# frozen_string_literal: true

class GraphqlController < ApplicationController
  # Same-origin SPA: Rails' default CSRF protection applies and the client sends the
  # X-CSRF-Token header (read from csrf_meta_tags). No null_session needed.

  # Rails' built-in controller error handling: any unexpected error from a GraphQL
  # request is routed here (keeps `execute` to the happy path).
  rescue_from StandardError, with: :render_unexpected_error

  def execute
    result = JgiveHomeAssigmentSchema.execute(
      params[:query],
      variables: prepare_variables(params[:variables]),
      operation_name: params[:operationName],
      context: {}
    )
    render json: result
  end

  private

  # Unexpected (non-GraphQL) errors: log them and return a clean JSON 500. The real
  # message + backtrace are exposed only in development; production returns a generic
  # message so internals never leak. (GraphQL validation/resolver errors are handled by
  # graphql-ruby itself and come back in the response `errors` array, not here.)
  def render_unexpected_error(error)
    logger.error("[GraphQL] #{error.class}: #{error.message}")
    logger.error(error.backtrace.join("\n")) if error.backtrace

    payload = { message: Rails.env.development? ? error.message : "Internal server error" }
    payload[:backtrace] = error.backtrace if Rails.env.development?
    render json: { data: nil, errors: [ payload ] }, status: :internal_server_error
  end

  # Handle variables in form data, a JSON body, or a blank value.
  def prepare_variables(variables_param)
    case variables_param
    when String
      variables_param.present? ? (JSON.parse(variables_param) || {}) : {}
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash # GraphQL-Ruby validates the name and type of incoming variables.
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end
end
