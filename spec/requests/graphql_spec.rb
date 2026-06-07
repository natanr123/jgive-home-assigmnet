require "rails_helper"

RSpec.describe "POST /graphql", type: :request do
  # Post as JSON (like the real SPA) so Int/Boolean variables keep their types —
  # form-encoded params would stringify them and break coercion.
  def gql(query, variables = {})
    post "/graphql",
         params: { query: query, variables: variables }.to_json,
         headers: { "CONTENT_TYPE" => "application/json" }
    JSON.parse(response.body)
  end

  let(:org) { create(:charity_organization) }
  let(:campaign) { create(:campaign, charity_organization: org, goal_amount_cents: 1_000_00) }

  describe "campaign query" do
    let(:query) do
      %(query($id: ID!){ campaign(id: $id){ name stats{ raisedCents donorsCount percent goalAmountCents } presetAmounts{ amountCents label } charityOrganization{ name } } })
    end

    it "returns the campaign with stats and presets" do
      create(:donation, :paid, campaign: campaign, amount_cents: 50_000)
      data = gql(query, { id: campaign.id })["data"]["campaign"]
      expect(data["name"]).to eq(campaign.name)
      expect(data["stats"]["raisedCents"]).to eq(50_000)
      expect(data["stats"]["goalAmountCents"]).to eq(1_000_00)
      expect(data["presetAmounts"].size).to eq(2)
      expect(data["charityOrganization"]["name"]).to eq(org.name)
    end

    it "returns null + a top-level error for an unknown id" do
      body = gql(query, { id: "999999" })
      expect(body["data"]["campaign"]).to be_nil
      expect(body["errors"].first["message"]).to eq("Campaign not found")
    end

    it "sanitizes story HTML, stripping disallowed tags" do
      campaign.update!(story_html: "<h2>כותרת</h2><script>alert(1)</script><p>טקסט</p>")
      html = gql(%(query($id: ID!){ campaign(id:$id){ storyHtml } }), { id: campaign.id })["data"]["campaign"]["storyHtml"]
      expect(html).to include("<h2>כותרת</h2>", "<p>טקסט</p>")
      expect(html).not_to include("script")
    end
  end

  describe "recentDonations query" do
    let(:query) do
      %(query($c: ID!, $p: Int, $pp: Int){ recentDonations(campaignId:$c, page:$p, perPage:$pp){ totalCount nextPage donations{ displayName amountCents recurring pending comment } } })
    end

    before do
      create(:donation, :paid, campaign: campaign, donor_first_name: "רחל", donor_last_name: "ביבי")
      create(:donation, :paid, :anonymous, campaign: campaign)
      create(:donation, campaign: campaign, donor_first_name: "יאיר", donor_last_name: "כהן") # pending
      create(:donation, :failed, campaign: campaign) # excluded
    end

    it "paginates countable donations and resolves display names" do
      page1 = gql(query, { c: campaign.id, p: 1, pp: 2 })["data"]["recentDonations"]
      expect(page1["totalCount"]).to eq(3) # failed excluded
      expect(page1["nextPage"]).to eq(2)
      expect(page1["donations"].size).to eq(2)

      all_names = gql(query, { c: campaign.id, p: 1, pp: 10 })["data"]["recentDonations"]["donations"].map { _1["displayName"] }
      expect(all_names).to include("רחל ביבי", nil) # nil = anonymous
    end

    it "exposes pending as a boolean but never the raw status" do
      donations = gql(query, { c: campaign.id, p: 1, pp: 10 })["data"]["recentDonations"]["donations"]
      expect(donations.map { _1["pending"] }).to include(true, false)

      leak = gql(%(query($c: ID!){ recentDonations(campaignId:$c){ donations{ status } } }), { c: campaign.id })
      expect(leak["errors"].first["message"]).to match(/Field 'status' doesn't exist/)
    end
  end

  describe "createDonation mutation" do
    let(:mutation) do
      %(mutation($i: CreateDonationInput!){ createDonation(input:$i){ donation{ id displayName amountCents recurring pending } stats{ donorsCount raisedCents } errors } })
    end

    it "creates a pending donation and moves the stats" do
      input = { campaignId: campaign.id, amountCents: 5_000, donorFirstName: "טל", donorLastName: "לוי" }
      expect {
        body = gql(mutation, { i: input })["data"]["createDonation"]
        expect(body["errors"]).to be_empty
        expect(body["donation"]["pending"]).to be(true)
        expect(body["donation"]["displayName"]).to eq("טל לוי")
        expect(body["stats"]["raisedCents"]).to eq(5_000)
      }.to change { campaign.donations.pending.count }.by(1)
    end

    it "supports an anonymous recurring donation" do
      input = { campaignId: campaign.id, amountCents: 18_000, frequency: "monthly", displayPreference: "anonymous" }
      body = gql(mutation, { i: input })["data"]["createDonation"]
      expect(body["errors"]).to be_empty
      expect(body["donation"]["recurring"]).to be(true)
      expect(body["donation"]["displayName"]).to be_nil
    end

    it "returns validation errors without creating a record" do
      input = { campaignId: campaign.id, amountCents: 0, donorFirstName: "x", donorLastName: "y" }
      expect {
        body = gql(mutation, { i: input })["data"]["createDonation"]
        expect(body["donation"]).to be_nil
        expect(body["errors"]).to include(a_string_matching(/greater than 0/))
      }.not_to change(Donation, :count)
    end

    it "reports an unknown campaign" do
      body = gql(mutation, { i: { campaignId: "999999", amountCents: 5_000, donorFirstName: "a", donorLastName: "b" } })["data"]["createDonation"]
      expect(body["errors"]).to include("Campaign not found")
    end
  end

  describe "introspection" do
    it "is available in the test environment" do
      body = gql("{ __schema { queryType { name } } }")
      expect(body["data"]["__schema"]["queryType"]["name"]).to eq("Query")
    end
  end

  describe "unexpected server errors" do
    it "returns a clean JSON 500 without re-raising or leaking internals" do
      allow(JgiveHomeAssigmentSchema).to receive(:execute).and_raise(StandardError, "secret internal detail")

      post "/graphql", params: { query: "{ __typename }" }.to_json,
                       headers: { "CONTENT_TYPE" => "application/json" }

      expect(response).to have_http_status(:internal_server_error)
      body = JSON.parse(response.body)
      expect(body["data"]).to be_nil
      expect(body["errors"].first["message"]).to eq("Internal server error")
      expect(response.body).not_to include("secret internal detail")
    end
  end
end
