import { expect, Page } from "@playwright/test";
import { TwoFactorAuthentication } from "./component/TwoFactorAuthentication";

export class HomePage {
  private readonly twoFactorAuthentication: TwoFactorAuthentication;

  constructor(private readonly page: Page) {
    this.twoFactorAuthentication = new TwoFactorAuthentication(page);
  }

  async assertHomeLoaded(): Promise<void> {
    await expect(this.page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(
      this.page.getByTestId("balance-visibility-toggle"),
    ).toBeVisible();
  }

  async dismissPasskeyModalIfVisible(): Promise<void> {
    await this.twoFactorAuthentication.dismissPasskeyModalIfVisible();
  }

  async goToPortfolio(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.page.getByRole("link", { name: "Portfolio" }).click(),
    ]);
  }
}
