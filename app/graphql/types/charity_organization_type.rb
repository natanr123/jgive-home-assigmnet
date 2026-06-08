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
    field :about_raw, String, description: "Unprocessed stored HTML (for the edit form)"
    field :avatar_url, String, description: "Active Storage logo URL, or null"

    def about_html = HtmlSanitizer.call(object.about)
    def about_raw = object.about
    def avatar_url = AttachmentUrl.call(object.avatar)
  end
end
