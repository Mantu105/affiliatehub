'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2, X, AlertTriangle, Link2, ChevronDown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { parseEmails } from '@/lib/utils'
import { updateContact, deleteContact } from '@/app/contacts/actions'
import type { Profile, Contact } from '@/types'

interface Props {
  profile: Profile | null
  contact: Contact
  isAdmin: boolean
}

export default function ContactEditForm({ profile, contact, isAdmin }: Props) {
  const router = useRouter()
  const [name, setName]               = useState(contact.name)
  const [emailsRaw, setEmailsRaw]     = useState(contact.emails || '')
  const [telegramId, setTelegramId]   = useState((contact as any).telegram_id || '')
  const [isPartner, setIsPartner]         = useState((contact as any).is_partner || false)
  const [brand, setBrand]                 = useState((contact as any).brand || '')
  const [trafficSource, setTrafficSource] = useState((contact as any).traffic_source || '')

  const BRANDS = ['Melbet', 'Mostbet', 'Bet on game', 'Betmaan']
  const [error, setError]             = useState('')
  const [saved, setSaved]             = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [savePending, startSave]      = useTransition()
  const [delPending,  startDel]       = useTransition()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emailList = parseEmails(emailsRaw)
    startSave(async () => {
      const res = await updateContact(contact.id, {
        name:           name.trim(),
        emails:         emailList.join(', '),
        telegram_id:    telegramId.trim() || null,
        is_partner:     isPartner,
        brand:          isPartner ? brand || null : null,
        traffic_source: isPartner ? trafficSource.trim() || null : null,
      })
      if (res.error) { setError(res.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const handleDelete = () => {
    startDel(async () => {
      await deleteContact(contact.id)
      router.push('/contacts')
    })
  }

  return (
    <AppShell profile={profile} isAdmin={isAdmin}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1>
              <p className="text-slate-500 text-sm">Edit affiliate details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
              <Trash2 className="w-4 h-4" />Delete
            </button>
          </div>
        </div>

        {saved  && <div className="alert-success mb-4"><CheckCircle2 className="w-4 h-4" />Saved successfully!</div>}
        {error  && <div className="alert-error mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}

        {/* Delete modal */}
        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => !delPending && setShowDelete(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <button onClick={() => setShowDelete(false)} disabled={delPending} className="absolute top-4 right-4 btn-icon text-slate-400">
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 text-center mb-1">Delete Affiliate</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{contact.name}"</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)} disabled={delPending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={delPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {delPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="card p-6 space-y-4">
            <div>
              <label className="form-label">Contact Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Email Addresses</label>
              <textarea value={emailsRaw} onChange={e => setEmailsRaw(e.target.value)} rows={3} className="form-textarea" />
              <p className="form-hint">Comma-separated — {parseEmails(emailsRaw).length} valid email(s)</p>
            </div>
            <div>
              <label className="form-label">Telegram ID</label>
              <input type="text" placeholder="@username or numeric ID" value={telegramId}
                onChange={e => setTelegramId(e.target.value)} className="form-input" />
            </div>

            {/* Is Partner */}
            <div>
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPartner}
                  onChange={e => { setIsPartner(e.target.checked); if (!e.target.checked) { setBrand(''); setTrafficSource('') } }}
                  className="w-4 h-4 rounded border-slate-300 accent-brand-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">Already Partner?</span>
                {isPartner && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Partner</span>}
              </label>
            </div>

            {/* Brand + Traffic Source — only when isPartner */}
            {isPartner && (
              <>
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
              </>
            )}
          </div>

          <button type="submit" disabled={savePending} className="btn-primary w-full">
            {savePending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </form>

      </div>
    </AppShell>
  )
}
