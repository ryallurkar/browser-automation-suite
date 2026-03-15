import { expect, test } from "@playwright/test";

import { DeviceApprovalPage } from "../pages/DeviceApprovalPage";
import { LoginPage } from "../pages/LoginPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { getRequiredEnv } from "./support/env";
import { HomePage } from "../pages/HomePage";

test("login and verify portfolio value", async ({ page }) => {
  const expectedPortfolioValue = getRequiredEnv("EXPECTED_PORTFOLIO_VALUE");
  const username = getRequiredEnv("TEST_USERNAME");
  const password = getRequiredEnv("TEST_PASSWORD");

  const loginPage = new LoginPage(page);

  // Clear inbox before starting (Option B)
  await loginPage.clearInbox(username);

  // Login flow
  await loginPage.goto();
  await loginPage.acceptCookiesIfVisible();

  // Record timestamp before login (Option C)
  const loginTime = new Date();

  await loginPage.login(username, password);
  await loginPage.waitForDeviceApprovalScreen();

  // Get fresh approval email only
  const approvalLink = await loginPage.waitForDeviceApprovalEmail(
    loginTime,
    username,
  );

  const approvalPage = new DeviceApprovalPage(page);
  await approvalPage.clickApprovalLink(approvalLink);
  await approvalPage.dismissPasskeyModalIfVisible();
  const homePage = new HomePage(page);

  homePage.goToPortfolio();
  const portfolioPage = new PortfolioPage(page);
  const value = await portfolioPage.getPortfolioValue();
  expect(value).toContain(expectedPortfolioValue);
  await page.getByRole("button").filter({ hasText: /^$/ }).nth(3).click(); // Bad selector, should be improved, but that's the only way to click the user menu in the header from codegen
  await page.getByRole("menuitem", { name: "Sign out" }).click();
});
