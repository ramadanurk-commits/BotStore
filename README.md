# BotStore

Local setup and team handoff: [TEAM-START.md](TEAM-START.md).
Product comparison: up to three current published products, browser-local selection,
three-language pricing/features/requirements and responsive table. No account is
needed for comparison; checkout and private files keep their existing authorization.

Three-language digital-template marketplace for Kazakhstan. UI: Kazakh, Russian and English. Existing Sites project: `appgprj_6ab2338f3858819198a17e9ceff6ac4f`.

## Features

- Catalog search, category filters, sorting and persistent favorites.
- Platform-owned ChatGPT sign-in. No separate password database.
- D1: users, products, orders, favorites, store settings, uploaded-file metadata and audit trail.
- R2: private seller ZIP uploads (15 MB maximum).
- Free purchases unlock immediately. Paid purchases use **manual bank-transfer verification**. No automatic Kaspi or card processing is connected.
- Purchased files are snapshotted in the order. Updating a product does not replace previously purchased files.
- Seller submissions require administrator publication. Seller payouts are arranged outside the platform; there is no automatic payout system.
- Administrator: product editing, three-language descriptions, ZIP uploads, moderation, order approval/cancellation, users, revenue and payment/purchase terms.
- Owner authorization uses the server-only `ADMIN_EMAIL` environment variable compared against platform-authenticated identity. All APIs enforce ownership/role checks.

## Owner's first launch

1. Open the published site using the owner's ChatGPT account. The initial catalog is created once through the authorized owner initialization endpoint.
2. Open **Админ-панель / Admin panel** in navigation.
3. In **Settings**, enter the real business name, support email, bank-transfer instructions and purchase/refund terms in all three languages.
4. Enable paid sales only once these details are correct. The site never invents bank details.
5. Verify incoming transfers in your bank. Open Orders and confirm only verified full payments. Customer-supplied transfer references alone are not proof of payment.
6. Add or edit real templates and select Published. Seller submissions remain in review until an administrator publishes them.
7. The hosting audience is public. Purchasing and private account data still require ChatGPT sign-in. Standalone Google/email registration is not connected.

## Starting catalog

- Telegram order bot: standard-library Python polling bot; requires Python 3.10+, your Telegram token, admin chat ID and an always-running machine. No included hosting or database.
- Google Sheets CRM: Apps Script creates a CRM sheet and summary formulas.
- Trilingual business website: editable responsive HTML with WhatsApp contact.
- Free income/expense tracker: Apps Script with income, expense and profit formulas.

Sources are in `templates/`. ZIP payloads are bundled on the server in `lib/bundles.ts`, never in public assets. Rebuild with `python scripts/package-templates.py` after changing templates. Each ZIP includes a three-language README.

The included templates are basic starter tools, not a hosted automation service. Bot tokens and business accounts must be configured by the purchaser. Google/Telegram live setup is not exercised without user credentials.

## Development and validation

- Preserve the existing pnpm lockfile and Sites build scripts.
- `node node_modules/typescript/bin/tsc --noEmit`
- `node tests/api.integration.mjs` runs isolated D1/R2 tests without production writes.
- `node scripts/run-framework.mjs build`
- Database schema: `db/schema.ts`; migrations: `drizzle/`.
- Production migrations are applied by Sites. Never replay or rewrite applied migrations.
- Use the Sites supervised preview flow in the managed runtime. Portable localhost development includes the starter's local sign-in helper; local setup assigns its test email as administrator. Production builds do not include this middleware. The API integration suite uses isolated test identities.

## Operational limits

- Manual transfer verification remains available. Freedom Pay code is prepared but disabled until merchant onboarding, credentials and sandbox/live acceptance testing. No automatic seller transfers, refunds, or outbound transactional email.
- User interfaces show up to 500 recent records; audit view shows 50. Revenue aggregates use all orders.
- ZIP files are private and moderation-gated; uploads are format/size checked, not antivirus scanned.
- Before a broader commercial launch, finalize your actual business terms, customer access and operational support process.

## Growth features

- Support tickets with private buyer/admin threads, order links, closure and rate limits.
- Reviews restricted to fulfilled purchases; no fabricated reviews or ratings.
- Seller ledger: gross sales, platform fee (default 15%, configurable 0–50%), net earnings and recorded external payouts. Fee is snapshotted on each new order. Old orders retain fee 0. Payout recording does NOT transfer funds; never record money that has not actually been transferred.
- Product links, demos and a free starter CTA. Demos do not create real Telegram appointments.
- STO booking template: Python + SQLite, service/day/time selection, double-booking prevention, owner-only cancellation, administrator notifications, fixed UTC+5. One vehicle per slot. Setup wizard saves business configuration and produces a private configured ZIP; bot tokens are entered locally, never collected by BotStore.
- Launch checklist in the admin panel. Support and business terms must be finalized before enabling sales.
- The new STO product is added by migration for existing seeded stores; owner initialization also inserts missing built-ins without overwriting edited products.

### Freedom Pay integration — not activated

Server-only `FREEDOMPAY_MERCHANT_ID`, `FREEDOMPAY_SECRET`, canonical HTTPS `SITE_ORIGIN`, and `PAYMENT_MODE=live` enable the adapter. Keep PAYMENT_MODE disabled until the provider has approved the merchant and the complete test/payment/refund process has been exercised with the provider. Do not paste secrets into chat or client code.

Implementation follows https://freedompay.kz/docs-en/merchant-api/intro and https://freedompay.kz/docs-en/merchant-api/pay : signed init_payment.php requests, signed result callbacks at /api/payment/result, KZT/amount/payment-ID checks and idempotent fulfillment. Browser return URLs never mark an order paid. Test payment callbacks are refused. Ambiguous gateway timeouts stay locked; reconcile them in the provider account before any operational repair. There is no admin force-unlock button, automatic reconciliation, or refund implementation. Orders with payment attempts cannot be cancelled/recycled through the manual order endpoint.

### Additional validation

`python tests/booking.test.py` checks the booking flow with a mocked Telegram transport and temporary SQLite database. API integration tests cover reviews, support isolation, commissions, payouts and configured downloads. These are isolated software tests, not evidence of a live bank payment or Telegram deployment.

## Kaspi Pay payment links

Admin Settings now includes the merchant name, an official HTTPS pay.kaspi.kz payment link and an enable switch. No link or bank details are supplied by default. Obtain your point-of-sale link in Kaspi Pay → Remote payments → Payment link, and check that its recipient is your business before enabling. Official guide: https://guide.kaspi.kz/partner/ru/pos/payments/remote/q2019 .

The customer sees the exact order amount and can copy the amount/order ID, open Kaspi, enter the amount and order ID as a message, then return to submit a receipt reference. This is manual verification: neither clicking the link nor submitting a receipt marks an order paid. The administrator checks the actual credit in Kaspi Pay before approving the order. No Kaspi credentials, SMS codes, card numbers, or banking-session scraping are used. A live transfer was not tested.

Kaspi Gold manual transfers: owner-authorized card and phone details are configured as KASPI_TRANSFER_CARD and KASPI_TRANSFER_PHONE in the runtime environment, not committed to source. They are intentionally returned for customer display and copy buttons. Setting them is not automatic payment integration and does not bypass the paid-sales/terms setup gate.
