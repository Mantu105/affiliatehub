import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin client bypasses RLS so we can read all users' data
  const supabase = createAdminSupabaseClient()

  const { data: followUps, error } = await supabase
    .from('follow_ups')
    .select('*, contacts(name, emails), email_logs(user_id)')
    .eq('sent', false)
    .lte('scheduled_at', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!followUps?.length) return NextResponse.json({ message: 'No follow-ups due', count: 0 })

  let sent = 0

  for (const followUp of followUps) {
    const contact = (followUp as any).contacts
    const userId  = (followUp as any).email_logs?.user_id
    if (!contact?.emails || !userId) continue

    // Look up this user's active SMTP account
    const { data: smtp } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!smtp) {
      console.warn(`[CRON] No SMTP configured for user ${userId}, skipping follow-up ${followUp.id}`)
      continue
    }

    const recipients = contact.emails.split(',').map((e: string) => e.trim()).filter(Boolean)
    const from = smtp.from_name ? `${smtp.from_name} <${smtp.from_email}>` : smtp.from_email

    try {
      const transporter = nodemailer.createTransport({
        host:   smtp.host,
        port:   smtp.port,
        secure: smtp.secure,
        auth:   { user: smtp.username, pass: smtp.password },
        tls:    { rejectUnauthorized: false },
      })

      await transporter.sendMail({
        from,
        to:      recipients,
        subject: followUp.subject,
        html:    followUp.body,
        text:    followUp.body.replace(/<[^>]+>/g, ''),
      })

      await supabase.from('follow_ups').update({ sent: true }).eq('id', followUp.id)
      sent++
    } catch (err) {
      console.error(`[CRON] Follow-up send error for ${followUp.id}:`, err)
    }
  }

  return NextResponse.json({ message: `Sent ${sent} follow-up(s)`, count: sent })
}
