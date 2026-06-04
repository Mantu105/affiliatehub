'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Send, MessageSquare, Loader2, AlertTriangle, X, CheckCircle2, AlertCircle, FileText, ChevronDown } from 'lucide-react'
import { deleteContact } from '@/app/contacts/actions'
import { parseEmails } from '@/lib/utils'
import RichTextEditor from '@/components/RichTextEditor'

interface ContactRow {
  id: string
  name: string
  emails: string
  telegram_id: string | null
  is_partner: boolean
  model: string | null
  country: string | null
  created_at: string
  user_id: string
  profiles?: { full_name?: string; email?: string } | null
}

interface Props {
  contacts: ContactRow[]
  from: number
}

function RadioCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="cursor-pointer inline-flex items-center justify-center" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`w-4 h-4 rounded-full border-2 transition-all ${
        checked
          ? 'border-brand-600 bg-brand-600'
          : 'border-slate-300 bg-white hover:border-brand-400'
      }`} />
    </label>
  )
}

export default function ContactsTable({ contacts, from }: Props) {
  const router      = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, startDelete] = useTransition()

  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id))

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(contacts.map(c => c.id)))
  }

  const handleDelete = () => {
    if (selectedIds.size === 0) return
    startDelete(async () => {
      await Promise.all(Array.from(selectedIds).map(id => deleteContact(id)))
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  // ── Send Email modal state ──
  const [showEmailModal,   setShowEmailModal]   = useState(false)
  const [composeMode,      setComposeMode]      = useState<'manual' | 'template'>('manual')
  const [emailSubject,     setEmailSubject]     = useState('')
  const [emailBody,        setEmailBody]        = useState('')
  const [emailSending,     setEmailSending]     = useState(false)
  const [emailError,       setEmailError]       = useState('')
  const [emailSuccess,     setEmailSuccess]     = useState(false)
  const [templates,        setTemplates]        = useState<{id:string;title:string;subject:string;body:string}[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const [showLimitWarning, setShowLimitWarning] = useState(false)

  const openEmailModal = async () => {
    if (overLimit) { setShowLimitWarning(true); return }
    setShowLimitWarning(false)
    setEmailError(''); setEmailSuccess(false); setComposeMode('manual')
    setShowEmailModal(true)
    if (templates.length === 0) {
      try {
        const res = await fetch('/api/templates')
        const data = await res.json()
        setTemplates(data.templates || [])
      } catch {}
    }
  }

  const closeEmailModal = () => {
    setShowEmailModal(false)
    setEmailSubject(''); setEmailBody(''); setEmailError(''); setEmailSuccess(false)
    setSelectedTemplate(''); setComposeMode('manual')
  }

  const applyTemplate = (id: string) => {
    setSelectedTemplate(id)
    const tpl = templates.find(t => t.id === id)
    if (!tpl) return
    setEmailSubject(tpl.subject)
    // If body has no HTML tags, convert newlines → <br> so the editor shows proper line breaks
    const hasHtml = /<[a-z][\s\S]*>/i.test(tpl.body)
    setEmailBody(hasHtml ? tpl.body : tpl.body.replace(/\n/g, '<br>'))
  }

  const switchMode = (mode: 'manual' | 'template') => {
    setComposeMode(mode)
    if (mode === 'manual') { setSelectedTemplate(''); setEmailSubject(''); setEmailBody('') }
  }

  const handleSendEmail = async () => {
    setEmailError('')
    if (!emailSubject.trim()) { setEmailError('Subject is required.'); return }
    if (!emailBody.trim())    { setEmailError('Message is required.'); return }
    setEmailSending(true)
    try {
      const recipients = selectedWithEmails.flatMap(c => parseEmails(c.emails))
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, htmlBody: emailBody, textBody: emailBody.replace(/<[^>]+>/g, ''), recipients }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailError(data.error || 'Failed to send email'); setEmailSending(false); return }
      setEmailSuccess(true)
      setTimeout(() => { closeEmailModal(); setSelectedIds(new Set()) }, 2000)
    } catch (err: any) { setEmailError(err.message) }
    setEmailSending(false)
  }

  const EMAIL_LIMIT = 30
  const selectedWithEmails = contacts.filter(c => selectedIds.has(c.id) && c.emails?.trim())
  const totalEmailCount = selectedWithEmails.reduce(
    (sum, c) => sum + c.emails.split(',').map(e => e.trim()).filter(Boolean).length, 0
  )
  const overLimit    = totalEmailCount > EMAIL_LIMIT
  const canSendEmail = selectedWithEmails.length > 0

  return (
    <div>
      {/* ── Over-limit warning (only shown after clicking Send Email) ── */}
      {showLimitWarning && overLimit && (
        <div className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <strong>{totalEmailCount} email addresses</strong> selected — limit is <strong>30</strong>. Please deselect some contacts to reduce the total.
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={handleDelete}
          disabled={selectedIds.size === 0 || deleting}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedIds.size > 0
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
        </button>

        {canSendEmail ? (
          <button
            onClick={openEmailModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />Send Email{selectedWithEmails.length > 1 ? ` (${selectedWithEmails.length})` : ''}
          </button>
        ) : (
          <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed opacity-60">
            <Send className="w-4 h-4" />Send Email
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <RadioCheckbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="w-12">SN</th>
                <th>Email</th>
                <th>Telegram</th>
                <th>Country</th>
                <th>Partner</th>
                <th>Model</th>
                <th>Created By</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, idx) => {
                const emailList  = c.emails ? c.emails.split(',').map(e => e.trim()).filter(Boolean) : []
                const isSelected = selectedIds.has(c.id)

                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/contacts/${c.id}`)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-brand-50' : 'hover:bg-slate-50/60'}`}
                  >
                    <td>
                      <RadioCheckbox checked={isSelected} onChange={() => toggleOne(c.id)} />
                    </td>

                    <td className="text-sm text-slate-400 font-medium">{from + idx + 1}</td>

                    <td>
                      {emailList.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-slate-700 truncate max-w-[200px]">{emailList[0]}</span>
                          {emailList.length > 1 && <span className="text-xs text-slate-400">+{emailList.length - 1} more</span>}
                        </div>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    <td>
                      {c.telegram_id
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                            <MessageSquare className="w-3 h-3" />{c.telegram_id}
                          </span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    <td className="text-sm text-slate-600 capitalize">
                      {c.country || <span className="text-slate-300">—</span>}
                    </td>

                    <td>
                      {c.is_partner
                        ? <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Yes</span>
                        : <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">No</span>}
                    </td>

                    <td>
                      {c.model ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.model === 'Revshare' ? 'bg-violet-100 text-violet-700' :
                          c.model === 'CPA'      ? 'bg-blue-100   text-blue-700'   :
                          c.model === 'Hybrid'   ? 'bg-amber-100  text-amber-700'  :
                                                   'bg-slate-100  text-slate-600'
                        }`}>{c.model}</span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>

                    <td className="text-xs text-slate-600 whitespace-nowrap max-w-[140px] truncate">
                      {c.profiles?.full_name || c.profiles?.email || <span className="text-slate-300">—</span>}
                    </td>

                    <td className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Send Email Modal ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeEmailModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Send Email</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  To <span className="font-medium text-slate-700">{selectedWithEmails.flatMap(c => parseEmails(c.emails)).length} recipient(s)</span> across {selectedWithEmails.length} contact(s)
                </p>
              </div>
              <button onClick={closeEmailModal} className="btn-icon text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

              {emailSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />Email sent successfully!
                </div>
              )}
              {emailError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />{emailError}
                </div>
              )}

              {/* Mode toggle: Manual / Use Template */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button type="button" onClick={() => switchMode('manual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    composeMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  Manual
                </button>
                <button type="button" onClick={() => switchMode('template')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    composeMode === 'template' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <FileText className="w-3.5 h-3.5" />Use Template
                </button>
              </div>

              {/* Template selector (only in template mode) */}
              {composeMode === 'template' && (
                <div>
                  <label className="form-label">Select Template</label>
                  <div className="relative">
                    <select value={selectedTemplate} onChange={e => applyTemplate(e.target.value)}
                      className="form-input appearance-none pr-10 text-sm">
                      <option value="">— Choose a template —</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {templates.length === 0 && <p className="form-hint">No templates found.</p>}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="form-label">Subject <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Partnership Opportunity"
                  value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                  className="form-input text-sm" />
              </div>

              {/* Message — Rich Text Editor */}
              <div>
                <label className="form-label">Message <span className="text-red-400">*</span></label>
                <RichTextEditor value={emailBody} onChange={setEmailBody} minHeight={200} />
                <p className="form-hint">{emailBody.replace(/<[^>]+>/g, '').length} characters</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={closeEmailModal} disabled={emailSending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSendEmail} disabled={emailSending || emailSuccess}
                className="flex-1 btn-primary justify-center disabled:opacity-50">
                {emailSending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                  : <><Send className="w-4 h-4" />Send Email</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
