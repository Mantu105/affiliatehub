'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, Mail, MessageSquare, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getMyProfile } from '@/app/actions/profile'
import AppShell from '@/components/AppShell'
import { parseEmails } from '@/lib/utils'
import { addContact } from '@/app/contacts/actions'
import type { Profile } from '@/types'

export default function AddContactPage() {
  const router = useRouter()
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [name, setName]               = useState('')
  const [contactType, setContactType] = useState<'email' | 'telegram' | ''>('')
  const [emailsRaw, setEmailsRaw]     = useState('')
  const [telegramId, setTelegramId]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      getMyProfile().then(prof => setProfile(prof as Profile | null))
    })
  }, [router])

  const emailList = parseEmails(emailsRaw)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim())    { setError('Contact name is required.'); return }
    if (!contactType)    { setError('Please select Email or Telegram.'); return }
    if (contactType === 'email'    && emailList.length === 0) { setError('Please enter at least one valid email.'); return }
    if (contactType === 'telegram' && !telegramId.trim())     { setError('Please enter Telegram ID.'); return }

    setLoading(true)
    const result = await addContact({
      name:        name.trim(),
      emails:      contactType === 'email' ? emailList.join(', ') : '',
      telegram_id: contactType === 'telegram' ? telegramId.trim() : null,
    })
    if (result.error) { setError(result.error); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/contacts'), 1500)
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Add Contact</h1>
            <p className="text-slate-500 text-sm">Add a new affiliate contact</p>
          </div>
        </div>

        {success && <div className="alert-success mb-5"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>Contact added! Redirecting…</span></div>}
        {error   && <div className="alert-error mb-5"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Step 1 — Name */}
          <div className="card p-5">
            <label className="form-label">
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Contact Name
              </span>
            </label>
            <div className="relative mt-2">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" required placeholder="e.g. Rahul Sharma"
                value={name} onChange={e => setName(e.target.value)}
                className="form-input form-input-icon" />
            </div>
          </div>

          {/* Step 2 — Select Type */}
          <div className="card p-5">
            <label className="form-label">
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Contact Type
              </span>
            </label>
            <p className="text-xs text-slate-400 mt-1 mb-3">How do you contact this person?</p>
            <div className="grid grid-cols-2 gap-3">

              <button type="button" onClick={() => { setContactType('email'); setTelegramId('') }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  contactType === 'email'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${contactType === 'email' ? 'bg-brand-100' : 'bg-slate-100'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Email</span>
                <span className="text-xs opacity-60">Send via email</span>
                {contactType === 'email' && <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">Selected ✓</span>}
              </button>

              <button type="button" onClick={() => { setContactType('telegram'); setEmailsRaw('') }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  contactType === 'telegram'
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${contactType === 'telegram' ? 'bg-sky-100' : 'bg-slate-100'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Telegram</span>
                <span className="text-xs opacity-60">Save Telegram ID</span>
                {contactType === 'telegram' && <span className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded-full">Selected ✓</span>}
              </button>

            </div>
          </div>

          {/* Step 3 — Email Input */}
          {contactType === 'email' && (
            <div className="card p-5">
              <label className="form-label">
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Email Addresses
                </span>
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <textarea placeholder={"rahul@gmail.com, priya@gmail.com, amit@gmail.com"}
                  value={emailsRaw} onChange={e => setEmailsRaw(e.target.value)}
                  rows={3} className="form-textarea pl-10" />
              </div>
              <p className="form-hint">Separate multiple emails with commas ( , )</p>
              {emailList.length > 0 && (
                <div className="mt-3 p-3 bg-brand-50 rounded-xl">
                  <p className="text-xs font-semibold text-brand-700 mb-2">✅ {emailList.length} email{emailList.length > 1 ? 's' : ''} detected:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {emailList.map(em => (
                      <span key={em} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-brand-200 text-brand-700 rounded-lg text-xs">
                        <Mail className="w-3 h-3" />{em}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Telegram Input */}
          {contactType === 'telegram' && (
            <div className="card p-5">
              <label className="form-label">
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Telegram ID
                </span>
              </label>
              <div className="relative mt-2">
                <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="@rahul_sharma or 123456789"
                  value={telegramId} onChange={e => setTelegramId(e.target.value)}
                  className="form-input form-input-icon" />
              </div>
              <p className="form-hint">Enter Telegram username (with @) or numeric user ID</p>
              {telegramId && (
                <div className="mt-3 p-3 bg-sky-50 rounded-xl">
                  <p className="text-xs font-semibold text-sky-700">✅ Telegram ID: <span className="font-bold">{telegramId}</span></p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/contacts" className="btn-secondary flex-1 justify-center">Cancel</Link>
            <button type="submit" disabled={loading || success || !contactType} className="btn-primary flex-1 justify-center">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Contact</>}
            </button>
          </div>

        </form>
      </div>
    </AppShell>
  )
}