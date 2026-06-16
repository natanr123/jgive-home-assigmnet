class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  before_action :set_locale

  private

  # The locale is the first URL path segment (/:locale/:currency/..., mirroring the live
  # site's /he/ils/ scheme), so the SPA shell renders the correct <html lang>/dir on first
  # paint before React boots — no wrong-direction flash.
  def set_locale
    segment = request.path.split("/").find(&:present?)
    I18n.locale = segment == "en" ? :en : I18n.default_locale
  end
end
