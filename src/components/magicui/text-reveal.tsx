'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './text-reveal.module.css';

export interface TextRevealSegment {
  text: string;
  highlight?: boolean;
  highlightClassName?: string;
  breakAfter?: boolean;
}

export interface TextRevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div' | 'span';
  text?: string;
  segments?: TextRevealSegment[];
  children?: React.ReactNode;
  className?: string;
  staggerMs?: number;
  initialDelay?: number;
}

interface RevealWordItem {
  word: string;
  globalIndex: number;
  highlight?: boolean;
  highlightClassName?: string;
  breakAfter?: boolean;
}

/**
 * Magic UI Text Reveal Component
 * Revela o texto palavra por palavra de forma progressiva e fluida com blur-to-sharp e fade-in suave.
 * Suporta tags semânticas (h1, p, etc.) e múltiplos segmentos com destaque e quebra de linha.
 */
export function TextReveal({
  as: Component = 'div',
  text,
  segments,
  children,
  className,
  staggerMs = 70,
  initialDelay = 120,
  style,
  ...props
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  // Normaliza segmentos ou texto simples em palavras individuais
  const { wordsList, totalWords, plainText } = useMemo(() => {
    const list: RevealWordItem[] = [];
    let globalIdx = 0;

    if (segments && segments.length > 0) {
      segments.forEach((seg) => {
        const segWords = seg.text.trim().split(/\s+/).filter(Boolean);
        segWords.forEach((w, wIdx) => {
          list.push({
            word: w,
            globalIndex: globalIdx++,
            highlight: seg.highlight,
            highlightClassName: seg.highlightClassName,
            breakAfter: wIdx === segWords.length - 1 && !!seg.breakAfter,
          });
        });
      });
    } else {
      const content = text || (typeof children === 'string' ? children : '');
      const rawWords = content.trim().split(/\s+/).filter(Boolean);
      rawWords.forEach((w) => {
        list.push({
          word: w,
          globalIndex: globalIdx++,
        });
      });
    }

    const plain = list.map((i) => i.word).join(' ');

    return { wordsList: list, totalWords: list.length, plainText: plain };
  }, [segments, text, children]);

  const [revealedIndex, setRevealedIndex] = useState(0);

  useEffect(() => {
    if (totalWords === 0) return;

    // Inicia revelação com stagger suave palavra por palavra
    const startTimeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        setRevealedIndex(current);
        if (current >= totalWords) {
          clearInterval(interval);
        }
      }, staggerMs);

      return () => clearInterval(interval);
    }, initialDelay);

    return () => clearTimeout(startTimeout);
  }, [totalWords, staggerMs, initialDelay]);

  // Suporte a scroll progress para revelar caso o usuário role antes da animação terminar
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || totalWords === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = Math.min(
          1,
          Math.max(0, (windowHeight - rect.top) / (windowHeight * 0.7))
        );
        const scrollIndex = Math.floor(progress * totalWords);
        setRevealedIndex((prev) => Math.max(prev, scrollIndex));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalWords]);

  return (
    <Component
      ref={containerRef as any}
      className={`${styles.textRevealContainer} ${className || ''}`}
      style={style}
      aria-label={plainText}
      {...props}
    >
      <span className={styles.textRevealWords}>
        {wordsList.map((item, idx) => {
          const isRevealed = item.globalIndex < revealedIndex;
          const isHighlight = !!item.highlight;
          const highlightCls = item.highlightClassName || styles.wordHighlight;

          const wordClassName = isHighlight
            ? `${styles.wordWrapper} ${highlightCls} ${
                isRevealed ? styles.highlightWordRevealed : styles.highlightWordDimmed
              }`
            : `${styles.wordWrapper} ${
                isRevealed ? styles.wordRevealed : styles.wordDimmed
              }`;

          return (
            <React.Fragment key={`${item.word}-${item.globalIndex}`}>
              <span className={wordClassName}>
                {item.word}
              </span>
              {item.breakAfter ? <br /> : (idx < wordsList.length - 1 ? ' ' : null)}
            </React.Fragment>
          );
        })}
      </span>
    </Component>
  );
}

export default TextReveal;
