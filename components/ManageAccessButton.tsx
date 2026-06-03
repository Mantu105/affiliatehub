'use client'
import { useState, useTransition } from 'react'
import { Settings2, X, Plus, Trash2, Loader2, UserCheck } from 'lucide-react'
import { grantAccess, revokeAccess } from '@/app/admin/actions'

interface UserOption { id: string; name: string; email: string }
interface AccessEntry { can_view_user_id: string; can_view_name: string }

interface Props {
  userId: string
  userName: string
  userRole: string
  allUsers: UserOption[]
  currentAccess: AccessEntry[]
}

export default function ManageAccessButton({ userId, userName, userRole, allUsers, currentAccess }: Props) {
  const [open, setOpen] = useState(false)
  const [access, setAccess] = useState<AccessEntry[]>(currentAccess)
  const [selected, setSelected] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const grantableUsers = allUsers.filter(
    u => u.id !== userId && !access.find(a => a.can_view_user_id === u.id)
  )

  const handleGrant = () => {
    if (!selected) return
    const target = allUsers.find(u => u.id === selected)
    if (!target) return
    setError('')
    startTransition(async () => {
      const res = await grantAccess(userId, selected)
      if (res.error) { setError(res.error); return }
      setAccess(prev => [...prev, { can_view_user_id: selected, can_view_name: target.name || target.email }])
      setSelected('')
    })
  }

  const handleRevoke = (canViewUserId: string) => {
    setError('')
    startTransition(async () => {
      const res = await revokeAccess(userId, canViewUserId)
      if (res.error) { setError(res.error); return }
      setAccess(prev => prev.filter(a => a.can_view_user_id !== canViewUserId))
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-icon"
        title="Manage data access"
      >
        <Settings2 className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 btn-icon text-slate-400">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                {(userName || '?')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{userName}</h3>
                <p className="text-xs text-slate-400">Manage whose contacts this user can see</p>
              </div>
            </div>

            {userRole === 'admin' ? (
              <div className="py-6 text-center text-sm text-slate-500 bg-violet-50 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-violet-400 mx-auto mb-1" />
                Admin users already see all data.
              </div>
            ) : (
              <>
                {/* Current access list */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Can view contacts from</p>
                  {access.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">
                      Own contacts only (default)
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {access.map(a => (
                        <div key={a.can_view_user_id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-medium text-slate-700">{a.can_view_name}</span>
                          </div>
                          <button
                            onClick={() => handleRevoke(a.can_view_user_id)}
                            disabled={pending}
                            className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                          >
                            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grant access */}
                {grantableUsers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Grant access to</p>
                    <div className="flex gap-2">
                      <select
                        value={selected}
                        onChange={e => setSelected(e.target.value)}
                        className="flex-1 form-input text-sm"
                      >
                        <option value="">— Select a user —</option>
                        {grantableUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleGrant}
                        disabled={!selected || pending}
                        className="btn-primary px-3 disabled:opacity-50"
                      >
                        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
