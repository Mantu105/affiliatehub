'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, Clock } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { registerUser } from '@/app/actions/auth'

function strength(p: string) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-brand-400', 'bg-emerald-500']
  const text   = ['', 'text-red-500', 'text-amber-500', 'text-brand-500', 'text-emerald-600']
  return { score: s, label: labels[s] || '', color: colors[s] || '', text: text[s] || '' }
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showP, setShowP]       = useState(false)
  const [showC, setShowC]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const pw = strength(password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const result = await registerUser({ email, password, fullName })
    if (result.error) { setError(result.error); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  if (success) return (
    <AuthLayout title="Request submitted" subtitle="Awaiting admin approval"
      backLink={{ href: '/login', label: 'Back to sign in' }}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <p className="text-slate-700 font-medium">Your account has been created for:</p>
        <p className="text-brand-600 font-bold">{email}</p>
        <p className="text-slate-500 text-sm">
          An admin will review and approve your account. You will be able to log in once approved.
        </p>
        <Link href="/login" className="btn-primary w-full block text-center mt-4">Back to sign in</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout title="Create your account" subtitle="Start managing your affiliate network"
      backLink={{ href: '/login', label: 'Sign in instead', prefix: 'Already have an account?' }}>
      <form onSubmit={handleRegister} className="space-y-4">
        {error && <div className="alert-error"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div>
          <label className="form-label" htmlFor="name">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="name" type="text" required autoComplete="name" placeholder="John Doe"
              value={fullName} onChange={e => setFullName(e.target.value)} className="form-input form-input-icon" />
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} className="form-input form-input-icon" />
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="password" type={showP ? 'text' : 'password'} required autoComplete="new-password"
              placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)}
              className="form-input form-input-icon pr-11" />
            <button type="button" onClick={() => setShowP(!showP)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => <div key={i} className={`strength-bar flex-1 ${i <= pw.score ? pw.color : 'bg-slate-200'}`} />)}
              </div>
              <p className={`text-xs font-medium ${pw.text}`}>Strength: {pw.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="form-label" htmlFor="confirm">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="confirm" type={showC ? 'text' : 'password'} required autoComplete="new-password"
              placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className={`form-input form-input-icon pr-11 ${confirm && confirm !== password ? 'border-red-300 focus:ring-red-400' : ''}`} />
            <button type="button" onClick={() => setShowC(!showC)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm && confirm !== password && <p className="form-error-msg">Passwords do not match</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
