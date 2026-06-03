import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import { Mail, Send, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateTime, truncate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Email Logs' }

const PAGE_SIZE = 10

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase.rpc('get_my_role')
  const adminDb2 = createAdminSupabaseClient()
  const { data: profileRaw } = await adminDb2.from('profiles').select('*').eq('id', user.id).single()
  const profile  = profileRaw
    ? { ...profileRaw, email: profileRaw.email ?? user.email }
    : { id: user.id, email: user.email, full_name: null, role: roleData || 'user' }
  const role     = (roleData || 'user') as import('@/lib/roles').AppRole
  const isAdmin  = role === 'admin'
  const viewAll  = role === 'admin' || role === 'manager'

  const statusFilter = searchParams.status
  const page         = Math.max(1, parseInt(searchParams.page || '1'))
  const from         = (page - 1) * PAGE_SIZE
  const to           = from + PAGE_SIZE - 1

  const adminDb = createAdminSupabaseClient()

  // Resolve viewable user IDs for regular users
  let viewableIds: string[] = [user.id]
  if (!viewAll) {
    const { data: accessList } = await adminDb
      .from('user_access')
      .select('can_view_user_id')
      .eq('user_id', user.id)
    viewableIds = [user.id, ...(accessList?.map((a: any) => a.can_view_user_id) || [])]
  }

  // Stats — fetch only the status column for all records (lightweight)
  let statsQ = adminDb.from('email_logs').select('status')
  if (!viewAll) statsQ = statsQ.in('user_id', viewableIds)
  const { data: allStatuses } = await statsQ
  const stats = {
    total:  allStatuses?.length || 0,
    sent:   allStatuses?.filter(l => l.status === 'sent').length   || 0,
    failed: allStatuses?.filter(l => l.status === 'failed').length || 0,
  }

  // Paginated logs
  let logsQ = adminDb
    .from('email_logs')
    .select('*, contacts(name), profiles(full_name, email)', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(from, to)

  if (!viewAll)    logsQ = logsQ.in('user_id', viewableIds)
  if (statusFilter) logsQ = logsQ.eq('status', statusFilter)

  const { data: logs, count: totalCount } = await logsQ
  const totalPages  = Math.ceil((totalCount || 0) / PAGE_SIZE)
  const showingFrom = totalCount ? from + 1 : 0
  const showingTo   = Math.min(to + 1, totalCount || 0)

  // Build URL helper that preserves existing params
  const pageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/emails/logs${qs ? `?${qs}` : ''}`
  }

  // Page numbers to show (window of 5 around current)
  const pageNumbers: number[] = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pageNumbers.push(i)
  }

  return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track all sent emails and their status</p>
        </div>
        <Link href="/emails/send" className="btn-primary"><Send className="w-4 h-4" />Send Email</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Sent', value: stats.total,  color: 'text-slate-800',   bg: 'bg-slate-50'   },
          { label: 'Successful', value: stats.sent,   color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Failed',     value: stats.failed, color: 'text-red-700',     bg: 'bg-red-50'     },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { label: 'All',    value: '' },
          { label: 'Sent',   value: 'sent' },
          { label: 'Failed', value: 'failed' },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/emails/logs?status=${value}` : '/emails/logs'}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              (statusFilter || '') === value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {!logs?.length ? (
            <div className="text-center py-16">
              <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No emails found.</p>
              <Link href="/emails/send" className="btn-primary mt-4 inline-flex">Send your first email</Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Recipients</th>
                  <th>Contact</th>
                  {isAdmin && <th>Sent By</th>}
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="font-medium text-slate-800">{truncate(log.subject, 40)}</td>
                    <td>
                      <div className="text-xs text-slate-500 max-w-xs">
                        {truncate(log.recipients, 50)}
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">{(log as any).contacts?.name || '—'}</td>
                    {isAdmin && (
                      <td className="text-xs text-slate-500">
                        {(log as any).profiles?.full_name || (log as any).profiles?.email || '—'}
                      </td>
                    )}
                    <td>
                      {log.status === 'sent'
                        ? <span className="badge-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Sent</span>
                        : <span className="badge-red"><AlertCircle className="w-3 h-3" />Failed</span>}
                    </td>
                    <td className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(log.sent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
          {/* Showing X–Y of Z */}
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{showingFrom}–{showingTo}</span>{' '}
            of <span className="font-medium text-slate-700">{totalCount}</span> results
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            {/* Previous */}
            {page > 1 ? (
              <Link href={pageUrl(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600
                  border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4" />Prev
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                text-slate-300 border border-slate-100 bg-white cursor-not-allowed select-none">
                <ChevronLeft className="w-4 h-4" />Prev
              </span>
            )}

            {/* First page + ellipsis */}
            {pageNumbers[0] > 1 && (
              <>
                <Link href={pageUrl(1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium
                    text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  1
                </Link>
                {pageNumbers[0] > 2 && (
                  <span className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                )}
              </>
            )}

            {/* Page numbers */}
            {pageNumbers.map(p => (
              <Link key={p} href={pageUrl(p)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-brand-600 text-white border border-brand-600 shadow-sm'
                    : 'text-slate-600 border border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                {p}
              </Link>
            ))}

            {/* Last page + ellipsis */}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                )}
                <Link href={pageUrl(totalPages)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium
                    text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  {totalPages}
                </Link>
              </>
            )}

            {/* Next */}
            {page < totalPages ? (
              <Link href={pageUrl(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600
                  border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                Next<ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                text-slate-300 border border-slate-100 bg-white cursor-not-allowed select-none">
                Next<ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
