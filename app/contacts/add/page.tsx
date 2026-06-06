'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
  Mail, MessageSquare, Globe, ChevronDown, Link2,
} from 'lucide-react'

import { createClient } from '@/lib/supabase'
import { getMyProfile } from '@/app/actions/profile'
import AppShell from '@/components/AppShell'
import { parseEmails } from '@/lib/utils'
import { addContact } from '@/app/contacts/actions'
import type { Profile, ContactModel } from '@/types'

const MODELS: ContactModel[] = ['Revshare', 'CPA', 'Hybrid', 'Fixed']
const BRANDS = ['Melbet', 'Mostbet', 'Bet on game', 'Betmaan']

export default function AddContactPage() {
  const router = useRouter()
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [contactType, setContactType] = useState<'email' | 'telegram'>('email')
  const [emailsRaw, setEmailsRaw]     = useState('')
  const [telegramId, setTelegramId]   = useState('')
  const [isPartner, setIsPartner]         = useState(false)
  const [brand, setBrand]                 = useState('')
  const [trafficSource, setTrafficSource] = useState('')
  const [model, setModel]                 = useState<ContactModel | ''>('')
  const [country, setCountry]             = useState('')
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
    if (contactType === 'email'    && emailList.length === 0) { setError('Please enter at least one valid email.'); return }
    if (contactType === 'telegram' && !telegramId.trim())     { setError('Please enter a Telegram ID.'); return }

    const derivedName = contactType === 'email' ? emailList[0] : telegramId.trim()

    setLoading(true)
    const result = await addContact({
      name:           derivedName,
      emails:         contactType === 'email' ? emailList.join(', ') : '',
      telegram_id:    contactType === 'telegram' ? telegramId.trim() : null,
      is_partner:     isPartner,
      model:          model || null,
      country:        country.trim() || null,
      traffic_source: isPartner ? trafficSource.trim() || null : null,
      brand:          isPartner ? brand || null : null,
    })
    if (result.error) { setError(result.error); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => { router.refresh(); router.push('/contacts') }, 1500)
  }

  return (
    <AppShell profile={profile}>
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Add Affiliate</h1>
            <p className="text-slate-500 text-sm">Add a new affiliate</p>
          </div>
        </div>

        {success && <div className="alert-success mb-4"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>Contact added! Redirecting…</span></div>}
        {error   && <div className="alert-error   mb-4"><AlertCircle  className="w-4 h-4 shrink-0" /><span>{error}</span></div>}

        <form onSubmit={handleSubmit}>
          <div className="card divide-y divide-slate-100">

            {/* Row — Contact Type */}
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Contact Type <span className="text-red-500">*</span>
              </p>
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setContactType('email'); setTelegramId('') }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex-1 justify-center ${
                    contactType === 'email'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <Mail className="w-4 h-4 shrink-0" /> Email
                  {contactType === 'email' && <span className="ml-auto text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-full">✓</span>}
                </button>
                <button type="button"
                  onClick={() => { setContactType('telegram'); setEmailsRaw('') }}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex-1 justify-center ${
                    contactType === 'telegram'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <MessageSquare className="w-4 h-4 shrink-0" /> Telegram
                  {contactType === 'telegram' && <span className="ml-auto text-xs bg-sky-600 text-white px-1.5 py-0.5 rounded-full">✓</span>}
                </button>
              </div>
            </div>

            {/* Row — Email / Telegram input (conditional) */}
            {contactType === 'email' && (
              <div className="px-6 py-4">
                <label className="form-label">Email Addresses <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  <textarea
                    placeholder="email1@example.com, email2@example.com"
                    value={emailsRaw}
                    onChange={e => setEmailsRaw(e.target.value)}
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
                          aria-label={`Remove ${em}`}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="form-hint">Separate multiple emails with commas</p>
              </div>
            )}

            {contactType === 'telegram' && (
              <div className="px-6 py-4">
                <label className="form-label">Telegram ID <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="@username1, @username2 or numeric IDs"
                    value={telegramId}
                    onChange={e => setTelegramId(e.target.value)}
                    className="form-input form-input-icon text-sm"
                  />
                </div>
                <p className="form-hint">Separate multiple Telegram IDs with commas</p>
              </div>
            )}

            {/* Row — Model + Country (2 columns) */}
            <div className="px-6 py-4 grid grid-cols-2 gap-5">
              <div>
                <label className="form-label">Commission Model</label>
                <div className="relative">
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value as ContactModel | '')}
                    className="form-input appearance-none pr-10 text-sm"
                  >
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
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="form-input form-input-icon text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row — Is Partner */}
            <div className="px-6 py-4">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPartner}
                  onChange={e => { setIsPartner(e.target.checked); if (!e.target.checked) { setTrafficSource(''); setBrand('') } }}
                  className="w-4 h-4 rounded border-slate-300 accent-brand-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">Already Partner?</span>
                {isPartner && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Partner</span>}
              </label>
            </div>

            {/* Row — Brand + Traffic Source */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="form-label">Brand</label>
                <div className="relative">
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="form-input appearance-none pr-10 text-sm"
                  >
                    <option value="">— Select Brand —</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Traffic Source</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="url"
                    placeholder="https://example.com/traffic-source"
                    value={trafficSource}
                    onChange={e => setTrafficSource(e.target.value)}
                    className="form-input form-input-icon text-sm"
                  />
                </div>
                <p className="form-hint">Enter the traffic source link for this partner</p>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Link href="/contacts" className="btn-secondary flex-1 justify-center">Cancel</Link>
            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : <><Save className="w-4 h-4" />Save Affiliate</>}
            </button>
          </div>
        </form>

      </div>
    </AppShell>
  )
}
