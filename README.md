# AD Associates — Next.js site

A component-split Next.js build with a REST backend. Every section is its own
file and every string comes from `src/data/content.json`.

> **Provenance.** This started life as a static design kit for a Mérida
> cantina and was rebranded to AD Associates. The visual system (dark theme,
> olive accent `#92843b`, Nunito + Libre Baskerville, 4px grid) is inherited
> from that kit. **All copy, contact details, prices and service lines are
> placeholders** — see "What still needs replacing" at the bottom.

## Run it

```powershell
npm install
# create .env — see Environment below
npm run db:migrate       # create prisma/dev.db and apply migrations
npm run db:seed          # 4 service lines, 16 offerings, 6 contact channels
npm run dev              # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`,
`npm run db:studio` (browse the data), `npm run db:reset` (drop and re-seed).

### Environment

`.env` is gitignored and there is no committed template, so it has to be
written by hand. Everything the app reads is below; the contact values are
what `npm run db:seed` writes into the `ContactChannel` table.

```ini
# SQLite for local development. For Postgres, change the datasource provider
# in prisma/schema.prisma to "postgresql" and put the connection string here.
DATABASE_URL="file:./prisma/dev.db"

# Phone numbers must be E.164 (leading +, digits only) — the WhatsApp deep
# link is built by stripping the +.
CONTACT_PHONE_E164="+919566860808"
CONTACT_PHONE_DISPLAY="+91 95668 60808"

# Optional second line. Blank both for a single number; the seed then skips
# that channel rather than writing an empty one.
CONTACT_PHONE_ALT_E164="+919655566454"
CONTACT_PHONE_ALT_DISPLAY="+91 96555 66454"

# WhatsApp lines. With a second one set the site asks which to message.
CONTACT_WHATSAPP_E164="+919566860808"
CONTACT_WHATSAPP_ALT_E164="+919655566454"

CONTACT_INSTAGRAM_HANDLE="ad_associates"   # no @
CONTACT_EMAIL="adassociates6789@gmail.com"

# Pre-typed into the WhatsApp chat and the mailto: subject. URL-encoded for
# you; leave either blank to omit it.
CONTACT_WHATSAPP_GREETING="Hello, I would like more information"
CONTACT_EMAIL_SUBJECT="Enquiry for AD Associates"

# Salt for hashing client IPs before they are stored on an enquiry. Generate:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
IP_HASH_SALT="change-me-in-production"

# Enquiry rate limit: max submissions per IP per window (ms).
ENQUIRY_RATE_LIMIT="5"
ENQUIRY_RATE_WINDOW_MS="600000"
```

Only `DATABASE_URL` is required to boot. Every contact value has a fallback in
`prisma/seed.ts`, but those fallbacks are the original US placeholders — leave
one unset and the seed will quietly write a `+1 (555)` number into the API.

**Must be on a local NTFS disk.** This project originated on a FAT32 USB drive
where `npm install` stalled indefinitely — FAT32 cannot hold symlinks and USB
flash write throughput collapses partway through a dependency tree.

### Troubleshooting

**`/api/health` reports `"database": "down"` and the log says
`NODE_MODULE_VERSION 137 … requires 147`.** `better-sqlite3` is a native
addon, so its compiled `.node` binary is tied to the Node ABI it was fetched
for. Switching Node versions after `npm install` leaves the wrong binary in
place and every Prisma query fails while the rest of the site still renders.
Fix it with `npm rebuild better-sqlite3`, then restart the dev server — the
running process has already loaded the stale binary.

**Do not run `npm run build` while `npm run dev` is running.** Both write
`.next/`, and the build replaces chunks the dev server is still serving, which
surfaces as `Cannot find module './331.js'` on every route. Stop the dev
server first; if it has already happened, delete `.next/` and restart.

## Deploying

The build runs without a `.env` and without a database, so a clean checkout
deploys as-is on Vercel: import the repo, take the detected Next.js defaults,
deploy. No environment variables are required to get the site up.

That works because **nothing on the page calls the API**. Every section is
server-rendered from `content.json`, so the whole public site — copy, imagery,
phone and WhatsApp links, the map — is live with no database behind it.

What is *not* live is `/api/*`. `/api/health` reports `degraded` with a 503 and
the rest return errors, because the datasource is SQLite:

- `prisma/dev.db` is gitignored, so it is not in the deployment at all.
- A serverless filesystem is read-only apart from `/tmp`, and is discarded
  between invocations, so an enquiry written there would not survive.

