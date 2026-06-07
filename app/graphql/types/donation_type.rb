# frozen_string_literal: true

module Types
  # Public view of a donation. The raw status enum is intentionally NOT exposed —
  # only `pending` (Boolean) leaks out, to drive the "ממתין לאישור" badge.
  class DonationType < Types::BaseObject
    field :id, ID, null: false
    field :display_name, String, description: "nil ⇒ anonymous donor"
    field :amount_cents, Integer, null: false
    field :currency, String, null: false
    field :recurring, Boolean, null: false
    field :comment, String
    field :pending, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def recurring = object.recurring?
    def pending = object.pending?
  end
end
