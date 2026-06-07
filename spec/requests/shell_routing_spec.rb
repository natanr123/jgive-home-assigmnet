require "rails_helper"

# The catch-all serves the SPA shell, but it must NOT swallow the API, health check,
# Active Storage, or asset routes.
RSpec.describe "SPA shell routing", type: :request do
  it "serves the shell for a client-routed campaign path" do
    get "/campaigns/123"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('<div id="root">')
  end

  it "serves the shell for a nested donate path" do
    get "/campaigns/123/donate/amount"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('<div id="root">')
  end

  it "does not swallow the health check" do
    get "/up"
    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include('<div id="root">')
  end

  it "redirects root to the first campaign" do
    org = create(:charity_organization)
    campaign = create(:campaign, charity_organization: org)
    get "/"
    expect(response).to redirect_to("/campaigns/#{campaign.id}")
  end

  it "routes /graphql to the GraphQL controller, not the shell" do
    post "/graphql", params: { query: "{ __typename }" }.to_json,
                     headers: { "CONTENT_TYPE" => "application/json" }
    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include('<div id="root">')
    expect(JSON.parse(response.body).dig("data", "__typename")).to eq("Query")
  end
end
