import { expect, test } from "@playwright/test";

test("fixture query params do not grant a session when fixtures are disabled", async ({ page }) => {
  await page.goto("/?e2e_session=admin");

  await expect(page).toHaveURL(/\/\?e2e_session=admin$/);
  await expect(page.getByRole("heading", { name: /Launch your fully branded academy/ })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Sign in" })).toBeVisible();
  await expect(page.locator("summary", { hasText: "Admin User" })).toHaveCount(0);
});

test("fixture-only session route is unavailable when fixtures are disabled", async ({ page }) => {
  const response = await page.goto("/e2e/session-header");

  expect(response?.status()).toBe(404);
  await expect(page.locator("summary", { hasText: "Admin User" })).toHaveCount(0);
});
