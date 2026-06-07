# frozen_string_literal: true

module Types
  # Campaign progress aggregates (from Campaign#stats). Raw goal echoed so the client
  # can render "exceeded goal" states even though percent is capped at 100.
  class StatsType < Types::BaseObject
    field :raised_cents, Integer, null: false
    field :donors_count, Integer, null: false
    field :percent, Integer, null: false
    field :goal_amount_cents, Integer, null: false
  end
end
