'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Clock, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { requestPasswordReset } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState('')
  const [newPassword, setNew]     = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showP, setShowP]         = useState(false)
  const [showC, setShowC]         = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const result = await requestPasswordReset({ email, newPassword })
    if (result.error) { setError(result.error); setLoading(false); return }
    setSubmitted(true); setLoading(false)
  }

  if (submitted) return (
    <AuthLayout title="Request submitted" subtitle="Awaiting admin approval"
      backLink={{ href: '/login', label: 'Back to sign in' }}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <p className="text-slate-700 font-medium">Password change request received for:</p>
        <p className="text-brand-600 font-bold">{email}</p>
        <p className="text-slate-500 text-sm">
          An admin will review and approve your password change. You can log in with your new password once approved.
        </p>
        <Link href="/login" className="btn-primary w-full block text-center">Back to sign in</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout title="Reset your password" subtitle="Submit a new password for admin approval"
      backLink={{ href: '/login', label: 'Back to sign in' }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert-error"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div>
          <label className="form-label" htmlFor="email">Email address <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} className="form-input form-input-icon" />
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="newPassword">New password <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="newPassword" type={showP ? 'text' : 'password'} required autoComplete="new-password"
              placeholder="Min. 6 characters" value={newPassword} onChange={e => setNew(e.target.value)}
              className="form-input form-input-icon pr-11" />
            <button type="button" onClick={() => setShowP(!showP)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="confirm">Confirm new password <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="confirm" type={showC ? 'text' : 'password'} required autoComplete="new-password"
              placeholder="Re-enter new password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className={`form-input form-input-icon pr-11 ${confirm && confirm !== newPassword ? 'border-red-300 focus:ring-red-400' : ''}`} />
            <button type="button" onClick={() => setShowC(!showC)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm && confirm !== newPassword && <p className="form-error-msg">Passwords do not match</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit for approval'}
        </button>
        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </form>
    </AuthLayout>
  )
}
