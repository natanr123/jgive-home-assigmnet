class CreateCampaigns < ActiveRecord::Migration[8.1]
  def change
    create_table :campaigns do |t|
      t.references :charity_organization, null: false, foreign_key: true
      t.string :name, null: false
      t.string :subtitle
      t.text :story_html
      t.integer :goal_amount_cents, null: false
      t.string :currency, null: false, default: "ILS"
      t.string :cover_image_path
      t.jsonb :preset_amounts, null: false, default: []
      t.integer :additional_amount_cents, null: false, default: 0
      t.integer :additional_donors_count, null: false, default: 0

      t.timestamps
    end
  end
end
