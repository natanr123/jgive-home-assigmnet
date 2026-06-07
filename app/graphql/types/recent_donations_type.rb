# frozen_string_literal: true

module Types
  # Page of recent donations + paging metadata (mirrors JGive's GetRecentDonations shape).
  class RecentDonationsType < Types::BaseObject
    field :donations, [ Types::DonationType ], null: false
    field :total_count, Integer, null: false
    field :next_page, Integer, description: "nil when there are no more pages"
  end
end
