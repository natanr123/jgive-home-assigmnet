# frozen_string_literal: true

# Make a GCS service-account key available to Application Default Credentials when the
# key is provided as an env var (the only practical way to ship a keyfile to an off-GCP
# PaaS like Railway — there is no filesystem to drop it on, and no metadata server).
#
# Set ENV["GCS_KEYFILE_JSON"] to the full service-account key JSON. We write it to a
# gitignored tmp path and point GOOGLE_APPLICATION_CREDENTIALS at it, which the
# google-cloud-storage gem (and Active Storage's :google service) read automatically.
#
# If GOOGLE_APPLICATION_CREDENTIALS is already set (e.g. local dev exporting a key path,
# or a real GCP environment with a metadata server), this is a no-op.
if ENV["GCS_KEYFILE_JSON"].present? && ENV["GOOGLE_APPLICATION_CREDENTIALS"].blank?
  path = Rails.root.join("tmp/gcs-key.json")
  File.write(path, ENV["GCS_KEYFILE_JSON"]) unless File.exist?(path)
  File.chmod(0o600, path)
  ENV["GOOGLE_APPLICATION_CREDENTIALS"] = path.to_s
end
