import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign, donorCount } from "./helpers";

test("full donation flow creates a pending donation and updates progress", async ({ page }) => {
  await gotoFeaturedCampaign(page);
  const before = await donorCount(page);

  // open the modal (URL becomes /donate/amount)
  await page.getByRole("link", { name: "לתרומה" }).click();
  await expect(page).toHaveURL(/\/donate\/amount$/);
  await expect(page.locator("dialog[open]")).toBeVisible();

  // pick the ₪180 preset (label "נטיעת עץ") and continue
  await page.getByRole("button", { name: /נטיעת עץ/ }).click();
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page).toHaveURL(/\/donate\/details/);

  // fill names and submit
  await page.getByLabel("שם פרטי").fill("בדיקה");
  await page.getByLabel("שם משפחה").fill("פליירייט");
  await page.getByRole("button", { name: "סיום ותרומה" }).click();

  // thank-you route
  await expect(page).toHaveURL(/\/donate\/thanks$/);
  await expect(page.getByText(/תודה רבה/)).toBeVisible();

  // back to campaign — progress revalidated (delta, not absolute)
  await page.getByRole("button", { name: "חזרה לקמפיין" }).click();
  await expect(page).toHaveURL(/\/campaigns\/\d+$/);
  await expect.poll(() => donorCount(page)).toBe(before + 1);

  // the new pending donation shows in the recent tab with its badge
  await page.getByRole("tab", { name: "תרומות אחרונות" }).click();
  const firstCard = page.locator("li").filter({ hasText: "בדיקה פליירייט" }).first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByText("ממתין לאישור")).toBeVisible();
});
