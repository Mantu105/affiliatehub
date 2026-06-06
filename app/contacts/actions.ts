'use server'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import type { AppRole } from '@/lib/roles'

async function getAuthContext() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: role } = await supabase.rpc('get_my_role')
  return { user, role: (role || 'user') as AppRole, supabase }
}

export async function addContact(payload: {
  name: string
  emails: string
  telegram_id: string | null
  is_partner: boolean
  model: string | null
  country: string | null
  traffic_source?: string | null
  brand?: string | null
}) {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'Not authenticated' }
  const adminDb = createAdminSupabaseClient()

  // Per-user uniqueness: skip if email already exists for this user
  if (payload.emails?.trim()) {
    const { count } = await adminDb
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)
      .ilike('emails', payload.emails.trim())
    if ((count ?? 0) > 0) return { skipped: true }
  }

  // Per-user uniqueness: skip if telegram_id already exists for this user
  if (payload.telegram_id?.trim()) {
    const { count } = await adminDb
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)
      .ilike('telegram_id', payload.telegram_id.trim())
    if ((count ?? 0) > 0) return { skipped: true }
  }

  const { error } = await adminDb.from('contacts').insert({
    user_id:        ctx.user.id,
    name:           payload.name,
    emails:         payload.emails,
    telegram_id:    payload.telegram_id,
    is_partner:     payload.is_partner,
    model:          payload.model || null,
    country:        payload.country ? payload.country.toLowerCase() : null,
    traffic_source: payload.traffic_source?.trim() || null,
    brand:          payload.brand || null,
  })
  if (error) return { error: error.message }

  revalidatePath('/contacts')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateContact(contactId: string, payload: {
  name: string
  emails: string
  telegram_id: string | null
  notes?: string
  tags?: string
  is_partner?: boolean
  model?: string | null
  country?: string | null
  traffic_source?: string | null
  brand?: string | null
}) {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'Not authenticated' }
  const adminDb = createAdminSupabaseClient()

  if (ctx.role !== 'admin') {
    const { data: contact } = await adminDb.from('contacts').select('user_id').eq('id', contactId).single()
    if (!contact || contact.user_id !== ctx.user.id) return { error: 'Not authorized' }
  }

  const { error } = await adminDb.from('contacts').update(payload).eq('id', contactId)
  if (error) return { error: error.message }

  revalidatePath('/contacts')
  revalidatePath(`/contacts/${contactId}`)
  return { success: true }
}

export async function deleteContact(contactId: string) {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'Not authenticated' }
  const adminDb = createAdminSupabaseClient()

  if (ctx.role !== 'admin') {
    const { data: contact } = await adminDb.from('contacts').select('user_id').eq('id', contactId).single()
    if (!contact || contact.user_id !== ctx.user.id) return { error: 'Not authorized' }
  }

  const { error } = await adminDb.from('contacts').delete().eq('id', contactId)
  if (error) return { error: error.message }

  revalidatePath('/contacts')
  revalidatePath('/dashboard')
  return { success: true }
}
