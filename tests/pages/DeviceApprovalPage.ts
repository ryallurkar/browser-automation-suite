import { expect, Page } from '@playwright/test';

export class DeviceApprovalPage {
  constructor(private readonly page: Page) {}

  async clickApprovalLink(link: string): Promise<void> {
    await this.page.goto(link, { waitUntil: 'domcontentloaded' });

    await expect(this.page.getByText(/Approving new device/i)).toBeVisible();

    const addPasskeyButton = this.page.getByRole('button', { name: 'Add passkey' });
    await expect(addPasskeyButton).toBeVisible();

    const maybeLaterButton = this.page.getByRole('button', { name: 'Maybe later' });
    await expect(maybeLaterButton).toBeVisible();
    await maybeLaterButton.click();
    await expect(this.page.getByRole('link', { name: 'Home' })).toBeVisible();
  }
}
