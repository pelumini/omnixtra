import { expect, type Locator, type Page, test } from "@playwright/test";

async function appNavigation(page: Page): Promise<Locator> {
  if ((page.viewportSize()?.width ?? 768) < 768) {
    const openNavigation = page.getByRole("button", { name: "Open navigation menu" });
    await expect(openNavigation).toBeVisible();
    await openNavigation.click();
    return page.getByRole("menu");
  }

  return page.getByRole("complementary");
}

test("org admin sees member, billing, and course creation entry points while member does not", async ({
  page,
}) => {
  await page.goto("/e2e/permissions/admin");

  const adminNavigation = await appNavigation(page);
  await expect(adminNavigation.getByRole("link", { name: "Members" })).toBeVisible();
  await expect(adminNavigation.getByRole("link", { name: "Billing" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add course" })).toBeVisible();

  await page.goto("/e2e/permissions/member");

  await expect(page.getByRole("link", { name: "Members" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Billing" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add course" })).toHaveCount(0);
});

test("member direct navigation to members sees denial and no member data", async ({ page }) => {
  await page.goto("/e2e/permissions/member-direct-members");

  await expect(page.getByRole("heading", { name: "This area is for admins" })).toBeVisible();
  await expect(page.getByText("00000000-0000-0000-0000-000000000921")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create user" })).toHaveCount(0);
});

test("admin at admin-seat limit cannot invite another admin but can still choose member", async ({
  page,
}) => {
  await page.goto("/e2e/permissions/admin-seat-limit");

  const createUserDialog = page.getByRole("dialog", { name: "Create user" });
  await expect(page.getByText("You've used all 3 admin seats")).toBeVisible();
  await expect(createUserDialog.getByRole("button", { name: "Create user" })).toBeDisabled();

  await page.getByLabel("Role").selectOption("member");

  await expect(page.getByText("You've used all 3 admin seats")).toHaveCount(0);
  await expect(createUserDialog.getByRole("button", { name: "Create user" })).toBeDisabled();
});

test("learner course surface omits authoring and direct builder access is denied without data", async ({
  page,
}) => {
  await page.goto("/e2e/permissions/learner-course");

  await expect(page.getByRole("heading", { name: "Learner Course A" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Builder" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);

  await page.goto("/e2e/permissions/learner-builder");

  await expect(page.getByRole("heading", { name: "This course is not yours to edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Role Gated Onboarding" })).toHaveCount(0);
});

test("course owner sees authoring entry and can reach builder controls", async ({ page }) => {
  await page.goto("/e2e/permissions/admin");

  await expect(page.getByRole("link", { name: "Builder" })).toBeVisible();

  await page.goto("/e2e/permissions/course-owner-builder");

  await expect(page.getByRole("heading", { name: "Role Gated Onboarding" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
});
