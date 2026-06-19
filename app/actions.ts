'use server'

import webpush from 'web-push'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY

if (!publicKey || !privateKey) {
  throw new Error('Missing VAPID keys')
}

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  publicKey,
  privateKey
)

type StoredSubscription = webpush.PushSubscription

let subscription: StoredSubscription | null = null

export async function subscribeUser(sub: StoredSubscription) {
  subscription = sub

  // Production:
  // Save to database here

  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null

  // Production:
  // Remove from database here

  return { success: true }
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error('No subscription available')
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Test Notification',
        body: message,
        icon: '/icon-192x192.png',
      })
    )

    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)

    return {
      success: false,
      error: 'Failed to send notification',
    }
  }
}