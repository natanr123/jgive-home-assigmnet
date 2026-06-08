# frozen_string_literal: true

# Calculates the platform commission for a donation (10% of the amount), enqueued
# whenever a donation is created. An Active Job — runs on the Sidekiq adapter
# (config.active_job.queue_adapter = :sidekiq).
class CalcCommissionJob < ApplicationJob
  queue_as :default

  COMMISSION_RATE = 0.10

  def perform(donation_id)
    donation = Donation.find_by(id: donation_id)
    return unless donation

    commission = (donation.amount_cents * COMMISSION_RATE).round
    # update_column: skip validations/callbacks — no re-enqueue, no touch.
    donation.update_column(:commission_cents, commission)
  end
end
