'use client'
import { useState, useEffect, useTransition, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
  Mail, MessageSquare, Globe, ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { parseEmails } from '@/lib/utils'
import { updateContact } from '@/app/contacts/actions'
import { getMyProfile } from '@/app/actions/profile'
import type { Profile, Contact, UserRole, ContactModel } from '@/types'

const MODELS: ContactModel[] = ['Revshare', 'CPA', 'Hybrid', 'Fixed']

function ContactDetailContent() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [contact,    setContact]    = useState<Contact | null>(null)
  const [role,       setRole]       = useState<UserRole>('user')
  const [loading,    setLoading]    = useState(true)

  // Editable fields
  const [contactType, setContactType] = useState<'email' | 'telegram'>('email')
  const [emailsRaw,   setEmailsRaw]   = useState('')
  const [telegramId,  setTelegramId]  = useState('')
  const [isPartner,   setIsPartner]   = useState(false)
  const [model,       setModel]       = useState<ContactModel | ''>('')
  const [country,     setCountry]     = useState('')

  // Original values to detect unsaved changes
  const [orig, setOrig] = useState<{
    contactType: 'email' | 'telegram'
    emailsRaw: string
    telegramId: string
    isPartner: boolean
    model: ContactModel | ''
    country: string
  } | null>(null)

  const [error,       setError]       = useState('')
  const [saved,       setSaved]       = useState(false)
  const [pending,     startSave]      = useTransition()

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [prof, { data: roleData }, { data: c }] = await Promise.all([
        getMyProfile(),
        supabase.rpc('get_my_role'),
        supabase.from('contacts').select('*').eq('id', id).single(),
      ])
      const r = (roleData || 'user') as UserRole
      setRole(r)
      setProfile(prof as Profile | null)
      if (!c) { router.push('/contacts'); return }
      const canView = r === 'admin' || r === 'manager' || c.user_id === user.id
      if (!canView) { router.push('/contacts'); return }
      setContact(c)
      // Determine type
      const hasEmail = !!(c.emails?.trim())
      const initType = hasEmail ? 'email' : 'telegram' as 'email' | 'telegram'
      const initEmails = c.emails || ''
      const initTelegram = c.telegram_id || ''
      const initPartner = !!(c as any).is_partner
      const initModel = ((c as any).model || '') as ContactModel | ''
      const initCountry = (c as any).country || ''
      setContactType(initType)
      setEmailsRaw(initEmails)
      setTelegramId(initTelegram)
      setIsPartner(initPartner)
      setModel(initModel)
      setCountry(initCountry)
      setOrig({ contactType: initType, emailsRaw: initEmails, telegramId: initTelegram, isPartner: initPartner, model: initModel, country: initCountry })
      setLoading(false)
    })()
  }, [id, router])

  const isDirty = orig !== null && (
    contactType !== orig.contactType ||
    emailsRaw   !== orig.emailsRaw   ||
    telegramId  !== orig.telegramId  ||
    isPartner   !== orig.isPartner   ||
    model       !== orig.model       ||
    country     !== orig.country
  )

  if (loading || !contact) return (
    <AppShell profile={profile} isAdmin={role === 'admin'}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    </AppShell>
  )

  const emailList = parseEmails(emailsRaw)

  const handleSave = () => {
    setError('')
    if (contactType === 'email' && emailList.length === 0) { setError('Please enter at least one valid email.'); return }
    if (contactType === 'telegram' && !telegramId.trim())  { setError('Please enter a Telegram ID.'); return }

    startSave(async () => {
      const res = await updateContact(contact.id, {
        name:        contact.name,
        emails:      contactType === 'email' ? emailList.join(', ') : '',
        telegram_id: contactType === 'telegram' ? telegramId.trim() : null,
        is_partner:  isPartner,
        model:       model || null,
        country:     country.trim().toLowerCase() || null,
      })
      if (res.error) { setError(res.error); return }
      setSaved(true)
      setTimeout(() => { setSaved(false); router.push('/contacts') }, 1500)
    })
  }

  return (
    <AppShell profile={profile} isAdmin={role === 'admin'}>
      <div className="max-w-2xl mx-auto">

        {/* Header — back + title only */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Contact Details</h1>
            <p className="text-slate-500 text-sm">{contact.name}</p>
          </div>
        </div>

        {saved && <div className="alert-success mb-4"><CheckCircle2 className="w-4 h-4" />Saved! Redirecting…</div>}
        {error && <div className="alert-error   mb-4"><AlertCircle  className="w-4 h-4" />{error}</div>}

        {/* ── Editable form card ── */}
        <div className="card divide-y divide-slate-100">

          {/* Contact Type */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact Type</p>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => setContactType('email')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex-1 justify-center ${
                  contactType === 'email'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                <Mail className="w-4 h-4" /> Email
                {contactType === 'email' && <span className="ml-auto text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-full">✓</span>}
              </button>
              <button type="button"
                onClick={() => setContactType('telegram')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex-1 justify-center ${
                  contactType === 'telegram'
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                <MessageSquare className="w-4 h-4" /> Telegram
                {contactType === 'telegram' && <span className="ml-auto text-xs bg-sky-600 text-white px-1.5 py-0.5 rounded-full">✓</span>}
              </button>
            </div>
          </div>

          {/* Email */}
          {contactType === 'email' && (
            <div className="px-6 py-4">
              <label className="form-label">Email Addresses</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <textarea
                  value={emailsRaw}
                  onChange={e => setEmailsRaw(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  rows={2}
                  className="form-textarea pl-10 text-sm"
                />
              </div>
              {emailList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {emailList.map(em => (
                    <span key={em} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg text-xs">
                      <Mail className="w-3 h-3" />{em}
                    </span>
                  ))}
                </div>
              )}
              <p className="form-hint">Separate multiple emails with commas</p>
            </div>
          )}

          {/* Telegram */}
          {contactType === 'telegram' && (
            <div className="px-6 py-4">
              <label className="form-label">Telegram ID</label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={telegramId}
                  onChange={e => setTelegramId(e.target.value)}
                  placeholder="@username or numeric ID"
                  className="form-input form-input-icon text-sm"
                />
              </div>
            </div>
          )}

          {/* Model + Country */}
          <div className="px-6 py-4 grid grid-cols-2 gap-5">
            <div>
              <label className="form-label">Commission Model</label>
              <div className="relative">
                <select value={model} onChange={e => setModel(e.target.value as ContactModel | '')}
                  className="form-input appearance-none pr-10 text-sm">
                  <option value="">— Select —</option>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="form-label">Country</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                  placeholder="e.g. India" className="form-input form-input-icon text-sm" />
              </div>
            </div>
          </div>

          {/* Is Partner */}
          <div className="px-6 py-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={isPartner} onChange={e => setIsPartner(e.target.checked)}
                className="w-4 h-4 accent-brand-600 cursor-pointer" />
              <span className="text-sm font-medium text-slate-700">Is Partner</span>
              {isPartner && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Partner</span>}
            </label>
          </div>

        </div>

        {/* Footer — Cancel + Save */}
        <div className="flex gap-3 mt-4">
          <Link href="/contacts" className="btn-secondary flex-1 justify-center">Cancel</Link>
          <button onClick={handleSave} disabled={pending || saved || !isDirty}
            className={`btn-primary flex-1 justify-center transition-all ${!isDirty && !pending ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {pending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </div>

      </div>
    </AppShell>
  )
}

export default function ContactDetailPage() {
  return (
    <Suspense>
      <ContactDetailContent />
    </Suspense>
  )
}
