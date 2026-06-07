# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [ Types::NodeType, null: true ], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ ID ], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Nullable: an unknown id returns null + a top-level error (the clean GraphQL "404").
    field :campaign, Types::CampaignType, null: true do
      argument :id, ID, required: true
    end

    def campaign(id:)
      Campaign.includes(:charity_organization).find_by(id: id) ||
        raise(GraphQL::ExecutionError, "Campaign not found")
    end

    field :recent_donations, Types::RecentDonationsType, null: false do
      argument :campaign_id, ID, required: true
      argument :page, Integer, required: false, default_value: 1
      argument :per_page, Integer, required: false, default_value: 10
    end

    def recent_donations(campaign_id:, page:, per_page:)
      per_page = per_page.clamp(1, 50)
      page = [ page, 1 ].max
      scope = Donation.where(campaign_id: campaign_id).countable.recent_first
      total = scope.count
      donations = scope.offset((page - 1) * per_page).limit(per_page).to_a
      next_page = (page * per_page < total) ? page + 1 : nil

      { donations: donations, total_count: total, next_page: next_page }
    end
  end
end
