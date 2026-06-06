import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import { Plus, Mail, MessageSquare, Users, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { canViewAll } from '@/lib/roles'
import type { AppRole } from '@/lib/roles'
import ContactsTable from '@/components/ContactsTable'
import SearchAndFilter from '@/components/SearchAndFilter'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Affiliates' }

const PAGE_SIZE = 10

export default async function ContactsPage({ searchParams }: {
  searchParams: { q?: string; page?: string; from_date?: string; to_date?: string; country?: string; is_partner?: string; has_email?: string; has_telegram?: string }
}) {
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

  const q           = searchParams.q?.trim()      || ''
  const fromDate    = searchParams.from_date       || ''
  const toDate      = searchParams.to_date         || ''
  const country     = searchParams.country?.trim() || ''
  const isPartner   = searchParams.is_partner   === 'true'
  const hasEmail    = searchParams.has_email    === 'true'
  const hasTelegram = searchParams.has_telegram === 'true'
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
  if (q)           countQ = countQ.or(`emails.ilike.%${q}%,telegram_id.ilike.%${q}%,country.ilike.%${q}%`)
  if (fromDate)    countQ = countQ.gte('created_at', fromDate)
  if (toDate)      countQ = countQ.lte('created_at', `${toDate}T23:59:59`)
  if (country)     countQ = countQ.ilike('country', `%${country}%`)
  if (isPartner)   countQ = countQ.eq('is_partner', true)
  if (hasEmail)    countQ = (countQ as any).not('emails', 'is', null).neq('emails', '')
  if (hasTelegram) countQ = (countQ as any).not('telegram_id', 'is', null)
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
    .order('created_at', { ascending: true })
    .range(from, to)
  dataQ = applyScope(dataQ)
  if (q)           dataQ = dataQ.or(`emails.ilike.%${q}%,telegram_id.ilike.%${q}%,country.ilike.%${q}%`)
  if (fromDate)    dataQ = dataQ.gte('created_at', fromDate)
  if (toDate)      dataQ = dataQ.lte('created_at', `${toDate}T23:59:59`)
  if (country)     dataQ = dataQ.ilike('country', `%${country}%`)
  if (isPartner)   dataQ = dataQ.eq('is_partner', true)
  if (hasEmail)    dataQ = (dataQ as any).not('emails', 'is', null).neq('emails', '')
  if (hasTelegram) dataQ = (dataQ as any).not('telegram_id', 'is', null)
  const { data: contacts } = await dataQ

  const totalPages = Math.ceil((total || 0) / PAGE_SIZE)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q)           params.set('q',           q)
    if (fromDate)    params.set('from_date',   fromDate)
    if (toDate)      params.set('to_date',     toDate)
    if (country)     params.set('country',     country)
    if (isPartner)   params.set('is_partner',  'true')
    if (hasEmail)    params.set('has_email',   'true')
    if (hasTelegram) params.set('has_telegram','true')
    params.set('page', String(p))
    return `/contacts?${params.toString()}`
  }

  return (
    <AppShell profile={profile} isAdmin={isAdmin}>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Affiliates</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total || 0} total affiliates</p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
              <Eye className="w-3.5 h-3.5" />Viewing all contacts
            </span>
          )}
          <Link href="/contacts/add" className="btn-primary"><Plus className="w-4 h-4" />Add Affiliate</Link>
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
            <p className="text-xs text-slate-500 font-medium">Email Affiliates</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{telegramCount}</p>
            <p className="text-xs text-slate-500 font-medium">Telegram Affiliates</p>
          </div>
        </div>
      </div>

      {/* Search + Date Filter */}
      <Suspense>
        <SearchAndFilter />
      </Suspense>

      {/* Table */}
      {!contacts?.length ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{q ? 'No affiliates match your search.' : 'No affiliates yet.'}</p>
          {!q && <Link href="/contacts/add" className="btn-primary mt-4 inline-flex">Add your first affiliate</Link>}
        </div>
      ) : (
        <>
          <ContactsTable contacts={contacts as any} from={from} />

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
        </>
      )}

    </AppShell>
  )
}
