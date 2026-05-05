import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccessRequests } from '@/lib/actions/access'
import { AdminPanel } from './admin-panel'

export const metadata = { title: 'Admin — Volta' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Protect with admin email check
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/dashboard')

  const requests = await getAccessRequests()

  return <AdminPanel requests={requests} />
}
