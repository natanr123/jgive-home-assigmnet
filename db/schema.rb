# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_07_222948) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "campaigns", force: :cascade do |t|
    t.integer "additional_amount_cents", default: 0, null: false
    t.integer "additional_donors_count", default: 0, null: false
    t.bigint "charity_organization_id", null: false
    t.string "cover_image_path"
    t.datetime "created_at", null: false
    t.string "currency", default: "ILS", null: false
    t.integer "goal_amount_cents", null: false
    t.string "name", null: false
    t.jsonb "preset_amounts", default: [], null: false
    t.text "story_html"
    t.string "subtitle"
    t.datetime "updated_at", null: false
    t.index ["charity_organization_id"], name: "index_campaigns_on_charity_organization_id"
  end

  create_table "charity_organizations", force: :cascade do |t|
    t.text "about"
    t.string "charity_number"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone_number"
    t.datetime "updated_at", null: false
    t.string "website_url"
  end

  create_table "donations", force: :cascade do |t|
    t.integer "amount_cents", null: false
    t.bigint "campaign_id", null: false
    t.text "comment"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "currency", default: "ILS", null: false
    t.string "display_preference", default: "full_name", null: false
    t.string "donor_first_name"
    t.string "donor_last_name"
    t.string "frequency", default: "one_time", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["campaign_id", "status"], name: "index_donations_on_campaign_id_and_status"
    t.index ["campaign_id"], name: "index_donations_on_campaign_id"
    t.index ["created_at"], name: "index_donations_on_created_at"
  end

  add_foreign_key "campaigns", "charity_organizations"
  add_foreign_key "donations", "campaigns"
end
