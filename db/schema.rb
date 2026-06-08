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

ActiveRecord::Schema[8.1].define(version: 2026_06_08_115152) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "campaigns", force: :cascade do |t|
    t.integer "additional_amount_cents", default: 0, null: false
    t.integer "additional_donors_count", default: 0, null: false
    t.bigint "charity_organization_id", null: false
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
    t.integer "commission_cents"
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

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "campaigns", "charity_organizations"
  add_foreign_key "donations", "campaigns"
end
