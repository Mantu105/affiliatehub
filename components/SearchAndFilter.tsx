'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function SearchAndFilter() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const wrapperRef   = useRef<HTMLDivElement>(null)

  const [open,        setOpen]        = useState(false)
  const [q,           setQ]           = useState(searchParams.get('q')           || '')
  const [fromDate,    setFromDate]    = useState(searchParams.get('from_date')   || '')
  const [toDate,      setToDate]      = useState(searchParams.get('to_date')     || '')
  const [country,     setCountry]     = useState(searchParams.get('country')     || '')
  const [isPartner,   setIsPartner]   = useState(searchParams.get('is_partner')  === 'true')
  const [hasEmail,    setHasEmail]    = useState(searchParams.get('has_email')   === 'true')
  const [hasTelegram, setHasTelegram] = useState(searchParams.get('has_telegram') === 'true')

  const activeCount = [
    !!(searchParams.get('from_date') || searchParams.get('to_date')),
    !!searchParams.get('country'),
    searchParams.get('is_partner')   === 'true',
    searchParams.get('has_email')    === 'true',
    searchParams.get('has_telegram') === 'true',
  ].filter(Boolean).length

  const isFiltered = activeCount > 0

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
    if (q.trim())       p.set('q',           q.trim())
    if (fromDate)       p.set('from_date',   fromDate)
    if (toDate)         p.set('to_date',     toDate)
    if (country.trim()) p.set('country',     country.trim())
    if (isPartner)      p.set('is_partner',  'true')
    if (hasEmail)       p.set('has_email',   'true')
    if (hasTelegram)    p.set('has_telegram','true')
    router.push(`/contacts?${p.toString()}`)
    setOpen(false)
  }

  const clear = () => {
    setFromDate(''); setToDate(''); setCountry('')
    setIsPartner(false); setHasEmail(false); setHasTelegram(false)
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
          {isFiltered && (
            <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-4 space-y-4">

            {/* Created Date */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Created Date</p>
              <div className="flex items-center gap-1.5">
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
            </div>

            {/* Country */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Country</p>
              <input
                type="text"
                placeholder="e.g. India"
                value={country}
                onChange={e => setCountry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && apply()}
                className="form-input text-xs py-1.5 px-2.5 w-full"
              />
            </div>

            {/* Checkboxes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contact Type</p>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPartner}
                    onChange={e => setIsPartner(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                    style={{ accentColor: '#4f46e5' }}
                  />
                  <span className="text-sm text-slate-700">Is Partner</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEmail}
                    onChange={e => setHasEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                    style={{ accentColor: '#4f46e5' }}
                  />
                  <span className="text-sm text-slate-700">Has Email</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTelegram}
                    onChange={e => setHasTelegram(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                    style={{ accentColor: '#4f46e5' }}
                  />
                  <span className="text-sm text-slate-700">Has Telegram</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button onClick={clear}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                Clear All
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
          Clear filters ({activeCount})
        </button>
      )}

    </div>
  )
}
