import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seeds the service catalogue and contact channels.
 *
 * Idempotent — every write is an upsert keyed on a natural unique column, so
 * running it repeatedly converges rather than duplicating. Safe to re-run
 * after editing this file.
 *
 * PLACEHOLDER DATA. The service lines below are plausible for an advisory
 * firm, and the prices are round invented numbers — replace both with AD
 * Associates' real offering before this goes anywhere near a client.
 */

// Standalone script: it builds its own client rather than importing the app
// singleton, so seeding never drags Next's module graph in.
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  priceUnit?: string;
  imageUrl?: string;
  tags?: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
}

interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  products: SeedProduct[];
}

const IMG = {
  strategy: "/assets/images/feature-1.png",
  operations: "/assets/images/feature-2.png",
  transactions: "/assets/images/feature-3.png",
  advisory: "/assets/images/approach.jpg",
} as const;

const CATALOGUE: SeedCategory[] = [
  {
    slug: "strategy",
    name: "Strategy and growth",
    description: "Where to compete, what to stop doing, and how to fund the difference.",
    products: [
      {
        slug: "market-entry-assessment",
        name: "Market entry assessment",
        description:
          "Sizing, competitive structure and route-to-market for a new geography or segment, ending in a go/no-go recommendation with the assumptions it rests on stated plainly.",
        priceCents: 4500000,
        priceUnit: "per engagement",
        imageUrl: IMG.strategy,
        tags: "strategy,research,4-6 weeks",
        isFeatured: true,
      },
      {
        slug: "growth-strategy-sprint",
        name: "Growth strategy sprint",
        description:
          "A three-week diagnostic of where growth is actually coming from, which channels are subsidising which, and the two or three moves worth funding next year.",
        priceCents: 2800000,
        priceUnit: "per engagement",
        imageUrl: IMG.strategy,
        tags: "strategy,3 weeks",
        isFeatured: true,
      },
      {
        slug: "pricing-review",
        name: "Pricing and packaging review",
        description:
          "Willingness-to-pay analysis, discount leakage, and a packaging structure that stops the sales team negotiating against itself.",
        priceCents: 3200000,
        priceUnit: "per engagement",
        imageUrl: IMG.strategy,
        tags: "pricing,commercial",
      },
      {
        slug: "portfolio-review",
        name: "Portfolio review",
        description:
          "Which products, sites or business units earn their capital, and what an honest divestment or reinvestment case looks like for the ones that do not.",
        priceCents: 3800000,
        priceUnit: "per engagement",
        imageUrl: IMG.strategy,
        tags: "strategy,capital allocation",
      },
    ],
  },
  {
    slug: "operations",
    name: "Operations and performance",
    description: "Turning intent into throughput, and making the change outlast the report.",
    products: [
      {
        slug: "cost-diagnostic",
        name: "Cost base diagnostic",
        description:
          "A bottom-up view of where money leaves the business, benchmarked and separated into what is structural, what is discretionary, and what is simply unmanaged.",
        priceCents: 3500000,
        priceUnit: "per engagement",
        imageUrl: IMG.operations,
        tags: "operations,cost,4 weeks",
        isFeatured: true,
      },
      {
        slug: "operating-model-design",
        name: "Operating model design",
        description:
          "Accountability, decision rights and structure redrawn around what the business now has to do, with a transition plan rather than an org chart.",
        priceCents: 5200000,
        priceUnit: "per engagement",
        imageUrl: IMG.operations,
        tags: "operations,org design",
      },
      {
        slug: "process-improvement",
        name: "Process improvement",
        description:
          "End-to-end mapping of a process that is visibly failing — order to cash, hire to onboard — and the sequence of fixes that actually moves the cycle time.",
        priceCents: 2400000,
        priceUnit: "per engagement",
        imageUrl: IMG.operations,
        tags: "operations,process",
      },
      {
        slug: "supply-chain-review",
        name: "Supply chain review",
        description:
          "Supplier concentration, inventory policy and service-level trade-offs, with the resilience cost of each option quantified rather than asserted.",
        priceCents: 4100000,
        priceUnit: "per engagement",
        imageUrl: IMG.operations,
        tags: "operations,supply chain",
      },
    ],
  },
  {
    slug: "transactions",
    name: "Transaction support",
    description: "Underwriting the thesis, then making sure you end up owning it.",
    products: [
      {
        slug: "commercial-due-diligence",
        name: "Commercial due diligence",
        description:
          "Market, customer and competitive testing of an investment thesis under deal timelines, with the risks that would change the price flagged early rather than at signing.",
        priceCents: 6500000,
        priceUnit: "per engagement",
        imageUrl: IMG.transactions,
        tags: "transactions,diligence,3-5 weeks",
        isFeatured: true,
      },
      {
        slug: "operational-due-diligence",
        name: "Operational due diligence",
        description:
          "Whether the target can deliver the plan: capacity, systems, key-person exposure, and the capex the model quietly assumes away.",
        priceCents: 5800000,
        priceUnit: "per engagement",
        imageUrl: IMG.transactions,
        tags: "transactions,diligence",
      },
      {
        slug: "post-merger-integration",
        name: "Post-merger integration planning",
        description:
          "Day-one readiness and a 100-day plan, sequenced so the synergies underwritten in the model have named owners and dates attached.",
        priceCents: 7200000,
        priceUnit: "per engagement",
        imageUrl: IMG.transactions,
        tags: "transactions,integration",
      },
      {
        slug: "valuation-support",
        name: "Valuation support",
        description:
          "Independent modelling and sensitivity analysis to stress the numbers a deal rests on, including the scenarios nobody in the room wants to raise.",
        priceCents: 3600000,
        priceUnit: "per engagement",
        imageUrl: IMG.transactions,
        tags: "transactions,valuation",
      },
    ],
  },
  {
    slug: "advisory",
    name: "Ongoing advisory",
    description: "Senior counsel between the big pieces of work, without a standing project team.",
    products: [
      {
        slug: "board-advisory-retainer",
        name: "Board advisory retainer",
        description:
          "A partner available to the board and executive team for the decisions that come up between meetings. Monthly, cancellable, no minimum term.",
        priceCents: 950000,
        priceUnit: "per month",
        imageUrl: IMG.advisory,
        tags: "advisory,retainer",
        isFeatured: true,
      },
      {
        slug: "executive-workshop",
        name: "Executive workshop",
        description:
          "A facilitated day with the leadership team to force a decision that has been circling for months, with the pre-read and the follow-up both included.",
        priceCents: 850000,
        priceUnit: "per day",
        imageUrl: IMG.advisory,
        tags: "advisory,facilitation",
      },
      {
        slug: "second-opinion-review",
        name: "Second opinion review",
        description:
          "An independent read of work already done — internal or from another firm — and a direct answer on whether the conclusion holds.",
        priceCents: 1200000,
        priceUnit: "per review",
        imageUrl: IMG.advisory,
        tags: "advisory,review",
      },
      {
        slug: "interim-leadership",
        name: "Interim leadership",
        description:
          "A senior operator embedded in the business while you recruit, with a defined handover rather than an open-ended engagement.",
        priceCents: 0,
        priceUnit: "quoted on request",
        imageUrl: IMG.advisory,
        tags: "advisory,interim",
      },
    ],
  },
];

