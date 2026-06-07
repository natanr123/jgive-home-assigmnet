import { createBrowserRouter } from "react-router";
import CampaignPage, { campaignLoader } from "./routes/campaign";
import ErrorPage from "./routes/error";

export const router = createBrowserRouter([
  {
    path: "/campaigns/:id",
    loader: campaignLoader,
    Component: CampaignPage,
    errorElement: <ErrorPage />,
    children: [
      // Nested donate modal routes are added in step 6.
    ],
  },
]);
