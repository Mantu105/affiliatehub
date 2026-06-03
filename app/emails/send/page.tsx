'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2,
  Mail, Users, Calendar, ChevronDown, FileText, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { parseEmails } from '@/lib/utils'
import { getMyProfile } from '@/app/actions/profile'
import type { Profile, Contact } from '@/types'

type Template = { id: string; title: string; subject: string; body: string }

function SendEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedContactId = searchParams.get('contact')

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [contacts, setContacts]         = useState<Contact[]>([])
  const [templates, setTemplates]       = useState<Template[]>([])
  const [selectedContact, setSelected]  = useState<string>(preselectedContactId || '')
  const [selectedTemplate, setTemplate] = useState<string>('')
  const [customEmails, setCustomEmails] = useState('')
  const [subject, setSubject]           = useState('')
  const [body, setBody]                 = useState('')
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate]   = useState('')
  const [followUpSubject, setFollowUpSubject] = useState('')
  const [followUpBody, setFollowUpBody]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [recipientMode, setRecipientMode] = useState<'contact' | 'custom'>('contact')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      getMyProfile().then(prof => {
        setProfile(prof as Profile | null)
        // Load contacts
        const q = supabase.from('contacts').select('*').order('name')
        if (prof?.role !== 'admin') q.eq('user_id', user.id)
        q.then(({ data: c }) => setContacts((c as Contact[]) || []))
        // Load templates
        fetch('/api/templates')
          .then(r => r.json())
          .then(({ templates: t }) => setTemplates(t || []))
      })
    })
  }, [router])

  // Apply selected template → fill subject + body
  const handleTemplateChange = (templateId: string) => {
    setTemplate(templateId)
    if (!templateId) return
    const tpl = templates.find(t => t.id === templateId)
    if (tpl) { setSubject(tpl.subject); setBody(tpl.body) }
  }

  const clearTemplate = () => {
    setTemplate(''); setSubject(''); setBody('')
  }

  const getRecipients = (): string[] => {
    if (recipientMode === 'contact' && selectedContact) {
      const c = contacts.find(c => c.id === selectedContact)
      return c ? parseEmails(c.emails) : []
    }
    return parseEmails(customEmails)
  }

  const recipients = getRecipients()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!recipients.length) { setError('Please select a contact or enter email addresses.'); return }
    if (!subject.trim())    { setError('Subject is required.'); return }
    if (!body.trim())       { setError('Email body is required.'); return }
    if (scheduleFollowUp && !followUpDate) { setError('Please select a follow-up date.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: recipientMode === 'contact' ? selectedContact : null,
          subject, htmlBody: body.replace(/\n/g, '<br>'), textBody: body,
          recipients, scheduleFollowUp, followUpDate, followUpSubject, followUpBody,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send email'); setLoading(false); return }
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  // ── Success screen ────────────────────────────────────────
  if (success) return (
    <AppShell profile={profile}>
      <div className="max-w-md mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Email Sent!</h2>
        <p className="text-slate-500 mb-2 text-sm sm:text-base">
          Successfully sent to <strong>{recipients.length}</strong> recipient(s)
        </p>
        {scheduleFollowUp && (
          <p className="text-sm text-brand-600 font-medium mb-6">
            Follow-up scheduled for {new Date(followUpDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/emails/logs" className="btn-secondary">View Email Logs</Link>
          <button
            onClick={() => { setSuccess(false); setSubject(''); setBody(''); setSelected(''); setTemplate('') }}
            className="btn-primary">
            Send Another
          </button>
        </div>
      </div>
    </AppShell>
  )

  // ── Main form ─────────────────────────────────────────────
  return (
    <AppShell profile={profile}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/contacts" className="btn-icon shrink-0"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Send Email</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Compose and send to your contacts</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {error && (
            <div className="alert-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          {/* Recipients */}
          <div className="card p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Recipients</h2>

            {/* Mode toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
              {(['contact', 'custom'] as const).map(mode => (
                <button key={mode} type="button" onClick={() => setRecipientMode(mode)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    recipientMode === mode
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <span className="flex items-center justify-center gap-1.5">
                    {mode === 'contact'
                      ? <><Users className="w-3.5 h-3.5 shrink-0" /><span>From Contacts</span></>
                      : <><Mail className="w-3.5 h-3.5 shrink-0" /><span>Custom Emails</span></>}
                  </span>
                </button>
              ))}
            </div>

            {recipientMode === 'contact' ? (
              <div>
                <label className="form-label">Select Contact</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select value={selectedContact} onChange={e => setSelected(e.target.value)}
                    className="form-input form-input-icon appearance-none pr-10 text-sm">
                    <option value="">— Choose a contact —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({parseEmails(c.emails).length} email{parseEmails(c.emails).length > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                {contacts.length === 0 && (
                  <p className="form-hint mt-2 text-xs">
                    No contacts yet.{' '}
                    <Link href="/contacts/add" className="text-brand-600 hover:underline">Add one first →</Link>
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="form-label">Email Addresses</label>
                <textarea placeholder="Enter emails separated by commas…" value={customEmails}
                  onChange={e => setCustomEmails(e.target.value)} rows={2} className="form-textarea text-sm" />
              </div>
            )}

            {/* Recipient chips */}
            {recipients.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {recipients.slice(0, 3).map(em => (
                    <span key={em} className="badge-blue text-xs max-w-[160px] truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />{em}
                    </span>
                  ))}
                  {recipients.length > 3 && (
                    <span className="badge-blue text-xs">+{recipients.length - 3} more</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{recipients.length} recipient(s) selected</p>
              </div>
            )}
          </div>

          {/* Template selector — only shown in From Contacts mode */}
          {recipientMode === 'contact' && templates.length > 0 && (
            <div className="card p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  Use a Template
                  <span className="text-xs font-normal text-slate-400">(optional)</span>
                </h2>
                {selectedTemplate && (
                  <button type="button" onClick={clearTemplate}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedTemplate}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="form-input form-input-icon appearance-none pr-10 text-sm">
                  <option value="">— Choose a template —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>

              {selectedTemplate && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Template applied — subject and message have been filled. You can still edit them below.
                </p>
              )}
            </div>
          )}

          {/* Compose */}
          <div className="card p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Compose</h2>
            <div>
              <label className="form-label">Subject <span className="text-red-400">*</span></label>
              <input type="text" required placeholder="e.g. Partnership Opportunity"
                value={subject} onChange={e => setSubject(e.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Message <span className="text-red-400">*</span></label>
              <textarea required placeholder="Write your email message here…"
                value={body} onChange={e => setBody(e.target.value)}
                rows={8} className="form-textarea text-sm" />
              <p className="form-hint">{body.length} characters</p>
            </div>
          </div>

          {/* Follow-up */}
          <div className="card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-800 text-sm">Schedule Follow-up</h2>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Automatically send a follow-up email later</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" checked={scheduleFollowUp}
                  onChange={e => setScheduleFollowUp(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
              </label>
            </div>
            {scheduleFollowUp && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="form-label">Follow-up Date & Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="datetime-local" value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="form-input form-input-icon text-sm" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Follow-up Subject</label>
                  <input type="text" placeholder={`Re: ${subject || 'your email'}`}
                    value={followUpSubject} onChange={e => setFollowUpSubject(e.target.value)}
                    className="form-input text-sm" />
                </div>
                <div>
                  <label className="form-label">Follow-up Message</label>
                  <textarea placeholder="Follow-up message…" value={followUpBody}
                    onChange={e => setFollowUpBody(e.target.value)} rows={3} className="form-textarea text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pb-4">
            <Link href="/contacts" className="btn-secondary flex-1 justify-center text-sm">Cancel</Link>
            <button type="submit" disabled={loading || !recipients.length}
              className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Sending to {recipients.length}…</>
                : <><Send className="w-4 h-4" />Send to {recipients.length} recipient(s)</>}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default function SendEmailPage() {
  return (
    <Suspense>
      <SendEmailForm />
    </Suspense>
  )
}
