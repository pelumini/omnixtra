import { expect, test } from "@playwright/test";

test("unauthenticated root renders the public landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Launch your own learning academy." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create your academy" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Join with invite" }).first()).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Sign in" })).toBeVisible();
});

test("bare localhost login asks for an academy host", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Open your academy" })).toBeVisible();
  await expect(page.getByText("your-academy.localhost:3001/login")).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an academy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Use your invitation" })).toBeVisible();
});

test("authenticated header shows account menu and hides sign in", async ({ page }) => {
  await page.goto("/e2e/session-header");

  await expect(page.locator("summary", { hasText: "Admin User" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Sign in" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  await page.locator("summary", { hasText: "Admin User" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("server root router sends admins to admin and members to my courses", async ({ page }) => {
  await page.goto("/?e2e_session=admin");

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /Welcome, .+!/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Launch your own learning academy." })).toHaveCount(0);

  await page.goto("/?e2e_session=member");

  await expect(page).toHaveURL(/\/my-courses\?e2e=member$/);
  await expect(page.getByRole("heading", { name: "My Courses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Launch your own learning academy." })).toHaveCount(0);

  await page.goto("/?e2e_session=pending");

  await expect(page).toHaveURL(/\/\?e2e_session=pending$/);
  await expect(page.getByRole("heading", { name: "Invitation required" })).toBeVisible();
});

test("my courses renders only capability sections held by the caller", async ({ page }) => {
  await page.goto("/my-courses?e2e=learner-only");

  await expect(page.getByRole("heading", { name: "Courses I'm taking" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Security Basics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Courses I facilitate" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Courses I own" })).toHaveCount(0);

  await page.goto("/my-courses?e2e=member");

  await expect(page.getByRole("heading", { name: "Courses I'm taking" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Courses I facilitate" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Courses I own" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customer Enablement" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manager Onboarding" })).toBeVisible();
});

test("my courses supports admin visits and zero-total member state", async ({ page }) => {
  await page.goto("/my-courses?e2e=admin");

  await expect(page.getByRole("heading", { name: "My Courses" })).toBeVisible();
  await expect(
    page.getByRole("complementary").getByRole("link", { name: "Members" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Courses I own" })).toBeVisible();

  await page.goto("/my-courses?e2e=empty");

  await expect(
    page.getByRole("heading", {
      name: "You are in Acme Learning but have not been added to any courses yet.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Courses I'm taking" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Courses I facilitate" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Courses I own" })).toHaveCount(0);
});

test("member remains denied from the existing admin member-management gate", async ({ page }) => {
  await page.goto("/e2e/permissions/member-direct-members");

  await expect(page.getByRole("heading", { name: "This area is for admins" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Invite member" })).toHaveCount(0);
});
