class Donation < ApplicationRecord
  belongs_to :campaign

  # Standing orders (monthly) are capped at this term — JGive's `maxRecurringMonths`.
  MAX_RECURRING_MONTHS = 36

  enum :frequency, { one_time: "one_time", monthly: "monthly" }, validate: true
  enum :status, { pending: "pending", paid: "paid", failed: "failed" }, validate: true
  enum :display_preference,
       { full_name: "full_name", first_name_only: "first_name_only", anonymous: "anonymous" },
       validate: true

  # Counts toward displayed progress: pending + paid (the assignment wants submit to
  # update progress immediately). Switching to paid-only is a one-line change here.
  scope :countable, -> { where(status: [ :pending, :paid ]) }
  scope :recent_first, -> { order(created_at: :desc) }

  # A monthly donation carries a term; a one-time one never does. Normalize before
  # validation so a stray recurring_months on a one-time donation can't sneak in.
  before_validation { self.recurring_months = nil unless monthly? }

  # Whenever a donation is created, compute its commission on a background job.
  # after_create_commit (not after_create) so the row is committed before the
  # worker — in a separate process — looks it up.
  after_create_commit { CalcCommissionJob.perform_later(id) }

  validates :amount_cents, numericality: { greater_than: 0, less_than: 100_000_000 }
  validates :comment, length: { maximum: 280 }
  validates :donor_first_name, presence: true, unless: :anonymous?
  validates :donor_last_name, presence: true, if: :full_name?
  # Term required and bounded for monthly; absent otherwise (enforced by the normalizer above).
  # presence first so a missing term reads "can't be blank", not "is not a number".
  validates :recurring_months,
            presence: true,
            numericality: { only_integer: true, greater_than: 0,
                            less_than_or_equal_to: MAX_RECURRING_MONTHS },
            if: :monthly?

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

  # The donor's full commitment: one-time → the amount; monthly → amount × term.
  # NOTE: this is the donor-facing total shown in the modal. It is deliberately NOT
  # what counts toward campaign progress — Campaign#stats sums the per-charge
  # amount_cents (money moving now), not the multi-year pledge. See Campaign#stats.
  def total_cents
    amount_cents * (recurring_months || 1)
  end
end
