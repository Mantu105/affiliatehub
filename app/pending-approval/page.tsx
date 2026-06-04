import Link from 'next/link'
import { Clock, LogOut } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function PendingApprovalPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Account Pending Approval</h1>
          <p className="text-slate-500 text-sm mt-1">Your account is awaiting admin review</p>
        </div>
        {user?.email && (
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-brand-600">{user.email}</span>
          </p>
        )}
        <p className="text-slate-500 text-sm leading-relaxed">
          An administrator will review your account and activate it shortly.
          You will be able to access the dashboard once approved.
        </p>
        <form action="/auth/signout" method="post">
          <button type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
