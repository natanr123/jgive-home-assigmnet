import { createBrowserRouter } from "react-router";
import CampaignPage, { campaignLoader } from "./routes/campaign";
import ErrorPage from "./routes/error";
import DonateModal from "./routes/donate/DonateModal";
import DonateAmount from "./routes/donate/DonateAmount";
import DonateDetails, { donateAction } from "./routes/donate/DonateDetails";
import DonateThanks from "./routes/donate/DonateThanks";

export const router = createBrowserRouter([
  {
    id: "campaign",
    path: "/campaigns/:id",
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
]);
