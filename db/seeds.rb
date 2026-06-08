# Seeds — idempotent (find_or_create_by! on natural keys), re-runnable.
#
# Campaign 1 reproduces the real JGive campaign "הגן הכתום" (donation-target 159183):
# real story/charity copy and donor entries captured from their GraphQL API. We hit the
# real displayed totals (₪993,188 raised, 3,170 donors) WITHOUT seeding thousands of rows
# by topping up campaign.additional_* with the difference left over after the handful of
# real donations below (the "additional/offline donations" pattern JGive itself uses).
require "json"

data_dir     = Rails.root.join("db/seeds/data")
images_dir   = data_dir.join("images")
story_html   = File.read(data_dir.join("campaign_story.html"))
charity_html = File.read(data_dir.join("charity_about.html"))
donor_rows   = JSON.parse(File.read(data_dir.join("donations.json")))

# Attach a committed seed image as an Active Storage blob, idempotently.
attach = lambda do |attachment, path, content_type|
  return if attachment.attached?

  attachment.attach(io: File.open(path), filename: File.basename(path), content_type: content_type)
end

# --- Campaign 1: הגן הכתום ---------------------------------------------------
venatata = CharityOrganization.find_or_create_by!(charity_number: "580689537") do |c|
  c.name         = "ונטעת"
  c.email        = "info@venatata.org"
  c.phone_number = "0528622966"
  c.website_url  = "http://www.venatata.org"
  c.about        = charity_html
end
attach.call(venatata.avatar, images_dir.join("avatar.png"), "image/png")

orange_garden = Campaign.find_or_create_by!(name: "הגן הכתום") do |c|
  c.charity_organization = venatata
  c.subtitle          = "לזכר בני משפחת ביבס וילדי ה-7 באוקטובר"
  c.story_html        = story_html
  c.goal_amount_cents = 5_000_000_00
  c.currency          = "ILS"
  c.preset_amounts    = [
    { "amount_cents" => 18_000,  "label" => "נטיעת עץ" },
    { "amount_cents" => 36_000,  "label" => "נטיעת 2 עצים 🧡 הכי נבחר" },
    { "amount_cents" => 72_000,  "label" => "נטיעת 3 עצים - לזכרם" },
    { "amount_cents" => 180_000, "label" => "בונים מרחב לילדים" },
    { "amount_cents" => 500_000, "label" => "בוני הגן הכתום" }
  ]
end
attach.call(orange_garden.banner, images_dir.join("banner.jpg"), "image/jpeg")
# Story images, attached in order — the storyHtml resolver maps tokens
# (campaigns/story/N.jpg) to these blobs by index.
unless orange_garden.story_images.attached?
  (1..4).each do |n|
    path = images_dir.join("story/#{n}.jpg")
    orange_garden.story_images.attach(io: File.open(path), filename: "#{n}.jpg", content_type: "image/jpeg")
  end
end

# Real donor entries (subset). name: null ⇒ anonymous. A couple kept pending and one
# recurring to exercise the state machine; the rest are paid.
if orange_garden.donations.none?
  donor_rows.first(12).each_with_index do |row, i|
    amount = row["amount_cents"] || 18_000 # amount-hidden rows: seed a plausible amount
    anonymous = row["name"].nil?
    first, last = (row["name"] || "").split(" ", 2)

    orange_garden.donations.create!(
      amount_cents:       amount,
      currency:           "ILS",
      frequency:          row["recurring"] ? "monthly" : "one_time",
      status:             (i < 2 ? "pending" : "paid"), # first two pending, rest paid
      completed_at:       (i < 2 ? nil : Time.current - i.hours),
      display_preference: anonymous ? "anonymous" : (last.present? ? "full_name" : "first_name_only"),
      donor_first_name:   anonymous ? nil : first.presence,
      donor_last_name:    anonymous ? nil : last.presence,
      comment:            row["comment"].presence
    )
  end

  # Reconcile to the real displayed totals without seeding 3,170 rows.
  # Live total is 993,187.72; we round to the displayed whole-shekel 993,188.
  target_raised_cents = 993_188_00
  target_donors       = 3_170
  seeded = orange_garden.donations.countable
  orange_garden.update!(
    additional_amount_cents: target_raised_cents - seeded.sum(:amount_cents),
    additional_donors_count: target_donors - seeded.count
  )
end

# --- Campaign 2: a small synthetic campaign (proves nothing is hard-coded) ----
helping_hands = CharityOrganization.find_or_create_by!(charity_number: "590000001") do |c|
  c.name         = "ידיים תומכות"
  c.email        = "info@helping-hands.example"
  c.phone_number = "0501234567"
  c.website_url  = "http://www.helping-hands.example"
  c.about        = "<div>עמותה קטנה לדוגמה — מוכיחה שהדף מונע-נתונים.</div>"
end

winter_coats = Campaign.find_or_create_by!(name: "מעילים לחורף") do |c|
  c.charity_organization = helping_hands
  c.subtitle          = "קמפיין דוגמה שני"
  c.story_html        = "<h2>על הפרויקט</h2><p>איסוף מעילים חמים למשפחות בחורף.</p>"
  c.goal_amount_cents = 100_000_00
  c.currency          = "ILS"
  c.preset_amounts    = [
    { "amount_cents" => 5_000,  "label" => "מעיל לילד" },
    { "amount_cents" => 10_000, "label" => "מעיל למבוגר" },
    { "amount_cents" => 25_000, "label" => "ערכת חורף למשפחה" }
  ]
end

if winter_coats.donations.none?
  winter_coats.donations.create!(amount_cents: 10_000, status: "paid", completed_at: 1.day.ago,
                                 display_preference: "full_name", donor_first_name: "דנה", donor_last_name: "כהן")
  winter_coats.donations.create!(amount_cents: 25_000, status: "paid", completed_at: 2.hours.ago,
                                 display_preference: "anonymous")
end

puts "Seeded: #{Campaign.count} campaigns, #{Donation.count} donations, #{CharityOrganization.count} orgs"
puts "  #{orange_garden.name}: #{orange_garden.stats.inspect}"