Setting `DATABASE_URL` to the SQLite path on Vercel does not fix this; it needs
a hosted database. Postgres is a two-line change — the `provider` in
`schema.prisma` and the adapter in `db.ts` — plus `DATABASE_URL` and the
`CONTACT_*` variables in the Vercel project, then `npm run db:migrate` and
`npm run db:seed` against it. Until the contact form is actually wired to a
page, none of that blocks the site.

Two things had to change before any of this built at all, both worth keeping:

- `prisma.config.ts` used `env("DATABASE_URL")`, which throws
  `PrismaConfigEnvError` when unset and killed `prisma generate` — and so the
  whole build — on every machine without a `.env`.
- `db.ts` constructed the Prisma client at module load. `next build` imports
  each route module to collect page data, so the build needed a live database
  URL and failed with `Failed to collect page data for /api/products`. The
  client is now built on first property access instead.

## Frontend

```
src/
├─ app/
│  ├─ layout.tsx      <html lang> + metadata, pulled from content.json
│  ├─ page.tsx        composes the six blocks in order
│  └─ globals.css     @imports the six stylesheets, cascade order fixed
├─ components/
│  ├─ layout/         SkipLink · Nav · NavMenu · Footer
│  ├─ sections/       Hero · About · Capabilities · Approach · Work · Contact
│  └─ ui/             Button · Eyebrow · Section · Stat · ImageBox ·
│                     Reveal · ScrollReveal
├─ data/              content.json + typed accessor
├─ lib/emphasize.tsx  renders `body` with `emphasis` phrases as <strong>
├─ styles/            the design kit, `ad-` prefixed
└─ types/content.ts   the shape of content.json
```

The About heading contains two `\u200b` escapes (U+200B, zero-width space).
"Strong.Swift.Secure" has no spaces, so it is a single 19-character token: the
browser had no legal place to break it and fell back to `overflow-wrap:
break-word`, splitting it mid-word as "Strong.Swift.Se / cure". The escapes add
break opportunities at the full stops without adding visible space. They are
written as JSON escapes rather than pasted characters so they are visible to
anyone editing the file — delete them and the mid-word breaking returns.

Only `SkipLink`, `ScrollReveal` and `NavMenu` are client components — every
section is a server component, so the page ships almost no JavaScript.

Both JS-gated behaviours fail closed, so `layout.tsx` carries a `<noscript>`
block that reverses them: without it, `.ad-observe`'s `opacity: 0` leaves the
whole page below the hero blank, and the nav panel cannot be opened.

### Responsive

The site is built to hold from a ~240px smartwatch to an ultrawide monitor.
Most of the work is done by `clamp()` in `tokens.css` rather than by
breakpoints, so sizing is continuous and there is no width at which the layout
is merely "not yet broken":

- **Spacing** splits in two. `--ad-space-1`–`8` stay on the fixed 4px grid —
  they are component measurements, and a card should not breathe differently
  because the window is wide. `--ad-space-12` and up are page rhythm and are
  fluid; 120px between sections is right at 1440px and absurd at 320px.
- **Type** — `h1`–`h4`, `--ad-stat` and `--ad-lead` are fluid. Every clamp
  maximum is the original fixed value, so desktop is pixel-identical to the
  extracted design; only the small end is new.
- **Breakpoints** are reserved for what a clamp cannot express: column counts
  (576 / 768 / 992px) and the nav switching between a bar and a panel (768px).

Below 768px the nav collapses into a disclosure panel — `NavMenu` renders one
`<ul>` for both layouts rather than a desktop copy and a mobile copy, so a
screen reader is not read every destination twice. Before this the links were
simply `display: none` under 768px with nothing in their place, which left
phone visitors with no navigation at all.

Other device-level rules worth knowing:

- **Hover is gated behind `@media (hover: hover)`.** A touch screen reports
  `:hover` as sticky after a tap, so the ungated rules left every tapped
  button lifted 8px out of place until something else was touched.
- **Tap targets are floored at `--ad-touch-target` (44px)** — nav links,
  buttons, the menu toggle, the brand link, and footer links under
  `@media (pointer: coarse)`.
- **`env(safe-area-inset-*)`** on the container, nav and footer, for notched
  phones in landscape and the iPhone home indicator.
- **The hero is capped against the viewport** (`min(560px, 88dvh)`), so a
  phone held sideways does not spend one and a half screens on it. `dvh`
  follows the mobile address bar; a `vh` line precedes it as a fallback.
