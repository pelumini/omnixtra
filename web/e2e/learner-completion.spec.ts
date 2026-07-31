import { expect, test } from "@playwright/test";

const courseId = "00000000-0000-0000-0000-000000000101";

test("learner course page exposes completion, quiz, certificate, and tutor surfaces", async ({ page }) => {
  await page.goto(`/learn/courses/${courseId}`);

  await expect(page.getByRole("heading", { name: "Course Player" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enrol" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tutor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quiz" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Certificate" })).toBeVisible();
});
