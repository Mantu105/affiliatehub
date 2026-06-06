'use client'
import { useState, useEffect, useTransition, Suspense } from 'react'
import { useRouter, useParams  } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
  Mail, MessageSquare, Globe, ChevronDown, Link2, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { parseEmails } from '@/lib/utils'
import { updateContact } from '@/app/contacts/actions'
import { getMyProfile } from '@/app/actions/profile'
import type { Profile, Contact, UserRole, ContactModel } from '@/types'

const MODELS: ContactModel[] = ['Revshare', 'CPA', 'Hybrid', 'Fixed']
const BRANDS = ['Melbet', 'Mostbet', 'Bet on game', 'Betmaan']

function ContactDetailContent() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [profile, setProfile] = useState<Profile | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [role,    setRole]    = useState<UserRole>('user')
  const [loading, setLoading] = useState(true)

  // Editable fields
  const [emailsRaw,     setEmailsRaw]     = useState('')
  const [telegramId,    setTelegramId]    = useState('')
  const [isPartner,     setIsPartner]     = useState(false)
  const [brand,         setBrand]         = useState('')
  const [trafficSource, setTrafficSource] = useState('')
  const [model,         setModel]         = useState<ContactModel | ''>('')
  const [country,       setCountry]       = useState('')

  // Original snapshot for dirty detection
  const [orig, setOrig] = useState<{
    emailsRaw: string
    telegramId: string
    isPartner: boolean
    brand: string
    trafficSource: string
    model: ContactModel | ''
    country: string
  } | null>(null)

  const [error,   setError]   = useState('')
  const [saved,   setSaved]   = useState(false)
  const [pending, startSave]  = useTransition()

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

      const initEmails        = c.emails         || ''
      const initTelegram      = c.telegram_id     || ''
      const initPartner       = !!( c as any).is_partner
      const initBrand         = (c as any).brand          || ''
      const initTrafficSource = (c as any).traffic_source || ''
      const initModel         = ((c as any).model   || '') as ContactModel | ''
      const initCountry       = (c as any).country  || ''

      setEmailsRaw(initEmails)
      setTelegramId(initTelegram)
      setIsPartner(initPartner)
      setBrand(initBrand)
      setTrafficSource(initTrafficSource)
      setModel(initModel)
      setCountry(initCountry)
      setOrig({ emailsRaw: initEmails, telegramId: initTelegram, isPartner: initPartner, brand: initBrand, trafficSource: initTrafficSource, model: initModel, country: initCountry })
      setLoading(false)
    })()
  }, [id, router])

  const isDirty = orig !== null && (
    emailsRaw     !== orig.emailsRaw     ||
    telegramId    !== orig.telegramId    ||
    isPartner     !== orig.isPartner     ||
    brand         !== orig.brand         ||
    trafficSource !== orig.trafficSource ||
    model         !== orig.model         ||
    country       !== orig.country
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
    if (emailList.length === 0 && !telegramId.trim()) {
      setError('Please enter at least one email or Telegram ID.'); return
    }
    startSave(async () => {
      const res = await updateContact(contact.id, {
        name:           contact.name,
        emails:         emailList.join(', '),
        telegram_id:    telegramId.trim() || null,
        is_partner:     isPartner,
        brand:          isPartner ? brand || null : null,
        traffic_source: isPartner ? trafficSource.trim() || null : null,
        model:          model || null,
        country:        country.trim().toLowerCase() || null,
      })
      if (res.error) { setError(res.error); return }
      setSaved(true)
      setTimeout(() => { setSaved(false); router.push('/contacts') }, 1500)
    })
  }

  return (
    <AppShell profile={profile} isAdmin={role === 'admin'}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Affiliate Details</h1>
            <p className="text-slate-500 text-sm">{contact.name}</p>
          </div>
        </div>

        {saved && <div className="alert-success mb-4"><CheckCircle2 className="w-4 h-4" />Saved! Redirecting…</div>}
        {error && <div className="alert-error   mb-4"><AlertCircle  className="w-4 h-4" />{error}</div>}

        <div className="card divide-y divide-slate-100">

          {/* Email Addresses */}
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
                    <button
                      type="button"
                      onClick={() => setEmailsRaw(emailList.filter(e => e !== em).join(', '))}
                      className="ml-0.5 text-brand-400 hover:text-brand-700 leading-none"
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            <p className="form-hint">Separate multiple emails with commas</p>
          </div>

          {/* Telegram ID */}
          <div className="px-6 py-4">
            <label className="form-label">Telegram ID</label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={telegramId}
                onChange={e => setTelegramId(e.target.value)}
                placeholder="@username1, @username2 or numeric IDs"
                className="form-input form-input-icon text-sm"
              />
            </div>
            <p className="form-hint">Separate multiple Telegram IDs with commas</p>
          </div>

          {/* Commission Model + Country */}
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

          {/* Already Partner */}
          <div className="px-6 py-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPartner}
                onChange={e => { setIsPartner(e.target.checked); if (!e.target.checked) { setBrand(''); setTrafficSource('') } }}
                className="w-4 h-4 accent-brand-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Already Partner?</span>
              {isPartner && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Partner</span>}
            </label>
          </div>

          {/* Brand */}
          <div className="px-6 py-4">
            <label className="form-label">Brand</label>
            <div className="relative">
              <select value={brand} onChange={e => setBrand(e.target.value)}
                className="form-input appearance-none pr-10 text-sm">
                <option value="">— Select Brand —</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Traffic Source */}
          <div className="px-6 py-4">
            <label className="form-label">Traffic Source</label>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="url"
                  placeholder="https://example.com/traffic-source"
                  value={trafficSource}
                  onChange={e => setTrafficSource(e.target.value)}
                  className="form-input form-input-icon text-sm"
                />
              </div>
              {trafficSource.trim() && (
                <a
                  href={trafficSource.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open traffic source"
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-slate-500 hover:text-brand-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="form-hint">Enter the traffic source link for this partner</p>
          </div>

        </div>

        {/* Footer */}
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
