import { expect, type Locator, type Page, test } from "@playwright/test";

async function signInNavigationItem(page: Page): Promise<Locator> {
  if ((page.viewportSize()?.width ?? 1024) < 1024) {
    const openMenu = page.getByRole("button", { name: "Open menu" });
    await expect(openMenu).toBeVisible();
    await openMenu.click();
    return page.getByRole("menuitem", { exact: true, name: "Sign in" });
  }

  return page.getByRole("link", { exact: true, name: "Sign in" });
}

test("fixture query params do not grant a session when fixtures are disabled", async ({ page }) => {
  await page.goto("/?e2e_session=admin");

  await expect(page).toHaveURL(/\/\?e2e_session=admin$/);
  await expect(page.getByRole("heading", { name: "Launch your own learning academy." })).toBeVisible();
  await expect(await signInNavigationItem(page)).toBeVisible();
  await expect(page.locator("summary", { hasText: "Admin User" })).toHaveCount(0);
});

test("fixture-only session route is unavailable when fixtures are disabled", async ({ page }) => {
  const response = await page.goto("/e2e/session-header");

  expect(response?.status()).toBe(404);
  await expect(page.locator("summary", { hasText: "Admin User" })).toHaveCount(0);
});
