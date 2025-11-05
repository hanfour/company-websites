'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Image } from '@tiptap/extension-image';
import { Youtube } from '@tiptap/extension-youtube';
import { common, createLowlight } from 'lowlight';
import { useEffect, useState, useCallback } from 'react';

const lowlight = createLowlight(common);

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  enablePreview?: boolean;
}

export default function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder,
  enablePreview = true,
}: EnhancedRichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false, // 使用 CodeBlockLowlight 代替
      }),
      Placeholder.configure({
        placeholder: placeholder || '開始輸入內容...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 px-4 py-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-white p-4 rounded-lg overflow-x-auto my-4',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg my-4',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none p-4',
      },
    },
  });

  // 當外部 value 改變時更新編輯器內容
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // 插入圖片
  const handleInsertImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  }, [editor, imageUrl]);

  // 插入 YouTube 影片
  const handleInsertYoutube = useCallback(() => {
    if (youtubeUrl && editor) {
      editor.commands.setYoutubeVideo({ src: youtubeUrl });
      setYoutubeUrl('');
      setShowYoutubeDialog(false);
    }
  }, [editor, youtubeUrl]);

  // 插入連結
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('輸入連結網址:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* 編輯/預覽切換 */}
      {enablePreview && (
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              !showPreview ? 'bg-white border border-b-0 border-gray-300 font-semibold' : 'bg-gray-100 text-gray-600'
            }`}
          >
            編輯
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              showPreview ? 'bg-white border border-b-0 border-gray-300 font-semibold' : 'bg-gray-100 text-gray-600'
            }`}
          >
            預覽
          </button>
        </div>
      )}

      {!showPreview ? (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* 工具列 */}
          <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
            {/* 文字格式 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors ${
                  editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
                }`}
                title="粗體"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors italic ${
                  editor.isActive('italic') ? 'bg-gray-300' : ''
                }`}
                title="斜體"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors underline ${
                  editor.isActive('underline') ? 'bg-gray-300' : ''
                }`}
                title="底線"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors line-through ${
                  editor.isActive('strike') ? 'bg-gray-300' : ''
                }`}
                title="刪除線"
              >
                S
              </button>
            </div>

            {/* 標題 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 font-bold' : ''
                }`}
                title="標題 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 font-bold' : ''
                }`}
                title="標題 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 font-bold' : ''
                }`}
                title="標題 3"
              >
                H3
              </button>
            </div>

            {/* 對齊 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
                }`}
                title="靠左對齊"
              >
                ≡
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
                }`}
                title="置中對齊"
              >
                ≣
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
                }`}
                title="靠右對齊"
              >
                ≡
              </button>
            </div>

            {/* 列表 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('bulletList') ? 'bg-gray-300' : ''
                }`}
                title="項目符號"
              >
                • 列表
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('orderedList') ? 'bg-gray-300' : ''
                }`}
                title="編號列表"
              >
                1. 列表
              </button>
            </div>

            {/* 表格 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm"
                title="插入表格"
              >
                ⊞ 表格
              </button>
              {editor.isActive('table') && (
                <>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors text-xs"
                    title="插入列（前）"
                  >
                    ←列
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors text-xs"
                    title="插入行（上）"
                  >
                    ↑行
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="px-2 py-1 rounded hover:bg-red-200 transition-colors text-xs text-red-600"
                    title="刪除表格"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>

            {/* 媒體 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => setShowImageDialog(true)}
                className="px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm"
                title="插入圖片"
              >
                🖼 圖片
              </button>
              <button
                type="button"
                onClick={() => setShowYoutubeDialog(true)}
                className="px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm"
                title="插入 YouTube"
              >
                ▶ 影片
              </button>
              <button
                type="button"
                onClick={setLink}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('link') ? 'bg-gray-300' : ''
                }`}
                title="插入連結"
              >
                🔗 連結
              </button>
            </div>

            {/* 其他 */}
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('codeBlock') ? 'bg-gray-300' : ''
                }`}
                title="代碼塊"
              >
                {'</>'}
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm ${
                  editor.isActive('blockquote') ? 'bg-gray-300' : ''
                }`}
                title="引用"
              >
                ❝ 引用
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm"
                title="分隔線"
              >
                ─ 分隔線
              </button>
            </div>

            {/* 復原/重做 */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                title="復原"
              >
                ↶
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="px-3 py-1 rounded hover:bg-gray-200 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                title="重做"
              >
                ↷
              </button>
            </div>
          </div>

          {/* 編輯區域 */}
          <div className="bg-white min-h-[300px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        /* 預覽模式 */
        <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[300px]">
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      )}

      {/* 插入圖片對話框 */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">插入圖片</h3>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="輸入圖片網址"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 插入 YouTube 對話框 */}
      {showYoutubeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">插入 YouTube 影片</h3>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="輸入 YouTube 網址"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-600 mb-4">
              支援格式：https://www.youtube.com/watch?v=VIDEO_ID
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowYoutubeDialog(false);
                  setYoutubeUrl('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleInsertYoutube}
                disabled={!youtubeUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
