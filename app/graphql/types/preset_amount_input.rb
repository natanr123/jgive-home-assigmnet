# frozen_string_literal: true

module Types
  class PresetAmountInput < Types::BaseInputObject
    argument :amount_cents, Integer, required: true
    argument :label, String, required: true
  end
end
