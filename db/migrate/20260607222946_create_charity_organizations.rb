class CreateCharityOrganizations < ActiveRecord::Migration[8.1]
  def change
    create_table :charity_organizations do |t|
      t.string :name
      t.string :email
      t.string :phone_number
      t.string :website_url
      t.string :charity_number
      t.text :about

      t.timestamps
    end
  end
end
