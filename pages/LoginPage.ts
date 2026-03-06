import { expect, Locator, Page } from '@playwright/test';
import dotenv from 'dotenv';

import { loadAppConfig } from '../tests/support/config';
import { MailosaurSupport } from '../tests/support/mailosaur';

dotenv.config({ quiet: true })

export class LoginPage {
  private readonly appConfig = loadAppConfig();
  private readonly mailosaurSupport = new MailosaurSupport();
  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameField = this.page.getByRole('textbox', { name: 'Email or username' });
    this.passwordField = this.page.getByRole('textbox', { name: 'Password' });
    this.submitButton = this.page.getByRole('button', { name: 'Continue' });
  }

  async goto(): Promise<void> {
    const baseUrl = process.env.BASE_URL ?? this.appConfig.baseUrl;
    const loginUrl = new URL('/login', baseUrl).toString();
    console.log(`➡️ Navigating to login page`);
    await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  }

  async login(username: string, password: string): Promise<void> {
    console.log('🔐 Submitting login credentials');
    await expect(this.usernameField).toBeVisible();
    await expect(this.passwordField).toBeVisible();
    await expect(this.submitButton).toBeVisible();

    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
    await this.submitButton.click();

    // Check for rate limiting immediately after submit.
    await this.checkForRateLimit();
  }

  async checkForRateLimit(): Promise<void> {
    // TODO: verify exact text and selector for the rate-limit message on the real page.
    const rateLimitVisible = await this.page
      .locator('text=tried too many times')
      .isVisible()
      .catch(() => false);

    if (rateLimitVisible) {
      throw new Error(
        '🚫 RATE LIMITED: Too many login attempts from this IP address. Please wait before running tests again. If running in CI, try again in 15-30 mins.',
      );
    }
  }

  async waitForDeviceApprovalScreen(): Promise<void> {
    console.log('⏳ Waiting for device approval screen...');
    await this.page.waitForURL(/\/device-approval/);
    await expect(this.page.getByText(/Use same internet connection/i)).toBeVisible();
    console.log('✅ Device approval screen detected');
  }

  async acceptCookiesIfVisible(): Promise<void> {
    const rejectAllButton = this.page.getByRole('button', { name: 'Reject All' });
    if (await rejectAllButton.isVisible().catch(() => false)) {
      console.log('🍪 Rejecting cookie consent');
      await rejectAllButton.click();
    }
  }

  async clearInbox(): Promise<void> {
    await this.mailosaurSupport.clearInbox();
  }

  async waitForDeviceApprovalEmail(receivedAfter: Date): Promise<string> {
    return this.mailosaurSupport.waitForDeviceApprovalEmail(receivedAfter);
  }

}
