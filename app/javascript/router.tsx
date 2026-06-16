import { useLayoutEffect } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation, useParams } from "react-router";
import { LocaleProvider, normalizeLocale, normalizeCurrency } from "./lib/i18n";
import CampaignPage, { campaignLoader } from "./routes/campaign";
import ErrorPage from "./routes/error";
import DonateModal from "./routes/donate/DonateModal";
import DonateAmount from "./routes/donate/DonateAmount";
import DonateDetails, { donateAction } from "./routes/donate/DonateDetails";
import DonateThanks from "./routes/donate/DonateThanks";
import CampaignEdit, { editLoader, editAction } from "./routes/CampaignEdit";

// Reads /:locale/:currency, provides them to the tree, and keeps <html lang>/dir in sync
// after client navigation (the server sets them on first paint from the URL — no flash).
function LocaleLayout() {
  const params = useParams();
  const locale = normalizeLocale(params.locale);
  const currency = normalizeCurrency(params.currency);

  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <LocaleProvider locale={locale} currency={currency}>
      <Outlet />
    </LocaleProvider>
  );
}

// Un-prefixed legacy paths (e.g. /campaigns/1) -> default he/ils, preserving the rest.
function LegacyRedirect() {
  const loc = useLocation();
  return <Navigate to={`/he/ils${loc.pathname}${loc.search}`} replace />;
}

// Anything else -> hit the server root, which redirects to /he/ils/campaigns/:firstId.
function HardRedirectHome() {
  if (typeof window !== "undefined") window.location.replace("/");
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/:locale/:currency",
    element: <LocaleLayout />,
    children: [
      {
        id: "campaign",
        path: "campaigns/:id",
        loader: campaignLoader,
        Component: CampaignPage,
        errorElement: <ErrorPage />,
        children: [
          {
            path: "donate",
            Component: DonateModal,
            children: [
              { path: "amount", Component: DonateAmount },
              { path: "details", Component: DonateDetails, action: donateAction },
              { path: "thanks", Component: DonateThanks },
            ],
          },
        ],
      },
      {
        path: "campaigns/:id/edit",
        loader: editLoader,
        action: editAction,
        Component: CampaignEdit,
        errorElement: <ErrorPage />,
      },
    ],
  },
  { path: "/campaigns/:id/*", element: <LegacyRedirect /> },
  { path: "*", element: <HardRedirectHome /> },
]);
