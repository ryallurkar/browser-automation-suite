import { expect, Page } from "@playwright/test";

export class TwoFactorAuthentication {
  constructor(private readonly page: Page) {}

  async dismissPasskeyModalIfVisible(): Promise<void> {
    try {
      const maybeLaterButton = this.page.getByRole("button", {
        name: "Maybe later",
      });
      await maybeLaterButton.waitFor({ state: "visible", timeout: 10_000 });
      await maybeLaterButton.click();
    } catch {
      console.log("modal didn't appear");
    }
  }
}
