'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPush } from '@/lib/push-sender'

export type ExpenseCategory = 'food' | 'lodging' | 'gas' | 'transport' | 'activities' | 'other'

export interface EventExpense {
  id: string; event_id: string; created_by: string; title: string
  category: ExpenseCategory; total_amount: number
  expense_date: string | null; pay_by_date: string | null
  receipt_url: string | null; status: string
  created_at: string; updated_at: string
  creator: { display_name: string | null; username: string } | null
  splits: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string; expense_id: string; user_id: string; amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  paid_at: string | null; payment_screenshot_url: string | null
  created_at: string; updated_at: string
  profiles: { id: string; display_name: string | null; username: string; avatar_url: string | null; payment_links: Record<string, string> | null } | null
}

export async function getEventExpenses(eventId: string): Promise<EventExpense[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_expenses')
    .select('*,creator:profiles!event_expenses_created_by_fkey(display_name,username),splits:event_expense_splits(*,profiles(id,display_name,username,avatar_url,payment_links))')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  return (data ?? []) as EventExpense[]
}

export async function createExpense(eventId: string, fields: {
  title: string
  category: ExpenseCategory
  total_amount: number
  expense_date?: string | null
  pay_by_date?: string | null
  receipt_url?: string | null
  split_user_ids: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const count = fields.split_user_ids.length
  const perPerson = Math.round((fields.total_amount / count) * 100) / 100

  const { data: expense, error: expError } = await supabase
    .from('event_expenses')
    .insert({
      event_id: eventId,
      created_by: user.id,
      title: fields.title,
      category: fields.category,
      total_amount: fields.total_amount,
      expense_date: fields.expense_date ?? null,
      pay_by_date: fields.pay_by_date ?? null,
      receipt_url: fields.receipt_url ?? null,
      status: 'pending_approval',
    })
    .select('id')
    .single()

  if (expError || !expense) return { error: expError?.message ?? 'Failed to create expense' }

  const splits = fields.split_user_ids.map(uid => ({
    expense_id: expense.id,
    user_id: uid,
    amount: perPerson,
    status: uid === user.id ? 'approved' : 'pending',
  }))

  const { error: splitError } = await supabase.from('event_expense_splits').insert(splits)
  if (splitError) return { error: splitError.message }

  const otherUsers = fields.split_user_ids.filter(uid => uid !== user.id)
  if (otherUsers.length === 0) {
    await supabase.from('event_expenses').update({ status: 'active' }).eq('id', expense.id)
  }

  for (const uid of otherUsers) {
    await sendPush(uid, {
      title: 'New expense split',
      body: 'You have been added to "' + fields.title + '" - $' + perPerson.toFixed(2) + '. Tap to approve.',
      url: '/events/' + eventId,
    }).catch(() => {})
  }

  revalidatePath('/events/' + eventId)
  return { success: true, expenseId: expense.id }
}

export async function respondToExpenseSplit(splitId: string, response: 'approved' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: split } = await supabase
    .from('event_expense_splits')
    .select('*, event_expenses(id, event_id, title, created_by, total_amount, status)')
    .eq('id', splitId)
    .eq('user_id', user.id)
    .single()

  if (!split) return { error: 'Split not found' }
  const expense = (split as any).event_expenses as any

  await supabase.from('event_expense_splits')
    .update({ status: response, updated_at: new Date().toISOString() })
    .eq('id', splitId)

  const { data: allSplits } = await supabase
    .from('event_expense_splits').select('*').eq('expense_id', expense.id)

  const active = (allSplits ?? []).filter((s: any) => s.status !== 'rejected')
  const pending = active.filter((s: any) => s.status === 'pending')

  if (response === 'rejected') {
    if (active.length === 0) {
      await supabase.from('event_expenses').update({ status: 'cancelled' }).eq('id', expense.id)
      await sendPush(expense.created_by, {
        title: 'Expense cancelled',
        body: 'All users declined "' + expense.title + '". Expense cancelled.',
        url: '/events/' + expense.event_id,
      }).catch(() => {})
    } else {
      const newAmount = Math.round((expense.total_amount / active.length) * 100) / 100
      for (const s of active) {
        await supabase.from('event_expense_splits').update({ amount: newAmount }).eq('id', (s as any).id)
      }
      const { data: p } = await supabase.from('profiles').select('display_name, username').eq('id', user.id).single()
      const name = (p as any)?.display_name ?? (p as any)?.username ?? 'Someone'
      for (const s of active) {
        await sendPush((s as any).user_id, {
          title: (s as any).user_id === expense.created_by ? 'Expense split declined' : 'Expense share updated',
          body: name + ' declined "' + expense.title + '". Your share is now $' + newAmount.toFixed(2) + '.',
          url: '/events/' + expense.event_id,
        }).catch(() => {})
      }
    }
  } else if (pending.length === 0) {
    await supabase.from('event_expenses').update({ status: 'active' }).eq('id', expense.id)
  }

  revalidatePath('/events/' + expense.event_id)
  return { success: true }
}

export async function markSplitPaid(splitId: string, screenshotUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: split } = await supabase
    .from('event_expense_splits')
    .select('*, event_expenses(id, event_id, title, created_by)')
    .eq('id', splitId).eq('user_id', user.id).single()

  if (!split) return { error: 'Split not found' }

  await supabase.from('event_expense_splits').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    payment_screenshot_url: screenshotUrl ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', splitId)

  const expense = (split as any).event_expenses as any
  const { data: p } = await supabase.from('profiles').select('display_name, username').eq('id', user.id).single()
  const name = (p as any)?.display_name ?? (p as any)?.username ?? 'Someone'

  await sendPush(expense.created_by, {
    title: 'Payment received',
    body: name + ' marked their share of "' + expense.title + '" as paid.',
    url: '/events/' + expense.event_id,
  }).catch(() => {})

  revalidatePath('/events/' + expense.event_id)
  return { success: true }
}

export async function uploadExpenseFile(file: File, path: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.storage.from('expense-receipts').upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('expense-receipts').getPublicUrl(path)
  return publicUrl
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: expense } = await supabase.from('event_expenses')
    .select('created_by, event_id').eq('id', expenseId).single()
  if (!expense || (expense as any).created_by !== user.id) return { error: 'Unauthorized' }

  await supabase.from('event_expenses').delete().eq('id', expenseId)
  revalidatePath('/events/' + (expense as any).event_id)
  return { success: true }
}
