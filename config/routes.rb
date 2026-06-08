require "sidekiq/web"

Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # Sidekiq dashboard (no auth — a demo; protect behind admin auth in production).
  mount Sidekiq::Web => "/sidekiq"

  # Health check for load balancers / uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  # "/" redirects to the featured (first) campaign — keeps the GraphQL schema at
  # 2 queries + 1 mutation (no separate "list campaigns" query just for this).
  root to: redirect { |_params, _req| "/campaigns/#{Campaign.order(:id).first&.id}" }

  # SPA shell for every client-routed path. Specific routes above win; the
  # constraint is belt-and-braces (segment boundaries, not prefixes) so it never
  # swallows /graphql, /up, /rails/*, /assets/*, /cable, or /sidekiq.
  get "*path", to: "shell#show", format: false,
      constraints: ->(req) { req.path !~ %r{\A/(rails|assets|graphql|up|cable|sidekiq)(/|\z)} }
end
