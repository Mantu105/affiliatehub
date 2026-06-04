'use client'
import { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
  minHeight?: number
}

export default function RichTextEditor({ value, onChange, minHeight = 200 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = editorRef.current
    if (el && el.innerHTML !== value) el.innerHTML = value
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    ;(document as any).execCommand(cmd, false, arg)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const setColor = (color: string) => exec('foreColor', color)

  const ToolBtn = ({ label, title, action, className = '' }: {
    label: string; title: string; action: () => void; className?: string
  }) => (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); action() }}
      className={`px-2 py-1 rounded hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors ${className}`}>
      {label}
    </button>
  )

  const Divider = () => <div className="w-px h-5 bg-slate-200 mx-0.5 self-center" />

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        <ToolBtn label="B" title="Bold"          action={() => exec('bold')}          className="font-bold" />
        <ToolBtn label="I" title="Italic"        action={() => exec('italic')}        className="italic" />
        <ToolBtn label="U" title="Underline"     action={() => exec('underline')}     className="underline" />
        <ToolBtn label="S" title="Strikethrough" action={() => exec('strikethrough')} className="line-through" />

        <Divider />

        <ToolBtn label="H1" title="Heading 1" action={() => exec('formatBlock', 'h1')} className="font-bold text-[11px]" />
        <ToolBtn label="H2" title="Heading 2" action={() => exec('formatBlock', 'h2')} className="font-bold text-[11px]" />
        <ToolBtn label="P"  title="Paragraph" action={() => exec('formatBlock', 'p')}  className="text-[11px]" />

        <Divider />

        <ToolBtn label="• List"  title="Bullet list"   action={() => exec('insertUnorderedList')} />
        <ToolBtn label="1. List" title="Numbered list" action={() => exec('insertOrderedList')}   />

        <Divider />

        <ToolBtn label="⬅" title="Align left"   action={() => exec('justifyLeft')}   />
        <ToolBtn label="↔" title="Align center" action={() => exec('justifyCenter')} />
        <ToolBtn label="➡" title="Align right"  action={() => exec('justifyRight')}  />

        <Divider />

        {['#000000', '#e53e3e', '#3182ce', '#38a169', '#d69e2e'].map(c => (
          <button key={c} type="button" title={`Color ${c}`}
            onMouseDown={e => { e.preventDefault(); setColor(c) }}
            style={{ background: c }}
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" />
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="outline-none px-4 py-3 text-sm text-slate-800 overflow-auto leading-relaxed"
        style={{ minHeight, whiteSpace: 'pre-wrap' }}
      ></div>
    </div>
  )
}
