import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign } from "./helpers";

test("campaign page renders title, progress, goal and tabs", async ({ page }) => {
  await gotoFeaturedCampaign(page);

  // title + subtitle
  await expect(page.getByRole("heading", { name: "הגן הכתום", level: 1 })).toBeVisible();

  // progress: a raised amount in ₪, a percent, and the goal
  await expect(page.getByText("גויסו")).toBeVisible();
  await expect(page.getByText(/מספר תורמים/)).toBeVisible();
  await expect(page.getByText(/5,000,000/)).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();

  // the six tabs, in order
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(6);
  await expect(tabs.nth(0)).toHaveText("על הפרויקט");
  await expect(tabs.nth(1)).toHaveText("תרומות אחרונות");

  // donate CTA
  await expect(page.getByRole("link", { name: "לתרומה" }).first()).toBeVisible();
});
