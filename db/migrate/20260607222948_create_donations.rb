class CreateDonations < ActiveRecord::Migration[8.1]
  def change
    create_table :donations do |t|
      t.references :campaign, null: false, foreign_key: true
      t.integer :amount_cents, null: false
      t.string :currency, null: false, default: "ILS"
      t.string :frequency, null: false, default: "one_time"
      t.string :status, null: false, default: "pending"
      t.string :donor_first_name
      t.string :donor_last_name
      t.string :display_preference, null: false, default: "full_name"
      t.text :comment
      t.datetime :completed_at

      t.timestamps
    end

    add_index :donations, [ :campaign_id, :status ]
    add_index :donations, :created_at
  end
end
