import { useRouteError, isRouteErrorResponse } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}>
      <h1>{is404 ? "הקמפיין לא נמצא" : "משהו השתבש"}</h1>
      <p>
        <a href="/">חזרה לעמוד הבית</a>
      </p>
    </main>
  );
}