- **`scroll-padding-top`** on `html` offsets anchor jumps by the sticky
  header's height — nav links used to land with the heading behind the bar.
- **`prefers-reduced-motion`** now also drops the looping hero video and falls
  back to its poster still (WCAG 2.2.2: motion over five seconds needs an
  out, and the video loops forever with no controls).

Images use plain `<img>`, not `next/image`: the kit's CSS targets bare `img`
elements (`.ad-gallery img`, `.image-box-header img`), which `next/image`'s
wrapper markup and inline sizing would fight. The lint rule is disabled in
`eslint.config.mjs` with that reasoning recorded.

## Backend

REST API under `/api`, backed by Prisma 7 + SQLite. Full reference:
[docs/API.md](docs/API.md).

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | liveness + database reachability |
| `GET /api/categories` | service lines with available-offering counts |
| `GET /api/products` | catalogue: filter, search, sort, paginate |
| `GET /api/products/[slug]` | offering + related + offering-aware contact links |
| `GET /api/contact` | phone lines, WhatsApp, email, Instagram |
| `POST /api/enquiries` | the contact form |

```
src/server/
├─ db.ts             Prisma singleton (survives dev hot reload)
├─ http.ts           response envelope + error boundary
├─ validation.ts     Zod schemas for every input
├─ serializers.ts    rows → API resources; drops ipHash/userAgent
├─ rate-limit.ts     fixed-window limiter
├─ client.ts         client IP extraction + salted hashing
└─ services/         products, enquiries, contact — the actual logic
prisma/schema.prisma Category · Product · Enquiry · ContactChannel
prisma.config.ts     Prisma 7 config (datasource URL + seed command)
```

The models are named `Product` / `Category` but hold service offerings and
service lines. The generic names were kept so the schema stays reusable.

Design decisions worth knowing:

- **Money is `Int` cents**, never a float, returned as
  `{ amountCents, currency, formatted, unit }` so no client reinvents
  formatting. `unit` is `null` for quote-on-request offerings.
- **Contact channels are database rows**, not constants — the number or handle
  changes without a redeploy. The seed prunes anything it did not just write:
  the upsert keys on `(kind, value)`, so *changing* a number inserts a row
  rather than replacing one, and without the prune the superseded number would
  stay live in the API.
- **WhatsApp links are built per offering**, so tapping through from an item
  opens a chat that already names it.
- **The honeypot answers 202, not an error.** Returning a validation error
  would tell a bot exactly which field caught it.
- **IPs are stored as a salted SHA-256** and never returned by any endpoint.
- **Postgres migration is a two-line change** — the datasource provider in
  `schema.prisma` and the adapter in `db.ts`. The `String` status columns
  become real enums at that point (SQLite has no enum type).

## What still needs replacing

Nothing below is real. The rebrand changed names and copy; it could not
invent an actual business.

The contact details are the exception — these are real:

| | Value | Set in |
|---|---|---|
| Telephone | `+91 95668 60808` | `CONTACT_PHONE_E164` / `_DISPLAY` |
| Telephone (second line) | `+91 96555 66454` | `CONTACT_PHONE_ALT_E164` / `_DISPLAY` |
| WhatsApp | both lines | `CONTACT_WHATSAPP_E164`, `CONTACT_WHATSAPP_ALT_E164` |
| Email | `adassociates6789@gmail.com` | `CONTACT_EMAIL` |
| Email subject | "Enquiry for AD Associates" | `CONTACT_EMAIL_SUBJECT` |
| Office | 2/45-C, Mariamman Kovil Street, Vellanaipatti, Serayampalayam, Coimbatore, Tamil Nadu 641048 | `contact.address`, `footer.addressLines` |
| Instagram | `@ad_associates` | `CONTACT_INSTAGRAM_HANDLE`, `social[]` in content.json |

The numbers and the email are shown in the contact section and the footer, and
returned by `GET /api/contact`. The second line is optional: blank out
`CONTACT_PHONE_ALT_E164` and the seed drops that channel.

**WhatsApp asks which line to message.** Both numbers are on WhatsApp, so a
single link would have to guess. The contact section has a *Message on
WhatsApp* button that opens onto the two numbers, each a `wa.me` link with the
greeting pre-typed.

