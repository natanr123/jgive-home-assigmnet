FactoryBot.define do
  factory :donation do
    campaign
    amount_cents { 18_000 }
    currency { "ILS" }
    frequency { "one_time" }
    status { "pending" }
    display_preference { "full_name" }
    donor_first_name { "ישראל" }
    donor_last_name { "ישראלי" }
    comment { nil }

    trait :paid do
      status { "paid" }
      completed_at { Time.current }
    end

    trait :failed do
      status { "failed" }
    end

    trait :recurring do
      frequency { "monthly" }
    end

    trait :with_comment do
      comment { "תודה רבה על המיזם החשוב הזה" }
    end

    trait :first_name_only do
      display_preference { "first_name_only" }
      donor_last_name { nil }
    end

    trait :anonymous do
      display_preference { "anonymous" }
      donor_first_name { nil }
      donor_last_name { nil }
    end
  end
end
