require "rails_helper"

RSpec.describe CalcCommission do
  it "sets commission_cents to 10% of the donation amount (rounded)" do
    donation = create(:donation, amount_cents: 18_000)
    described_class.new.perform(donation.id)
    expect(donation.reload.commission_cents).to eq(1_800)
  end

  it "rounds to the nearest cent" do
    donation = create(:donation, amount_cents: 12_345) # 10% = 1234.5
    described_class.new.perform(donation.id)
    expect(donation.reload.commission_cents).to eq(1_235)
  end

  it "is a no-op for a missing donation" do
    expect { described_class.new.perform(-1) }.not_to raise_error
  end
end