It is a plain `<details>`/`<summary>` — no JavaScript, no state, no new client
component. The element already provides the keyboard behaviour and the
expanded/collapsed announcement, and it still opens with scripting disabled
(verified). The panel sits **in flow below 576px** and **absolutely
positioned above it**: floating on a phone could only overhang the screen
edge, while in-flow on desktop would shove the sibling buttons down on every
open.

`CONTACT_WHATSAPP_ALT_E164` is optional — blank it and the seed drops the
second channel. Note the page's copy of these links lives in `content.json`;
only `GET /api/contact` is seeded from the environment.

**The email link carries a subject.** `contact.emailHref` is
`mailto:…?subject=Enquiry%20for%20AD%20Associates`, so the visitor's mail app
opens already addressed and titled — they only write the message. The display
text and the href are separate fields for this reason; render `contact.email`,
never `contact.emailHref`. The seed builds the same href for the API's email
channel from `CONTACT_EMAIL_SUBJECT`; blank that variable for a bare `mailto:`.

A `mailto:` hands off to whatever mail app the visitor uses — the Gmail app on
Android, Mail on iOS, Outlook on a work laptop. **When no mail handler is
registered, Windows drops the click silently: no app, no error, nothing.** The
page looks broken even though the link is correct.

So the address is followed by a small `(compose in Gmail)` link
(`contact.emailWebHref`) opening Gmail's web composer pre-addressed. It sits
*beside* the address rather than replacing it — making Gmail the only route
would strand every visitor who does not use Gmail.

This is worth knowing when testing: a dead `mailto:` is usually the tester's
machine, not the site. On Windows, check which handler is registered with

```powershell
(Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\mailto\UserChoice").ProgId
```

A ProgId of `AppXbx2ce4vcxjdhff3d1ms66qqzk12zn827` is the retired Windows Mail
app, which recent Windows builds no longer ship — every `mailto:` on every
site fails until Settings → Apps → Default apps → *Choose defaults by link
type* → `MAILTO` is pointed at a mail client that exists.

**The map is addressed by Google place CID, not by coordinates or a search
string.** `contact.mapEmbed` is
`https://maps.google.com/maps?cid=18258534699908848486&output=embed`. The CID
identifies the firm's own Google listing, so the pin cannot drift the way a
re-geocoded address string can, and the info card shows the business name. Two
things worth knowing if it ever needs changing:

- The embed needs no API key, but only renders **inside an iframe** — opening
  the URL directly returns "The Google Maps Embed API must be used in an
  iframe", which makes it look broken when it is not.
- To retarget it, follow the place's share link to its full URL and read the
  CID out of `data=…!1s0x…:0x…` — the hex after the colon, as decimal:
  `node -e "console.log(BigInt('0xfd6358925b35db66').toString())"`.

The Instagram link is stored without the `igsh=` parameter that Instagram
appends to a shared link. That token identifies the share session it came
from, not the profile, so it does not belong in a link served to every
visitor — `https://www.instagram.com/ad_associates/` resolves to the same
page without it.

There is deliberately **no LinkedIn** anywhere — no link, no seeded channel,
no `CONTACT_LINKEDIN_URL`. `"linkedin"` does remain a permitted value in
`CONTACT_KINDS` (`src/server/constants.ts`); that list stands in for a
database enum, and keeping the value there means adding a LinkedIn page later
is a seed-and-config change rather than a schema one.

| | Current placeholder |
|---|---|
| Service lines & prices | plausible advisory offerings, invented round numbers |
| "250+ Engagements Delivered" | invented figure |
| Founded 2014 | invented |

**Imagery is still the cantina's.** The hero video is bar footage, and the
feature, gallery and badge images are photographs of a Mexican cantina. Files
were renamed to neutral names (`approach.jpg`, `badge-primary.png`) but the
pictures themselves cannot be rebranded — replace them.

The brand mark is `logo.png` — the real AD monogram, white on transparent.
The supplied artwork was white on opaque black with 68% of its canvas as
padding, which at a 32px nav height would have drawn the mark itself at
roughly 18px and shown a black rectangle on any non-black surface. It was
cropped to the glyphs and keyed to transparency using luminance as the alpha
channel, which preserves the antialiased edges that a colour-key threshold
would have left with a dark fringe.

Two earlier files sit unused beside it: `logo.svg`, the typographic
placeholder generated for the rename, and `logo-previous.svg`, the original
cantina wordmark.

Note the monogram carries no company name, where the old wordmark spelled out
"AD ASSOCIATES · STRATEGY & ADVISORY". The name reaches assistive technology
and search engines through the `alt` text (`site.name`) instead.
