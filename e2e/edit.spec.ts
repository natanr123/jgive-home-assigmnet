import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign } from "./helpers";

test("edit page loads campaign data and saves changes", async ({ page }) => {
  const base = await gotoFeaturedCampaign(page);

  await page.goto(`${base}/edit`);
  await expect(page.getByRole("heading", { name: "עריכת קמפיין" })).toBeVisible();

  // fields are prefilled from GraphQL
  await expect(page.getByLabel("שם הקמפיין")).toHaveValue("הגן הכתום");

  // edit the subtitle and save
  const edited = "נערך ב-E2E";
  await page.getByLabel("כותרת משנה").fill(edited);
  await page.getByRole("button", { name: "שמירה" }).click();

  // redirected back to the view page with the change applied
  await expect(page).toHaveURL(new RegExp(`${base}$`));
  await expect(page.getByText(edited)).toBeVisible();
});
