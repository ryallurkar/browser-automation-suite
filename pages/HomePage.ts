import { Page } from "@playwright/test";
import { TwoFactorAuthentication } from "./component/TwoFactorAuthentication";

export class HomePage {
  private readonly twoFactorAuthentication: TwoFactorAuthentication;
  constructor(private readonly page: Page) {
    this.twoFactorAuthentication = new TwoFactorAuthentication(page);
  }

  async dismissPasskeyModalIfVisible(): Promise<void> {
    await this.twoFactorAuthentication.dismissPasskeyModalIfVisible();
  }

  async goToPortfolio(): Promise<void> {
    await this.page.getByRole("link", { name: "Portfolio" }).click();
    await this.page.waitForLoadState("domcontentloaded");
  }
}
