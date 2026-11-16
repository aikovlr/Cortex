'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './blur-fade.module.css';

export type BlurFadeVariant =
  | 'fade-up'
  | 'drop'
  | 'pop'
  | 'slide-left'
  | 'slide-right'
  | 'focus';

export interface BlurFadeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: BlurFadeVariant;
  duration?: number;
  delay?: number;
  yOffset?: number;
  blur?: string;
  inViewMargin?: string;
  once?: boolean;
}

/**
 * Magic UI Blur Fade Component
 * Revela containers suavemente durante o scroll com desfoque progressivo, elevação e fade-in.
 * Suporta múltiplos estilos de entrada (drop, pop, slide-left, slide-right, focus, fade-up).
 */
export function BlurFade({
  children,
  className,
  variant = 'fade-up',
  duration = 0.65,
  delay = 0,
  yOffset = 22,
  blur = '6px',
  inViewMargin = '-40px',
  once = true,
  style,
  ...props
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      {
        rootMargin: `0px 0px ${inViewMargin} 0px`,
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [inViewMargin, once]);

  const variantClass = styles[`variant-${variant}`] || styles['variant-fade-up'];

  return (
    <div
      ref={ref}
      className={`${styles.blurFadeContainer} ${variantClass} ${
        isInView ? styles.blurFadeIn : styles.blurFadeOut
      } ${className || ''}`}
      style={{
        ...style,
        '--bf-duration': `${duration}s`,
        '--bf-delay': `${delay}s`,
        '--bf-y-offset': `${yOffset}px`,
        '--bf-blur': blur,
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

export default BlurFade;
