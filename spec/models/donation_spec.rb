require "rails_helper"

RSpec.describe Donation, type: :model do
  describe "validations" do
    it "requires a positive, bounded amount" do
      expect(build(:donation, amount_cents: 0)).not_to be_valid
      expect(build(:donation, amount_cents: -1)).not_to be_valid
      expect(build(:donation, amount_cents: 100_000_000)).not_to be_valid
      expect(build(:donation, amount_cents: 18_000)).to be_valid
    end

    it "caps comment length at 280" do
      expect(build(:donation, comment: "a" * 281)).not_to be_valid
      expect(build(:donation, comment: "a" * 280)).to be_valid
    end

    it "rejects unknown enum values (validate: true)" do
      expect(build(:donation, status: "bogus")).not_to be_valid
    end

    context "name requirements per display preference" do
      it "requires first+last for full_name" do
        expect(build(:donation, display_preference: "full_name", donor_first_name: "א", donor_last_name: nil)).not_to be_valid
        expect(build(:donation, display_preference: "full_name", donor_first_name: "א", donor_last_name: "ב")).to be_valid
      end

      it "requires only first name for first_name_only" do
        expect(build(:donation, :first_name_only)).to be_valid
        expect(build(:donation, :first_name_only, donor_first_name: nil)).not_to be_valid
      end

      it "requires no name for anonymous" do
        expect(build(:donation, :anonymous)).to be_valid
      end
    end
  end

  describe "#display_name" do
    it "joins first and last for full_name" do
      expect(build(:donation, donor_first_name: "רחל", donor_last_name: "ביבי").display_name).to eq("רחל ביבי")
    end

    it "returns only the first name for first_name_only" do
      expect(build(:donation, :first_name_only, donor_first_name: "יאיר").display_name).to eq("יאיר")
    end

    it "returns nil for anonymous" do
      expect(build(:donation, :anonymous).display_name).to be_nil
    end
  end

  describe "#recurring?" do
    it "is true only for monthly frequency" do
      expect(build(:donation, :recurring).recurring?).to be(true)
      expect(build(:donation).recurring?).to be(false)
    end
  end

  describe "scopes" do
    let(:campaign) { create(:campaign) }

    it "countable includes pending + paid, excludes failed" do
      pending = create(:donation, campaign: campaign)
      paid    = create(:donation, :paid, campaign: campaign)
      create(:donation, :failed, campaign: campaign)
      expect(campaign.donations.countable).to contain_exactly(pending, paid)
    end
  end
end
