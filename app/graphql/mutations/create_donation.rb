# frozen_string_literal: true

module Mutations
  # Creates a donation in `pending` state and returns it with the campaign's updated
  # stats. Validation failures come back as user-facing strings in `errors` (not raised),
  # so the client renders them inline. Payment is out of scope — the donation stays
  # pending until a payment webhook would flip it to paid (see README).
  class CreateDonation < Mutations::BaseMutation
    argument :campaign_id, ID, required: true
    argument :amount_cents, Integer, required: true
    argument :frequency, String, required: false, default_value: "one_time"
    argument :recurring_months, Integer, required: false,
      description: "Term in months for a monthly donation; ignored for one-time"
    argument :display_preference, String, required: false, default_value: "full_name"
    argument :donor_first_name, String, required: false
    argument :donor_last_name, String, required: false
    argument :comment, String, required: false

    field :donation, Types::DonationType
    field :stats, Types::StatsType
    field :errors, [ String ], null: false

    def resolve(campaign_id:, amount_cents:, frequency:, display_preference:,
                recurring_months: nil, donor_first_name: nil, donor_last_name: nil, comment: nil)
      campaign = Campaign.find_by(id: campaign_id)
      return { donation: nil, stats: nil, errors: [ "Campaign not found" ] } unless campaign

      donation = campaign.donations.build(
        amount_cents: amount_cents,
        frequency: frequency,
        recurring_months: recurring_months,
        display_preference: display_preference,
        donor_first_name: donor_first_name,
        donor_last_name: donor_last_name,
        comment: comment,
        status: "pending"
      )

      if donation.save
        { donation: donation,
          stats: campaign.reload.stats.merge(goal_amount_cents: campaign.goal_amount_cents),
          errors: [] }
      else
        { donation: nil, stats: nil, errors: donation.errors.full_messages }
      end
    rescue ArgumentError => e
      # invalid enum value for frequency/display_preference
      { donation: nil, stats: nil, errors: [ e.message ] }
    end
  end
end
