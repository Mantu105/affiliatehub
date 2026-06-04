'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2, X, AlertTriangle } from 'lucide-react'
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
  const [name, setName]           = useState(contact.name)
  const [emailsRaw, setEmailsRaw] = useState(contact.emails || '')
  const [telegramId, setTelegramId] = useState((contact as any).telegram_id || '')
  const [notes, setNotes]         = useState((contact as any).notes || '')
  const [tags, setTags]           = useState((contact as any).tags || '')
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [savePending, startSave]  = useTransition()
  const [delPending,  startDel]   = useTransition()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emailList = parseEmails(emailsRaw)
    startSave(async () => {
      const res = await updateContact(contact.id, {
        name: name.trim(),
        emails: emailList.join(', '),
        telegram_id: telegramId.trim() || null,
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
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
              <p className="text-slate-500 text-sm">Edit contact details</p>
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
              <h3 className="text-base font-semibold text-slate-900 text-center mb-1">Delete Contact</h3>
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
            <div>
              <label className="form-label">Tags</label>
              <input type="text" placeholder="e.g. VIP, India" value={tags}
                onChange={e => setTags(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea placeholder="Additional notes…" value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} className="form-textarea" />
            </div>
          </div>

          <button type="submit" disabled={savePending} className="btn-primary w-full">
            {savePending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </form>


      </div>
    </AppShell>
  )
}
