# frozen_string_literal: true

module Types
  class CampaignType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :subtitle, String
    field :story_html, String, description: "Sanitized HTML"
    field :story_html_raw, String, description: "Unprocessed stored HTML (for the edit form)"
    field :cover_image_url, String, description: "Resolved asset URL, or null if missing"
    field :goal_amount_cents, Integer, null: false
    field :currency, String, null: false
    field :preset_amounts, [ Types::PresetAmountType ], null: false
    field :stats, Types::StatsType, null: false
    field :charity_organization, Types::CharityOrganizationType, null: false

    # Story images are Active Storage attachments referenced in the stored HTML by a
    # stable token (campaigns/story/N.jpg). Rewrite each token to its attached blob's
    # URL (by order) at read time, then sanitize.
    def story_html
      html = object.story_html
      return nil if html.blank?

      images = object.story_images.to_a
      resolved = html.gsub(/src="campaigns\/story\/(\d+)\.jpg"/) do
        blob = images[Regexp.last_match(1).to_i - 1]
        blob ? %(src="#{AttachmentUrl.call(blob)}") : Regexp.last_match(0)
      end
      HtmlSanitizer.call(resolved)
    end

    def story_html_raw = object.story_html

    # The banner's Active Storage URL (/rails/active_storage/...), or nil when there's
    # no banner (e.g. the synthetic campaign 2) — the client falls back to a gradient.
    def cover_image_url = AttachmentUrl.call(object.banner)

    def stats = object.stats.merge(goal_amount_cents: object.goal_amount_cents)
  end
end
