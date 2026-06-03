import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Deactivate all user's configs first
  const { error: deactivateErr } = await supabase
    .from('smtp_settings')
    .update({ is_active: false })
    .eq('user_id', user.id)

  if (deactivateErr) return NextResponse.json({ error: deactivateErr.message }, { status: 500 })

  // Activate the selected one
  const { error } = await supabase
    .from('smtp_settings')
    .update({ is_active: true })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
