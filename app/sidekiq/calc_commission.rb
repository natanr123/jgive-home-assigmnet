# frozen_string_literal: true

# Calculates the platform commission for a donation (10% of the amount) on a
# background Sidekiq worker, enqueued whenever a donation is created.
class CalcCommission
  include Sidekiq::Job

  COMMISSION_RATE = 0.10

  def perform(donation_id)
    donation = Donation.find_by(id: donation_id)
    return unless donation

    commission = (donation.amount_cents * COMMISSION_RATE).round
    # update_column: skip validations/callbacks — no re-enqueue, no touch.
    donation.update_column(:commission_cents, commission)
  end
end
