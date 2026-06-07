# Sanitizes stored campaign/charity HTML at READ time (in resolvers), so the raw
# content stays intact in the DB and the allowlist can evolve without re-seeding.
module HtmlSanitizer
  ALLOWED_TAGS       = %w[h2 h3 h4 p br strong b em i ul ol li a div span].freeze
  ALLOWED_ATTRIBUTES = %w[href].freeze

  def self.call(html)
    return nil if html.blank?

    Rails::HTML5::SafeListSanitizer.new.sanitize(
      html, tags: ALLOWED_TAGS, attributes: ALLOWED_ATTRIBUTES
    )
  end
end
