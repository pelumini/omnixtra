import { expect, test } from "@playwright/test";

test("admin dashboard exposes reporting and CSV export", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "CSV" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Course Completion" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learner Progress" })).toBeVisible();
});

test("onboarding wizard tracks launch steps", async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  const firstStep = page.getByRole("button", { name: "Choose plan" });
  await firstStep.click();
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
});

test("pricing page renders self-serve plans", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Starter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Growth" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Business" })).toBeVisible();
});
