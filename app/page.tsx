'use client'

import { useEffect, useState } from 'react'
import {
  sendNotification,
  subscribeUser,
  unsubscribeUser,
} from './actions'



function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat(
    (4 - (base64String.length % 4)) % 4
  )

  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}


function PushNotificationManager() {
  const [mounted, setMounted] = useState(false)
  const [subscription, setSubscription] =
    useState<PushSubscription | null>(null)
  const [message, setMessage] = useState('')

  
  useEffect(() => {
    // Deliberate "mounted" gate to avoid SSR/CSR hydration mismatch —
    // this component must render identically on the server and on first
    // client paint, then switch to client-only state once mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (!mounted) return

    // Browser feature detection must happen client-side only, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(
      'serviceWorker' in navigator &&
        'PushManager' in window
    )
  }, [mounted])

  useEffect(() => {
    if (!isSupported) return

    const registerSW = async () => {
      try {
        const reg =
          await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none',
            }
          )

        const sub =
          await reg.pushManager.getSubscription()

        setSubscription(sub)
      } catch (err) {
        console.error('SW error:', err)
      }
    }

    void registerSW()
  }, [isSupported])

  async function subscribeToPush() {
    const vapidKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidKey) return

    const registration =
      await navigator.serviceWorker.ready

    const sub =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(vapidKey),
      })

    setSubscription(sub)

    await subscribeUser(
      JSON.parse(JSON.stringify(sub))
    )
  }

  async function unsubscribeFromPush() {
    if (!subscription) return

   const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    setSubscription(null)

    await unsubscribeUser(endpoint)
  }

  async function sendTestNotification() {
    if (!message.trim()) return

    await sendNotification(message)
    setMessage('')
  }

  // ✅ IMPORTANT: identical first render
  if (!mounted) {
    return <p>Loading push system...</p>
  }

  if (!isSupported) {
    return <p>Push not supported</p>
  }

  return (
    <section>
      <h3>Push Notifications</h3>

      {subscription ? (
        <>
          <p>Subscribed</p>

          <button onClick={unsubscribeFromPush}>
            Unsubscribe
          </button>

          <input
            value={message}
            placeholder="Test message"
            onChange={(e) =>
              setMessage(e.target.value)
            }
          />

          <button onClick={sendTestNotification}>
            Send Test
          </button>
        </>
      ) : (
        <button onClick={subscribeToPush}>
          Subscribe
        </button>
      )}
    </section>
  )
}


interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function InstallPrompt() {
  const [mounted, setMounted] = useState(false)

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [isIOS, setIsIOS] = useState(false)

  const [isStandalone, setIsStandalone] =
    useState(false)

  useEffect(() => {
    // Same deliberate "mounted" gate as above, plus client-only device
    // detection (userAgent / matchMedia aren't available during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)

    setIsIOS(
      /iPad|iPhone|iPod/.test(
        navigator.userAgent
      )
    )

    setIsStandalone(
      window.matchMedia(
        '(display-mode: standalone)'
      ).matches
    )
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()

      setDeferredPrompt(
        event as BeforeInstallPromptEvent
      )
    }

    window.addEventListener(
      'beforeinstallprompt',
      handler
    )

    return () =>
      window.removeEventListener(
        'beforeinstallprompt',
        handler
      )
  }, [])

  async function installApp() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()

    const choice =
      await deferredPrompt.userChoice

    if (choice.outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
  }

  if (!mounted) {
    return null
  }

  if (isStandalone) {
    return null
  }

  return (
    <section>
      <h3>Install App</h3>

      {!isIOS && deferredPrompt && (
        <button onClick={installApp}>
          Install App
        </button>
      )}

      {isIOS && (
        <p>
          To install on iOS, tap Share →
          <strong> Add to Home Screen</strong>
        </p>
      )}
    </section>
  )
}

/* ────────────────────────────────
   PAGE
──────────────────────────────── */
export default function Page() {
  return (
    <main>
      <PushNotificationManager />
      <InstallPrompt />
    </main>
  )
}