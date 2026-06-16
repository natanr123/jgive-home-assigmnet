import { useRouteError, isRouteErrorResponse } from "react-router";
import { useT } from "../lib/i18n";

export default function ErrorPage() {
  const t = useT();
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}>
      <h1>{is404 ? t("notFound") : t("genericError")}</h1>
      <p>
        <a href="/">{t("backHome")}</a>
      </p>
    </main>
  );
}
