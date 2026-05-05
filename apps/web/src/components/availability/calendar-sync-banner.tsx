'use client'

import { useRouter } from 'next/navigation'

import { useState, useTransition } from 'react'
import { signInWithGoogle, syncGoogleCalendar } from '@/lib/actions/google-calendar'

type Props = {
  connected: boolean
}

export function CalendarSyncBanner({ connected }: Props) {
  const router = useRouter()
  const [syncing,       startSync]    = useTransition()
  const [connecting,    startConnect] = useTransition()
  const [syncResult,    setSyncResult] = useState<{ synced: number; error: string | null } | null>(null)

  function handleConnect() {
    startConnect(async () => {
      const { url, error } = await signInWithGoogle('/availability')
      if (url) window.location.href = url
      else console.error(error)
    })
  }

  function handleSync() {
    startSync(async () => {
      const result = await syncGoogleCalendar()
      setSyncResult(result)
      if (!result.error) router.refresh()
    })
  }

  return (
    <div style={{
      background: '#161616', border: '1px solid #222',
      borderRadius: '14px', padding: '14px 16px',
      marginBottom: '28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '12px', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Google icon */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>
            Google Calendar
          </p>
          {syncResult ? (
            <p style={{ fontSize: '11px', margin: '2px 0 0', color: syncResult.error ? '#f87171' : '#4ade80' }}>
              {syncResult.error ?? `Synced — ${syncResult.synced} free hours updated`}
            </p>
          ) : (
            <p style={{ fontSize: '11px', color: connected ? '#4ade80' : '#555', margin: '2px 0 0' }}>
              {connected ? 'Connected — availability synced from your calendar' : 'Auto-fill your availability from Google Calendar'}
            </p>
          )}
        </div>
      </div>

      {connected ? (
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: '7px 14px', borderRadius: '8px', border: 'none',
            background: syncing ? '#1e1e1e' : '#1a3a2a',
            color: syncing ? '#444' : '#4ade80',
            fontSize: '12px', fontWeight: 600, cursor: syncing ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {syncing ? 'Syncing…' : '↻ Sync now'}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{
            padding: '7px 14px', borderRadius: '8px', border: 'none',
            background: connecting ? '#1e1e1e' : '#fff',
            color: connecting ? '#444' : '#333',
            fontSize: '12px', fontWeight: 600, cursor: connecting ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {connecting ? 'Redirecting…' : 'Connect'}
        </button>
      )}
    </div>
  )
}
