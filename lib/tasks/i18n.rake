# frozen_string_literal: true

require "json"

# config/locales/*.yml is the single source of truth; i18n-js exports the
# `frontend:` namespace to app/javascript/locales/*.json for the React layer.
# The exported JSON is committed (so the CI `git diff` gate can detect drift) and
# re-exported during asset precompile so production never ships a stale catalog.
# See docs/I18N.md.
namespace :i18n do
  desc "Export the `frontend:` locale namespace to JSON for the React layer (i18n-js)"
  task :export do
    sh "bundle exec i18n export"
  end

  # Parity gate scoped to OUR namespace. `i18n lint:translations` lints the whole
  # I18n backend, so Rails' English framework defaults (en.number.*, en.time.*)
  # show as extraneous against Hebrew (which has none) — pure noise. This compares
  # only the exported he/en `frontend` key sets, which is exactly what ships.
  desc "Verify exported he.json / en.json share an identical `frontend` key set"
  task :verify do
    dir = File.expand_path("../../app/javascript/locales", __dir__)
    flatten = lambda do |hash, prefix = ""|
      hash.flat_map do |k, v|
        key = prefix.empty? ? k.to_s : "#{prefix}.#{k}"
        v.is_a?(Hash) ? flatten.call(v, key) : [ key ]
      end
    end
    keys = %w[he en].to_h do |loc|
      data = JSON.parse(File.read(File.join(dir, "#{loc}.json")))
      [ loc, flatten.call(data.dig(loc, "frontend") || {}).sort ]
    end
    missing_in_en = keys["he"] - keys["en"]
    missing_in_he = keys["en"] - keys["he"]
    if missing_in_en.empty? && missing_in_he.empty?
      puts "=> i18n parity OK: #{keys['he'].size} frontend keys present in both he and en."
    else
      warn "=> i18n parity FAILED"
      warn "   missing in en: #{missing_in_en.join(', ')}" unless missing_in_en.empty?
      warn "   missing in he: #{missing_in_he.join(', ')}" unless missing_in_he.empty?
      abort "i18n frontend key-parity check failed."
    end
  end
end

# Refresh the JSON during precompile (runs in the same build that already boots
# Rails with SECRET_KEY_BASE_DUMMY=1 — see Dockerfile). Belt-and-suspenders on top
# of the committed artifact + CI git-diff gate.
if Rake::Task.task_defined?("assets:precompile")
  Rake::Task["assets:precompile"].enhance([ "i18n:export" ])
end
