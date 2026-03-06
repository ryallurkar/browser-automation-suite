import { expect, Locator, Page } from '@playwright/test';
import dotenv from 'dotenv';
import MailosaurClient from 'mailosaur';

import { loadAppConfig } from '../support/config';
import { getRequiredEnv } from '../support/env';

dotenv.config({ quiet: true })

type MailCleanupMode = 'combined' | 'clear-before' | 'delete-single' | 'filter-only';

export class LoginPage {
  private readonly appConfig = loadAppConfig();
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
    const mode = this.getCleanupMode();
    if (mode !== 'combined' && mode !== 'clear-before') {
      console.log(`🧹 Inbox clear skipped (MAILOSAUR_CLEANUP_MODE=${mode})`);
      return;
    }

    const mailosaur = new MailosaurClient(getRequiredEnv('MAILOSAUR_API_KEY'));
    const serverId = getRequiredEnv('MAILOSAUR_SERVER_ID');

    await mailosaur.messages.deleteAll(serverId);
    console.log('🗑️ Inbox cleared before test');
  }

  async waitForDeviceApprovalEmail(receivedAfter: Date): Promise<string> {
    const mode = this.getCleanupMode();
    const mailosaur = new MailosaurClient(getRequiredEnv('MAILOSAUR_API_KEY'));
    const serverId = getRequiredEnv('MAILOSAUR_SERVER_ID');
    const sentTo = getRequiredEnv('TEST_USERNAME');

    const filterAfter = new Date(receivedAfter);
    filterAfter.setSeconds(filterAfter.getSeconds() - 10);

    console.log('📧 Waiting for device approval email...');

    const email = await mailosaur.messages.get(
      serverId,
      { sentTo },
      { receivedAfter: filterAfter },
    );

    console.log(`✅ Fresh email received: at ${email.received}`);

    // TODO: verify exact device-approval link pattern in the real email template.
    const links = email.html?.links ?? [];
    const approvalLink = links.find(
      (link: any) =>
        typeof link.href === 'string' &&
        (link.href.includes('/new-device-sign-in/web?code=') ||
          link.href.includes('approve') ||
          link.href.includes('device') ||
          link.href.includes('confirm') ||
          link.href.includes('activate')),
    );

    if (!approvalLink?.href) {
      console.log('🔍 All links found in email:');
      for (const link of links) {
        if (link?.href) {
          console.log(` - ${link.href}`);
        }
      }
      throw new Error('Approval link not found in email. Check console for all available links.');
    }

    if (mode === 'combined' || mode === 'delete-single') {
      if (email.id) {
        await mailosaur.messages.del(email.id);
        console.log('🗑️ Email deleted from inbox');
      } else {
        console.log('⚠️ Email id missing, cannot delete message after use');
      }
    } else {
      console.log(`🧹 Single email delete skipped (MAILOSAUR_CLEANUP_MODE=${mode})`);
    }

    return approvalLink.href;
  }

  private getCleanupMode(): MailCleanupMode {
    const raw = (process.env.MAILOSAUR_CLEANUP_MODE ?? 'combined').trim().toLowerCase();
    const allowed: MailCleanupMode[] = ['combined', 'clear-before', 'delete-single', 'filter-only'];
    if (allowed.includes(raw as MailCleanupMode)) {
      return raw as MailCleanupMode;
    }
    console.log(`⚠️ Unknown MAILOSAUR_CLEANUP_MODE="${raw}", defaulting to combined`);
    return 'combined';
  }

}
