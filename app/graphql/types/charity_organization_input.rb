# frozen_string_literal: true

module Types
  class CharityOrganizationInput < Types::BaseInputObject
    argument :name, String, required: false
    argument :email, String, required: false
    argument :phone_number, String, required: false
    argument :website_url, String, required: false
    argument :charity_number, String, required: false
    argument :about, String, required: false
  end
end
