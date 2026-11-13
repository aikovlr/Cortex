'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  HeadingIcon,
  CodeIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  LinkIcon,
  AlertTriangleIcon,
} from '@/components/common/Icons/Icons';
import { MarkdownRenderer } from '../MarkdownRenderer/MarkdownRenderer';
import styles from './MarkdownEditor.module.css';

export interface MarkdownEditorProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  minHeight?: number;
  maxLength?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  label = 'Descrição',
  value,
  onChange,
  placeholder = 'Instruções ou detalhes da tarefa... (Markdown suportado)',
  error,
  minHeight = 130,
  maxLength = 2000,
}) => {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value ? value.length : 0;
  const isOverLimit = charCount > maxLength;

  const applyFormat = useCallback(
    (prefix: string, suffix: string = '', defaultText: string = '', isLinePrefix: boolean = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = value || '';
      const selectedText = currentVal.substring(start, end);

      let newText = '';
      let newCursorPosStart = start;
      let newCursorPosEnd = end;

      if (isLinePrefix) {
        // Encontra o início da linha onde o cursor está
        const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = currentVal.indexOf('\n', end);
        const actualLineEnd = lineEnd === -1 ? currentVal.length : lineEnd;
        const targetBlock = currentVal.substring(lineStart, actualLineEnd);

        // Se for lista ou citação, aplica prefixo no início de cada linha selecionada
        const lines = targetBlock.split('\n');
        const formattedLines = lines.map((l) => (l.startsWith(prefix) ? l : `${prefix}${l}`));
        const formattedBlock = formattedLines.join('\n');

        newText = currentVal.substring(0, lineStart) + formattedBlock + currentVal.substring(actualLineEnd);
        newCursorPosStart = lineStart + formattedBlock.length;
        newCursorPosEnd = newCursorPosStart;
      } else {
        const textToWrap = selectedText || defaultText;
        const wrapped = `${prefix}${textToWrap}${suffix}`;
        newText = currentVal.substring(0, start) + wrapped + currentVal.substring(end);

        if (selectedText) {
          newCursorPosStart = start + prefix.length;
          newCursorPosEnd = newCursorPosStart + selectedText.length;
        } else {
          newCursorPosStart = start + prefix.length;
          newCursorPosEnd = newCursorPosStart + defaultText.length;
        }
      }

      onChange(newText);

      // Restaura o foco e ajusta seleção
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPosStart, newCursorPosEnd);
        }
      }, 0);
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyFormat('**', '**', 'negrito');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyFormat('*', '*', 'itálico');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        applyFormat('[', '](url)', 'link');
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'write'}
            className={`${styles.tabBtn} ${tab === 'write' ? styles.tabActive : ''}`}
            onClick={() => setTab('write')}
          >
            Escrever
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            className={`${styles.tabBtn} ${tab === 'preview' ? styles.tabActive : ''}`}
            onClick={() => setTab('preview')}
          >
            Visualizar
          </button>
        </div>
      </div>

      <div className={`${styles.editorContainer} ${isOverLimit ? styles.editorContainerError : ''}`}>
        {tab === 'write' && (
          <div className={styles.toolbar} role="toolbar" aria-label="Ferramentas de formatação">
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('**', '**', 'texto')}
              title="Negrito (Ctrl+B)"
              aria-label="Negrito"
            >
              <BoldIcon size={15} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('*', '*', 'texto')}
              title="Itálico (Ctrl+I)"
              aria-label="Itálico"
            >
              <ItalicIcon size={15} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('~~', '~~', 'texto')}
              title="Tachado"
              aria-label="Tachado"
            >
              <StrikethroughIcon size={15} />
            </button>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('### ', '', 'Título', true)}
              title="Título (H3)"
              aria-label="Título"
            >
              <HeadingIcon size={15} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('`', '`', 'código')}
              title="Código inline"
              aria-label="Código inline"
            >
              <CodeIcon size={15} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('```\n', '\n```', '// seu código')}
              title="Bloco de código"
              aria-label="Bloco de código"
            >
              <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{'{}'}</span>
            </button>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('- ', '', 'item', true)}
              title="Lista com marcadores"
              aria-label="Lista com marcadores"
            >
              <ListIcon size={15} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('1. ', '', 'item', true)}
              title="Lista numerada"
              aria-label="Lista numerada"
            >
              <ListOrderedIcon size={15} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('> ', '', 'citação', true)}
              title="Citação"
              aria-label="Citação"
            >
              <QuoteIcon size={15} />
            </button>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => applyFormat('[', '](https://)', 'link')}
              title="Link (Ctrl+K)"
              aria-label="Link"
            >
              <LinkIcon size={15} />
            </button>
          </div>
        )}

        {tab === 'write' ? (
          <textarea
            ref={textareaRef}
            className={`${styles.textarea} ${isOverLimit ? styles.textareaError : ''}`}
            style={{ minHeight: `${minHeight}px` }}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div className={styles.previewArea} style={{ minHeight: `${minHeight}px` }}>
            <MarkdownRenderer
              content={value}
              emptyFallback="Nada para visualizar ainda. Comece a escrever na aba 'Escrever'..."
            />
          </div>
        )}

        {isOverLimit && (
          <div className={styles.overLimitBanner} role="alert">
            <AlertTriangleIcon size={15} color="#ef4444" />
            <span>
              Atenção: você ultrapassou o limite em {charCount - maxLength} caractere(s). O limite máximo permitido é de {maxLength} caracteres.
            </span>
          </div>
        )}

        <div className={styles.footerHint}>
          <span className={styles.markdownSupportBadge}>
            Markdown habilitado (negrito, itálico, listas, links, blocos de código)
          </span>
          <span className={`${styles.charCount} ${isOverLimit ? styles.charCountError : ''}`}>
            {charCount} / {maxLength} caracteres
          </span>
        </div>
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

