'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function SearchAndFilter() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const wrapperRef   = useRef<HTMLDivElement>(null)

  const [open,     setOpen]     = useState(false)
  const [q,        setQ]        = useState(searchParams.get('q')         || '')
  const [fromDate, setFromDate] = useState(searchParams.get('from_date') || '')
  const [toDate,   setToDate]   = useState(searchParams.get('to_date')   || '')

  const isFiltered = !!(searchParams.get('from_date') || searchParams.get('to_date'))

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const apply = () => {
    const p = new URLSearchParams()
    p.set('page', '1')
    if (q.trim()) p.set('q', q.trim())
    if (fromDate) p.set('from_date', fromDate)
    if (toDate)   p.set('to_date', toDate)
    router.push(`/contacts?${p.toString()}`)
    setOpen(false)
  }

  const clear = () => {
    setFromDate(''); setToDate('')
    const p = new URLSearchParams()
    p.set('page', '1')
    if (q.trim()) p.set('q', q.trim())
    router.push(`/contacts?${p.toString()}`)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2 mb-5" ref={wrapperRef}>

      {/* Filter button + popover */}
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            open || isFiltered
              ? 'bg-brand-50 border-brand-300 text-brand-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
          {isFiltered && <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Created Date</p>
            <div className="flex items-center gap-1.5 mb-3">
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="form-input text-xs py-1.5 px-2 flex-1 min-w-0"
              />
              <span className="text-slate-400 text-xs shrink-0">—</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={e => setToDate(e.target.value)}
                className="form-input text-xs py-1.5 px-2 flex-1 min-w-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clear}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                Clear
              </button>
              <button onClick={apply}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors">
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="Search by email, telegram, country…"
          className="form-input form-input-icon text-sm w-full"
        />
      </div>

      {/* Active filter chip */}
      {isFiltered && (
        <button onClick={clear}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors shrink-0">
          <X className="w-3 h-3" />
          {searchParams.get('from_date')} → {searchParams.get('to_date')}
        </button>
      )}

    </div>
  )
}
