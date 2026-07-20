'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import clsx from 'clsx'

function BotaoBarra({
  ativo,
  onClick,
  titulo,
  children,
}: {
  ativo: boolean
  onClick: () => void
  titulo: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={titulo}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        'flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm font-medium',
        ativo ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {children}
    </button>
  )
}

function Barra({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 p-1.5">
      <select
        value={
          editor.isActive('heading', { level: 1 })
            ? 'h1'
            : editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : 'p'
        }
        onMouseDown={(e) => e.preventDefault()}
        onChange={(e) => {
          const v = e.target.value
          if (v === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run()
        }}
        className="mr-1 h-7 rounded border border-gray-200 bg-white px-1 text-xs text-gray-700"
      >
        <option value="p">Texto</option>
        <option value="h1">Título 1</option>
        <option value="h2">Título 2</option>
        <option value="h3">Título 3</option>
      </select>

      <div className="mx-1 h-5 w-px bg-gray-200" />

      <BotaoBarra
        titulo="Negrito"
        ativo={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </BotaoBarra>
      <BotaoBarra
        titulo="Itálico"
        ativo={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </BotaoBarra>
      <BotaoBarra
        titulo="Sublinhado"
        ativo={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </BotaoBarra>
      <BotaoBarra
        titulo="Tachado"
        ativo={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </BotaoBarra>
      <BotaoBarra
        titulo="Código"
        ativo={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {'</>'}
      </BotaoBarra>

      <div className="mx-1 h-5 w-px bg-gray-200" />

      <BotaoBarra
        titulo="Lista"
        ativo={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </BotaoBarra>
      <BotaoBarra
        titulo="Lista numerada"
        ativo={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </BotaoBarra>

      <div className="mx-1 h-5 w-px bg-gray-200" />

      <BotaoBarra
        titulo="Alinhar à esquerda"
        ativo={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        ≡
      </BotaoBarra>
      <BotaoBarra
        titulo="Centralizar"
        ativo={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        ≣
      </BotaoBarra>
      <BotaoBarra
        titulo="Alinhar à direita"
        ativo={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        ≡
      </BotaoBarra>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  editable = true,
  mostrarBarra = editable,
  placeholder,
  className,
}: {
  value: string
  onChange?: (html: string) => void
  onBlur?: (html: string) => void
  editable?: boolean
  mostrarBarra?: boolean
  placeholder?: string
  className?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    onBlur: ({ editor }) => onBlur?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: clsx(
          'rich-text-content prose prose-sm max-w-none focus:outline-none',
          mostrarBarra ? 'px-3 py-2' : 'py-0.5'
        ),
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const atual = editor.getHTML()
    if (value !== atual) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  if (!editor) return null

  return (
    <div
      className={clsx(
        'overflow-hidden',
        mostrarBarra && 'rounded-md border border-gray-300 bg-white',
        className
      )}
    >
      {mostrarBarra && <Barra editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
