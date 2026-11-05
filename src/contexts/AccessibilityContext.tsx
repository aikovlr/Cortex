'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { preferenciaService } from '@/services/preferenciaService';

export const AVAILABLE_FONT_SIZES = [12, 14, 16, 18, 20, 22, 24] as const;
export type FontSizeNumber = (typeof AVAILABLE_FONT_SIZES)[number];
export type FontSize = FontSizeNumber | 'small' | 'medium' | 'large' | string;
export type Theme = 'light' | 'dark';

export interface FontSizeOptionItem {
  value: FontSizeNumber;
  label: string;
  description: string;
}

export const FONT_SIZE_OPTIONS: FontSizeOptionItem[] = [
  { value: 12, label: '12px', description: 'Mínima' },
  { value: 14, label: '14px', description: 'Pequena' },
  { value: 16, label: '16px', description: 'Padrão' },
  { value: 18, label: '18px', description: 'Média-Alta' },
  { value: 20, label: '20px', description: 'Grande' },
  { value: 22, label: '22px', description: 'Muito Grande' },
  { value: 24, label: '24px', description: 'Máxima' },
];

export function toNumericFontSize(size: FontSize | number | string | null | undefined): FontSizeNumber {
  if (typeof size === 'number') {
    if (size % 2 === 0 && size >= 12 && size <= 24) {
      return size as FontSizeNumber;
    }
  }
  if (size === 'small') return 14;
  if (size === 'medium') return 16;
  if (size === 'large') return 18;

  const parsed = parseInt(String(size), 10);
  if (!isNaN(parsed) && parsed >= 12 && parsed <= 24 && parsed % 2 === 0) {
    return parsed as FontSizeNumber;
  }
  return 16;
}

