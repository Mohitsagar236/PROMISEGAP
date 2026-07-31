import { test, expect } from "@playwright/test";

test("demo user can inspect dashboard and document ingestion", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@promisegap.demo");
  await page.getByLabel("Password").fill("PromiseGap123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("link", { name: "Ingest document" }).click();
  await expect(page.getByRole("heading", { name: "New document" })).toBeVisible();
  await expect(page.getByLabel("Raw text")).toContainText("Employee profile photos");
});
