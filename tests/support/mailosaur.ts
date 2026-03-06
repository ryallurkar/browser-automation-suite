import MailosaurClient from 'mailosaur';

import { getRequiredEnv } from './env';

export type MailosaurCleanupMode = 'combined' | 'clear-before' | 'delete-single' | 'filter-only';

export class MailosaurSupport {
  private readonly client: MailosaurClient;
  private readonly serverId: string;
  private readonly cleanupMode: MailosaurCleanupMode;

  constructor() {
    this.client = new MailosaurClient(getRequiredEnv('MAILOSAUR_API_KEY'));
    this.serverId = getRequiredEnv('MAILOSAUR_SERVER_ID');
    this.cleanupMode = this.getCleanupMode();
  }

  async clearInbox(sentTo: string): Promise<void> {
    if (this.cleanupMode !== 'combined' && this.cleanupMode !== 'clear-before') {
      console.log(`🧹 Inbox clear skipped (MAILOSAUR_CLEANUP_MODE=${this.cleanupMode})`);
      return;
    }

    const cleanupWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let page = 0;
    let deletedCount = 0;

    while (true) {
      const result = await this.client.messages.search(
        this.serverId,
        { sentTo },
        { receivedAfter: cleanupWindowStart, page, itemsPerPage: 100 },
      );

      const messages = result.items ?? [];
      if (messages.length === 0) {
        break;
      }

      for (const message of messages) {
        await this.client.messages.del(message.id);
        deletedCount += 1;
      }

      page += 1;
    }

    console.log(`🗑️ Inbox cleanup completed for ${sentTo}; deleted ${deletedCount} message(s)`);
  }

  async waitForDeviceApprovalEmail(receivedAfter: Date, sentTo: string): Promise<string> {
    const filterAfter = new Date(receivedAfter);
    filterAfter.setSeconds(filterAfter.getSeconds() - 10);

    console.log('📧 Waiting for device approval email...');

    const email = await this.client.messages.get(
      this.serverId,
      { sentTo },
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

  private extractApprovalLink(links: Array<{ href?: string }>): string {
    const approvalLink = links.find(
      (link) =>
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
