'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { calcularProgressoXp, TipoIconeNivel } from '@/utils/gamification';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { AnimatedCounter } from '@/components/common/AnimatedCounter/AnimatedCounter';
import {
  SproutIcon,
  StarIcon,
  ShieldIcon,
  SwordsIcon,
  CrownIcon,
  FlameIcon,
  TargetIcon,
  ZapIcon,
  LightbulbIcon,
  InfoIcon,
  XIcon,
} from '@/components/common/Icons/Icons';
import styles from './AccountLevelWidget.module.css';

function renderIconeNivel(tipo: TipoIconeNivel, size = 16, color = 'currentColor') {
  switch (tipo) {
    case 'sprout':
      return <SproutIcon size={size} color={color} />;
    case 'star':
      return <StarIcon size={size} color={color} />;
    case 'shield':
      return <ShieldIcon size={size} color={color} />;
    case 'swords':
      return <SwordsIcon size={size} color={color} />;
    case 'crown':
      return <CrownIcon size={size} color={color} />;
    case 'flame':
      return <FlameIcon size={size} color={color} />;
    default:
      return <StarIcon size={size} color={color} />;
  }
}

export interface AccountLevelWidgetProps {
  nivel?: number;
  experiencia?: number;
  variant?: 'compact' | 'sidebar' | 'card';
  showPopover?: boolean;
}

