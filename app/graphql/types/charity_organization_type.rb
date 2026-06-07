# frozen_string_literal: true

module Types
  class CharityOrganizationType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String
    field :phone_number, String
    field :website_url, String
    field :charity_number, String
    field :about_html, String, description: "Sanitized HTML"

    def about_html = HtmlSanitizer.call(object.about)
  end
end
