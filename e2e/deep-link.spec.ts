import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign } from "./helpers";

test("deep-linking the donate URL opens the page with the modal open", async ({ page }) => {
  const base = await gotoFeaturedCampaign(page);

  // Load the modal URL directly (the SPA-shell behaviour: server returns the shell,
  // the client router renders the campaign page with the modal mounted).
  await page.goto(`${base}/donate/amount`);
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect(page.getByText("פרטי התרומה שלי")).toBeVisible();
  // the page behind the modal is still the campaign
  await expect(page.getByRole("heading", { name: "הגן הכתום", level: 1 })).toBeVisible();
});
