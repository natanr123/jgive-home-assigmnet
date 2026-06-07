class ShellController < ApplicationController
  # Serves the SPA shell for every client-routed path. React reads the URL and
  # renders the matching route (campaign page, donate modal, …).
  def show; end
end
