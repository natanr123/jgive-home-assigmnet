class Campaign < ApplicationRecord
  belongs_to :charity_organization
  has_many :donations, dependent: :destroy

  # Images as Active Storage attachments (mirrors JGive's blob-backed media).
  has_one_attached :banner
  has_many_attached :story_images

  validates :name, presence: true
  validates :goal_amount_cents, numericality: { greater_than: 0 }
  validates :additional_amount_cents, :additional_donors_count,
            numericality: { greater_than_or_equal_to: 0 }
  validate :preset_amounts_well_formed

  # Aggregates for the progress header. One round-trip (SUM + COUNT together),
  # memoized per instance. `additional_*` absorb offline/imported donations so
  # seeds can hit the real campaign totals without inserting thousands of rows.
  #
  # Recurring donations contribute their per-charge `amount_cents` (the installment
  # moving now), not the full multi-year pledge (Donation#total_cents). To count the
  # whole commitment instead, sum `amount_cents * COALESCE(recurring_months, 1)` here.
  def stats
    @stats ||= begin
      sum, count = donations.countable.pick(
        Arel.sql("COALESCE(SUM(amount_cents), 0), COUNT(*)")
      )
      raised = additional_amount_cents + sum.to_i
      donors = additional_donors_count + count.to_i
      percent = goal_amount_cents.to_i.zero? ? 0 : (raised * 100.0 / goal_amount_cents)
      {
        raised_cents: raised,
        donors_count: donors,
        # capped for display; raw raised/goal stay available via the keys above
        percent: [ percent.floor, 100 ].min
      }
    end
  end

  private

  # preset_amounts must be an array of { "amount_cents" => Integer, "label" => String }.
  def preset_amounts_well_formed
    return if preset_amounts.is_a?(Array) && preset_amounts.all? do |p|
      p.is_a?(Hash) && p["amount_cents"].is_a?(Integer) && p["label"].is_a?(String)
    end

    errors.add(:preset_amounts, "must be an array of { amount_cents:, label: }")
  end
end
