# Portfolio Validator

Playwright + TypeScript acceptance tests with automated device-approval email handling.

## Prerequisites

- Node.js 18+
- Mailosaur account
- Exchange account registered with a Mailosaur inbox address

## Mailosaur Setup

1. Create an account on Mailosaur
2. Note your Server ID from the dashboard
3. Get your API key from the API section
4. Register your exchange account email as `anything@YOUR_SERVER_ID.mailosaur.net`
5. Add both Mailosaur values to `.env`

## Installation

1. Clone the repository
2. `npm install`
3. `npx playwright install chromium`

## Configuration

1. Copy `.env.example` to `.env`
2. Fill in all values:
   - `TEST_USERNAME`
   - `TEST_PASSWORD`
   - `EXPECTED_PORTFOLIO_VALUE`
   - `BASE_URL`
   - `MAILOSAUR_API_KEY`
   - `MAILOSAUR_SERVER_ID`
   - `MAILOSAUR_CLEANUP_MODE` (`combined`, `clear-before`, `delete-single`, `filter-only`)

## Running Tests

Headless (default):

```bash
npx playwright test
```

Headed (see browser):

```bash
npx playwright test --headed
```

## On Linux

```bash
npx playwright install-deps chromium
npx playwright test
```

## CI/CD

Add these as GitHub Secrets:
- `TEST_USERNAME`
- `TEST_PASSWORD`
- `EXPECTED_PORTFOLIO_VALUE`
- `BASE_URL`
- `MAILOSAUR_API_KEY`
- `MAILOSAUR_SERVER_ID`

## TODO Before Running

The following selectors and patterns must be verified against real pages:
1. Device approval email link pattern in Mailosaur inbox content
2. 2FA popup "Maybe Later" or "Skip" button
3. Portfolio value element selector

## Known Limitation

This flow depends on device-approval email content format and optional post-login security prompts. Selector and link-pattern updates may be required if the product UI or email template changes.