export const AccountLevelWidget: React.FC<AccountLevelWidgetProps> = ({
  nivel = 1,
  experiencia = 0,
  variant = 'compact',
  showPopover = true,
}) => {
  const { isMobileOpen, closeMobile } = useSidebar();
  const { reduceMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [showMobileToast, setShowMobileToast] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  const prevXpRef = useRef<number | null>(null);
  const prevNivelRef = useRef<number | null>(null);
  const [xpGain, setXpGain] = useState<{ amount: number; id: number } | null>(null);
  const [isLevelUp, setIsLevelUp] = useState<boolean>(false);

  useEffect(() => {
    if (prevXpRef.current !== null && experiencia > prevXpRef.current) {
      const ganho = experiencia - prevXpRef.current;
      setXpGain({ amount: ganho, id: Date.now() });
      const timer = setTimeout(() => {
        setXpGain(null);
      }, 2400);
      return () => clearTimeout(timer);
    }
    prevXpRef.current = experiencia;
  }, [experiencia]);

  useEffect(() => {
    if (prevNivelRef.current !== null && nivel > prevNivelRef.current) {
      setIsLevelUp(true);
      const timer = setTimeout(() => {
        setIsLevelUp(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    prevNivelRef.current = nivel;
  }, [nivel]);

  const progresso = calcularProgressoXp(nivel, experiencia);

  // Fecha o card/toast explicativo mobile ao fechar a barra lateral
  useEffect(() => {
    if (!isMobileOpen) {
      setShowMobileToast(false);
    }
  }, [isMobileOpen]);

  // Fecha o toast explicativo mobile ao clicar fora ou apertar Escape
  useEffect(() => {
    if (!showMobileToast) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        sidebarContainerRef.current &&
        !sidebarContainerRef.current.contains(event.target as Node)
      ) {
        setShowMobileToast(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowMobileToast(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMobileToast]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Modo SIDEBAR (Mobile)
  if (variant === 'sidebar') {
    return (
      <div
        ref={sidebarContainerRef}
        className={styles.sidebarContainer}
        role="region"
        aria-label="Nível de conta e experiência"
      >
        <div className={styles.sidebarHeader}>
          <span
            className={`${styles.levelBadge} ${isLevelUp && !reduceMotion ? styles.levelUpPulse : ''}`}
            style={{
              backgroundColor: progresso.info.corFundo,
              color: progresso.info.cor,
            }}
          >
            <span>{renderIconeNivel(progresso.info.tipoIcone, 14, progresso.info.cor)}</span>
            <span>Nível {progresso.nivel}</span>
          </span>
          <span className={styles.levelTitle} title={progresso.info.nome}>
            {progresso.info.nome}
          </span>
          {xpGain && !reduceMotion && (
            <span className={styles.sidebarXpFloat}>+{xpGain.amount} XP</span>
          )}
          <button
            type="button"
            className={styles.sidebarInfoBtn}
            onClick={() => setShowMobileToast((prev) => !prev)}
            title="Como aumentar o nível?"
            aria-label="Exibir ou ocultar explicação de como aumentar o nível"
            aria-expanded={showMobileToast}
          >
            <InfoIcon size={15} color="rgba(255, 255, 255, 0.9)" />
          </button>
        </div>

        <progress
          className={styles.progressBar}
          value={progresso.experiencia}
          max={progresso.limiteXp}
          aria-label={`Progresso de experiência: ${progresso.experiencia} de ${progresso.limiteXp} XP (${progresso.progressoPercentual}%)`}
        />

        <div className={styles.xpTextRow}>
          <span className={styles.xpNumbers}>
            <AnimatedCounter value={progresso.experiencia} /> / {progresso.limiteXp} XP
          </span>
          <span className={styles.xpPercent}>
            <AnimatedCounter value={progresso.progressoPercentual} suffix="%" />
          </span>
        </div>

        {showMobileToast && (
          <div
            className={styles.sidebarToast}
            role="status"
            aria-label="Como aumentar o nível de conta"
          >
            <div className={styles.sidebarToastHeader}>
              <div className={styles.sidebarToastTitle}>
                <LightbulbIcon size={14} color="#f5d0fe" />
                <span>Como aumentar o nível?</span>
              </div>
              <button
                type="button"
                className={styles.sidebarToastClose}
                onClick={() => setShowMobileToast(false)}
                aria-label="Fechar aviso"
              >
                <XIcon size={13} color="rgba(255, 255, 255, 0.85)" />
              </button>
            </div>

            <p className={styles.sidebarToastText}>
              Conclua <strong>metas de equipe</strong> para ganhar XP e subir de nível na sua conta!
            </p>

            <div className={styles.sidebarToastFooter}>
              <span>
                Faltam <strong>{progresso.xpRestante} XP</strong> para o Nv. {progresso.nivel + 1}
              </span>
              <Link
                href="/configuracoes?aba=minha-conta"
                className={styles.sidebarToastLink}
                onClick={() => {
                  setShowMobileToast(false);
                  closeMobile();
                }}
              >
                Ver detalhes →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modo CARD (Minha Conta / Configurações)
  if (variant === 'card') {
    return (
      <section
        className={styles.cardContainer}
        aria-labelledby="gamification-card-heading"
      >
        <div className={styles.cardHeaderRow}>
          <div className={styles.cardEmblemGroup}>
            <div
              className={`${styles.cardEmblem} ${isLevelUp && !reduceMotion ? styles.levelUpEmblemPulse : ''}`}
              style={{
                backgroundColor: progresso.info.corFundo,
                color: progresso.info.cor,
              }}
              aria-hidden="true"
            >
              {renderIconeNivel(progresso.info.tipoIcone, 32, progresso.info.cor)}
            </div>

            <div className={styles.cardTitles}>
              <span className={styles.cardLevelLabel}>Nível de Conta</span>
              <div className={styles.cardLevelNumber} id="gamification-card-heading">
                <span>Nível {progresso.nivel}</span>
                <span
                  className={styles.cardTierTag}
                  style={{
                    backgroundColor: progresso.info.corFundo,
                    color: progresso.info.cor,
                  }}
                >
                  {progresso.info.nome}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cardProgressSection} style={{ position: 'relative' }}>
          {xpGain && !reduceMotion && (
            <span className={styles.xpFloatBadge}>+{xpGain.amount} XP</span>
          )}
          <div className={styles.cardProgressStats}>
            <span>Progresso para o Nível {progresso.nivel + 1}</span>
            <span className={styles.cardProgressHighlight}>
              <AnimatedCounter value={progresso.experiencia} /> / {progresso.limiteXp} XP (<AnimatedCounter value={progresso.progressoPercentual} suffix="%" />)
            </span>
          </div>

          <progress
            className={styles.cardProgressBar}
            value={progresso.experiencia}
            max={progresso.limiteXp}
            aria-label={`Experiência acumulada: ${progresso.experiencia} de ${progresso.limiteXp} XP (${progresso.progressoPercentual}%)`}
          />

          <div className={styles.cardProgressStats}>
            <span style={{ fontSize: '12px' }}>
              Faltam apenas <strong>{progresso.xpRestante} XP</strong> para subir de nível!
            </span>
            <span style={{ fontSize: '12px', color: 'var(--cortex-purple)' }}>
              Metas de equipe concedem XP
            </span>
          </div>
        </div>

        <div className={styles.cardInfoGrid}>
          <div className={styles.cardInfoBox}>
            <span className={styles.cardInfoIcon} aria-hidden="true">
              <TargetIcon size={20} color="var(--cortex-purple)" />
            </span>
            <div>
              <div className={styles.cardInfoBoxTitle}>Metas de Equipe</div>
              <p className={styles.cardInfoBoxText}>
                Ao concluir metas compartilhadas com suas equipes, você e seus colegas acumulam XP de recompensa diretamente na conta.
              </p>
            </div>
          </div>

          <div className={styles.cardInfoBox}>
            <span className={styles.cardInfoIcon} aria-hidden="true">
              <ZapIcon size={20} color="var(--cortex-purple)" />
            </span>
            <div>
              <div className={styles.cardInfoBoxTitle}>Subida de Nível Automática</div>
              <p className={styles.cardInfoBoxText}>
                Ao alcançar o limite de {progresso.limiteXp} XP, você avança para o próximo nível instantaneamente e desbloqueia novos títulos de prestígio.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Modo COMPACT (Padrão para Header)
  return (
    <div className={styles.compactWrapper} ref={wrapperRef}>
      {xpGain && !reduceMotion && (
        <span className={styles.xpFloatBadge}>+{xpGain.amount} XP</span>
      )}

      {isLevelUp && !reduceMotion && (
        <div className={styles.levelUpBanner} role="status" aria-live="polite">
          <span style={{ fontSize: '18px' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700 }}>Subiu de Nível!</div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              Você alcançou o Nível {progresso.nivel} — {progresso.info.nome}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.compactBtn}
        onClick={() => {
          if (showPopover) {
            setIsOpen((prev) => !prev);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={`Nível ${progresso.nivel} (${progresso.info.nome}) — ${progresso.experiencia}/${progresso.limiteXp} XP. Clique para ver detalhes.`}
        aria-label={`Nível ${progresso.nivel}, ${progresso.info.nome}. ${progresso.experiencia} de ${progresso.limiteXp} pontos de experiência.`}
      >
        <span
          className={`${styles.compactLevelChip} ${isLevelUp && !reduceMotion ? styles.levelUpPulse : ''}`}
          style={{
            backgroundColor: progresso.info.corFundo,
            color: progresso.info.cor,
          }}
        >
          <span>{renderIconeNivel(progresso.info.tipoIcone, 13, progresso.info.cor)}</span>
          <span>Nv. {progresso.nivel}</span>
        </span>

        <progress
          className={styles.compactBar}
          value={progresso.experiencia}
          max={progresso.limiteXp}
          aria-hidden="true"
        />

        <span className={styles.compactXpText}>
          <AnimatedCounter value={progresso.experiencia} />/{progresso.limiteXp} XP
        </span>
      </button>

      {isOpen && showPopover && (
        <div
          className={styles.popover}
          role="dialog"
          aria-label="Detalhes de Nível e Experiência"
        >
          <div className={styles.popoverHeader}>
            <div className={styles.popoverTitle}>
              <span>{renderIconeNivel(progresso.info.tipoIcone, 16, progresso.info.cor)}</span>
              <span>Nível {progresso.nivel} — {progresso.info.nome}</span>
            </div>
          </div>

          <progress
            className={styles.progressBar}
            value={progresso.experiencia}
            max={progresso.limiteXp}
            aria-label={`Progresso de nível: ${progresso.experiencia} de ${progresso.limiteXp} XP`}
          />

          <div className={styles.xpTextRow} style={{ color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {progresso.experiencia} / {progresso.limiteXp} XP
            </span>
            <span style={{ color: 'var(--cortex-purple)', fontWeight: 600 }}>
              {progresso.progressoPercentual}%
            </span>
          </div>

          <p className={styles.popoverDescription}>
            Faltam <strong>{progresso.xpRestante} XP</strong> para alcançar o <strong>Nível {progresso.nivel + 1}</strong>.
          </p>

          <div className={styles.popoverTip}>
            <span aria-hidden="true">
              <LightbulbIcon size={14} color="var(--cortex-purple)" />
            </span>
            <span>
              Conclua <strong>metas de equipe</strong> para acumular experiência e subir no ranking da organização!
            </span>
          </div>

          <Link
            href="/configuracoes?aba=minha-conta"
            className={styles.popoverDescription}
            style={{
              color: 'var(--cortex-purple)',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'block',
              marginTop: '4px',
            }}
            onClick={() => setIsOpen(false)}
          >
            Ver detalhes em Minha Conta →
          </Link>
        </div>
      )}
    </div>
  );
};

