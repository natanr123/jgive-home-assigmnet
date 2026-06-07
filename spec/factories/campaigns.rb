FactoryBot.define do
  factory :campaign do
    charity_organization
    sequence(:name) { |n| "קמפיין #{n}" }
    subtitle { "תיאור קצר" }
    story_html { "<h2>על הפרויקט</h2><p>סיפור הקמפיין</p>" }
    goal_amount_cents { 5_000_000_00 }
    currency { "ILS" }
    cover_image_path { "campaigns/cover.jpg" }
    preset_amounts do
      [
        { "amount_cents" => 18_000,  "label" => "נטיעת עץ" },
        { "amount_cents" => 36_000,  "label" => "נטיעת 2 עצים" }
      ]
    end
    additional_amount_cents { 0 }
    additional_donors_count { 0 }
  end
end
