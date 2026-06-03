import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { host, port, secure, username, password, from_email } = body

  if (!host || !port || !username || !password || !from_email) {
    return NextResponse.json({ error: 'Fill in all fields before testing' }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   host.trim(),
      port:   parseInt(port),
      secure: !!secure,
      auth:   { user: username.trim(), pass: password },
      tls:    { rejectUnauthorized: false },
    })

    await transporter.verify()
    return NextResponse.json({ success: true, message: 'Connection successful! Your SMTP settings are working.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Connection failed' }, { status: 400 })
  }
}
