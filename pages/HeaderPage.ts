import { Page } from "@playwright/test";

export class HeaderPage {
  constructor(private readonly page: Page) {}

  async signOut(): Promise<void> {
    // Bad selector — codegen only option without source access
    await this.page
      .getByRole("button")
      .filter({ hasText: /^$/ })
      .nth(3)
      .click();
    await this.page.getByRole("menuitem", { name: "Sign out" }).click();
  }
}
