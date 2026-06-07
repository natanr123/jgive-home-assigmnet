FactoryBot.define do
  factory :charity_organization do
    sequence(:name) { |n| "עמותה #{n}" }
    email { "info@example.org" }
    phone_number { "0500000000" }
    website_url { "http://www.example.org" }
    sequence(:charity_number) { |n| (580_000_000 + n).to_s }
    about { "<div>על העמותה</div>" }
  end
end
