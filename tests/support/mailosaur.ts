import MailosaurClient from 'mailosaur';

import { getRequiredEnv } from './env';

export type MailosaurCleanupMode = 'combined' | 'clear-before' | 'delete-single' | 'filter-only';

export class MailosaurSupport {
  private readonly client: MailosaurClient;
  private readonly serverId: string;
  private readonly sentTo: string;
  private readonly cleanupMode: MailosaurCleanupMode;

  constructor() {
    this.client = new MailosaurClient(getRequiredEnv('MAILOSAUR_API_KEY'));
    this.serverId = getRequiredEnv('MAILOSAUR_SERVER_ID');
    this.sentTo = getRequiredEnv('TEST_USERNAME');
    this.cleanupMode = this.getCleanupMode();
  }

  async clearInbox(): Promise<void> {
    if (this.cleanupMode !== 'combined' && this.cleanupMode !== 'clear-before') {
      console.log(`🧹 Inbox clear skipped (MAILOSAUR_CLEANUP_MODE=${this.cleanupMode})`);
      return;
    }

    await this.client.messages.deleteAll(this.serverId);
    console.log('🗑️ Inbox cleared before test');
  }

  async waitForDeviceApprovalEmail(receivedAfter: Date): Promise<string> {
    const filterAfter = new Date(receivedAfter);
    filterAfter.setSeconds(filterAfter.getSeconds() - 10);

    console.log('📧 Waiting for device approval email...');

    const email = await this.client.messages.get(
      this.serverId,
      { sentTo: this.sentTo },
      { receivedAfter: filterAfter },
    );

    console.log(`✅ Fresh email received: at ${email.received}`);

    const approvalLink = this.extractApprovalLink(email.html?.links ?? []);

    if (this.cleanupMode === 'combined' || this.cleanupMode === 'delete-single') {
      if (email.id) {
        await this.client.messages.del(email.id);
        console.log('🗑️ Email deleted from inbox');
      } else {
        console.log('⚠️ Email id missing, cannot delete message after use');
      }
    } else {
      console.log(`🧹 Single email delete skipped (MAILOSAUR_CLEANUP_MODE=${this.cleanupMode})`);
    }

    return approvalLink;
  }

  private extractApprovalLink(links: any[]): string {
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

    return approvalLink.href;
  }

  private getCleanupMode(): MailosaurCleanupMode {
    const raw = (process.env.MAILOSAUR_CLEANUP_MODE ?? 'combined').trim().toLowerCase();
    const allowed: MailosaurCleanupMode[] = ['combined', 'clear-before', 'delete-single', 'filter-only'];
    if (allowed.includes(raw as MailosaurCleanupMode)) {
      return raw as MailosaurCleanupMode;
    }
    console.log(`⚠️ Unknown MAILOSAUR_CLEANUP_MODE="${raw}", defaulting to combined`);
    return 'combined';
  }
}
