import { test as setup } from "@playwright/test";

import { DeviceApprovalPage } from "./pages/DeviceApprovalPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { getRequiredEnv } from "./tests/support/env";
import { MailosaurSupport } from "./tests/support/mailosaur";

setup("authenticate and save state", async ({ page }) => {
  const username = getRequiredEnv("TEST_USERNAME");
  const password = getRequiredEnv("TEST_PASSWORD");

  const loginPage = new LoginPage(page);
  const approvalPage = new DeviceApprovalPage(page);
  const homePage = new HomePage(page);
  const mailosaur = new MailosaurSupport();

  await mailosaur.clearInbox(username);

  await loginPage.goto();
  await loginPage.rejectCookiesIfVisible();

  const loginTime = new Date();
  await loginPage.login(username, password);
  await loginPage.waitForDeviceApprovalScreen();

  const approvalLink = await mailosaur.waitForDeviceApprovalEmail(
    loginTime,
    username,
  );

  await approvalPage.clickApprovalLink(approvalLink);

  // Auth state saved here — after device approval, passkey and 2FA modals dismissed
  await approvalPage.dismissPasskeyModalIfVisible();
  await homePage.dismissPasskeyModalIfVisible();

  await page.context().storageState({ path: "auth.json" });
});
