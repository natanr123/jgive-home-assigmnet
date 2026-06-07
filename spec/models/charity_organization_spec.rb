require "rails_helper"

RSpec.describe CharityOrganization, type: :model do
  it "requires a name" do
    expect(build(:charity_organization, name: nil)).not_to be_valid
    expect(build(:charity_organization)).to be_valid
  end

  it "has many campaigns" do
    org = create(:charity_organization)
    create(:campaign, charity_organization: org)
    expect(org.campaigns.count).to eq(1)
  end
end
