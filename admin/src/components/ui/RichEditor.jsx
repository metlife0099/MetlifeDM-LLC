import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImageIcon,
  Minus,
} from 'lucide-react';
import { cn } from '@/utils/format.js';

/**
 * Simple TipTap-based rich text editor for blog posts, page content, etc.
 * value: HTML string
 * onChange(html): callback
 */
export default function RichEditor({ value = '', onChange, placeholder = 'Start writing…', minHeight = 320 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-ultra underline' },
      }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose prose-sm max-w-none min-h-[var(--editor-min)]',
      },
    },
  });

  // useEditor's `content` option only seeds the document on the initial mount —
  // it does not react to prop changes. Without this, any edit form that loads
  // its value asynchronously (fetch resolves after mount) renders an empty
  // editor even though `value` is populated, and saving would wipe the field.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next !== current) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (isActive, onClick, Icon, title) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 border-r border-hairline hover:bg-ivory-soft transition-colors',
        isActive && 'bg-ivory-soft text-ultra'
      )}
    >
      <Icon size={14} strokeWidth={1.5} />
    </button>
  );

  const addLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL', prev || '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border border-hairline-strong bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap border-b border-hairline">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), Bold, 'Bold')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), Italic, 'Italic')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), Strikethrough, 'Strike')}
        {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), Code, 'Inline code')}
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), Heading1, 'Heading 1')}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, 'Heading 2')}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3, 'Heading 3')}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), List, 'Bullet list')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), ListOrdered, 'Numbered list')}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), Quote, 'Blockquote')}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), Minus, 'Divider')}
        {btn(editor.isActive('link'), addLink, LinkIcon, 'Link')}
        {btn(false, addImage, ImageIcon, 'Image')}
        <div className="ml-auto flex">
          {btn(false, () => editor.chain().focus().undo().run(), Undo, 'Undo')}
          {btn(false, () => editor.chain().focus().redo().run(), Redo, 'Redo')}
        </div>
      </div>

      {/* Content */}
      <div
        className="p-4"
        style={{ '--editor-min': `${minHeight}px` }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
