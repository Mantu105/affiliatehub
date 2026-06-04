'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { getMyProfile } from '@/app/actions/profile'
import type { Profile } from '@/types'
import {
  FileText, Plus, Save, Loader2, AlertCircle, CheckCircle2,
  Pencil, Trash2, ArrowLeft, X, Eye,
} from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'

type Template = {
  id: string
  title: string
  subject: string
  body: string
  created_at: string
}

type FormData = { title: string; subject: string; body: string }
const EMPTY: FormData = { title: '', subject: '', body: '' }

export default function AdminTemplatesPage() {
  const router = useRouter()
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [templates, setTemplates]   = useState<Template[]>([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState<'list' | 'form' | 'preview'>('list')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<Template | null>(null)
  const [form, setForm]             = useState<FormData>(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [msg, setMsg]               = useState<{ ok: boolean; text: string } | null>(null)

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/templates')
    const { templates: data } = await res.json()
    setTemplates(data || [])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      getMyProfile().then(async prof => {
        if ((prof as any)?.role !== 'admin') { router.push('/dashboard'); return }
        setProfile(prof as Profile | null)
        await loadTemplates()
        setLoading(false)
      })
    })
  }, [router, loadTemplates])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const openAdd = () => {
    setEditingId(null); setForm(EMPTY); setMsg(null); setView('form')
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id)
    setForm({ title: t.title, subject: t.subject, body: t.body })
    setMsg(null); setView('form')
  }

  const openPreview = (t: Template) => { setPreviewing(t); setView('preview') }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMsg(null)

    const url    = editingId ? `/api/templates/${editingId}` : '/api/templates'
    const method = editingId ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setMsg({ ok: false, text: data.error }); setSaving(false); return }

    await loadTemplates()
    setMsg({ ok: true, text: editingId ? 'Template updated!' : 'Template created!' })
    setSaving(false)
    setTimeout(() => { setView('list'); setMsg(null) }, 1000)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    await loadTemplates()
    setDeleting(null); setDeleteConfirm(null)
  }

  if (loading) return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    </AppShell>
  )

  // ── Preview ──────────────────────────────────────────────
  if (view === 'preview' && previewing) return (
    <AppShell profile={profile}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="btn-icon shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{previewing.title}</h1>
            <p className="text-slate-500 text-xs">Template preview</p>
          </div>
        </div>
        <div className="card p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Subject</p>
            <p className="text-slate-800 font-medium">{previewing.subject}</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Body</p>
            <div
              className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewing.body }}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => openEdit(previewing)} className="btn-secondary text-sm">
            <Pencil className="w-4 h-4" />Edit Template
          </button>
        </div>
      </div>
    </AppShell>
  )

  // ── Form ─────────────────────────────────────────────────
  if (view === 'form') return (
    <AppShell profile={profile}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="btn-icon shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {editingId ? 'Edit Template' : 'New Template'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              {editingId ? 'Update the template content' : 'Create a reusable email template'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="card p-4 sm:p-6 space-y-4">
            <div>
              <label className="form-label">Template Name <span className="text-red-400">*</span></label>
              <input required type="text" placeholder="e.g. Welcome Email, Partnership Offer"
                value={form.title} onChange={set('title')} className="form-input text-sm" />
              <p className="form-hint">Shown in the template dropdown when composing emails</p>
            </div>
            <div>
              <label className="form-label">Subject Line <span className="text-red-400">*</span></label>
              <input required type="text" placeholder="e.g. Exciting Partnership Opportunity"
                value={form.subject} onChange={set('subject')} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Email Body <span className="text-red-400">*</span></label>
              <RichTextEditor
                value={form.body}
                onChange={html => setForm(f => ({ ...f, body: html }))}
                minHeight={280}
              />
              <p className="form-hint">{form.body.replace(/<[^>]+>/g, '').length} characters</p>
            </div>
          </div>

          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}>
              {msg.ok
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                : <AlertCircle  className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
              {msg.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <button type="button" onClick={() => setView('list')} className="btn-secondary flex-1 justify-center text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : <><Save className="w-4 h-4" />{editingId ? 'Update' : 'Create'} Template</>}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )

  // ── List ─────────────────────────────────────────────────
  return (
    <AppShell profile={profile}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Email Templates</h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                {templates.length} template{templates.length !== 1 ? 's' : ''} · Admin only
              </p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Template</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Empty */}
        {templates.length === 0 ? (
          <div className="card p-10 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">No templates yet</h2>
            <p className="text-sm text-slate-400 mb-5">
              Create templates so users can quickly compose emails with pre-filled subject and body.
            </p>
            <button onClick={openAdd} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" />Create First Template
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Template Name
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Subject
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Body Preview
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-900">{t.title}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <span className="text-slate-600 truncate block">{t.subject}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[240px]">
                        <span className="text-slate-400 text-xs truncate block">
                          {t.body.slice(0, 80)}{t.body.length > 80 ? '…' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openPreview(t)} title="Preview"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(t)} title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === t.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                              <span className="text-xs text-red-700 whitespace-nowrap">Delete?</span>
                              <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">
                                {deleting === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(t.id)} title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {templates.map(t => (
                <div key={t.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{t.subject}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t.body.slice(0, 60)}{t.body.length > 60 ? '…' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => openPreview(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                      <Eye className="w-3 h-3" />Preview
                    </button>
                    <button onClick={() => openEdit(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    {deleteConfirm === t.id ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white disabled:opacity-50">
                          Yes
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" />Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
