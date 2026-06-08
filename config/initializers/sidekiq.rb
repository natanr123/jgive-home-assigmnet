# frozen_string_literal: true

redis_config = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

Sidekiq.configure_server { |config| config.redis = redis_config }
Sidekiq.configure_client { |config| config.redis = redis_config }

Sidekiq.logger.level = Logger::WARN if Rails.env.test?

# Protect the Web UI with HTTP Basic auth whenever credentials are configured (set
# SIDEKIQ_USER + SIDEKIQ_PASSWORD in production). Left open in local dev for convenience.
if ENV["SIDEKIQ_USER"].present? && ENV["SIDEKIQ_PASSWORD"].present?
  require "sidekiq/web"
  Sidekiq::Web.use(Rack::Auth::Basic, "Sidekiq") do |user, password|
    # constant-time compare, ANDed without short-circuit, so neither field's correctness leaks
    ActiveSupport::SecurityUtils.secure_compare(user, ENV["SIDEKIQ_USER"]) &
      ActiveSupport::SecurityUtils.secure_compare(password, ENV["SIDEKIQ_PASSWORD"])
  end
end
