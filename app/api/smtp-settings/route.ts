import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('smtp_settings')
    .select('id, name, host, port, secure, username, from_email, from_name, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ configs: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, host, port, secure, username, password, from_email, from_name } = body

  if (!host || !port || !username || !password || !from_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if this is the first config — if so, auto-activate it
  const { count } = await supabase
    .from('smtp_settings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const isFirst = (count ?? 0) === 0

  const { data, error } = await supabase
    .from('smtp_settings')
    .insert({
      user_id:    user.id,
      name:       (name || 'Default').trim(),
      host:       host.trim(),
      port:       parseInt(port),
      secure:     !!secure,
      username:   username.trim(),
      password,
      from_email: from_email.trim(),
      from_name:  (from_name || '').trim(),
      is_active:  isFirst,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id, activated: isFirst })
}
