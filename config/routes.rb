Rails.application.routes.draw do
  post "/graphql", to: "graphql#execute"

  # Health check for load balancers / uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  # SPA shell + client-routed catch-all are added in step 4.
end
