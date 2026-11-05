'use client';

import React from 'react';
import { useAccessibility, FontSize } from '@/contexts/AccessibilityContext';
import {
  SunIcon,
  MoonIcon,
  ContrastIcon,
  TypeIcon,
  SparklesIcon,
} from './LandingIcons';
import styles from './landing.module.css';

// Todos os 7 tamanhos de fonte oficiais disponíveis no Cortex
const PREVIEW_FONT_SIZES: FontSize[] = [12, 14, 16, 18, 20, 22, 24];

export default function AccessibilitySection() {
  const accessibility = useAccessibility();

  // Caso esteja dentro do AccessibilityProvider (padrão light consistente com SSR)
  const theme = accessibility?.theme || 'light';
  const setTheme = accessibility?.setTheme;
  const highContrast = accessibility?.highContrast || false;
  const setHighContrast = accessibility?.setHighContrast;
  const fontSize = accessibility?.fontSize || 16;
  const setFontSize = accessibility?.setFontSize;

  return (
    <section
      id="acessibilidade"
      className={`${styles.section} ${styles.sectionDeepDark}`}
      aria-labelledby="accessibility-heading"
    >
      <div className={styles.landingContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Inclusão e Usabilidade</span>
          <h2 id="accessibility-heading" className={styles.sectionTitle}>
            Acessibilidade como prioridade real
          </h2>
          <p className={styles.sectionSubtitle}>
            Uma ferramenta de produtividade só é eficiente quando pode ser usada com conforto por todos.
          </p>
        </div>

        <div className={styles.accessibilityBox}>
          {/* Lado Esquerdo: Descrição dos Recursos de Acessibilidade */}
          <div className={styles.accessibilityFeaturesList}>
            <div className={styles.accessibilityFeatureItem}>
              <div className={styles.accessibilityIconCircle}>
                <SunIcon size={20} />
              </div>
              <div>
                <h3 className={styles.accessibilityFeatureTitle}>Tema Claro e Escuro</h3>
                <p className={styles.accessibilityFeatureDesc}>
                  Alternância fluida entre modo claro e escuro, reduzindo a fadiga visual e
                  adaptando-se ao ambiente de iluminação do usuário.
                </p>
              </div>
            </div>

            <div className={styles.accessibilityFeatureItem}>
              <div className={styles.accessibilityIconCircle}>
                <ContrastIcon size={20} />
              </div>
              <div>
                <h3 className={styles.accessibilityFeatureTitle}>Modo Alto Contraste</h3>
                <p className={styles.accessibilityFeatureDesc}>
                  Realce intensificado de bordas, textos e elementos de ação para usuários com baixa
                  visão ou sensibilidade a contrastes sutis.
                </p>
              </div>
            </div>

            <div className={styles.accessibilityFeatureItem}>
              <div className={styles.accessibilityIconCircle}>
                <TypeIcon size={20} />
              </div>
              <div>
                <h3 className={styles.accessibilityFeatureTitle}>Tamanho de Fonte Ajustável</h3>
                <p className={styles.accessibilityFeatureDesc}>
                  Escala de tipografia real com suporte de 12px a 24px, garantindo legibilidade sem
                  quebrar o layout e sem distorcer elementos.
                </p>
              </div>
            </div>
          </div>

          {/* Lado Direito: Caixa Interativa de Demonstração */}
          <div className={styles.accessibilityPreviewBox}>
            <div className={styles.previewHeader}>
              <SparklesIcon size={16} />
              <span>Experimente ao Vivo</span>
            </div>

            <div className={styles.previewControlsRow} suppressHydrationWarning>
              {/* Controle de Tema */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Tema da Interface:</span>
                <div className={styles.controlButtons}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className={`${styles.controlBtn} ${theme === 'light' ? styles.controlBtnActive : ''}`}
                    onClick={() => setTheme && setTheme('light')}
                    aria-label="Ativar tema claro no Cortex"
                  >
                    <SunIcon size={14} />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className={`${styles.controlBtn} ${theme === 'dark' ? styles.controlBtnActive : ''}`}
                    onClick={() => setTheme && setTheme('dark')}
                    aria-label="Ativar tema escuro no Cortex"
                  >
                    <MoonIcon size={14} />
                    <span>Escuro</span>
                  </button>
                </div>
              </div>

              {/* Controle de Alto Contraste */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Alto Contraste:</span>
                <div className={styles.controlButtons}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className={`${styles.controlBtn} ${highContrast ? styles.controlBtnActive : ''}`}
                    onClick={() => setHighContrast && setHighContrast(!highContrast)}
                    aria-label={highContrast ? 'Desativar modo alto contraste' : 'Ativar modo alto contraste'}
                  >
                    <ContrastIcon size={14} />
                    <span>{highContrast ? 'Ativado' : 'Desativado'}</span>
                  </button>
                </div>
              </div>

              {/* Controle de Tamanho de Fonte (Todos os 7 tamanhos oficiais) */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Tamanho da Fonte:</span>
                <div className={styles.controlButtons} style={{ flexWrap: 'wrap' }}>
                  {PREVIEW_FONT_SIZES.map((size) => (
                    <button
                      key={String(size)}
                      type="button"
                      suppressHydrationWarning
                      className={`${styles.controlBtn} ${fontSize === size ? styles.controlBtnActive : ''}`}
                      onClick={() => setFontSize && setFontSize(size)}
                      aria-label={`Ajustar tamanho da fonte para ${size} pixels`}
                    >
                      <span>{size}px</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
