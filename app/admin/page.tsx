import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import RoleSelector from '@/components/RoleSelector'
import ManageAccessButton from '@/components/ManageAccessButton'
import { ApprovalButtons } from '@/components/ApprovalButtons'
import { Users, ShieldCheck, UserCheck, Clock, ChevronLeft, ChevronRight, UserPlus, KeyRound } from 'lucide-react'
import { formatDate, formatDateTime, truncate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  approveUser, rejectUser,
  approvePasswordReset, rejectPasswordReset,
} from '@/app/admin/actions'

export const metadata: Metadata = { title: 'Admin Panel' }

const C_PAGE = 5   // contacts per page
const U_PAGE = 5   // users per page

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { cPage?: string; uPage?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase.rpc('get_my_role')
  if (!role || role !== 'admin') redirect('/dashboard')

  const adminDb = createAdminSupabaseClient()

  const { data: profileRaw } = await adminDb.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileRaw
    ? { ...profileRaw, email: profileRaw.email ?? user.email }
    : { id: user.id, email: user.email, full_name: null, role: 'admin' }

  // Pagination state — contacts
  const cPage = Math.max(1, parseInt(searchParams.cPage || '1'))
  const cFrom = (cPage - 1) * C_PAGE;  const cTo = cFrom + C_PAGE - 1

  // Pagination state — users
  const uPage = Math.max(1, parseInt(searchParams.uPage || '1'))

  const [
    { data: allProfiles, count: userCount },
    { data: allContacts, count: contactCount },
    { data: allAccess },
  ] = await Promise.all([
    adminDb.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    adminDb.from('contacts')
      .select('*, profiles(full_name,email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(cFrom, cTo),
    adminDb.from('user_access').select('user_id, can_view_user_id'),
  ])

  const [{ data: pendingUsers }, { data: pendingResets }] = await Promise.all([
    adminDb.from('profiles').select('*').eq('status', 'pending').order('created_at'),
    adminDb.from('pending_password_resets').select('*').eq('status', 'pending').order('requested_at'),
  ])

  const adminCount  = allProfiles?.filter(p => p.role === 'admin').length || 0
  const cTotalPages = Math.ceil((contactCount || 0) / C_PAGE)
  const uTotalPages = Math.ceil((userCount    || 0) / U_PAGE)

  const uFrom = (uPage - 1) * U_PAGE
  const paginatedProfiles = allProfiles?.slice(uFrom, uFrom + U_PAGE) || []

  const contactUrl = (p: number) => `/admin?uPage=${uPage}&cPage=${p}`
  const userUrl    = (p: number) => `/admin?uPage=${p}&cPage=${cPage}`

  // Build access lookup
  const accessMap: Record<string, { can_view_user_id: string; can_view_name: string }[]> = {}
  allAccess?.forEach(entry => {
    if (!accessMap[entry.user_id]) accessMap[entry.user_id] = []
    const targetProfile = allProfiles?.find(p => p.id === entry.can_view_user_id)
    accessMap[entry.user_id].push({
      can_view_user_id: entry.can_view_user_id,
      can_view_name: targetProfile?.full_name || targetProfile?.email || entry.can_view_user_id,
    })
  })

  const allUserOptions = (allProfiles || []).map(p => ({
    id: p.id, name: p.full_name || '', email: p.email || '',
  }))

  // Reusable pagination component (rendered inline as JSX)
  const Pagination = ({
    page, totalPages, buildUrl, label,
  }: {
    page: number; totalPages: number; buildUrl: (p: number) => string; label: string
  }) => {
    if (totalPages <= 1) return null
    const delta = 2
    const pages: number[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i)

    return (
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/60">
        <p className="text-xs text-slate-500">
          Page <span className="font-medium text-slate-700">{page}</span> of{' '}
          <span className="font-medium text-slate-700">{totalPages}</span>
          <span className="ml-1 text-slate-400">· {label}</span>
        </p>
        <div className="flex items-center gap-1">
          {/* Prev */}
          {page > 1 ? (
            <Link href={buildUrl(page - 1)}
              className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />Prev
            </Link>
          ) : (
            <span className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-slate-300 border border-slate-100 cursor-not-allowed select-none">
              <ChevronLeft className="w-3.5 h-3.5" />Prev
            </span>
          )}

          {/* First + ellipsis */}
          {pages[0] > 1 && (
            <>
              <Link href={buildUrl(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium
                  text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">1</Link>
              {pages[0] > 2 && <span className="w-6 text-center text-slate-400 text-xs">…</span>}
            </>
          )}

          {/* Page numbers */}
          {pages.map(p => (
            <Link key={p} href={buildUrl(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-brand-600 text-white border border-brand-600 shadow-sm'
                  : 'text-slate-600 border border-slate-200 bg-white hover:bg-slate-50'
              }`}>
              {p}
            </Link>
          ))}

          {/* Last + ellipsis */}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && (
                <span className="w-6 text-center text-slate-400 text-xs">…</span>
              )}
              <Link href={buildUrl(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium
                  text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                {totalPages}
              </Link>
            </>
          )}

          {/* Next */}
          {page < totalPages ? (
            <Link href={buildUrl(page + 1)}
              className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              Next<ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-slate-300 border border-slate-100 cursor-not-allowed select-none">
              Next<ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <AppShell profile={profile} isAdmin={true}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <span className="badge-admin"><ShieldCheck className="w-3 h-3" />Admin</span>
        </div>
        <p className="text-slate-500 text-sm">Full system overview — manage users, roles, and data access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',    value: userCount    || 0, icon: Users,       color: 'text-brand-600',   bg: 'bg-brand-50'   },
          { label: 'Admin Users',    value: adminCount,         icon: ShieldCheck, color: 'text-violet-600',  bg: 'bg-violet-50'  },
          { label: 'Total Affiliates', value: contactCount || 0, icon: UserCheck,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">

        {/* Pending User Approvals */}
        {(pendingUsers?.length ?? 0) > 0 && (
          <div className="card border-amber-200">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  Pending Account Approvals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">New users waiting for your approval to access the system</p>
              </div>
              <span className="badge-amber"><Clock className="w-3 h-3" />{pendingUsers?.length} pending</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Requested</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody>
                  {pendingUsers?.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(p.full_name || p.email || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{p.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="text-slate-600 text-sm">{p.email}</td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td>
                        <div className="flex justify-end">
                          <ApprovalButtons id={p.id} onApprove={approveUser} onReject={rejectUser} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Password Resets */}
        {(pendingResets?.length ?? 0) > 0 && (
          <div className="card border-blue-200">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-500" />
                  Pending Password Changes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Users requesting a password change — approve to apply the new password</p>
              </div>
              <span className="badge-blue"><Clock className="w-3 h-3" />{pendingResets?.length} pending</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Email</th><th>Requested</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody>
                  {pendingResets?.map(r => (
                    <tr key={r.id}>
                      <td className="font-medium text-slate-800">{r.email}</td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(r.requested_at)}</td>
                      <td>
                        <div className="flex justify-end">
                          <ApprovalButtons id={r.id} onApprove={approvePasswordReset} onReject={rejectPasswordReset} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800 text-sm">User Management ({userCount})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Change roles and control which users' data each person can access</p>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Role</th><th>Data Access</th><th>Joined</th>
                  <th className="text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProfiles.map(p => {
                  const currentAccess = accessMap[p.id] || []
                  const isSelf = p.id === user.id
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(p.full_name || p.email || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{p.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="text-slate-600 text-sm">{p.email}</td>
                      <td><RoleSelector userId={p.id} currentRole={p.role || 'user'} isSelf={isSelf} /></td>
                      <td>
                        {p.role === 'admin' ? (
                          <span className="text-xs text-slate-400 italic">All data</span>
                        ) : currentAccess.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Own only</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {currentAccess.map(a => (
                              <span key={a.can_view_user_id} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                <UserCheck className="w-3 h-3" />{a.can_view_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td>
                        <div className="flex justify-end">
                          <ManageAccessButton
                            userId={p.id}
                            userName={p.full_name || p.email || '?'}
                            userRole={p.role || 'user'}
                            allUsers={allUserOptions}
                            currentAccess={currentAccess}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={uPage} totalPages={uTotalPages} buildUrl={userUrl} label={`${userCount} users`} />
        </div>

        {/* Recent Affiliates */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800 text-sm">
              Recent Affiliates ({contactCount})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {cFrom + 1}–{Math.min(cTo + 1, contactCount || 0)} of {contactCount}
            </p>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Emails</th><th>Telegram</th><th>Owner</th><th>Added</th></tr>
              </thead>
              <tbody>
                {allContacts?.map(c => (
                  <tr key={c.id}>
                    <td className="text-xs text-slate-500">{truncate(c.emails || '—', 40)}</td>
                    <td className="text-xs text-slate-500">{c.telegram_id || '—'}</td>
                    <td className="text-xs text-slate-500">{(c as any).profiles?.full_name || (c as any).profiles?.email || '—'}</td>
                    <td className="text-xs text-slate-400 whitespace-nowrap">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={cPage} totalPages={cTotalPages} buildUrl={contactUrl} label={`${contactCount} affiliates`} />
        </div>


      </div>
    </AppShell>
  )
}
