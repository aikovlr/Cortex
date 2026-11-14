'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { calcularProgressoXp, TipoIconeNivel } from '@/utils/gamification';
import {
  SproutIcon,
  StarIcon,
  ShieldIcon,
  SwordsIcon,
  CrownIcon,
  FlameIcon,
  UserIcon,
} from '@/components/common/Icons/Icons';
import styles from './UserLevelAvatar.module.css';

function renderIconeNivel(tipo: TipoIconeNivel, size = 14, color = 'currentColor') {
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

export interface UserLevelAvatarProps {
  fotoUrl?: string | null;
  nome?: string | null;
  nivel?: number | null;
  experiencia?: number | null;
  size?: number; // diâmetro em px (padrão 36)
  className?: string;
  showTooltip?: boolean; // exibe detalhes no hover (padrão true)
  hoverDelayMs?: number; // delay antes de abrir o hover (padrão 180ms)
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const UserLevelAvatar: React.FC<UserLevelAvatarProps> = ({
  fotoUrl,
  nome,
  nivel = 1,
  experiencia = 0,
  size = 36,
  className = '',
  showTooltip = true,
  hoverDelayMs = 180,
  style = {},
  onClick,
}) => {
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isTooltipMounted, setIsTooltipMounted] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Limpa timers ao desmontar componente
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Reseta estado de erro se a URL mudar
  useEffect(() => {
    setImgError(false);
  }, [fotoUrl]);

  const nivelNum = Number(nivel);
  const nivelEfetivo = !isNaN(nivelNum) && nivelNum > 0 ? nivelNum : 1;
  const xpNum = Number(experiencia);
  const xpEfetivo = !isNaN(xpNum) && xpNum >= 0 ? xpNum : 0;
  const progresso = calcularProgressoXp(nivelEfetivo, xpEfetivo);

  const atualizarPosicaoTooltip = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const tooltipHeight = 150;
    const padding = 12;

    // Se estiver muito próximo ao topo da janela, posiciona abaixo
    const placeBottom = rect.top < tooltipHeight + padding;
    const placement = placeBottom ? 'bottom' : 'top';

    const top = placeBottom
      ? rect.bottom + window.scrollY + 10
      : rect.top + window.scrollY - 10;

    // Centraliza horizontalmente sobre o avatar com margem de segurança nas bordas da tela
    const rawLeft = rect.left + window.scrollX + rect.width / 2;
    const minLeft = 145;
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - 145 : rawLeft;
    const left = Math.max(minLeft, Math.min(maxLeft, rawLeft));

    setTooltipPos({ top, left, placement });
  }, []);

  const abrirTooltipComDelay = useCallback(() => {
    if (!showTooltip) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    showTimeoutRef.current = setTimeout(() => {
      atualizarPosicaoTooltip();
      setIsTooltipMounted(true);
      // Próximo frame de pintura para acionar a transição CSS de fade-in
      requestAnimationFrame(() => {
        setIsFadingIn(true);
      });
    }, hoverDelayMs);
  }, [showTooltip, hoverDelayMs, atualizarPosicaoTooltip]);

  const fecharTooltipComFade = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    setIsFadingIn(false);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsTooltipMounted(false);
    }, 200);
  }, []);

  const fecharImediatamente = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsFadingIn(false);
    setIsTooltipMounted(false);
  }, []);

  // Atualiza posição do tooltip ao rolar ou redimensionar a página enquanto estiver aberto
  useEffect(() => {
    if (!isTooltipMounted) return;

    const handleScrollOrResize = () => {
      atualizarPosicaoTooltip();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fecharImediatamente();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTooltipMounted, atualizarPosicaoTooltip, fecharImediatamente]);

  // Dimensões da borda e espaçamento interno para não tampar a foto
  const borderWidth = size >= 60 ? 3 : 2;
  const paddingInner = size >= 60 ? 3.5 : 2;
  const initialLetter = nome ? nome.trim().charAt(0).toUpperCase() : null;

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles.avatarWrapper} ${className}`}
        style={{
          width: size,
          height: size,
          padding: `${paddingInner}px`,
          border: `${borderWidth}px solid ${progresso.info.cor}`,
          boxShadow: `0 0 10px ${progresso.info.cor}35`,
          ...style,
        }}
        onMouseEnter={abrirTooltipComDelay}
        onMouseLeave={fecharTooltipComFade}
        onFocus={abrirTooltipComDelay}
        onBlur={fecharTooltipComFade}
        onClick={onClick}
        tabIndex={0}
        role="img"
        aria-label={`Foto de perfil de ${nome || 'Usuário'}. Nível ${progresso.nivel} (${progresso.info.nome}), ${progresso.experiencia} de ${progresso.limiteXp} XP.`}
      >
        <div className={styles.avatarCircle}>
          {fotoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoUrl}
              alt={nome || 'Usuário'}
              className={styles.avatarImg}
              onError={() => setImgError(true)}
            />
          ) : initialLetter ? (
            <div
              className={styles.avatarFallback}
              style={{ fontSize: `${Math.round(size * 0.42)}px` }}
            >
              {initialLetter}
            </div>
          ) : (
            <div className={styles.avatarIconFallback}>
              <UserIcon size={Math.round(size * 0.46)} />
            </div>
          )}
        </div>
      </div>

      {mounted &&
        showTooltip &&
        isTooltipMounted &&
        tooltipPos &&
        createPortal(
          <div
            className={`${styles.tooltipOverlay} ${
              tooltipPos.placement === 'bottom'
                ? styles.tooltipOverlayBottom
                : styles.tooltipOverlayTop
            }`}
            style={{
              top: `${tooltipPos.top}px`,
              left: `${tooltipPos.left}px`,
            }}
            role="tooltip"
          >
            <div
              className={`${styles.tooltipCard} ${
                isFadingIn ? styles.tooltipCardVisible : ''
              }`}
            >
              <div className={styles.tooltipHeader}>
                <div className={styles.tooltipLevelRow}>
                  <span className={styles.tooltipLevelNumber}>
                    Nível {progresso.nivel}
                  </span>
                </div>
                <span
                  className={styles.tooltipTierTag}
                  style={{
                    backgroundColor: progresso.info.corFundo,
                    color: progresso.info.cor,
                  }}
                >
                  {renderIconeNivel(progresso.info.tipoIcone, 13, progresso.info.cor)}
                  <span>{progresso.info.nome}</span>
                </span>
              </div>

              {nome && <div className={styles.tooltipUserName}>{nome}</div>}

              <div className={styles.tooltipProgressSection}>
                <div className={styles.tooltipProgressStats}>
                  <span className={styles.tooltipXpLabel}>Progresso XP</span>
                  <span className={styles.tooltipXpValues}>
                    {progresso.experiencia} / {progresso.limiteXp} XP
                  </span>
                </div>

                <div className={styles.tooltipProgressBar}>
                  <div
                    className={styles.tooltipProgressFill}
                    style={{
                      width: `${progresso.progressoPercentual}%`,
                      backgroundColor: progresso.info.cor,
                    }}
                  />
                </div>
              </div>

              <div className={styles.tooltipFooter}>
                <span>Faltam {progresso.xpRestante} XP para Nv. {progresso.nivel + 1}</span>
                <span style={{ fontWeight: 700, color: progresso.info.cor }}>
                  {progresso.progressoPercentual}%
                </span>
              </div>
            </div>

            <div
              className={`${styles.tooltipArrow} ${
                isFadingIn ? styles.tooltipArrowVisible : ''
              } ${
                tooltipPos.placement === 'bottom'
                  ? styles.tooltipArrowBottom
                  : styles.tooltipArrowTop
              }`}
            />
          </div>,
          document.body
        )}
    </>
  );
};