function whatsAppHref(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const greeting =
    process.env.CONTACT_WHATSAPP_GREETING ?? "Hello, I would like more information";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`${greeting}.`)}`;
}

/**
 * A mailto: carrying the subject line, so tapping the address opens a
 * composer that is ready to send instead of one the visitor has to title
 * themselves. An empty CONTACT_EMAIL_SUBJECT yields a bare mailto:.
 */
function mailtoHref(address: string): string {
  const subject = process.env.CONTACT_EMAIL_SUBJECT?.trim();
  return subject
    ? `mailto:${address}?subject=${encodeURIComponent(subject)}`
    : `mailto:${address}`;
}

async function seedCatalogue() {
  let categoryCount = 0;
  let productCount = 0;

  for (const [categoryIndex, category] of CATALOGUE.entries()) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: categoryIndex,
        isActive: true,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: categoryIndex,
      },
    });
    categoryCount += 1;

    for (const [productIndex, product] of category.products.entries()) {
      const data = {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        currency: "USD",
        priceUnit: product.priceUnit ?? null,
        imageUrl: product.imageUrl ?? null,
        tags: product.tags ?? "",
        isAvailable: product.isAvailable ?? true,
        isFeatured: product.isFeatured ?? false,
        sortOrder: productIndex,
        categoryId: record.id,
      };

      await prisma.product.upsert({
        where: { slug: product.slug },
        update: data,
        create: { slug: product.slug, ...data },
      });
      productCount += 1;
    }
  }

  return { categoryCount, productCount };
}

async function seedContactChannels() {
  const phoneE164 = process.env.CONTACT_PHONE_E164 ?? "+15550100200";
  const phoneDisplay = process.env.CONTACT_PHONE_DISPLAY ?? "+1 (555) 010-0200";
  // The second line is optional — an empty or unset value means the firm is
  // back to one number, and the channel is left out rather than seeded blank.
  const phoneAltE164 = process.env.CONTACT_PHONE_ALT_E164?.trim() || null;
  const whatsappE164 = process.env.CONTACT_WHATSAPP_E164 ?? phoneE164;
  // Optional, like the second phone line — blank means a single WhatsApp line.
  const whatsappAltE164 = process.env.CONTACT_WHATSAPP_ALT_E164?.trim() || null;
  const instagram = process.env.CONTACT_INSTAGRAM_HANDLE ?? "adassociates";
  const email = process.env.CONTACT_EMAIL ?? "hello@adassociates.com";

  const channels = [
    {
      kind: "phone",
      label: "Telephone",
      value: phoneE164,
      href: `tel:${phoneE164}`,
      sortOrder: 0,
    },
    ...(phoneAltE164
      ? [
          {
            kind: "phone",
            label: "Telephone (second line)",
            value: phoneAltE164,
            href: `tel:${phoneAltE164}`,
            sortOrder: 1,
          },
        ]
      : []),
    {
      kind: "whatsapp",
      label: "WhatsApp",
      // `value` holds E.164 because whatsAppLink() rebuilds the href from it
      // when an offering is named. Display formatting belongs to the UI.
      value: whatsappE164,
      href: whatsAppHref(whatsappE164),
      sortOrder: 2,
    },
    ...(whatsappAltE164
      ? [
          {
            kind: "whatsapp",
            label: "WhatsApp (second line)",
            value: whatsappAltE164,
            href: whatsAppHref(whatsappAltE164),
            sortOrder: 3,
          },
        ]
      : []),
    {
      kind: "email",
      label: "Email",
      value: email,
      href: mailtoHref(email),
      sortOrder: 4,
    },
    {
      kind: "instagram",
      label: "Instagram",
      value: `@${instagram}`,
      href: `https://www.instagram.com/${instagram}/`,
      sortOrder: 5,
    },
  ];

  const kept: string[] = [];

  for (const channel of channels) {
    const row = await prisma.contactChannel.upsert({
      where: { kind_value: { kind: channel.kind, value: channel.value } },
      update: {
        label: channel.label,
        href: channel.href,
        sortOrder: channel.sortOrder,
        isActive: true,
      },
      create: channel,
    });
    kept.push(row.id);
  }

  // The upsert keys on (kind, value), so *changing* an address or a number is
  // a new key — it inserts a row and leaves the old one behind, still active.
  // Re-seeding after an .env edit would then have /api/contact returning two
  // email channels, and the site offering the address the firm has stopped
  // using. This file is the source of truth for channels, so anything not in
  // the list above no longer exists.
  const { count: removed } = await prisma.contactChannel.deleteMany({
    where: { id: { notIn: kept } },
  });

  console.log(`  phone     ${phoneDisplay}`);
  if (phoneAltE164) {
    console.log(`  phone     ${process.env.CONTACT_PHONE_ALT_DISPLAY ?? phoneAltE164}`);
  }
  console.log(`  whatsapp  ${whatsappE164}`);
  if (whatsappAltE164) console.log(`  whatsapp  ${whatsappAltE164}`);
  console.log(`  email     ${email}`);
  console.log(`  instagram @${instagram}`);
  if (removed > 0) console.log(`  (removed ${removed} superseded channel(s))`);

  return channels.length;
}

async function main() {
  console.log("Seeding AD Associates…\n");

  const { categoryCount, productCount } = await seedCatalogue();
  console.log(`Catalogue: ${categoryCount} service lines, ${productCount} offerings\n`);

  console.log("Contact channels:");
  const channelCount = await seedContactChannels();
  console.log(`\nDone — ${channelCount} channels seeded.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
