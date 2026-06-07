# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :create_donation, mutation: Mutations::CreateDonation
  end
end
