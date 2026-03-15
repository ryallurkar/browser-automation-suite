import { test, expect } from "../support/fixtures";
import { loadAppConfig } from "../support/config";

// auth.json is loaded automatically via storageState in playwright.config.ts
// auth-setup.ts handles login, device approval and modal dismissal once before all tests

test.beforeEach(async ({ page, homePage }) => {
  const { baseUrl } = loadAppConfig();
  const root = process.env.BASE_URL ?? baseUrl;
  await page.goto(`${root}/c`, { waitUntil: "domcontentloaded" });
  await homePage.dismissPasskeyModalIfVisible(); // passkey prompt
  await homePage.assertHomeLoaded(); // ensure home is stable
  await homePage.dismissPasskeyModalIfVisible(); // 2FA setup prompt (delayed)
});

test("verify portfolio value is correct", async ({
  homePage,
  portfolioPage,
  testData,
}) => {
  await test.step("Navigate to portfolio from home", async () => {
    await homePage.goToPortfolio();
  });

  await test.step("Verify portfolio value matches expected", async () => {
    const value = await portfolioPage.getPortfolioValue();
    expect(value).toContain(testData.expectedPortfolioValue);
  });
});

test("verify portfolio page loads successfully", async ({
  homePage,
  portfolioPage,
}) => {
  await test.step("Navigate to portfolio from home", async () => {
    await homePage.goToPortfolio();
  });

  await test.step("Verify portfolio value element is visible", async () => {
    await expect(portfolioPage.portfolioValueElement).toBeVisible();
  });
});
