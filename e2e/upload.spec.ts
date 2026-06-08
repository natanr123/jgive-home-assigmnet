import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign } from "./helpers";

test("uploading a banner on the edit page attaches it via Active Storage", async ({ page }) => {
  const base = await gotoFeaturedCampaign(page);
  await page.goto(`${base}/edit`);

  // Wait for the Active Storage direct-upload PUT to finish before saving.
  const blobPut = page.waitForResponse(
    (r) => r.url().includes("/rails/active_storage/") && r.request().method() === "PUT"
  );
  await page.locator('input[type="file"]').first().setInputFiles("db/seeds/data/images/story/3.jpg");
  await blobPut;

  await page.getByRole("button", { name: "שמירה" }).click();

  // back on the view page, the hero is served from Active Storage
  await expect(page).toHaveURL(new RegExp(`${base}$`));
  await expect(page.locator("main img").first()).toHaveAttribute(
    "src",
    /\/rails\/active_storage\//
  );
});
