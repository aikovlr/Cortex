'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type FontSize = 'small' | 'medium' | 'large';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

function applyAccessibilityToDOM(size: FontSize, contrast: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Aplica tamanho de fonte e atributos globais
  root.setAttribute('data-font-size', size);
  if (size === 'small') {
    root.style.fontSize = '14px';
  } else if (size === 'large') {
    root.style.fontSize = '18px';
  } else {
    root.style.fontSize = '16px';
  }

  // Aplica alto contraste
  root.setAttribute('data-high-contrast', String(contrast));
  root.classList.toggle('high-contrast', contrast);
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [highContrast, setHighContrastState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedSize = localStorage.getItem('cortex_font_size') as FontSize | null;
      const initialSize: FontSize = savedSize && ['small', 'medium', 'large'].includes(savedSize)
        ? savedSize
        : 'medium';

      const savedContrast = localStorage.getItem('cortex_high_contrast');
      const initialContrast = savedContrast === 'true';

      setFontSizeState(initialSize);
      setHighContrastState(initialContrast);
      applyAccessibilityToDOM(initialSize, initialContrast);
    } catch {
      // Ignora erro de acesso a localStorage caso esteja desabilitado
    }
  }, []);

  const setFontSize = useCallback((newSize: FontSize) => {
    setFontSizeState(newSize);
    try {
      localStorage.setItem('cortex_font_size', newSize);
    } catch {}
    setHighContrastState((currentContrast) => {
      applyAccessibilityToDOM(newSize, currentContrast);
      return currentContrast;
    });
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem('cortex_high_contrast', String(enabled));
    } catch {}
    setFontSizeState((currentSize) => {
      applyAccessibilityToDOM(currentSize, enabled);
      return currentSize;
    });
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser utilizado dentro de um AccessibilityProvider');
  }
  return context;
}

