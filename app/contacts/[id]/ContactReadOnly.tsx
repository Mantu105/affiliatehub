'use client'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Tag, FileText, Eye } from 'lucide-react'
import AppShell from '@/components/AppShell'
import type { Profile, Contact } from '@/types'
interface Props {
  profile: Profile | null
  contact: Contact
  isAdmin: boolean
}

export default function ContactReadOnly({ profile, contact, isAdmin }: Props) {
  const emailList = contact.emails
    ? contact.emails.split(',').map(e => e.trim()).filter(Boolean)
    : []

  return (
    <AppShell profile={profile} isAdmin={isAdmin}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/contacts" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1>
            <p className="text-slate-500 text-sm">Contact details</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
            <Eye className="w-3.5 h-3.5" />Read-only
          </span>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Name</p>
            <p className="text-slate-800 font-medium">{contact.name}</p>
          </div>

          {emailList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                <Mail className="w-3.5 h-3.5 inline mr-1" />Email Addresses ({emailList.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {emailList.map(em => (
                  <span key={em} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 text-sm rounded-lg font-medium">
                    <Mail className="w-3.5 h-3.5" />{em}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contact.telegram_id && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Telegram
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 text-sm rounded-lg font-medium">
                <MessageSquare className="w-3.5 h-3.5" />{contact.telegram_id}
              </span>
            </div>
          )}

          {(contact as any).tags && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1" />Tags
              </p>
              <p className="text-slate-700 text-sm">{(contact as any).tags}</p>
            </div>
          )}

          {(contact as any).notes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />Notes
              </p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{(contact as any).notes}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-slate-400 mt-4">
          You have read-only access to this contact. You can only edit contacts you created.
        </p>


      </div>
    </AppShell>
  )
}
