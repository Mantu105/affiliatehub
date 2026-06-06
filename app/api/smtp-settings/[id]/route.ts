import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, host, port, secure, username, password, from_email } = body

  if (!host || !port || !username || !from_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    name:       (name || 'Default').trim(),
    host:       host.trim(),
    port:       parseInt(port),
    secure:     !!secure,
    username:   username.trim(),
    from_email: from_email.trim(),
  }
  // Only update password if a new one was provided
  if (password) updates.password = password

  const { error } = await supabase
    .from('smtp_settings')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if this was the active config
  const { data: target } = await supabase
    .from('smtp_settings')
    .select('is_active')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('smtp_settings')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If deleted config was active, promote the first remaining one
  if (target?.is_active) {
    const { data: first } = await supabase
      .from('smtp_settings')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (first) {
      await supabase
        .from('smtp_settings')
        .update({ is_active: true })
        .eq('id', first.id)
    }
  }

  return NextResponse.json({ success: true })
}
