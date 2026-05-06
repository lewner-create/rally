'use client'

import { useEffect, useRef, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '@/lib/actions/notifications'
import { savePushSubscription } from '@/lib/actions/push'
import { playNotificationTone, playPlanChime, playLockInSuccess } from '@/lib/sounds'

const ACCENT = '#7F77DD'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'new_plan':    return '📋'
    case 'plan_locked': return '🔒'
    case 'nudge':       return '👋'
    case 'new_member':  return '👤'
    case 'new_message': return '💬'
    default:            return '🔔'
  }
}

function typeUrl(n: Notification) {
  if (n.event_id)     return `/events/${n.event_id}`
  if (n.plan_card_id) return `/plans/${n.plan_card_id}`
  if (n.group_id)     return `/groups/${n.group_id}`
  return '/dashboard'
}

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell({ userId }: { userId: string }) {
  const router                          = useRouter()
  const panelRef                        = useRef<HTMLDivElement>(null)
  const buttonRef                       = useRef<HTMLButtonElement>(null)
  const [open, setOpen]                 = useState(false)
  const [notifs, setNotifs]             = useState<Notification[]>([])
  const [pushState, setPushState]       = useState<'unknown' | 'granted' | 'denied' | 'default'>('unknown')
  const [isPending, startTransition]    = useTransition()

  const unreadCount = notifs.filter(n => !n.read_at).length

  // ── Load notifications ───────────────────────────────────────────────────

  const load = useCallback(() => {
    getNotifications().then(setNotifs)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Realtime subscription ────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const n = payload.new as Notification
          setNotifs(prev => [n, ...prev])
          // Play sound based on type
          if (n.type === 'new_plan')    playPlanChime()
          else if (n.type === 'plan_locked') playLockInSuccess()
          else playNotificationTone()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // ── Close on outside click ───────────────────────────────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Push permission state ────────────────────────────────────────────────

  useEffect(() => {
    if ('Notification' in window) {
      setPushState(Notification.permission as any)
    }
  }, [])

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const permission = await Notification.requestPermission()
    setPushState(permission as any)
    if (permission !== 'granted') return

    const reg = await navigator.serviceWorker.ready
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const key  = sub.getKey('p256dh')
    const auth = sub.getKey('auth')
    if (!key || !auth) return

    await savePushSubscription({
      endpoint: sub.endpoint,
      p256dh:   btoa(String.fromCharCode(...new Uint8Array(key))),
      auth:     btoa(String.fromCharCode(...new Uint8Array(auth))),
    })
  }

  // ── Service worker registration ──────────────────────────────────────────

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // ── Mark read + navigate ─────────────────────────────────────────────────

  function handleNotifClick(n: Notification) {
    setOpen(false)
    if (!n.read_at) {
      markNotificationRead(n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    }
    router.push(typeUrl(n))
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifs(prev => prev.map(x => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative' }}>

      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'relative',
          width: '36px', height: '36px',
          borderRadius: '8px',
          border: 'none',
          background: open ? 'rgba(127,119,221,0.15)' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: unreadCount > 0 ? ACCENT : '#666',
          transition: 'background 0.15s, color 0.15s',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px', right: '4px',
            minWidth: '16px', height: '16px',
            borderRadius: '9999px',
            background: '#e05a5a',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid #0f0f0f',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            left: '44px',
            bottom: '0',
            width: '320px',
            maxHeight: '480px',
            background: '#161616',
            border: '1px solid #2a2a2a',
            borderRadius: '14px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '1px solid #222',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                style={{
                  fontSize: '12px', color: ACCENT,
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Push prompt */}
          {pushState === 'default' && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(127,119,221,0.08)',
              borderBottom: '1px solid #222',
              display: 'flex', alignItems: 'center',
              gap: '10px', flexShrink: 0,
            }}>
              <span style={{ fontSize: '18px' }}>🔔</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0' }}>
                  Enable alerts
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
                  Get notified when plans are posted
                </div>
              </div>
              <button
                onClick={enablePush}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: ACCENT,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                Allow
              </button>
            </div>
          )}

          {/* Notification list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#444',
                fontSize: '13px',
              }}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'flex-start',
                    gap: '12px', padding: '12px 16px',
                    background: n.read_at ? 'transparent' : 'rgba(127,119,221,0.06)',
                    border: 'none',
                    borderBottom: '1px solid #1e1e1e',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Unread dot */}
                  <div style={{
                    width: '6px', height: '6px',
                    borderRadius: '50%',
                    marginTop: '6px',
                    flexShrink: 0,
                    background: n.read_at ? 'transparent' : ACCENT,
                  }} />

                  {/* Icon */}
                  <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>
                    {typeIcon(n.type)}
                  </span>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: n.read_at ? 400 : 600,
                      color: n.read_at ? '#999' : '#e0e0e0',
                      lineHeight: 1.35,
                    }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div style={{
                        fontSize: '12px', color: '#555',
                        marginTop: '2px', lineHeight: 1.3,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as any,
                      }}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
