'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle2,
  Mail, Send, Pencil, X, AlertTriangle, MessageSquare, Tag, FileText, Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { parseEmails, formatDate } from '@/lib/utils'
import { updateContact, deleteContact } from '@/app/contacts/actions'
import { getMyProfile } from '@/app/actions/profile'
import type { Profile, Contact, UserRole } from '@/types'

export default function ContactDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const startInEditMode = searchParams.get('edit') === '1'

  const [profile, setProfile]       = useState<Profile | null>(null)
  const [contact, setContact]       = useState<Contact | null>(null)
  const [role, setRole]             = useState<UserRole>('user')
  const [loading, setLoading]       = useState(true)
  const [editMode, setEditMode]     = useState(startInEditMode)
  const [emailPage, setEmailPage] = useState(1)
  const EMAIL_PAGE_SIZE = 10

  // edit form state
  const [name, setName]             = useState('')
  const [emailsRaw, setEmailsRaw]   = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [notes, setNotes]           = useState('')
  const [tags, setTags]             = useState('')
  const [error, setError]           = useState('')
  const [saved, setSaved]           = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [savePending, startSave]    = useTransition()
  const [delPending,  startDel]     = useTransition()

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

      const currentRole = (roleData || 'user') as UserRole
      setRole(currentRole)
      setProfile(prof as Profile | null)

      if (!c) { router.push('/contacts'); return }

      const canViewAll = currentRole === 'admin' || currentRole === 'manager'
      if (!canViewAll && c.user_id !== user.id) { router.push('/contacts'); return }

      setContact(c)
      setName(c.name)
      setEmailsRaw(c.emails || '')
      setTelegramId(c.telegram_id || '')
      setNotes(c.notes || '')
      setTags(c.tags || '')

      setLoading(false)
    })()
  }, [id, router])

  if (loading || !contact) return (
    <AppShell profile={profile} isAdmin={role === 'admin'}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    </AppShell>
  )

  const isAdmin  = role === 'admin'
  const canWrite = isAdmin || contact.user_id === (profile?.id ?? '')
  const emailList = parseEmails(contact.emails || '')

  const enterEdit = () => {
    setName(contact.name)
    setEmailsRaw(contact.emails || '')
    setTelegramId(contact.telegram_id || '')
    setNotes(contact.notes || '')
    setTags(contact.tags || '')
    setError('')
    setEditMode(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startSave(async () => {
      const res = await updateContact(contact.id, {
        name:        name.trim(),
        emails:      parseEmails(emailsRaw).join(', '),
        telegram_id: telegramId.trim() || null,
        notes:       notes.trim() || undefined,
        tags:        tags.trim() || undefined,
      })
      if (res.error) { setError(res.error); return }
      // refresh contact state
      setContact(prev => prev ? {
        ...prev,
        name: name.trim(),
        emails: parseEmails(emailsRaw).join(', '),
        telegram_id: telegramId.trim() || null,
        notes: notes.trim() || null,
        tags: tags.trim() || null,
      } : prev)
      setSaved(true)
      setEditMode(false)
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1>
              <p className="text-slate-500 text-sm">
                {editMode ? 'Editing contact' : 'Contact details'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!editMode && emailList.length > 0 && (
              <Link href={`/emails/send?contact=${contact.id}`} className="btn-secondary text-sm">
                <Send className="w-4 h-4" />Send Email
              </Link>
            )}
            {!editMode && canWrite && (
              <button onClick={enterEdit} className="btn-primary text-sm">
                <Pencil className="w-4 h-4" />Edit
              </button>
            )}
            {editMode && (
              <button onClick={() => setEditMode(false)} className="btn-secondary text-sm">
                <X className="w-4 h-4" />Cancel
              </button>
            )}
            {canWrite && (
              <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
                <Trash2 className="w-4 h-4" />Delete
              </button>
            )}
          </div>
        </div>

        {saved && <div className="alert-success mb-4"><CheckCircle2 className="w-4 h-4" />Saved successfully!</div>}
        {error && <div className="alert-error  mb-4"><AlertCircle   className="w-4 h-4" />{error}</div>}

        {/* Delete modal */}
        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => !delPending && setShowDelete(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <button onClick={() => setShowDelete(false)} disabled={delPending}
                className="absolute top-4 right-4 btn-icon text-slate-400 disabled:opacity-40">
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 text-center mb-1">Delete Contact</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-700">"{contact.name}"</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)} disabled={delPending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={delPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {delPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW MODE ── */}
        {!editMode && (
          <div className="space-y-4">

            {/* Hero profile banner */}
            <div className="card overflow-hidden">
              <div className={`h-24 w-full ${emailList.length ? 'bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700' : 'bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700'}`} />
              <div className="px-6 pb-6">
                {/* Avatar overlapping banner */}
                <div className="flex items-end -mt-8 mb-4">
                  <div className={`w-16 h-16 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold ${
                    emailList.length ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-gradient-to-br from-sky-500 to-sky-700'
                  }`}>
                    {contact.name?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900">{contact.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />Added {formatDate(contact.created_at)}
                </p>

                {/* Stats chips */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold">
                    <Mail className="w-3.5 h-3.5" />{emailList.length} email{emailList.length !== 1 ? 's' : ''}
                  </span>
                  {contact.telegram_id && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />Telegram
                    </span>
                  )}
                  {contact.tags && contact.tags.split(',').filter(Boolean).map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                      <Tag className="w-3 h-3" />{t.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Email addresses with pagination */}
            {emailList.length > 0 && (() => {
              const totalPages = Math.ceil(emailList.length / EMAIL_PAGE_SIZE)
              const pageEmails = emailList.slice((emailPage - 1) * EMAIL_PAGE_SIZE, emailPage * EMAIL_PAGE_SIZE)
              const startIdx   = (emailPage - 1) * EMAIL_PAGE_SIZE

              return (
                <div className="card overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-brand-600" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">Email Addresses</span>
                      <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-bold">{emailList.length}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {startIdx + 1}–{Math.min(startIdx + EMAIL_PAGE_SIZE, emailList.length)} of {emailList.length}
                    </span>
                  </div>

                  {/* Email rows */}
                  <div className="divide-y divide-slate-50">
                    {pageEmails.map((em, i) => (
                      <div key={em} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                        <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {startIdx + i + 1}
                        </span>
                        <span className="text-sm text-slate-700 truncate flex-1">{em}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                      <button
                        onClick={() => setEmailPage(p => Math.max(1, p - 1))}
                        disabled={emailPage === 1}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - emailPage) <= 1)
                          .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                            acc.push(p)
                            return acc
                          }, [])
                          .map((p, idx) =>
                            p === '...' ? (
                              <span key={`e${idx}`} className="px-1 text-slate-400 text-xs">…</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => setEmailPage(p as number)}
                                className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${
                                  p === emailPage
                                    ? 'bg-brand-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          )}
                      </div>

                      <button
                        onClick={() => setEmailPage(p => Math.min(totalPages, p + 1))}
                        disabled={emailPage === totalPages}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Telegram */}
            {contact.telegram_id && (
              <div className="card px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Telegram ID</p>
                  <p className="text-sm font-semibold text-sky-700 mt-0.5">{contact.telegram_id}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">Notes</span>
                </div>
                <p className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}

          </div>
        )}

        {/* ── EDIT MODE ── */}
        {editMode && (
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
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary flex-1">
                <X className="w-4 h-4" />Cancel
              </button>
              <button type="submit" disabled={savePending} className="btn-primary flex-1">
                {savePending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
              </button>
            </div>
          </form>
        )}

      </div>
    </AppShell>
  )
}
