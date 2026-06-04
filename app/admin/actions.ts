'use server'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

async function assertAdmin() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: role } = await supabase.rpc('get_my_role')
  if (role !== 'admin') return null
  return user
}

export async function updateUserRole(targetUserId: string, newRole: 'admin' | 'manager' | 'user') {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }
  if (caller.id === targetUserId) return { error: 'Cannot change your own role' }

  const adminDb = createAdminSupabaseClient()
  const { error } = await adminDb
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function grantAccess(userId: string, canViewUserId: string) {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }

  const adminDb = createAdminSupabaseClient()
  const { error } = await adminDb
    .from('user_access')
    .upsert({ user_id: userId, can_view_user_id: canViewUserId }, { onConflict: 'user_id,can_view_user_id' })

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function revokeAccess(userId: string, canViewUserId: string) {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }

  const adminDb = createAdminSupabaseClient()
  const { error } = await adminDb
    .from('user_access')
    .delete()
    .eq('user_id', userId)
    .eq('can_view_user_id', canViewUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function approveUser(userId: string) {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }

  const adminDb = createAdminSupabaseClient()
  const { error } = await adminDb
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function rejectUser(userId: string) {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }

  const adminDb = createAdminSupabaseClient()
  const { error } = await adminDb
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function approvePasswordReset(resetId: string) {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }

  const adminDb = createAdminSupabaseClient()

  const { data: reset, error: fetchError } = await adminDb
    .from('pending_password_resets')
    .select('*')
    .eq('id', resetId)
    .single()

  if (fetchError || !reset) return { error: 'Reset request not found.' }

  // Apply the new password via admin API
  const { error: updateError } = await adminDb.auth.admin.updateUserById(reset.user_id, {
    password: reset.new_password,
  })

  if (updateError) return { error: updateError.message }

  await adminDb
    .from('pending_password_resets')
    .update({ status: 'approved' })
    .eq('id', resetId)

  revalidatePath('/admin')
  return { success: true }
}

export async function rejectPasswordReset(resetId: string) {
  const caller = await assertAdmin()
  if (!caller) return { error: 'Not authorized' }

  const adminDb = createAdminSupabaseClient()
  const { error } = await adminDb
    .from('pending_password_resets')
    .update({ status: 'rejected' })
    .eq('id', resetId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
