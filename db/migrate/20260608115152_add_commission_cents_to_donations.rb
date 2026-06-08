class AddCommissionCentsToDonations < ActiveRecord::Migration[8.1]
  def change
    add_column :donations, :commission_cents, :integer
  end
end
