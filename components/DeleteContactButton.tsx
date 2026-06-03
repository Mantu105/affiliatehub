'use client'
import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import { deleteContact } from '@/app/contacts/actions'

export default function DeleteContactButton({ contactId, contactName }: { contactId: string; contactName: string }) {
  const [showModal, setShowModal] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      await deleteContact(contactId)
      setShowModal(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-600"
        title="Delete contact"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => !pending && setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              disabled={pending}
              className="absolute top-4 right-4 btn-icon text-slate-400 hover:text-slate-600 disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            {/* Content */}
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">Delete Contact</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-700">"{contactName}"</span>?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={pending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</>
                  : <><Trash2 className="w-4 h-4" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
