'use client';

import React from 'react';
import Link from 'next/link';
import { AUTH_ROUTE, REGISTER_ROUTE } from './constants';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from './LandingIcons';
import styles from './landing.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection} aria-labelledby="hero-heading">
      <div className={styles.landingContainer}>
        <div className={styles.heroGrid}>
          {/* Conteúdo Textual da Hero com Fade e Stagger */}
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true" />
              <span>100% Gratuito e Seguro</span>
            </div>

            <h1 id="hero-heading" className={styles.heroTitle}>
              Organize suas tarefas <br />
              <span className={styles.heroTitleHighlight}>pessoais e de equipe</span> em um só lugar
            </h1>

            <p className={styles.heroSubtitle}>
              O Cortex é a plataforma web moderna e intuitiva para planejar atividades,
              gerenciar equipes com hierarquia clara e conquistar metas com gamificação integrada.
            </p>

            <div className={styles.heroCtaGroup}>
              <Link
                href={REGISTER_ROUTE}
                className={styles.btnPrimary}
                aria-label="Criar conta grátis no Cortex"
              >
                <span>Criar conta grátis</span>
                <ArrowRightIcon size={18} />
              </Link>

              <Link
                href={AUTH_ROUTE}
                className={styles.btnSecondary}
                aria-label="Acessar conta existente no Cortex"
              >
                <span>Já tenho conta</span>
              </Link>
            </div>

            <div className={styles.heroGuarantee}>
              <ShieldCheckIcon size={16} />
              <span>Sem custos e sem assinaturas.</span>
            </div>
          </div>

          {/* Ilustração Feita Somente com CSS e Ícones SVG (Sem Imagens) */}
          <div className={styles.heroIllustration} aria-hidden="true">
            <div className={styles.illustrationCanvas}>
              {/* Card Flutuante Terciário (Colaboração e Equipe) */}
              <div className={styles.heroTaskCardTertiary}>
                <div className={styles.avatarGroup}>
                  <div className={styles.avatarCircle}>JD</div>
                  <div className={styles.avatarCircle}>AM</div>
                  <div className={styles.avatarCircle}>CR</div>
                </div>
                <div className={styles.floatingCardContent}>
                  <span className={styles.floatingCardTitle}>Equipe Ágil</span>
                  <span className={styles.floatingCardSubtitle}>3 membros ativos</span>
                </div>
              </div>

              {/* Card Principal da Ilustração (Gestão de Tarefas) */}
              <div className={styles.heroTaskCardPrimary}>
                <div className={styles.heroCardHeader}>
                  <div className={styles.heroCardBadges}>
                    <span className={styles.badgePriority}>Alta Prioridade</span>
                    <span className={styles.badgeStatus}>Em andamento</span>
                  </div>
                  <span className={styles.scoreBadge}>
                    <StarIcon size={12} />
                    100 pts
                  </span>
                </div>

                <h2 className={styles.heroCardTitle}>
                  Entrega do Projeto Semestral
                </h2>

                <div className={styles.heroCardMeta}>
                  <div className={styles.heroCardMetaItem}>
                    <ClockIcon size={14} />
                    <span>Vence amanhã</span>
                  </div>
                  <div className={styles.heroCardMetaItem}>
                    <UsersIcon size={14} />
                    <span>Desenvolvimento</span>
                  </div>
                </div>
              </div>

              {/* Card Flutuante Secundário (Avaliação de Tarefas) */}
              <div className={styles.heroTaskCardSecondary}>
                <div className={styles.iconCircleSuccess}>
                  <CheckCircleIcon size={20} />
                </div>
                <div className={styles.floatingCardContent}>
                  <span className={styles.floatingCardTitle}>Tarefa Avaliada</span>
                  <span className={styles.floatingCardSubtitle}>Nota: 95 / 100 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
