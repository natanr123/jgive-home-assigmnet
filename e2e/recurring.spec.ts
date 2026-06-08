import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign, donorCount, raisedShekels } from "./helpers";

test("recurring donation: months selector drives the total and persists the term", async ({ page }) => {
  await gotoFeaturedCampaign(page);
  const beforeDonors = await donorCount(page);
  const beforeRaised = await raisedShekels(page);

  await page.getByRole("link", { name: "לתרומה" }).first().click();
  await expect(page).toHaveURL(/\/donate\/amount$/);

  // Switch to standing order — the months selector appears (default 36).
  await page.getByText("הוראת קבע", { exact: true }).click();
  const months = page.locator("#months");
  await expect(months).toBeVisible();
  await expect(months).toHaveValue("36");

  // Presets now read "36 × ₪amount"; pick "נטיעת עץ" (₪180/mo).
  await expect(page.getByRole("button", { name: /נטיעת עץ/ })).toContainText("36 ×");
  await page.getByRole("button", { name: /נטיעת עץ/ }).click();

  // Total = 36 × 180 = 6,480 shown next to the months selector (סה"כ).
  await expect(page.getByText(/סה"כ/)).toContainText("6,480");

  // Drop the term to 12 → total becomes 12 × 180 = 2,160.
  await months.selectOption("12");
  await expect(page.getByText(/סה"כ/)).toContainText("2,160");

  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page).toHaveURL(/recurringMonths=12/);

  // Per-charge amount (₪180) is what the backend stores as amount_cents.
  await expect(page.locator('input[name="amountCents"]')).toHaveValue("18000");
  await expect(page.locator('input[name="recurringMonths"]')).toHaveValue("12");

  await page.getByLabel("שם פרטי").fill("חודש");
  await page.getByLabel("שם משפחה").fill("קבוע");
  await page.getByRole("button", { name: "סיום ותרומה" }).click();
  await expect(page).toHaveURL(/\/donate\/thanks$/);

  await page.getByRole("button", { name: "חזרה לקמפיין" }).click();
  // Progress counts the per-charge ₪180 installment — NOT the 12 × ₪180 = ₪2,160 pledge.
  await expect.poll(() => donorCount(page)).toBe(beforeDonors + 1);
  await expect.poll(() => raisedShekels(page)).toBe(beforeRaised + 180);

  // The new donation shows in the feed with the standing-order label + term.
  await page.getByRole("tab", { name: "תרומות אחרונות" }).click();
  const card = page.locator("li").filter({ hasText: "חודש קבוע" }).first();
  await expect(card).toBeVisible();
  await expect(card.getByText(/הוראת קבע/)).toBeVisible();
  await expect(card.getByText(/12 חודשים/)).toBeVisible();
});

test("deep-linking details as monthly without a term redirects back to the amount step", async ({ page }) => {
  const base = await gotoFeaturedCampaign(page);

  // Monthly requires a term, which is only chosen on the amount step. A details
  // deep-link missing it must bounce back rather than submit something the backend rejects.
  await page.goto(`${base}/donate/details?frequency=monthly&amountCents=18000&displayPreference=anonymous`);
  await expect(page).toHaveURL(/\/donate\/amount$/);
  await expect(page.getByText("פרטי התרומה שלי")).toBeVisible();
});
