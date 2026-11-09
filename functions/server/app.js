/**
 * Self-hosted runner for the Cloud Functions in src/index.ts.
 *
 * Firebase only runs Cloud Functions on the paid Blaze plan. This Express app runs
 * the very same compiled functions (lib/index.js) on any Node host (Vercel, Render,
 * Railway, a VPS...), while Firestore and Auth stay on the free Spark plan.
 *
 *   POST /<callableName>      Firebase callable protocol ({ data } -> { result } | { error })
 *   ANY  /<httpFunctionName>  onRequest functions (payment + WhatsApp webhooks)
 *   GET  /cron/<scheduleName> onSchedule functions, guarded by CRON_SECRET
 *
 * Secrets are read from environment variables with the same names as the Firebase
 * secrets (GMAIL_EMAIL, GMAIL_PASSWORD, STRIPE_SECRET_KEY, ...).
 */
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// The Admin SDK needs explicit credentials outside Google Cloud. Initialise it before
// loading lib/index.js, which skips its own initializeApp() when an app exists.
if (admin.apps.length === 0) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not set (paste the service account JSON, or its base64).");
  }
  const fs = require("fs");
  // Accepts the JSON itself, a path to the downloaded key file, or base64 of the JSON.
  const json = raw.trim().startsWith("{") ? raw
    : fs.existsSync(raw) ? fs.readFileSync(raw, "utf8")
    : Buffer.from(raw, "base64").toString("utf8");
  const serviceAccount = JSON.parse(json);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const { HttpsError } = require("firebase-functions/v2/https");
const fns = require("../lib/index.js");

const app = express();
app.disable("x-powered-by");

// Keep the raw bytes (Stripe verifies webhook signatures against them) and parse the
// body ourselves, matching what Cloud Functions hands to handlers.
app.use(express.raw({ type: () => true, limit: "50mb" }));
app.use((req, _res, next) => {
  const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  req.rawBody = buf;
  const type = String(req.headers["content-type"] || "");
  req.body = {};
  if (buf.length) {
    try {
      if (type.includes("application/json")) req.body = JSON.parse(buf.toString("utf8"));
      else if (type.includes("application/x-www-form-urlencoded")) {
        req.body = Object.fromEntries(new URLSearchParams(buf.toString("utf8")));
      } else req.body = buf.toString("utf8");
    } catch {
      req.body = {};
    }
  }
  next();
});

app.get("/", (_req, res) => res.json({ ok: true, service: "endorse-api" }));

const callableCors = cors({ origin: true, methods: ["POST", "OPTIONS"], maxAge: 86400 });

function sendCallableError(res, err) {
  if (err instanceof HttpsError) {
    res.status(err.httpErrorCode.status).json({ error: err.toJSON() });
    return;
  }
  console.error("Unhandled error in callable:", err);
  res.status(500).json({ error: { status: "INTERNAL", message: "INTERNAL" } });
}

for (const [name, fn] of Object.entries(fns)) {
  const endpoint = fn && fn.__endpoint;
  if (!endpoint) continue;

  if (endpoint.callableTrigger) {
    app.options(`/${name}`, callableCors);
    app.post(`/${name}`, callableCors, async (req, res) => {
      try {
        if (!req.body || typeof req.body !== "object" || !("data" in req.body)) {
          throw new HttpsError("invalid-argument", "Bad Request");
        }

        let auth;
        const header = String(req.headers.authorization || "");
        const match = header.match(/^Bearer\s+(.+)$/i);
        if (match) {
          try {
            const token = await admin.auth().verifyIdToken(match[1]);
            auth = { uid: token.uid, token, rawToken: match[1] };
          } catch {
            throw new HttpsError("unauthenticated", "Unauthenticated");
          }
        }

        const result = await fn.run({
          data: req.body.data,
          auth,
          rawRequest: req,
          acceptsStreaming: false,
        });
        res.status(200).json({ result: result === undefined ? null : result });
      } catch (err) {
        sendCallableError(res, err);
      }
    });
  } else if (endpoint.scheduleTrigger) {
    app.get(`/cron/${name}`, async (req, res) => {
      const secret = process.env.CRON_SECRET;
      if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
        res.status(401).send("Unauthorized");
        return;
      }
      try {
        await fn.run({ scheduleTime: new Date().toISOString(), jobName: name });
        res.json({ ok: true });
      } catch (err) {
        console.error(`Scheduled job ${name} failed:`, err);
        res.status(500).json({ ok: false });
      }
    });
  } else if (endpoint.httpsTrigger) {
    app.all(`/${name}`, (req, res) => fn(req, res));
  }
}

module.exports = app;
