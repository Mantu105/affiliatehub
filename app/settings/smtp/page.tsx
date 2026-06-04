'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import { getMyProfile } from '@/app/actions/profile'
import type { Profile } from '@/types'
import {
  Server, Plus, Save, Loader2, AlertCircle, CheckCircle2, Wifi,
  Eye, EyeOff, Info, Pencil, Trash2, Zap, ArrowLeft, X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────
type SmtpConfig = {
  id: string
  name: string
  host: string
  port: number
  secure: boolean
  username: string
  from_email: string
  from_name: string
  is_active: boolean
}

type FormData = {
  name: string
  host: string
  port: string
  secure: boolean
  username: string
  password: string
  from_email: string
  from_name: string
}

const DEFAULT_FORM: FormData = {
  name: '', host: 'smtp.gmail.com', port: '587', secure: false,
  username: '', password: '', from_email: '', from_name: '',
}

// ─── Main Page ────────────────────────────────────────────────
export default function SmtpSettingsPage() {
  const router = useRouter()
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [configs, setConfigs]       = useState<SmtpConfig[]>([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState<'list' | 'form'>('list')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState<FormData>(DEFAULT_FORM)
  const [showPass, setShowPass]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [testing, setTesting]       = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [saveMsg, setSaveMsg]       = useState<{ ok: boolean; text: string } | null>(null)
  const [testMsg, setTestMsg]       = useState<{ ok: boolean; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadConfigs = useCallback(async () => {
    const res = await fetch('/api/smtp-settings')
    const { configs: data } = await res.json()
    setConfigs(data || [])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      getMyProfile().then(prof => {
        setProfile(prof as Profile | null)
        loadConfigs().then(() => setLoading(false))
      })
    })
  }, [router, loadConfigs])

  // ── Form helpers ──────────────────────────────────────────
  const setField = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const openAdd = () => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setSaveMsg(null); setTestMsg(null); setShowPass(false)
    setView('form')
  }

  const openEdit = (c: SmtpConfig) => {
    setEditingId(c.id)
    setForm({
      name: c.name, host: c.host, port: String(c.port),
      secure: c.secure, username: c.username, password: '',
      from_email: c.from_email, from_name: c.from_name,
    })
    setSaveMsg(null); setTestMsg(null); setShowPass(false)
    setView('form')
  }

  const cancelForm = () => { setView('list'); setSaveMsg(null); setTestMsg(null) }

  // ── Actions ───────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSaveMsg(null)

    const url    = editingId ? `/api/smtp-settings/${editingId}` : '/api/smtp-settings'
    const method = editingId ? 'PUT' : 'POST'

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, name: form.from_email || form.username || 'Gmail', from_name: '', port: parseInt(form.port) }),
    })
    const data = await res.json()

    if (!res.ok) {
      setSaveMsg({ ok: false, text: data.error })
      setSaving(false)
      return
    }

    await loadConfigs()
    setSaveMsg({ ok: true, text: editingId ? 'Settings updated!' : 'SMTP account added!' })
    setSaving(false)
    // Go back to list after short delay
    setTimeout(() => { setView('list'); setSaveMsg(null) }, 1200)
  }

  const handleTest = async () => {
    setTesting(true); setTestMsg(null)
    const res  = await fetch('/api/smtp-settings/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, port: parseInt(form.port) }),
    })
    const data = await res.json()
    setTestMsg(res.ok ? { ok: true, text: data.message } : { ok: false, text: data.error })
    setTesting(false)
  }

  const handleActivate = async (id: string) => {
    setActivating(id)
    await fetch(`/api/smtp-settings/${id}/activate`, { method: 'POST' })
    await loadConfigs()
    setActivating(null)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/smtp-settings/${id}`, { method: 'DELETE' })
    await loadConfigs()
    setDeleting(null)
    setDeleteConfirm(null)
  }

  // ─── Loading ──────────────────────────────────────────────
  if (loading) return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    </AppShell>
  )

  // ─── Form View ────────────────────────────────────────────
  if (view === 'form') return (
    <AppShell profile={profile}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={cancelForm} className="btn-icon shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {editingId ? 'Edit SMTP Account' : 'Add SMTP Account'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">Configure an email sender</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-5 text-sm text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <p>
            For Gmail, use an <strong>App Password</strong> — generate one at{' '}
            <strong>Google Account → Security → App Passwords</strong>.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Server */}
          <div className="card p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Server</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="form-label">SMTP Host <span className="text-red-400">*</span></label>
                <input required type="text" placeholder="smtp.gmail.com"
                  value={form.host} onChange={setField('host')} className="form-input text-sm" />
              </div>
              <div>
                <label className="form-label">Port <span className="text-red-400">*</span></label>
                <input required type="number" placeholder="587"
                  value={form.port} onChange={setField('port')} className="form-input text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.secure}
                  onChange={e => setForm(f => ({ ...f, secure: e.target.checked }))} className="sr-only peer" />
                <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
              </label>
              <div>
                <span className="text-sm font-medium text-slate-700">SSL/TLS (port 465)</span>
                <p className="text-xs text-slate-400">Leave off for STARTTLS on port 587</p>
              </div>
            </div>
          </div>

          {/* Auth */}
          <div className="card p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Authentication</h2>
            <div>
              <label className="form-label">Username / Email <span className="text-red-400">*</span></label>
              <input required type="email" placeholder="you@gmail.com"
                value={form.username} onChange={setField('username')} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">
                Password / App Password
                {!editingId && <span className="text-red-400"> *</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={editingId ? 'Leave blank to keep existing password' : '••••••••••••••••'}
                  required={!editingId}
                  value={form.password} onChange={setField('password')}
                  className="form-input text-sm pr-10" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sender */}
          <div className="card p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Sender Identity</h2>
            <div>
              <label className="form-label">From Email <span className="text-red-400">*</span></label>
              <input required type="email" placeholder="you@gmail.com"
                value={form.from_email} onChange={setField('from_email')} className="form-input text-sm" />
              <p className="form-hint">Must match your SMTP account or an alias it allows</p>
            </div>
          </div>

          {/* Messages */}
          {saveMsg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              saveMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}>
              {saveMsg.ok
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
              {saveMsg.text}
            </div>
          )}
          {testMsg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              testMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}>
              {testMsg.ok
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
              {testMsg.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <button type="button" onClick={handleTest} disabled={testing || saving}
              className="btn-secondary flex-1 justify-center text-sm disabled:opacity-50">
              {testing
                ? <><Loader2 className="w-4 h-4 animate-spin" />Testing…</>
                : <><Wifi className="w-4 h-4" />Test Connection</>}
            </button>
            <button type="submit" disabled={saving || testing}
              className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : <><Save className="w-4 h-4" />{editingId ? 'Update' : 'Save'} Account</>}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )

  // ─── List View ────────────────────────────────────────────
  return (
    <AppShell profile={profile}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">SMTP Accounts</h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                {configs.length} account{configs.length !== 1 ? 's' : ''} configured
              </p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Account</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Empty state */}
        {configs.length === 0 ? (
          <div className="card p-10 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Server className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">No SMTP accounts yet</h2>
            <p className="text-sm text-slate-400 mb-5">
              Add a Gmail, Outlook, Zoho, or any SMTP account to start sending emails.
            </p>
            <button onClick={openAdd} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" />Add Your First Account
            </button>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="card overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Account Name
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      From Email
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      SMTP Server
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {configs.map(cfg => (
                    <tr key={cfg.id} className={`group hover:bg-slate-50 transition-colors ${
                      cfg.is_active ? 'bg-emerald-50/40' : ''
                    }`}>
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-900">{cfg.name}</span>
                        {cfg.from_name && (
                          <p className="text-xs text-slate-400 mt-0.5">{cfg.from_name}</p>
                        )}
                      </td>

                      {/* From Email */}
                      <td className="px-5 py-3.5">
                        <span className="text-slate-700">{cfg.from_email}</span>
                      </td>

                      {/* SMTP Server */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {cfg.host}:{cfg.port}
                        </span>
                        {cfg.secure && (
                          <span className="ml-1.5 text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                            SSL
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {cfg.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {!cfg.is_active && (
                            <button
                              onClick={() => handleActivate(cfg.id)}
                              disabled={activating === cfg.id}
                              title="Set as active"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                                bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-50">
                              {activating === cfg.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Zap className="w-3 h-3" />}
                              Set Active
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(cfg)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === cfg.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                              <span className="text-xs text-red-700 whitespace-nowrap">Delete?</span>
                              <button
                                onClick={() => handleDelete(cfg.id)}
                                disabled={deleting === cfg.id}
                                className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">
                                {deleting === cfg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(cfg.id)}
                              title="Delete"
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

            {/* ── Mobile cards (shown only on small screens) ── */}
            <div className="space-y-3 sm:hidden">
              {configs.map(cfg => (
                <div key={cfg.id} className={`card p-4 ${cfg.is_active ? 'ring-2 ring-brand-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{cfg.name}</span>
                        {cfg.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cfg.from_email}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{cfg.host}:{cfg.port}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {!cfg.is_active && (
                      <button onClick={() => handleActivate(cfg.id)} disabled={activating === cfg.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50">
                        {activating === cfg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Set Active
                      </button>
                    )}
                    <button onClick={() => openEdit(cfg)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    {deleteConfirm === cfg.id ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500">Delete?</span>
                        <button onClick={() => handleDelete(cfg.id)} disabled={deleting === cfg.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                          {deleting === cfg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(cfg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" />Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info tip */}
            <div className="flex gap-2.5 mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              The <span className="font-medium text-emerald-700 mx-1">Active</span> account is used when
              sending all emails and follow-ups. Click{' '}
              <strong className="text-slate-600 mx-1">Set Active</strong> to switch between accounts.
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
