'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { loginUser } from '@/app/actions/auth'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(params.get('error') || '')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginUser({ email, password })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(params.get('next') || '/dashboard')
    router.refresh()
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your AffiliateHub account"
      backLink={{ href: '/register', label: 'Create an account', prefix: "Don't have an account?" }}>
      <form onSubmit={handleLogin} className="space-y-4">
        {error && <div className="alert-error"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        <div>
          <label className="form-label" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} className="form-input form-input-icon" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label mb-0" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input id="password" type={showPass ? 'text' : 'password'} required autoComplete="current-password"
              placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              className="form-input form-input-icon pr-11" />
            <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
