import { expect, test } from "@playwright/test";

test("tenant creation entry connects to onboarding and course creation", async ({ page }) => {
  await page.goto("/auth");

  await expect(page.getByRole("heading", { name: "Access" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Organization" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accept Invitation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

  await page.goto("/onboarding");
  await page.getByRole("link", { name: "Open" }).nth(2).click();

  await expect(page).toHaveURL(/\/admin\/courses$/);
  await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New Course" })).toBeVisible();
});
