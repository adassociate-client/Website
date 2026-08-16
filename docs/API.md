# AD Associates — API

Base URL in development: `http://localhost:3000`

Two things this backend does: let visitors **browse the service catalogue**, and
let them **send an enquiry** — through the built-in form, or by following the
phone / WhatsApp / Instagram links it serves.

## Response envelope

Every endpoint returns the same shape.

```jsonc
// success
{ "data": <resource or array>, "meta": { "total": 16, "limit": 24, "offset": 0, "hasMore": false } }

// failure
{ "error": { "code": "validation_failed", "message": "Request validation failed",
             "details": [{ "field": "email", "message": "A valid email address is required" }] } }
```

| code | HTTP | when |
|---|---|---|
| `bad_request` | 400 | body is not valid JSON |
| `not_found` | 404 | no such offering; also the closed enquiry collection |
| `validation_failed` | 422 | a query param or body field failed validation |
| `rate_limited` | 429 | too many enquiries from one IP |
| `conflict` | 409 | could not allocate a unique enquiry reference |
| `internal_error` | 500 | unexpected — details are logged, never returned |

> **Naming note.** The database models are still `Product` / `Category`,
> which the API surfaces as `/api/products` and `/api/categories`. In this
> build a "product" is a service offering and a "category" is a service line.
> The generic names were kept so the schema stays reusable.

---

## `GET /api/health`

Liveness plus a `SELECT 1` against the database. `200` when healthy, `503`
when the database is unreachable.

```json
{ "data": { "status": "ok", "database": "up", "latencyMs": 47, "timestamp": "2026-07-27T16:22:02.319Z" } }
```

---

## `GET /api/categories`

Active service lines, each with a count of its **available** offerings.

```json
{ "data": [ { "id": "...", "slug": "strategy", "name": "Strategy and growth",
              "description": "Where to compete, what to stop doing…", "productCount": 4 } ],
  "meta": { "total": 4 } }
```

Seeded lines: `strategy`, `operations`, `transactions`, `advisory`.

---

## `GET /api/products`

| param | type | default | notes |
|---|---|---|---|
| `category` | slug | — | filter to one service line |
| `q` | string | — | substring match on name and description |
| `featured` | bool | — | `true` / `1` / `false` / `0` |
| `available` | bool | `true` | withdrawn offerings are hidden unless asked for |
| `sort` | enum | `order` | `order`, `price_asc`, `price_desc`, `name`, `newest` |
| `limit` | int | 24 | max 100 — a larger value is a 422, not a silent clamp |
| `offset` | int | 0 | |

```
GET /api/products?category=transactions&sort=price_asc
GET /api/products?q=diligence
GET /api/products?featured=true&limit=6
```

Money is returned four ways so no client has to reinvent formatting, and nobody
is tempted to do arithmetic on a formatted string. `unit` is `null` when the
offering is quoted rather than listed:

```json
{ "id": "...", "slug": "commercial-due-diligence", "name": "Commercial due diligence",
  "description": "Market, customer and competitive testing of an investment thesis…",
  "price": { "amountCents": 6500000, "currency": "USD", "formatted": "$65,000.00",
             "unit": "per engagement" },
  "imageUrl": "/assets/images/feature-3.png",
  "tags": ["transactions", "diligence", "3-5 weeks"],
  "isAvailable": true, "isFeatured": true,
  "category": { "slug": "transactions", "name": "Transaction support" } }
```

---

## `GET /api/products/[slug]`

One round trip for a whole detail page: the offering, related offerings from
the same service line, and the contact channels with **WhatsApp pre-filled to
name this offering** — so "further enquiries" is one tap from whatever the
visitor is reading.

```json
{ "data": {
    "product": { "...": "as above" },
    "related": [ { "slug": "operational-due-diligence" }, { "slug": "valuation-support" } ],
    "contact": [
      { "kind": "whatsapp", "label": "WhatsApp", "value": "+15550100200",
        "href": "https://wa.me/15550100200?text=Hello%2C%20I%20would%20like%20more%20information%20about%20%22Commercial%20due%20diligence%22." }
    ] } }
```

`404` if the slug is unknown; `422` if it is not a valid slug shape.

---

## `GET /api/contact`

All active channels: two phone lines, two WhatsApp lines, email, Instagram.

`?product=<slug>` deep-links WhatsApp to a message naming that offering.

```json
{ "data": [
  { "kind": "phone",     "label": "Telephone", "value": "+15550100200",        "href": "tel:+15550100200" },
  { "kind": "whatsapp",  "label": "WhatsApp",  "value": "+15550100200",        "href": "https://wa.me/15550100200?text=…" },
  { "kind": "instagram", "label": "Instagram", "value": "@adassociates",       "href": "https://www.instagram.com/adassociates/" }
], "meta": { "total": 5 } }
```

Channels are **rows, not constants** — the number or handle can change without
a redeploy. They are seeded from environment variables.

---

## `POST /api/enquiries`

The built-in contact form.

```jsonc
{
  "name": "Jordan Reyes",          // 2–120 chars
  "email": "jordan@example.com",   // validated, lowercased
  "phone": "+1 555 010 0200",      // optional; digits, spaces, + ( ) -
  "message": "We are considering a market entry study for Q3.",  // 10–2000 chars
  "productSlug": "market-entry-assessment",  // optional — what they were reading
  "website": ""                    // honeypot: must stay empty
}
```

`201` on success. The reference is designed to be read aloud over the phone —
no `I`, `O`, `0` or `1`:

```json
{ "data": { "reference": "ADA-DE3KUU", "name": "Jordan Reyes", "email": "jordan@example.com",
            "product": { "slug": "market-entry-assessment", "name": "Market entry assessment" },
            "createdAt": "2026-07-27T16:23:48.682Z",
            "message": "Thanks for getting in touch. We will be back to you shortly." } }
```

**Behaviours worth knowing:**

- **Honeypot** — if `website` is filled, the response is `202 {"received":true}`
  and nothing is written. It deliberately does *not* return an error: telling a
  bot which field caught it just teaches it to skip that field next time.
- **Rate limit** — 5 per IP per 10 minutes (`ENQUIRY_RATE_LIMIT`,
  `ENQUIRY_RATE_WINDOW_MS`). Exceeding it returns `429` with `Retry-After` and
  `RateLimit-*` headers. Checked *before* parsing, so a flood costs a map
  lookup rather than a database round trip.
- **A stale `productSlug` does not lose the message.** It is recorded
  unattached rather than rejecting a genuine enquiry.
- **IPs are never stored in the clear** — only a salted SHA-256, and it is
  never returned by any endpoint.

`GET /api/enquiries` returns `404` on purpose. Reading the inbox is a staff
action and this build has no authentication, so the collection is closed rather
than left open by omission.

---

## Known limits

- **The rate limiter is in-process.** Correct for the single instance this runs
  as today; it becomes leaky across multiple instances or on serverless, where
  each holds its own counters. Swap the map in `src/server/rate-limit.ts` for
  Redis at that point — `consume()`'s signature is designed not to change.
- **Nothing notifies the firm yet.** Enquiries are persisted and nothing more.
  Email/WhatsApp delivery is the obvious next piece.
- **No admin authentication**, hence the closed inbox.
- **Search is `LIKE`-based** substring matching. Fine at 16 offerings; swap for
  FTS5 (SQLite) or `tsvector` (Postgres) if the catalogue grows.
- **All seed data is placeholder.** The service lines are plausible for an
  advisory firm and the prices are round invented numbers. Replace both, along
  with the contact details in `.env`, before this is used for real.
