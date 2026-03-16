import { Locator, Page } from "@playwright/test";

export class PortfolioPage {
  readonly portfolioValueElement: Locator;

  constructor(private readonly page: Page) {
    this.portfolioValueElement = this.page
      .locator('[data-testid="portfolio-value"]')
      .first();
  }

  async getPortfolioValue(): Promise<string> {
    const valueText = await this.portfolioValueElement.innerText();

    if (!valueText) {
      throw new Error("Portfolio value element is visible but empty.");
    }

    return valueText.split("\n")[0].trim();
  }
}
