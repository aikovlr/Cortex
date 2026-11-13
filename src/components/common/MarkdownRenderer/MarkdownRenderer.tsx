'use client';

import React from 'react';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
  emptyFallback?: string;
}

// Renderiza nós inline com segurança (sem dangerouslySetInnerHTML)
const renderInlineTokens = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Padrão que captura:
  // 1. Links: [text](url)
  // 2. Inline code: `code`
  // 3. Negrito + Itálico: ***text***
  // 4. Negrito: **text** ou __text__
  // 5. Itálico: *text* ou _text_
  // 6. Tachado: ~~text~~
  const regex = /(\[(.*?)\]\((.*?)\)|`([^`]+)`|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*|_([^_]+)_)/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    if (matchStart > lastIndex) {
      result.push(text.slice(lastIndex, matchStart));
    }

    const [fullMatch, , linkText, linkUrl, inlineCode, boldItalic, boldStar, boldUnder, strikethrough, italicStar, italicUnder] = match;

    if (linkText !== undefined && linkUrl !== undefined) {
      const isSafe = /^https?:\/\//i.test(linkUrl) || linkUrl.startsWith('/') || linkUrl.startsWith('#');
      result.push(
        <a
          key={`link-${matchStart}`}
          href={isSafe ? linkUrl : '#'}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkText}
        </a>
      );
    } else if (inlineCode !== undefined) {
      result.push(
        <code key={`code-${matchStart}`} className={styles.inlineCode}>
          {inlineCode}
        </code>
      );
    } else if (boldItalic !== undefined) {
      result.push(
        <strong key={`bi-${matchStart}`}>
          <em>{boldItalic}</em>
        </strong>
      );
    } else if (boldStar !== undefined || boldUnder !== undefined) {
      result.push(
        <strong key={`bold-${matchStart}`}>
          {boldStar ?? boldUnder}
        </strong>
      );
    } else if (strikethrough !== undefined) {
      result.push(
        <del key={`del-${matchStart}`}>
          {strikethrough}
        </del>
      );
    } else if (italicStar !== undefined || italicUnder !== undefined) {
      result.push(
        <em key={`italic-${matchStart}`}>
          {italicStar ?? italicUnder}
        </em>
      );
    } else {
      result.push(fullMatch);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  emptyFallback = 'Nenhuma descrição informada.',
}) => {
  if (!content || !content.trim()) {
    return <span className={`${styles.emptyContent} ${className}`}>{emptyFallback}</span>;
  }

  const rawLines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      if (inList === 'ul') {
        elements.push(<ul key={key}>{listItems}</ul>);
      } else {
        elements.push(<ol key={key}>{listItems}</ol>);
      }
      inList = null;
      listItems = [];
    }
  };

  const flushBlockquote = (key: string) => {
    if (inBlockquote && blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={key}>
          {blockquoteLines.map((line, idx) => (
            <p key={idx}>{renderInlineTokens(line)}</p>
          ))}
        </blockquote>
      );
      inBlockquote = false;
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Checagem de bloco de código ```
    if (line.trim().startsWith('```')) {
      flushList(`list-before-code-${i}`);
      flushBlockquote(`quote-before-code-${i}`);

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <div key={`code-block-${i}`} className={styles.codeBlockContainer}>
            {codeBlockLang && (
              <div className={styles.codeBlockHeader}>{codeBlockLang}</div>
            )}
            <pre className={styles.codeBlock}>
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockLang = '';
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Linha vazia
    if (!line.trim()) {
      flushList(`list-empty-${i}`);
      flushBlockquote(`quote-empty-${i}`);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList(`list-h-${i}`);
      flushBlockquote(`quote-h-${i}`);

      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const inline = renderInlineTokens(headingText);

      switch (level) {
        case 1:
          elements.push(<h1 key={`h1-${i}`}>{inline}</h1>);
          break;
        case 2:
          elements.push(<h2 key={`h2-${i}`}>{inline}</h2>);
          break;
        case 3:
          elements.push(<h3 key={`h3-${i}`}>{inline}</h3>);
          break;
        case 4:
          elements.push(<h4 key={`h4-${i}`}>{inline}</h4>);
          break;
        default:
          elements.push(<h5 key={`h5-${i}`}>{inline}</h5>);
          break;
      }
      continue;
    }

    // Blockquote >
    if (line.trim().startsWith('>')) {
      flushList(`list-quote-${i}`);
      inBlockquote = true;
      blockquoteLines.push(line.trim().replace(/^>\s?/, ''));
      continue;
    } else {
      flushBlockquote(`quote-end-${i}`);
    }

    // Unordered List (- ou *)
    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList && inList !== 'ul') {
        flushList(`switch-to-ul-${i}`);
      }
      inList = 'ul';
      listItems.push(
        <li key={`li-${i}`}>{renderInlineTokens(ulMatch[2])}</li>
      );
      continue;
    }

    // Ordered List (1. 2. etc.)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList && inList !== 'ol') {
        flushList(`switch-to-ol-${i}`);
      }
      inList = 'ol';
      listItems.push(
        <li key={`oli-${i}`}>{renderInlineTokens(olMatch[2])}</li>
      );
      continue;
    }

    // Caso seja texto normal, finaliza lista pendente
    flushList(`list-text-${i}`);

    // Parágrafo
    elements.push(
      <p key={`p-${i}`}>{renderInlineTokens(line)}</p>
    );
  }

  // Flush de blocos pendentes ao final
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div key="code-block-end" className={styles.codeBlockContainer}>
        {codeBlockLang && <div className={styles.codeBlockHeader}>{codeBlockLang}</div>}
        <pre className={styles.codeBlock}>
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    );
  }
  flushList('list-end');
  flushBlockquote('quote-end');

  return <div className={`${styles.markdown} ${className}`}>{elements}</div>;
};

