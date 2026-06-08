class AddRecurringMonthsToDonations < ActiveRecord::Migration[8.1]
  # Term of a standing-order (monthly) donation. NULL for one-time donations.
  # amount_cents stays the per-charge amount; total commitment = amount_cents * recurring_months.
  def change
    add_column :donations, :recurring_months, :integer
  end
end
