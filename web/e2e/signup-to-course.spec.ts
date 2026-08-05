import { expect, test } from "@playwright/test";

test("academy creation entry is public while admin course tools require sign-in", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Launch your fully branded academy/ })).toBeVisible();

  await page.getByRole("link", { name: "Create your academy" }).click();

  await expect(page).toHaveURL(/\/get-started$/);
  await expect(page.getByRole("heading", { name: "Create your academy" })).toBeVisible();
  await expect(page.getByLabel("Academy name")).toBeVisible();
  await expect(page.getByLabel("Subdomain")).toBeVisible();

  await page.getByRole("button", { name: "Create academy" }).click();

  await expect(page.getByText("Give your academy a name.")).toBeVisible();
  await expect(page.getByText("Pick a subdomain of at least 2 characters.")).toBeVisible();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("This field is required.")).toBeVisible();
  await expect(page.getByText("Use at least 12 characters.")).toBeVisible();
  await expect(page.getByText(/^min_length$/)).toHaveCount(0);
  await expect(page.getByText(/^required$/)).toHaveCount(0);

  await page.goto("/admin/courses");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
