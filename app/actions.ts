"use server";

import webpush from "web-push";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/lib/models/PushSubscription";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToSubscriptions } from "@/lib/webpush";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails("mailto:alerts@landbookbyharmony.com", publicKey, privateKey);
}

type StoredSubscription = webpush.PushSubscription;

export async function subscribeUser(sub: StoredSubscription) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not logged in" };

  await connectDB();
  await PushSubscription.findOneAndUpdate(
    { endpoint: sub.endpoint },
    { user: user._id, endpoint: sub.endpoint, keys: { p256dh: sub.keys!.p256dh, auth: sub.keys!.auth } },
    { upsert: true, new: true }
  );

  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  await connectDB();
  await PushSubscription.deleteOne({ endpoint });
  return { success: true };
}

export async function sendNotification(message: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not logged in" };

  await connectDB();
  const subscriptions = await PushSubscription.find({ user: user._id });
  if (!subscriptions.length) return { success: false, error: "No subscription available" };

  const sent = await sendPushToSubscriptions(subscriptions, { title: "Test Notification", body: message });
  return { success: sent > 0, sent };
}