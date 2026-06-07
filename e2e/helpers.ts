import { type Page, expect } from "@playwright/test";

// Navigate to the featured campaign via the root redirect (id-agnostic) and return
// its path, e.g. "/campaigns/3".
export async function gotoFeaturedCampaign(page: Page): Promise<string> {
  await page.goto("/");
  await page.waitForURL(/\/campaigns\/\d+$/);
  await expect(page.getByRole("heading", { name: "הגן הכתום", level: 1 })).toBeVisible();
  return new URL(page.url()).pathname;
}

// Read the "מספר תורמים: 3,170" counter as a number.
export async function donorCount(page: Page): Promise<number> {
  const text = await page.getByText(/מספר תורמים/).innerText();
  return Number(text.replace(/\D/g, ""));
}
