'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Filter, X } from 'lucide-react'

export default function DateRangeFilter() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [fromDate, setFromDate] = useState(searchParams.get('from_date') || '')
  const [toDate,   setToDate]   = useState(searchParams.get('to_date')   || '')

  const isActive = !!(searchParams.get('from_date') || searchParams.get('to_date'))

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    if (fromDate) params.set('from_date', fromDate)
    else          params.delete('from_date')
    if (toDate)   params.set('to_date', toDate)
    else          params.delete('to_date')
    router.push(`/contacts?${params.toString()}`)
  }

  const clear = () => {
    setFromDate('')
    setToDate('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from_date')
    params.delete('to_date')
    params.set('page', '1')
    router.push(`/contacts?${params.toString()}`)
  }

  return (
    <div className="card p-4 mb-5">
      <div className="flex flex-wrap items-end gap-3">
        {/* From */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="form-input pl-9 text-sm"
            />
          </div>
        </div>

        {/* To */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={e => setToDate(e.target.value)}
              className="form-input pl-9 text-sm"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pb-0.5">
          <button
            onClick={apply}
            disabled={!fromDate && !toDate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Filter className="w-3.5 h-3.5" /> Apply Filter
          </button>
          {isActive && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Active filter badge */}
        {isActive && (
          <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2.5 py-1 rounded-full self-end pb-2.5">
            Filtered: {searchParams.get('from_date') || '…'} → {searchParams.get('to_date') || '…'}
          </span>
        )}
      </div>
    </div>
  )
}
