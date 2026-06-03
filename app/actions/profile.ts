'use server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

export async function getMyProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminDb = createAdminSupabaseClient()
  const { data: prof } = await adminDb.from('profiles').select('*').eq('id', user.id).single()

  return prof
    ? { ...prof, email: prof.email ?? user.email }
    : { id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? null, role: 'user' }
}
