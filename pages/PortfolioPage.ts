import { expect, Locator, Page } from '@playwright/test';

export class PortfolioPage {
  private readonly portfolioValueElement: Locator;

  constructor(private readonly page: Page) {
    this.portfolioValueElement = this.page.locator('[data-testid="portfolio-value"]').first();
  }

  async getPortfolioValue(): Promise<string> {
    await expect(this.portfolioValueElement).toBeVisible();
    const valueText = await this.portfolioValueElement.textContent();

    if (!valueText) {
      throw new Error('Portfolio value element is visible but empty.');
    }

    return valueText.trim();
  }
}
