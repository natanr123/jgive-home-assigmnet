# frozen_string_literal: true

module Types
  # A preset donation amount with its impact label, from campaign.preset_amounts (jsonb).
  class PresetAmountType < Types::BaseObject
    field :amount_cents, Integer, null: false
    field :label, String, null: false

    def amount_cents = object["amount_cents"]
    def label = object["label"]
  end
end
