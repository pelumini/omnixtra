import { expect, test } from "@playwright/test";

test("admin reporting exposes dashboard, CSV export, and report tables", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "CSV" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course Completion" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learner Progress" })).toBeVisible();
});
