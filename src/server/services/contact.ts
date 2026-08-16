import { prisma } from "../db";
import { serializeContactChannel } from "../serializers";

/**
 * The ways a visitor can reach the firm: the form, the phone, WhatsApp and
 * Instagram. Channels are rows rather than constants so the number can change
 * without a redeploy.
 */

export async function listContactChannels() {
  const channels = await prisma.contactChannel.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { kind: "asc" }],
  });

  return channels.map(serializeContactChannel);
}

/**
 * Builds a wa.me link with the message pre-typed. When an offering is supplied
 * the greeting names it, so the firm opens the chat already knowing what the
 * question is about.
 *
 * wa.me requires the number in E.164 *without* the leading +.
 */
export function whatsAppLink(e164: string, productName?: string): string {
  const digits = e164.replace(/\D/g, "");
  const greeting =
    process.env.CONTACT_WHATSAPP_GREETING ?? "Hello, I would like more information";
  const text = productName ? `${greeting} about "${productName}".` : `${greeting}.`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Per-product contact links — the same channels, but with WhatsApp deep-linked
 * to a message naming that item.
 */
export async function contactChannelsForProduct(productSlug: string) {
  const [channels, product] = await Promise.all([
    listContactChannels(),
    prisma.product.findUnique({ where: { slug: productSlug }, select: { name: true } }),
  ]);

  if (!product) return channels;

  return channels.map((channel) =>
    channel.kind === "whatsapp"
      ? { ...channel, href: whatsAppLink(channel.value, product.name) }
      : channel,
  );
}
