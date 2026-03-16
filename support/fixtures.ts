import { test as base } from "@playwright/test";

import { DeviceApprovalPage } from "../pages/DeviceApprovalPage";
import { HeaderPage } from "../pages/HeaderPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { loadAppConfig } from "./config";
import { getRequiredEnv } from "./env";
import { MailosaurSupport } from "./mailosaur";

type TestFixtures = {
  loginPage: LoginPage;
  deviceApprovalPage: DeviceApprovalPage;
  portfolioPage: PortfolioPage;
  headerPage: HeaderPage;
  homePage: HomePage;
  mailosaurSupport: MailosaurSupport;
  credentials: { username: string; password: string };
  testData: { expectedPortfolioValue: string };
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const { baseUrl } = loadAppConfig();
    const url = process.env.BASE_URL ?? baseUrl;
    await use(new LoginPage(page, url));
  },
  deviceApprovalPage: async ({ page }, use) => {
    await use(new DeviceApprovalPage(page));
  },
  portfolioPage: async ({ page }, use) => {
    await use(new PortfolioPage(page));
  },
  headerPage: async ({ page }, use) => {
    await use(new HeaderPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  mailosaurSupport: async ({}, use) => {
    await use(new MailosaurSupport());
  },
  credentials: async ({}, use) => {
    await use({
      username: getRequiredEnv("TEST_USERNAME"),
      password: getRequiredEnv("TEST_PASSWORD"),
    });
  },
  testData: async ({}, use) => {
    await use({
      expectedPortfolioValue: getRequiredEnv("EXPECTED_PORTFOLIO_VALUE"),
    });
  },
});

export { expect } from "@playwright/test";
