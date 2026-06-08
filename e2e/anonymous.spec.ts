import { test, expect } from "@playwright/test";
import { gotoFeaturedCampaign } from "./helpers";

test("anonymous donation shows no name on the card", async ({ page }) => {
  await gotoFeaturedCampaign(page);

  await page.getByRole("link", { name: "לתרומה" }).first().click();
  await page.getByRole("button", { name: /נטיעת 3 עצים/ }).click(); // ₪720 preset

  // choose "רק סכום התרומה" (anonymous)
  await page.getByLabel("אני רוצה שבעמוד הפרויקט יופיע:").selectOption("anonymous");
  await page.getByRole("button", { name: "המשך" }).click();

  // no name fields for anonymous — submit directly
  await expect(page.locator('input[name="donorFirstName"]')).toHaveCount(0);
  await page.getByRole("button", { name: "סיום ותרומה" }).click();
  await expect(page).toHaveURL(/\/donate\/thanks$/);

  await page.getByRole("button", { name: "חזרה לקמפיין" }).click();
  await page.getByRole("tab", { name: "תרומות אחרונות" }).click();

  // the most recent (pending) card is anonymous
  const firstCard = page.locator("ul li").first();
  await expect(firstCard.getByText("תורם/ת אנונימי/ת")).toBeVisible();
});
