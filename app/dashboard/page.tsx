import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import { Users, MessageSquare, Plus, Eye } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase.rpc('get_my_role')
  const isAdmin = role === 'admin'
  const adminDb = createAdminSupabaseClient()
  const { data: profileRaw } = await adminDb.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileRaw ? { ...profileRaw, email: profileRaw.email ?? user.email } : { id: user.id, email: user.email, full_name: null, role: role || 'user' }

  // Stats — use admin client to bypass RLS, scope by user_id for non-admins
  const scope = (q: any) => isAdmin ? q : q.eq('user_id', user.id)

  const [
    { count: totalContacts },
    { count: telegramContacts },
  ] = await Promise.all([
    scope(adminDb.from('contacts').select('id', { count: 'exact', head: true })),
    scope(adminDb.from('contacts').select('id', { count: 'exact', head: true }).not('telegram_id', 'is', null)),
  ])

  // Recent contacts
  const recentContactsQ = supabase.from('contacts').select('id, name, emails, telegram_id, created_at').order('created_at', { ascending: false }).limit(5)
  if (!isAdmin) recentContactsQ.eq('user_id', user.id)
  const { data: recentContacts } = await recentContactsQ

  const stats = [
    { label: 'Total Affiliates',  value: totalContacts ?? 0,    icon: Users,         color: 'text-brand-600',   bg: 'bg-brand-50',   href: '/contacts' },
    { label: 'With Telegram ID', value: telegramContacts ?? 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/contacts' },
  ]

  return (
    <AppShell profile={profile} isAdmin={isAdmin}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Admin view — you can see all data.' : 'Your affiliate network overview.'}
          </p>
        </div>
        <Link href="/contacts/add" className="btn-primary text-sm"><Plus className="w-4 h-4" />Add Affiliate</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="card p-5 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Contacts */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Recent Affiliates</h2>
          <Link href="/contacts" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> View all
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {!recentContacts?.length ? (
            <div className="px-6 py-8 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No affiliates yet.</p>
              <Link href="/contacts/add" className="text-brand-600 text-sm font-medium hover:underline mt-1 inline-block">Add your first affiliate</Link>
            </div>
          ) : recentContacts.map(c => (
            <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                {c.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                <p className="text-xs text-slate-400 truncate">{c.emails?.split(',')[0]}</p>
              </div>
              {c.telegram_id && <span className="badge-blue text-xs shrink-0">TG</span>}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
