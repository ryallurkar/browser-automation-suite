import { expect, Locator, Page } from "@playwright/test";
import { TwoFactorAuthentication } from "./component/TwoFactorAuthentication";

export class DeviceApprovalPage {
  private readonly twoFactorAuthentication: TwoFactorAuthentication;
  private readonly approvalScreenText: Locator;

  constructor(private readonly page: Page) {
    this.twoFactorAuthentication = new TwoFactorAuthentication(page);
    this.approvalScreenText = this.page.getByText(
      /Use same internet connection/i,
    );
  }

  async waitForApprovalScreen(): Promise<void> {
    await this.page.waitForURL(/\/device-approval/);
    await expect(this.approvalScreenText).toBeVisible();
  }

  async clickApprovalLink(link: string): Promise<void> {
    await this.page.goto(link, { waitUntil: "domcontentloaded" });
  }

  async dismissPasskeyModalIfVisible(): Promise<void> {
    await this.twoFactorAuthentication.dismissPasskeyModalIfVisible();
  }
}
