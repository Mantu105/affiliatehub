'use client'
import { useState, useTransition } from 'react'
import { ShieldCheck, Briefcase, User, ChevronDown, Loader2 } from 'lucide-react'
import { updateUserRole } from '@/app/admin/actions'
import type { AppRole } from '@/lib/roles'

const ROLES: { value: AppRole; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'admin',   label: 'Admin',   icon: ShieldCheck, color: 'text-violet-700', bg: 'bg-violet-50' },
  { value: 'manager', label: 'Manager', icon: Briefcase,   color: 'text-blue-700',   bg: 'bg-blue-50'   },
  { value: 'user',    label: 'User',    icon: User,        color: 'text-slate-700',  bg: 'bg-slate-100' },
]

export default function RoleSelector({ userId, currentRole, isSelf }: {
  userId: string
  currentRole: string
  isSelf: boolean
}) {
  const [role, setRole] = useState(currentRole as AppRole)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const current = ROLES.find(r => r.value === role) || ROLES[2]

  if (isSelf) {
    const Icon = current.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${current.bg} ${current.color}`}>
        <Icon className="w-3 h-3" />{current.label} (you)
      </span>
    )
  }

  const handleChange = (newRole: AppRole) => {
    if (newRole === role) { setOpen(false); return }
    setOpen(false)
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole)
      if (!res.error) setRole(newRole)
    })
  }

  const Icon = current.icon

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${current.bg} ${current.color} border-transparent hover:border-slate-200`}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
            {ROLES.map(r => {
              const RIcon = r.icon
              return (
                <button
                  key={r.value}
                  onClick={() => handleChange(r.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-slate-50 ${
                    r.value === role ? `font-semibold ${r.color}` : 'text-slate-600'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${r.bg}`}>
                    <RIcon className={`w-3.5 h-3.5 ${r.color}`} />
                  </span>
                  <div className="text-left">
                    <p className="font-medium leading-tight">{r.label}</p>
                    <p className="text-slate-400 text-[10px] leading-tight">
                      {r.value === 'admin' ? 'Full access' : r.value === 'manager' ? 'Read all' : 'Own only'}
                    </p>
                  </div>
                  {r.value === role && <span className="ml-auto text-brand-600 text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
