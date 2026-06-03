'use client'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export default function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter()
  return (
    <tr
      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
      onClick={e => {
        // Don't navigate when clicking a button or link (action icons)
        if ((e.target as HTMLElement).closest('a, button')) return
        router.push(href)
      }}
    >
      {children}
    </tr>
  )
}
