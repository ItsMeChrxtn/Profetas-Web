import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import '../styles/richtext.css';

// Fonts offered in the editor; all are loaded in index.html.
export const RICH_TEXT_FONTS = [
  { label: 'Manrope (default)', value: 'Manrope' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
];

const SIZES = [
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '5' },
  { label: 'Huge', value: '6' },
];

const looksLikeHtml = (text) => /<\/?[a-z][\s\S]*>/i.test(text || '');

/** Plain text of a post (for excerpts), whether it's HTML or older plain text. */
export function plainText(value) {
  if (!looksLikeHtml(value)) return value || '';
  const div = document.createElement('div');
  div.innerHTML = DOMPurify.sanitize(value);
  return div.textContent || '';
}

/** Shows admin-written content. Older posts are plain text, so line breaks are kept for those. */
export function RichText({ value, className = '' }) {
  if (!looksLikeHtml(value)) {
    return (
      <div className={`rich-text ${className}`} style={{ whiteSpace: 'pre-line' }}>
        {value}
      </div>
    );
  }
  const html = DOMPurify.sanitize(value, { ADD_ATTR: ['style', 'face', 'size', 'color'] });
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Small WYSIWYG editor (font, size, bold/italic/underline, color, lists,
 * alignment) built on contentEditable. Emits HTML through onChange.
 */
export function RichTextEditor({ value, onChange, minHeight = 180, placeholder = 'Write here...' }) {
  const ref = useRef(null);

  // Load the initial value once; after that the DOM is the source of truth while typing.
  useEffect(() => {
    if (!ref.current) return;
    const initial = looksLikeHtml(value) ? DOMPurify.sanitize(value, { ADD_ATTR: ['style', 'face', 'size', 'color'] }) : (value || '').replace(/\n/g, '<br>');
    if (ref.current.innerHTML !== initial) ref.current.innerHTML = initial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command, arg) {
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, arg);
    onChange(ref.current.innerHTML);
  }

  const button = (command, icon, title, arg) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={() => exec(command, arg)}>
      <i className={`fas ${icon}`} />
    </button>
  );

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <select defaultValue="" onChange={(e) => e.target.value && exec('fontName', e.target.value)} title="Font">
          <option value="" disabled>
            Font
          </option>
          {RICH_TEXT_FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>
        <select defaultValue="" onChange={(e) => e.target.value && exec('fontSize', e.target.value)} title="Size">
          <option value="" disabled>
            Size
          </option>
          {SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="rte-sep" />
        {button('bold', 'fa-bold', 'Bold')}
        {button('italic', 'fa-italic', 'Italic')}
        {button('underline', 'fa-underline', 'Underline')}
        <label className="rte-color" title="Text color">
          <i className="fas fa-palette" />
          <input type="color" defaultValue="#7B1E2B" onChange={(e) => exec('foreColor', e.target.value)} />
        </label>
        <span className="rte-sep" />
        {button('insertUnorderedList', 'fa-list-ul', 'Bulleted list')}
        {button('insertOrderedList', 'fa-list-ol', 'Numbered list')}
        {button('justifyLeft', 'fa-align-left', 'Align left')}
        {button('justifyCenter', 'fa-align-center', 'Center')}
        <span className="rte-sep" />
        {button('removeFormat', 'fa-remove-format', 'Clear formatting')}
      </div>
      <div
        ref={ref}
        className="rte-area rich-text"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={() => onChange(ref.current.innerHTML)}
      />
    </div>
  );
}
