import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign } from "./helpers";

test("refreshing mid-flow keeps the chosen amount (search-params state)", async ({ page }) => {
  const base = await gotoFeaturedCampaign(page);

  // Land directly on step 2 with the wizard state in the URL, then hard-reload.
  await page.goto(`${base}/donate/details?amountCents=72000&frequency=one_time&displayPreference=full_name`);
  await expect(page.getByText("פרטים אישיים")).toBeVisible();

  await page.reload();

  // The amount survives the reload (it lives in the URL, not component state).
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect(page.getByText("פרטים אישיים")).toBeVisible();
  await expect(page.locator('input[name="amountCents"]')).toHaveValue("72000");
  await expect(page.getByText(/720/)).toBeVisible(); // formatted ₪720 in the footer
});
