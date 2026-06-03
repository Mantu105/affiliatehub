'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  if (sent) return (
    <AuthLayout title="Reset link sent" subtitle="Check your email"
      backLink={{ href: '/login', label: 'Back to sign in' }}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-600" />
        </div>
        <p className="text-slate-700 font-medium">Reset link sent to:</p>
        <p className="text-brand-600 font-bold">{email}</p>
        <p className="text-slate-500 text-sm">The link expires in 1 hour. Check spam if you don't see it.</p>
        <button onClick={() => { setSent(false); setEmail('') }} className="btn-secondary w-full">Try different email</button>
        <Link href="/login" className="btn-primary w-full block text-center">Back to sign in</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll send you a reset link"
      backLink={{ href: '/login', label: 'Back to sign in' }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert-error"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div>
          <label className="form-label" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} className="form-input form-input-icon" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send reset link'}
        </button>
        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </form>
    </AuthLayout>
  )
}
