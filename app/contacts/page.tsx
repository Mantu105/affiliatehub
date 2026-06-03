import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import { Plus, Search, MessageSquare, Mail, Users, Send, Pencil, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { canViewAll, canWrite } from '@/lib/roles'
import type { AppRole } from '@/lib/roles'
import DeleteContactButton from '@/components/DeleteContactButton'
import ClickableRow from '@/components/ClickableRow'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contacts' }

const PAGE_SIZE = 10

export default async function ContactsPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase.rpc('get_my_role')
  const adminDb2 = createAdminSupabaseClient()
  const { data: profileRaw } = await adminDb2.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileRaw ? { ...profileRaw, email: profileRaw.email ?? user.email } : { id: user.id, email: user.email, full_name: null, role: roleData || 'user' }
  const role = (roleData || 'user') as AppRole
  const isAdmin   = role === 'admin'
  const isManager = role === 'manager'
  const viewAll   = canViewAll(role)

  const q    = searchParams.q?.trim() || ''
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const adminDb = createAdminSupabaseClient()

  // For plain 'user': check granted access
  let viewableIds: string[] = [user.id]
  if (!viewAll) {
    const { data: accessList } = await adminDb
      .from('user_access')
      .select('can_view_user_id')
      .eq('user_id', user.id)
    viewableIds = [user.id, ...(accessList?.map((a: any) => a.can_view_user_id) || [])]
  }

  const applyScope = (q: any) => viewAll ? q : q.in('user_id', viewableIds)

  // Count
  let countQ = adminDb.from('contacts').select('id', { count: 'exact', head: true })
  countQ = applyScope(countQ)
  if (q) countQ = countQ.or(`name.ilike.%${q}%,emails.ilike.%${q}%,telegram_id.ilike.%${q}%`)
  const { count: total } = await countQ

  // Stats
  let statsQ = adminDb.from('contacts').select('emails, telegram_id')
  statsQ = applyScope(statsQ)
  const { data: statsRows } = await statsQ
  const emailCount    = statsRows?.filter(c => c.emails?.trim()) .length || 0
  const telegramCount = statsRows?.filter(c => c.telegram_id)   .length || 0

  // Paginated rows
  let dataQ = adminDb
    .from('contacts')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .range(from, to)
  dataQ = applyScope(dataQ)
  if (q) dataQ = dataQ.or(`name.ilike.%${q}%,emails.ilike.%${q}%,telegram_id.ilike.%${q}%`)
  const { data: contacts } = await dataQ

  const totalPages = Math.ceil((total || 0) / PAGE_SIZE)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', String(p))
    return `/contacts?${params.toString()}`
  }

  return (
    <AppShell profile={profile} isAdmin={isAdmin}>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total || 0} total contacts</p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
              <Eye className="w-3.5 h-3.5" />Viewing all contacts
            </span>
          )}
          <Link href="/contacts/add" className="btn-primary"><Plus className="w-4 h-4" />Add Contact</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{emailCount}</p>
            <p className="text-xs text-slate-500 font-medium">Email Contacts</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{telegramCount}</p>
            <p className="text-xs text-slate-500 font-medium">Telegram Contacts</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-5 p-4">
        <form>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" name="q" defaultValue={q}
              placeholder="Search by name, email, or Telegram ID…"
              className="form-input form-input-icon" />
            <input type="hidden" name="page" value="1" />
          </div>
        </form>
      </div>

      {/* Table */}
      {!contacts?.length ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{q ? 'No contacts match your search.' : 'No contacts yet.'}</p>
          {!q && (
            <Link href="/contacts/add" className="btn-primary mt-4 inline-flex">Add your first contact</Link>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Emails</th>
                  <th>Telegram</th>
                  {viewAll && <th>Owner</th>}
                  <th>Added</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => {
                  const emailList    = c.emails ? c.emails.split(',').map((e: string) => e.trim()).filter(Boolean) : []
                  const userCanWrite = canWrite(role, c.user_id, user.id)

                  return (
                    <ClickableRow key={c.id} href={`/contacts/${c.id}`}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                            emailList.length ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-gradient-to-br from-sky-500 to-sky-700'
                          }`}>
                            {c.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                        </div>
                      </td>

                      <td>
                        {emailList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {emailList.slice(0, 2).map((em: string) => (
                              <span key={em} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{em}</span>
                            ))}
                            {emailList.length > 2 && <span className="text-xs text-slate-400">+{emailList.length - 2} more</span>}
                          </div>
                        ) : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      <td>
                        {c.telegram_id
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                              <MessageSquare className="w-3 h-3" />{c.telegram_id}
                            </span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>

                      {viewAll && (
                        <td className="text-sm text-slate-500">
                          {(c as any).profiles?.full_name || (c as any).profiles?.email || '—'}
                        </td>
                      )}

                      <td className="text-xs text-slate-400 whitespace-nowrap">{formatDate(c.created_at)}</td>

                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          {userCanWrite && emailList.length > 0 && (
                            <Link href={`/emails/send?contact=${c.id}`} className="btn-icon" title="Send Email">
                              <Send className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <Link
                            href={userCanWrite ? `/contacts/${c.id}?edit=1` : `/contacts/${c.id}`}
                            className="btn-icon"
                            title={userCanWrite ? 'Edit' : 'View'}
                          >
                            {userCanWrite
                              ? <Pencil className="w-3.5 h-3.5" />
                              : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                          </Link>
                          {userCanWrite && (
                            <DeleteContactButton contactId={c.id} contactName={c.name} />
                          )}
                        </div>
                      </td>
                    </ClickableRow>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {from + 1}–{Math.min(to + 1, total || 0)} of {total} contacts
              </p>
              <div className="flex items-center gap-1">
                <Link href={buildUrl(page - 1)}
                  className={`btn-icon ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
                  aria-disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`e${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                    ) : (
                      <Link key={p} href={buildUrl(p as number)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}>
                        {p}
                      </Link>
                    )
                  )}
                <Link href={buildUrl(page + 1)}
                  className={`btn-icon ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
                  aria-disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

    </AppShell>
  )
}
