# Resolves an Active Storage attachment (or attachment-list element) to a relative
# blob URL: /rails/active_storage/blobs/redirect/<signed_id>/<filename> — the same
# shape JGive serves. only_path:true means no host config is needed (the redirect
# controller fills in the host at request time). Returns nil when nothing is attached.
module AttachmentUrl
  def self.call(attachment)
    return nil if attachment.nil?
    return nil if attachment.respond_to?(:attached?) && !attachment.attached?

    blob = attachment.try(:blob) || attachment
    return nil unless blob

    Rails.application.routes.url_helpers.rails_blob_path(blob, only_path: true)
  end
end
