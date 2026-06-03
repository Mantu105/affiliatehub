'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Mail, FileText, ShieldCheck, X, Zap, Settings, LayoutTemplate } from 'lucide-react'

interface Props {
  isAdmin?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/contacts',     label: 'Contacts',     icon: Users },
  { href: '/emails/send',  label: 'Send Email',   icon: Mail },
  { href: '/emails/logs',  label: 'Email Logs',   icon: FileText },
  { href: '/settings/smtp', label: 'SMTP Settings', icon: Settings },
]

export default function Sidebar({ isAdmin = false, onClose }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="flex flex-col w-64 h-full bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">AffiliateHub</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-icon lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive(href)
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-slate-100" />
            {[
              { href: '/admin',            label: 'Admin Panel',       icon: ShieldCheck },
              { href: '/admin/templates',  label: 'Email Templates',   icon: LayoutTemplate },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(href)
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
