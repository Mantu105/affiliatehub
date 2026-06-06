import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { subject, htmlBody, textBody, recipients } = body

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
        error: 'Configure SMTP first. Go to Settings → SMTP Settings.',
      }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host:   smtp.host,
      port:   smtp.port,
      secure: smtp.secure,
      auth:   { user: smtp.username, pass: smtp.password },
      tls:    { rejectUnauthorized: false },
    })

    const from = smtp.from_email

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

    return NextResponse.json({ success: status === 'sent', status, error: errorMessage })

  } catch (err: any) {
    console.error('[API ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
