import crypto from "crypto";

/**
 * HMAC-SHA256 verification for incoming Freshworks webhooks.
 * Skipped outside production so local testing with curl/Postman is frictionless.
 * In production set FRESHWORKS_WEBHOOK_SECRET and configure each Freshworks
 * product to sign with the same secret, header: x-freshworks-signature
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): { ok: boolean; reason?: string } {
  if (process.env.NODE_ENV !== "production") return { ok: true };

  const secret = process.env.FRESHWORKS_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhookAuth] FRESHWORKS_WEBHOOK_SECRET not set — skipping verification");
    return { ok: true };
  }

  if (!signature) return { ok: false, reason: "Missing webhook signature" };

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature !== expected) return { ok: false, reason: "Invalid webhook signature" };

  return { ok: true };
}