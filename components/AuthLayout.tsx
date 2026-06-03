'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Props {
  children: React.ReactNode
  title: string
  subtitle: string
  backLink?: { href: string; label: string; prefix?: string }
}

export default function AuthLayout({ children, title, subtitle, backLink }: Props) {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">AffiliateHub</span>
          </Link>
        </div>
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
        {backLink && (
          <p className="text-center text-sm text-slate-500 mt-5">
            {backLink.prefix && <span>{backLink.prefix} </span>}
            <Link href={backLink.href} className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              {backLink.label}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
