# Wiring a real payment provider (pending → paid)

> Part of the [JGive donation page](../README.md). See [PLAN.md](PLAN.md) for the rest of the
> design and [MODELS.md](MODELS.md) for the `Donation` model this builds on.

Out of scope per the brief — submitting only creates a `pending` donation. Here's how I'd
take it to `paid`. I'll use **Stripe** for concreteness, but keep it behind a
provider-agnostic seam so the backend isn't Stripe-specific.

- [ ] **Provider port.** A `Payments::Provider` (`create_intent`,
  `verify_webhook`) with a `Payments::StripeProvider` adapter, so nothing outside the
  adapter depends on Stripe and a second method (e.g. Israeli **bit** via PayMe, which
  JGive also uses) can be added later. **Where it lives:** `app/services/payments/`
  (`provider.rb`, `stripe_provider.rb`, `handle_webhook.rb` → the `Payments::` namespace;
  `app/services` is the Zeitwerk root) + a thin `StripeWebhooksController`. The GraphQL
  mutation and the webhook controller talk to `Payments::Provider`, never to Stripe
  directly.

- [ ] **Start payment on submit (outbound, with an idempotency key).** `createDonation`
  still creates the `pending` donation, then creates a **PaymentIntent** for its
  `amount_cents` (amount set server-side, never trusted from the client) and returns the
  `client_secret`. The create call passes a deterministic **`Idempotency-Key`**
  (e.g. `intent:donation:<id>`) so a retried request can't create a second intent →
  no double charge.

- [ ] **Collect payment in the modal (best UX).** Render Stripe's **Payment Element**
  inside the existing donate modal (`<Elements clientSecret>` → `<PaymentElement>` →
  `stripe.confirmPayment({ return_url })`). Card stays in-flow (no redirect); 3-D Secure
  and redirect-based methods like bit still hand off as needed. Card fields live in
  Stripe's iframes → PCI SAQ A (card data never touches our server).

- [ ] **Webhook endpoint = source of truth.** `POST /webhooks/stripe`
  (`StripeWebhooksController`, CSRF-skipped — Stripe authenticates via signature):
  - read the **raw body**, **verify the `Stripe-Signature`** with the endpoint secret;
  - **dedupe inbound by `event.id`** (unique index) — Stripe may redeliver the same event;
  - on `payment_intent.succeeded` → `donation.update!(status: :paid, completed_at: Time.current)`
    (event-id record + update in one transaction); on `payment_intent.payment_failed` /
    `checkout.session.expired` → `:failed`;
  - return **2xx fast**; run side effects (receipt email, re-run `CalcCommissionJob`) async.

  The browser redirect/return is only UX — the **webhook** is authoritative, since the tab
  can close before returning.

- [ ] **Two idempotency guards, different directions:** the outbound `Idempotency-Key`
  prevents a duplicate **charge**; the inbound `event.id` store prevents applying the same
  confirmation twice (double `paid`, double email/commission).

- [ ] **Recurring** → Stripe subscription mode, capped by a `max_recurring_months`-style
  setting (JGive exposes `maxRecurringMonths: 36`).

- [ ] **Tighten the demo policy:** switch `Donation.countable` to **paid-only** (one-line
  change already isolated in the model) so pending donations stop counting publicly, and
  rate-limit `createDonation` (Rack::Attack).

**Why this needs almost no new modeling:** the `Donation` `status` enum
(`pending/paid/failed`) + `completed_at` already exist, and progress is **computed** from
`countable` — so flipping a donation to `paid` is reflected automatically, nothing else to
update. Local testing: the Stripe CLI (`stripe listen --forward-to localhost:3000/webhooks/stripe`,
`stripe trigger payment_intent.succeeded`).
