# Endorse API server (no Blaze plan needed)

Runs the functions in `src/index.ts` on Vercel (or any Node host). Firestore and
Firebase Auth stay on the free Spark plan; only the backend code moves.

## Deploy to Vercel (free Hobby plan, no card)

1. Push this repo to GitHub, then on vercel.com → **Add New → Project** → import it.
2. Set **Root Directory** to `functions`. Framework preset: **Other**. Leave the build settings alone (`vercel.json` sets them).
3. Add these **Environment Variables**:

   | Name | Value |
   |---|---|
   | `FIREBASE_SERVICE_ACCOUNT` | Firebase console → Project settings → Service accounts → **Generate new private key**; paste the whole JSON |
   | `GMAIL_EMAIL`, `GMAIL_PASSWORD` | Gmail address + App Password |
   | `POSTGRES_URL` | The Postgres URL Prisma uses |
   | `PAYSTACK_SECRET_KEY_LIVE`, `PAYSTACK_SECRET_KEY_TEST` | Paystack keys |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe keys |
   | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API |
   | `ANTHROPIC_API_KEY` | For document summaries |
   | `CRON_SECRET` | Any long random string (protects the daily reminder job) |

4. Deploy. Opening `https://<your-project>.vercel.app/` should show `{"ok":true,...}`.
5. In the **frontend** environment (Render and your local `.env`), set
   `VITE_API_URL=https://<your-project>.vercel.app` and redeploy the frontend.
6. Point webhooks at the new URLs:
   - Stripe / Paystack: `https://<your-project>.vercel.app/handlePaymentWebhook`
   - Meta WhatsApp: `https://<your-project>.vercel.app/whatsappWebhook`

## Run locally / on Render, Railway or a VPS

```
npm install && npm run vercel-build
npm run server        # listens on $PORT (default 8080)
```

## Endpoints

- `POST /<name>`: every `onCall` function, using the same protocol as Firebase callables
- `ANY /<name>`: `onRequest` functions (webhooks)
- `GET /cron/<name>`: `onSchedule` functions; requires `Authorization: Bearer $CRON_SECRET`. Vercel Cron calls `remindPlanExpiry` daily at 08:00 UTC (09:00 Lagos).

## Limits on the Vercel free plan

- Request bodies are capped at **4.5 MB**, so very large PDFs sent as base64 will be rejected.
- Functions time out after 300 s.