interface AccessibilityContextType {
  fontSize: FontSizeNumber;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  sincronizar: () => Promise<void>;
  isSyncing: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

function applyAccessibilityToDOM(size: FontSizeNumber, contrast: boolean, theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Aplica tamanho de fonte e atributos globais
  root.setAttribute('data-font-size', `${size}px`);
  root.style.fontSize = `${size}px`;

  // Mapeamento de retrocompatibilidade para classes CSS legadas
  const legacySize = size <= 14 ? 'small' : size >= 18 ? 'large' : 'medium';
  root.setAttribute('data-font-size-legacy', legacySize);

  // Aplica alto contraste
  root.setAttribute('data-high-contrast', String(contrast));
  root.classList.toggle('high-contrast', contrast);

  // Aplica tema
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeNumber>(16);
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [theme, setThemeState] = useState<Theme>('light');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dispara a sincronização de preferências com o backend no banco de dados
  const syncWithBackend = useCallback((newTheme: Theme, newContrast: boolean, newSize: FontSizeNumber) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await preferenciaService.atualizarAcessibilidade({
          tema: newTheme,
          altoContraste: newContrast,
          tamanhoFonte: newSize,
        });
      } catch {
        // Se o usuário não estiver autenticado (401) ou offline, o estado local em memória permanece válido
      } finally {
        setIsSyncing(false);
      }
    }, 300);
  }, []);

  // Busca as preferências sincronizadas do banco de dados
  const sincronizar = useCallback(async () => {
    try {
      const remotas = await preferenciaService.obterAcessibilidade();
      if (remotas) {
        const remoteSize = toNumericFontSize(remotas.tamanhoFonte);
        const remoteContrast = Boolean(remotas.altoContraste);
        const remoteTheme: Theme = remotas.tema === 'dark' ? 'dark' : 'light';

        setFontSizeState(remoteSize);
        setHighContrastState(remoteContrast);
        setThemeState(remoteTheme);

        try {
          localStorage.removeItem('cortex_font_size');
          localStorage.removeItem('cortex_high_contrast');
          localStorage.removeItem('cortex_theme');
          localStorage.removeItem('theme');
        } catch {}

        applyAccessibilityToDOM(remoteSize, remoteContrast, remoteTheme);
      }
    } catch {
      // Ignora falha de autenticação inicial / modo visitante
    }
  }, []);

  // Inicialização no cliente: sem server/client mismatch na hidratação, sincroniza direto com o banco de dados
  useEffect(() => {
    let ignore = false;

    try {
      // Remove do localStorage todas as preferências que já pertencem ao banco de dados
      localStorage.removeItem('cortex_font_size');
      localStorage.removeItem('cortex_high_contrast');
      localStorage.removeItem('cortex_theme');
      localStorage.removeItem('theme');
    } catch {}

    async function carregarPreferencias() {
      // Executa de forma assíncrona para não quebrar a hidratação do React
      await Promise.resolve();
      if (ignore) return;

      // 1. Aplica tema do sistema se usuário não autenticado estiver em dark mode
      try {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          setThemeState('dark');
          applyAccessibilityToDOM(16, false, 'dark');
        }
      } catch {}

      // 2. Busca e sincroniza preferências persistidas no backend
      try {
        const remotas = await preferenciaService.obterAcessibilidade();
        if (!ignore && remotas) {
          const remoteSize = toNumericFontSize(remotas.tamanhoFonte);
          const remoteContrast = Boolean(remotas.altoContraste);
          const remoteTheme: Theme = remotas.tema === 'dark' ? 'dark' : 'light';

          setFontSizeState(remoteSize);
          setHighContrastState(remoteContrast);
          setThemeState(remoteTheme);

          try {
            localStorage.removeItem('cortex_font_size');
            localStorage.removeItem('cortex_high_contrast');
            localStorage.removeItem('cortex_theme');
            localStorage.removeItem('theme');
          } catch {}

          applyAccessibilityToDOM(remoteSize, remoteContrast, remoteTheme);
        }
      } catch {}
    }

    carregarPreferencias();

    // Monitora alterações dinâmicas na preferência de sistema do usuário
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        setThemeState(systemTheme);
        setFontSizeState((currSize) => {
          setHighContrastState((currContrast) => {
            applyAccessibilityToDOM(currSize, currContrast, systemTheme);
            return currContrast;
          });
          return currSize;
        });
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => {
        ignore = true;
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }

    return () => {
      ignore = true;
    };
  }, []);

  const setFontSize = useCallback((newSizeInput: FontSize) => {
    const newSize = toNumericFontSize(newSizeInput);
    setFontSizeState(newSize);

    try {
      localStorage.removeItem('cortex_font_size');
    } catch {}

    setHighContrastState((currContrast) => {
      setThemeState((currTheme) => {
        applyAccessibilityToDOM(newSize, currContrast, currTheme);
        syncWithBackend(currTheme, currContrast, newSize);
        return currTheme;
      });
      return currContrast;
    });
  }, [syncWithBackend]);

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);

    try {
      localStorage.removeItem('cortex_high_contrast');
    } catch {}

    setFontSizeState((currSize) => {
      setThemeState((currTheme) => {
        applyAccessibilityToDOM(currSize, enabled, currTheme);
        syncWithBackend(currTheme, enabled, currSize);
        return currTheme;
      });
      return currSize;
    });
  }, [syncWithBackend]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      localStorage.removeItem('theme');
      localStorage.removeItem('cortex_theme');
    } catch {}

    setFontSizeState((currSize) => {
      setHighContrastState((currContrast) => {
        applyAccessibilityToDOM(currSize, currContrast, newTheme);
        syncWithBackend(newTheme, currContrast, currSize);
        return currContrast;
      });
      return currSize;
    });
  }, [syncWithBackend]);

  const toggleTheme = useCallback(() => {
    setThemeState((currTheme) => {
      const nextTheme: Theme = currTheme === 'dark' ? 'light' : 'dark';

      try {
        localStorage.removeItem('theme');
        localStorage.removeItem('cortex_theme');
      } catch {}

      setFontSizeState((currSize) => {
        setHighContrastState((currContrast) => {
          applyAccessibilityToDOM(currSize, currContrast, nextTheme);
          syncWithBackend(nextTheme, currContrast, currSize);
          return currContrast;
        });
        return currSize;
      });

      return nextTheme;
    });
  }, [syncWithBackend]);

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
        sincronizar,
        isSyncing,
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
