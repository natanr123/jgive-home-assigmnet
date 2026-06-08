class Donation < ApplicationRecord
  belongs_to :campaign

  enum :frequency, { one_time: "one_time", monthly: "monthly" }, validate: true
  enum :status, { pending: "pending", paid: "paid", failed: "failed" }, validate: true
  enum :display_preference,
       { full_name: "full_name", first_name_only: "first_name_only", anonymous: "anonymous" },
       validate: true

  # Counts toward displayed progress: pending + paid (the assignment wants submit to
  # update progress immediately). Switching to paid-only is a one-line change here.
  scope :countable, -> { where(status: [ :pending, :paid ]) }
  scope :recent_first, -> { order(created_at: :desc) }

  # Whenever a donation is created, compute its commission on a background job.
  # after_create_commit (not after_create) so the row is committed before the
  # worker — in a separate process — looks it up.
  after_create_commit { CalcCommissionJob.perform_later(id) }

  validates :amount_cents, numericality: { greater_than: 0, less_than: 100_000_000 }
  validates :comment, length: { maximum: 280 }
  validates :donor_first_name, presence: true, unless: :anonymous?
  validates :donor_last_name, presence: true, if: :full_name?

  # The public-facing donor name, resolved from the display preference (mirrors
  # JGive's `name: null ⇒ anonymous` convention). nil ⇒ render as anonymous.
  def display_name
    case display_preference
    when "full_name"       then [ donor_first_name, donor_last_name ].compact_blank.join(" ").presence
    when "first_name_only" then donor_first_name.presence
    end
  end

  # Exposed at the API boundary as `recurring: Boolean`, matching JGive's schema.
  def recurring?
    monthly?
  end
end
