require "rails_helper"

# Guards the "additional_* reconciliation" trick: seeds must hit the real displayed
# totals exactly, stay idempotent, and never double-count.
RSpec.describe "db/seeds.rb", type: :model do
  before { load Rails.root.join("db/seeds.rb") }

  it "reconciles the flagship campaign to the real displayed totals" do
    campaign = Campaign.find_by!(name: "הגן הכתום")
    expect(campaign.stats[:raised_cents]).to eq(993_188_00)
    expect(campaign.stats[:donors_count]).to eq(3_170)
    expect(campaign.stats[:percent]).to eq(19)
  end

  it "is idempotent" do
    counts = -> { [ Campaign.count, Donation.count, CharityOrganization.count ] }
    before_counts = counts.call
    load Rails.root.join("db/seeds.rb")
    expect(counts.call).to eq(before_counts)
  end
end
