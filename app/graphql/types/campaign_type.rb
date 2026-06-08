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

    # Story images are committed assets referenced by a stable token
    # (campaigns/story/N.jpg). Rewrite those to digested propshaft URLs at read
    # time, then sanitize.
    def story_html
      html = object.story_html
      return nil if html.blank?

      resolved = html.gsub(/src="(campaigns\/[^"]+)"/) do
        %(src="#{ActionController::Base.helpers.asset_path(Regexp.last_match(1))}")
      end
      HtmlSanitizer.call(resolved)
    end

    def story_html_raw = object.story_html

    # Resolve the committed asset to its propshaft (digested) URL. nil when the asset
    # is absent (e.g. the synthetic campaign 2) — the client falls back to a gradient.
    def cover_image_url
      return nil if object.cover_image_path.blank?

      ActionController::Base.helpers.asset_path(object.cover_image_path)
    rescue StandardError
      nil
    end

    def stats = object.stats.merge(goal_amount_cents: object.goal_amount_cents)
  end
end
