# Sahly

A trust-first marketplace MVP for buying, selling, and renting pre-loved baby products. No database, no accounts — every form submission arrives as an email.

## How the MVP works

- **Home / Browse / Product** display listings from the static catalogue at [`src/data/products.js`](src/data/products.js). Add an entry only after you've verified the product with the seller.
- **Sell**, **Rent**, product **Enquiry**, and the "Tell us what you need" **Wanted** flow all POST to `/api/submit`.
- The Cloudflare Worker in [`worker.js`](worker.js) generates a reference id, emails you the submission, and emails the parent a confirmation.
- Every response is a real customer conversation, so you handle price, pickup, payment, and rental terms manually until the numbers justify software.

## Local development

```powershell
npm install
npm run dev        # Vite on http://localhost:5173, proxying /api to the Worker
npm run dev:api    # in a second terminal: Wrangler dev on http://localhost:8787
```

Without the Worker running, forms will still validate but the API call fails. Start `dev:api` when you want to test end-to-end email flow.

## Email configuration (Resend)

The Worker uses [Resend](https://resend.com) because a single fetch call from Workers is enough to send email. Sign up (free tier is generous), verify your sending domain, then set the values:

```powershell
# Public (stored in wrangler.jsonc)
# FROM_EMAIL — verified sender (e.g. "Sahly <hello@yourdomain.com>")

# Secret (never commit; store in Cloudflare)
wrangler secret put RESEND_API_KEY
wrangler secret put COORDINATOR_EMAIL
```

For local Wrangler runs, put the same values in a `.dev.vars` file at the repo root:

```
RESEND_API_KEY=re_xxx
COORDINATOR_EMAIL=hello@yourdomain.com
FROM_EMAIL=Sahly <hello@yourdomain.com>
```

If `RESEND_API_KEY` is missing the Worker still returns a success response with a reference id but skips the actual send, which keeps early demos usable.

## Adding a listing

1. A parent submits the Sell / Rent form. You receive an email with photos attached.
2. You reply, inspect the product, agree on price.
3. You add an entry to [`src/data/products.js`](src/data/products.js) and commit.
4. `npm run deploy` publishes the updated catalogue to Cloudflare.

## Cloudflare deployment

```powershell
npm run deploy
```

`wrangler deploy` uploads `dist/` as static assets and the Worker in one step. The Worker serves `/api/submit` and falls through to the assets for every other path, with SPA fallback for the hash-based routes.
