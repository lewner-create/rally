'use server'

import { createClient } from '@/lib/supabase/server'

export type EventQuestion = {
  id: string
  event_id: string
  question: string
  required: boolean
  position: number
}

export async function getEventQuestions(eventId: string): Promise<EventQuestion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_questions')
    .select('*')
    .eq('event_id', eventId)
    .order('position', { ascending: true })
  return (data ?? []) as EventQuestion[]
}

export async function saveEventQuestions(
  eventId: string,
  questions: { question: string; required: boolean }[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // Replace all questions for this event
  await supabase.from('event_questions').delete().eq('event_id', eventId)

  if (questions.length === 0) return { error: null }

  const rows = questions.map((q, i) => ({
    event_id: eventId,
    question: q.question.trim(),
    required: q.required,
    position: i,
  }))

  const { error } = await supabase.from('event_questions').insert(rows)
  return { error: error?.message ?? null }
}

export async function submitQuestionAnswers(
  eventId: string,
  answers: { questionId: string; answer: string }[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const rows = answers.map(a => ({
    event_id:    eventId,
    question_id: a.questionId,
    user_id:     user.id,
    answer:      a.answer.trim(),
  }))

  const { error } = await supabase
    .from('event_question_answers')
    .upsert(rows, { onConflict: 'question_id,user_id' })

  return { error: error?.message ?? null }
}

export async function hasUserAnswered(
  eventId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('event_question_answers')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('user_id', userId)
  return (count ?? 0) > 0
}
