'use client'
import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type ActionFn = (id: string) => Promise<{ error?: string; success?: boolean }>

export function ApprovalButtons({
  id,
  onApprove,
  onReject,
}: {
  id: string
  onApprove: ActionFn
  onReject: ActionFn
}) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  const handle = async (type: 'approve' | 'reject') => {
    setLoading(type)
    const result = await (type === 'approve' ? onApprove : onReject)(id)
    setLoading(null)
    if (!result.error) setDone(type === 'approve' ? 'approved' : 'rejected')
  }

  if (done === 'approved') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
    </span>
  )
  if (done === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
      <XCircle className="w-3.5 h-3.5" /> Rejected
    </span>
  )

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handle('approve')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
      >
        {loading === 'approve'
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <CheckCircle2 className="w-3 h-3" />}
        Approve
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {loading === 'reject'
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <XCircle className="w-3 h-3" />}
        Reject
      </button>
    </div>
  )
}
