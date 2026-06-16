import { test, expect } from "@playwright/test";

// The header language/currency switcher rewrites the /:locale/:currency URL prefix, which
// drives the whole UI (translation + RTL/LTR + currency formatting), mirroring the live site.
test("switcher flips language (he->en), direction, and currency", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/he\/ils\/campaigns\/\d+$/);

  // Hebrew default: RTL + Hebrew donate CTA.
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("link", { name: "לתרומה" }).first()).toBeVisible();

  // Open the switcher (trigger shows "HE | ILS"), pick English + USD, confirm (Done = "סיום" while still he).
  await page.getByRole("button", { name: /HE \| ILS/ }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: /\(USD\)/ }).click();
  await page.getByRole("button", { name: "סיום" }).click();

  // URL, direction, language, and chrome all flip to English/LTR.
  await page.waitForURL(/\/en\/usd\/campaigns\/\d+/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Donate" }).first()).toBeVisible();
  // Amounts now render in USD.
  await expect(page.getByText(/\$/).first()).toBeVisible();

  // Switch back to Hebrew (trigger now shows "EN | USD"; Done = "Done" while still en).
  await page.getByRole("button", { name: /EN \| USD/ }).click();
  await page.getByRole("button", { name: "עברית" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.waitForURL(/\/he\/usd\/campaigns\/\d+/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
