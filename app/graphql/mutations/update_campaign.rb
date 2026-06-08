# frozen_string_literal: true

module Mutations
  # Updates a campaign's content (and its charity org's contact details). Out of the
  # assignment's scope, but built on the same stack as everything else — a GraphQL
  # mutation the SPA's edit route drives. Validation failures come back in `errors`.
  class UpdateCampaign < Mutations::BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :subtitle, String, required: false
    argument :story_html, String, required: false
    argument :goal_amount_cents, Integer, required: false
    argument :currency, String, required: false
    argument :preset_amounts, [ Types::PresetAmountInput ], required: false
    argument :charity_organization, Types::CharityOrganizationInput, required: false
    # Active Storage direct-upload signed ids (from /rails/active_storage/direct_uploads).
    argument :banner_signed_id, String, required: false
    argument :avatar_signed_id, String, required: false
    # New story images to append (the client also appends matching campaigns/story/N.jpg
    # tokens to story_html, which the read resolver maps to these blobs by order).
    argument :story_image_signed_ids, [ String ], required: false

    field :campaign, Types::CampaignType
    field :errors, [ String ], null: false

    def resolve(id:, charity_organization: nil, preset_amounts: nil,
                banner_signed_id: nil, avatar_signed_id: nil, story_image_signed_ids: nil, **attrs)
      campaign = Campaign.find_by(id: id)
      return { campaign: nil, errors: [ "Campaign not found" ] } unless campaign

      attrs = attrs.compact
      if preset_amounts
        attrs[:preset_amounts] = preset_amounts.map { |p| { "amount_cents" => p[:amount_cents], "label" => p[:label] } }
      end

      ActiveRecord::Base.transaction do
        campaign.update!(attrs)
        campaign.banner.attach(banner_signed_id) if banner_signed_id.present?
        Array(story_image_signed_ids).each { |sid| campaign.story_images.attach(sid) }

        org = campaign.charity_organization
        org.update!(charity_organization.to_h.compact) if charity_organization
        org.avatar.attach(avatar_signed_id) if avatar_signed_id.present?
      end

      { campaign: campaign, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { campaign: nil, errors: e.record.errors.full_messages }
    end
  end
end
