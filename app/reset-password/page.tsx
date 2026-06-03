'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'

function strength(p: string) {
  let s = 0
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
  return { score: s, label: ['','Weak','Fair','Good','Strong'][s]||'', color: ['','bg-red-400','bg-amber-400','bg-brand-400','bg-emerald-500'][s]||'', text: ['','text-red-500','text-amber-500','text-brand-500','text-emerald-600'][s]||'' }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showP, setShowP]       = useState(false)
  const [showC, setShowC]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { /* session ready */ }
    })
  }, [])

  const pw = strength(password)
  const reqs = [
    { check: password.length >= 8,          label: 'At least 8 characters' },
    { check: /[A-Z]/.test(password),         label: 'One uppercase letter' },
    { check: /[0-9]/.test(password),         label: 'One number' },
    { check: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ]

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (success) return (
    <AuthLayout title="Password updated!" subtitle="You can now sign in with your new password">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-slate-600 text-sm">Redirecting you to sign in…</p>
        <Link href="/login" className="btn-primary w-full block text-center">Sign in now</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password"
      backLink={{ href: '/login', label: 'Back to sign in' }}>
      <form onSubmit={handleReset} className="space-y-4">
        {error && <div className="alert-error"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div>
          <label className="form-label">New password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type={showP ? 'text' : 'password'} required autoComplete="new-password" placeholder="Min. 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} className="form-input form-input-icon pr-11" />
            <button type="button" onClick={() => setShowP(!showP)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className={`strength-bar flex-1 ${i <= pw.score ? pw.color : 'bg-slate-200'}`} />)}</div>
              <p className={`text-xs font-medium ${pw.text}`}>Strength: {pw.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="form-label">Confirm new password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type={showC ? 'text' : 'password'} required autoComplete="new-password" placeholder="Re-enter new password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className={`form-input form-input-icon pr-11 ${confirm && confirm !== password ? 'border-red-300' : ''}`} />
            <button type="button" onClick={() => setShowC(!showC)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm && confirm !== password && <p className="form-error-msg">Passwords do not match</p>}
        </div>
        <ul className="space-y-1.5 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
          {reqs.map(({ check, label }) => (
            <li key={label} className={`flex items-center gap-2 ${check ? 'text-emerald-600' : ''}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${check ? 'text-emerald-500' : 'text-slate-300'}`} /> {label}
            </li>
          ))}
        </ul>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
