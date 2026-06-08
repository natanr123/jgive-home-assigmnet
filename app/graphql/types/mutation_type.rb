# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :create_donation, mutation: Mutations::CreateDonation
    field :update_campaign, mutation: Mutations::UpdateCampaign
  end
end
