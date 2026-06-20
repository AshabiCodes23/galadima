import webpush from "web-push";
import PushSubscription from "@/lib/models/PushSubscription";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails("mailto:alerts@landbookbyharmony.com", publicKey, privateKey);
}

interface PushPayload {
  title: string;
  body: string;
  priority?: string;
  url?: string;
}

export async function sendPushToSubscriptions(subscriptions: any[], payload: PushPayload): Promise<number> {
  if (!publicKey || !privateKey) {
    console.warn("[webpush] VAPID keys missing — skipping push send");
    return 0;
  }

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({ title: payload.title, body: payload.body, icon: "/icon-192x192.png", priority: payload.priority, url: payload.url || "/alerts" })
        );
        sent += 1;
      } catch (err: any) {
        // 404/410 = the browser unsubscribed and never told us — clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
        } else {
          console.error("[webpush] send failed:", err.message);
        }
      }
    })
  );
  return sent;
}