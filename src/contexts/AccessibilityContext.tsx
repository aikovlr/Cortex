'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type FontSize = 'small' | 'medium' | 'large';
export type Theme = 'light' | 'dark';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

function applyAccessibilityToDOM(size: FontSize, contrast: boolean, theme: Theme) {
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

  // Aplica tema
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    try {
      const savedSize = localStorage.getItem('cortex_font_size') as FontSize | null;
      const initialSize: FontSize = savedSize && ['small', 'medium', 'large'].includes(savedSize)
        ? savedSize
        : 'medium';

      const savedContrast = localStorage.getItem('cortex_high_contrast');
      const initialContrast = savedContrast === 'true';

      const savedTheme = localStorage.getItem('cortex_theme') as Theme | null;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = savedTheme && ['light', 'dark'].includes(savedTheme)
        ? savedTheme
        : (prefersDark ? 'dark' : 'light');

      setFontSizeState(initialSize);
      setHighContrastState(initialContrast);
      setThemeState(initialTheme);
      applyAccessibilityToDOM(initialSize, initialContrast, initialTheme);
    } catch {
      // Ignora erro de acesso a localStorage caso esteja desabilitado
    }
  }, []);

  const setFontSize = useCallback((newSize: FontSize) => {
    setFontSizeState(newSize);
    try {
      localStorage.setItem('cortex_font_size', newSize);
    } catch {}
    setHighContrastState((currContrast) => {
      setThemeState((currTheme) => {
        applyAccessibilityToDOM(newSize, currContrast, currTheme);
        return currTheme;
      });
      return currContrast;
    });
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem('cortex_high_contrast', String(enabled));
    } catch {}
    setFontSizeState((currSize) => {
      setThemeState((currTheme) => {
        applyAccessibilityToDOM(currSize, enabled, currTheme);
        return currTheme;
      });
      return currSize;
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('cortex_theme', newTheme);
    } catch {}
    setFontSizeState((currSize) => {
      setHighContrastState((currContrast) => {
        applyAccessibilityToDOM(currSize, currContrast, newTheme);
        return currContrast;
      });
      return currSize;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currTheme) => {
      const nextTheme: Theme = currTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('cortex_theme', nextTheme);
      } catch {}
      setFontSizeState((currSize) => {
        setHighContrastState((currContrast) => {
          applyAccessibilityToDOM(currSize, currContrast, nextTheme);
          return currContrast;
        });
        return currSize;
      });
      return nextTheme;
    });
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        theme,
        setTheme,
        toggleTheme,
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

