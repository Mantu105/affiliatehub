import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { contactId, subject, htmlBody, textBody, recipients, scheduleFollowUp, followUpDate, followUpSubject, followUpBody } = body

    if (!subject || !htmlBody || !recipients?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the user's active SMTP account
    const { data: smtp } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!smtp) {
      return NextResponse.json({
        error: 'No active SMTP account. Go to Settings → SMTP, add an account and set it as Active.',
      }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host:   smtp.host,
      port:   smtp.port,
      secure: smtp.secure,
      auth:   { user: smtp.username, pass: smtp.password },
      tls:    { rejectUnauthorized: false },
    })

    const from = smtp.from_name
      ? `${smtp.from_name} <${smtp.from_email}>`
      : smtp.from_email

    const plainText = textBody || htmlBody.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    const minimalHtml = `<!DOCTYPE html><html><body>${htmlBody}</body></html>`

    let status: 'sent' | 'failed' = 'sent'
    let errorMessage: string | null = null

    for (const email of recipients) {
      try {
        await transporter.sendMail({ from, to: email, subject, text: plainText, html: minimalHtml })
      } catch (err: any) {
        status = 'failed'
        errorMessage = err.message
        console.error('[SMTP SEND ERROR]', err)
      }
    }

    const { data: log } = await supabase.from('email_logs').insert({
      user_id:       user.id,
      contact_id:    contactId || null,
      subject,
      body:          plainText,
      recipients:    recipients.join(', '),
      status,
      error_message: errorMessage,
      sent_at:       new Date().toISOString(),
    }).select().single()

    if (scheduleFollowUp && followUpDate && log) {
      await supabase.from('follow_ups').insert({
        email_log_id: log.id,
        contact_id:   contactId || null,
        subject:      followUpSubject || `Re: ${subject}`,
        body:         followUpBody || htmlBody,
        scheduled_at: new Date(followUpDate).toISOString(),
        sent:         false,
      })
    }

    return NextResponse.json({ success: status === 'sent', status, error: errorMessage })

  } catch (err: any) {
    console.error('[API ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
