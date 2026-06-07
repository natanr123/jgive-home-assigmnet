require "rails_helper"

RSpec.describe Campaign, type: :model do
  describe "validations" do
    it "requires name and a positive goal" do
      expect(build(:campaign, name: nil)).not_to be_valid
      expect(build(:campaign, goal_amount_cents: 0)).not_to be_valid
    end

    it "rejects malformed preset_amounts" do
      expect(build(:campaign, preset_amounts: [ { "amount_cents" => 100, "label" => "x" } ])).to be_valid
      expect(build(:campaign, preset_amounts: [ { "amount_cents" => "100", "label" => "x" } ])).not_to be_valid
      expect(build(:campaign, preset_amounts: [ { "label" => "x" } ])).not_to be_valid
      expect(build(:campaign, preset_amounts: "nope")).not_to be_valid
    end
  end

  describe "#stats" do
    let(:campaign) { create(:campaign, goal_amount_cents: 1_000_00) }

    it "sums pending + paid, excludes failed" do
      create(:donation, :paid, campaign: campaign, amount_cents: 30_000)
      create(:donation, campaign: campaign, amount_cents: 20_000) # pending
      create(:donation, :failed, campaign: campaign, amount_cents: 99_999)
      expect(campaign.stats[:raised_cents]).to eq(50_000)
      expect(campaign.stats[:donors_count]).to eq(2)
    end

    it "adds additional_* offline totals" do
      campaign.update!(additional_amount_cents: 900_00, additional_donors_count: 100)
      create(:donation, :paid, campaign: campaign, amount_cents: 10_000)
      expect(campaign.stats[:raised_cents]).to eq(900_00 + 10_000)
      expect(campaign.stats[:donors_count]).to eq(101)
    end

    it "computes a floored percent" do
      create(:donation, :paid, campaign: campaign, amount_cents: 19_900) # 19.9% of 100,000
      expect(campaign.stats[:percent]).to eq(19)
    end

    it "caps percent at 100 when over goal" do
      create(:donation, :paid, campaign: campaign, amount_cents: 5_000_00)
      expect(campaign.stats[:percent]).to eq(100)
    end

    it "returns 0 percent for an empty campaign without raising" do
      empty = create(:campaign, goal_amount_cents: 1)
      expect(empty.stats[:percent]).to eq(0)
      expect(empty.stats[:raised_cents]).to eq(0)
    end
  end
end
