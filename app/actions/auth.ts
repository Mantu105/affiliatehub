'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function loginUser(data: {
  email: string
  password: string
}): Promise<{ error?: string; success?: boolean }> {
  const adminDb = createAdminSupabaseClient()

  // Check profile status BEFORE authenticating
  const { data: profile } = await adminDb
    .from('profiles')
    .select('status')
    .eq('email', data.email.trim().toLowerCase())
    .maybeSingle()

  if (profile?.status === 'rejected') {
    return { error: 'Your account has been rejected. Please contact an admin.' }
  }
  if (profile?.status === 'pending') {
    return { error: 'Your account is pending admin approval. Please wait.' }
  }

  // Status is active (or no profile yet) — sign in server-side to set session cookies
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email.trim(),
    password: data.password,
  })

  if (error) {
    return {
      error: error.message === 'Invalid login credentials'
        ? 'Invalid email or password.'
        : error.message,
    }
  }

  return { success: true }
}

export async function registerUser(data: {
  email: string
  password: string
  fullName: string
}): Promise<{ error?: string; success?: boolean }> {
  const adminDb = createAdminSupabaseClient()

  // Create user via admin API — skips email confirmation entirely
  const { data: { user }, error } = await adminDb.auth.admin.createUser({
    email: data.email.trim(),
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.fullName.trim() },
  })

  if (error) return { error: error.message }
  if (!user) return { error: 'Failed to create account.' }

  // Ensure profile exists with status=pending (trigger may have created it already)
  await adminDb.from('profiles').upsert({
    id: user.id,
    email: data.email.trim(),
    full_name: data.fullName.trim(),
    role: 'user',
    status: 'pending',
  }, { onConflict: 'id' })

  return { success: true }
}

export async function requestPasswordReset(data: {
  email: string
  newPassword: string
}): Promise<{ error?: string; success?: boolean }> {
  const adminDb = createAdminSupabaseClient()

  // Look up user via profiles table
  const { data: profile } = await adminDb
    .from('profiles')
    .select('id')
    .eq('email', data.email.trim().toLowerCase())
    .single()

  if (!profile) return { error: 'No account found with this email address.' }

  // If there's already a pending reset, update it; otherwise insert
  const { data: existing } = await adminDb
    .from('pending_password_resets')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    await adminDb
      .from('pending_password_resets')
      .update({ new_password: data.newPassword, requested_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    const { error: insertError } = await adminDb.from('pending_password_resets').insert({
      user_id: profile.id,
      email: data.email.trim(),
      new_password: data.newPassword,
    })
    if (insertError) return { error: insertError.message }
  }

  return { success: true }
}
