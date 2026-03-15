import { Locator, Page } from "@playwright/test";

export class LoginPage {
  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly submitButton: Locator;
  private readonly rejectCookiesButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly baseUrl: string,
  ) {
    this.usernameField = this.page.getByRole("textbox", {
      name: "Email or username",
    });
    this.passwordField = this.page.getByRole("textbox", { name: "Password" });
    this.submitButton = this.page.getByRole("button", { name: "Continue" });
    this.rejectCookiesButton = this.page.getByRole("button", {
      name: "Reject All",
    });
  }

  async goto(): Promise<void> {
    const loginUrl = new URL("/login", this.baseUrl).toString();
    await this.page.goto(loginUrl, { waitUntil: "load" });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.submitButton.click(),
    ]);
    await this.checkForRateLimit();
  }

  async checkForRateLimit(): Promise<void> {
    // TODO: verify exact text and selector for the rate-limit message on the real page.
    const rateLimitVisible = await this.page
      .locator("text=tried too many times")
      .isVisible()
      .catch(() => false);

    if (rateLimitVisible) {
      throw new Error(
        "🚫 RATE LIMITED: Too many login attempts from this IP address. Please wait before running tests again. If running in CI, try again in 15-30 mins.",
      );
    }
  }

  async acceptCookiesIfVisible(): Promise<void> {
    if (await this.rejectCookiesButton.isVisible().catch(() => false)) {
      await this.rejectCookiesButton.click();
    }
  }
}
