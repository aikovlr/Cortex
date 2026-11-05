'use client';

import React from 'react';
import Link from 'next/link';
import { REGISTER_ROUTE } from './constants';
import { ArrowRightIcon, SparklesIcon } from './LandingIcons';
import styles from './landing.module.css';

export default function FinalCta() {
  return (
    <section className={styles.ctaSection} aria-labelledby="cta-heading">
      <div className={styles.landingContainer}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaBadgeFree}>
            <SparklesIcon size={14} />
            <span>Acesso Total e Imediato</span>
          </div>

          <h2 id="cta-heading" className={styles.ctaTitle}>
            Pronto para transformar sua produtividade e a gestão da sua equipe?
          </h2>

          <p className={styles.ctaSubtitle}>
            Crie sua conta no Cortex agora mesmo. Sem mensalidades, sem limites de tarefas
            e sem necessidade de cartão de crédito.
          </p>

          <div className={styles.heroCtaGroup}>
            <Link
              href={REGISTER_ROUTE}
              className={styles.btnPrimary}
              aria-label="Criar conta grátis no Cortex agora"
            >
              <span>Criar conta grátis</span>
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

