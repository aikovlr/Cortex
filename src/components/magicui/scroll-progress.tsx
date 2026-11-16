'use client';

import React, { useEffect, useState } from 'react';

export interface ScrollProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Magic UI Scroll Progress Component
 * Fixado logo abaixo do cabeçalho (top: 76px), escala horizontalmente com a rolagem da página.
 * Estilizado na tonalidade roxa do Cortex.
 */
export function ScrollProgress({
  className,
  style,
  ...props
}: ScrollProgressProps) {
  const [scaleX, setScaleX] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentScroll = window.scrollY;
        const progress = Math.min(1, Math.max(0, currentScroll / totalHeight));
        setScaleX(progress);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: '76px',
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 100,
        transformOrigin: 'left',
        transform: `scaleX(${scaleX})`,
        transition: 'transform 0.05s ease-out',
        background: 'linear-gradient(to right, #6a3fb8, var(--cortex-purple, #7B4FC9), #a881f3)',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export default ScrollProgress;
