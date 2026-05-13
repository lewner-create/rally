import { NextResponse } from 'next/server'
import { sendPostEventNudges } from '@/lib/actions/post-event-nudge'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await sendPostEventNudges()
  return NextResponse.json({ ok: true, ...result })
}
