'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { ChatBubble } from '@/components/chat/chat-bubble'

interface Group {
  id: string
  name: string
  slug: string
  theme_color: string | null
}

export function MobileLayoutWrapper({
  groups,
  children,
}: {
  groups: Group[]
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close sidebar on route change — more reliable than per-link onClick handlers
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar groups={groups} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: '#0f0f0f' }}>
        <div
          className="md:hidden flex items-center gap-3 px-4 h-14 border-b sticky top-0 z-30"
          style={{ background: '#0f0f0f', borderColor: '#1e1e1e' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[#666] hover:text-white transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span
            className="text-[20px] font-medium tracking-[-0.03em] leading-none"
            style={{ color: '#7F77DD' }}
          >
            volta
          </span>
        </div>

        {children}
        <ChatBubble />
      </main>
    </div>
  )
}
