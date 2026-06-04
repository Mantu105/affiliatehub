'use client'
export default function CheckboxCell() {
  return (
    <td onClick={e => e.stopPropagation()} className="w-10">
      <input
        type="radio"
        name="contact-select"
        className="w-4 h-4 accent-brand-600 cursor-pointer"
      />
    </td>
  )
}
