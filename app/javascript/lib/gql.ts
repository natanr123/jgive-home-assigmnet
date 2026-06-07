// Minimal GraphQL-over-fetch client. No Apollo/urql: React Router v7 loaders/actions
// own data fetching and revalidation is our cache-invalidation strategy.

export class GqlError extends Error {}

function csrfToken(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
}

export async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new GqlError(json.errors.map((e) => e.message).join("; "));
  }
  return json.data as T;
}
