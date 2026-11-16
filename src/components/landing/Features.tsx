'use client';

import React from 'react';
import { FEATURES } from './constants';
import {
  LayersIcon,
  UsersIcon,
  GitPullRequestIcon,
  TargetIcon,
  BarChartIcon,
  BellIcon,
  SlidersIcon,
} from './LandingIcons';
import { BlurFade } from '@/components/magicui/blur-fade';
import styles from './landing.module.css';

export default function Features() {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'layers':
        return <LayersIcon size={24} />;
      case 'users':
        return <UsersIcon size={24} />;
      case 'collaboration':
        return <GitPullRequestIcon size={24} />;
      case 'target':
        return <TargetIcon size={24} />;
      case 'chart':
        return <BarChartIcon size={24} />;
      case 'bell':
        return <BellIcon size={24} />;
      case 'accessibility':
        return <SlidersIcon size={24} />;
      default:
        return <LayersIcon size={24} />;
    }
  };

  return (
    <section id="recursos" className={`${styles.section} ${styles.sectionDark}`} aria-labelledby="features-heading">
      <div className={styles.landingContainer}>
        <BlurFade delay={0.05}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Funcionalidades Essenciais</span>
            <h2 id="features-heading" className={styles.sectionTitle}>
              Tudo o que você precisa para gerenciar atividades
            </h2>
            <p className={styles.sectionSubtitle}>
              Recursos práticos e objetivos projetados para manter indivíduos e equipes alinhados em cada etapa.
            </p>
          </div>
        </BlurFade>

        {/* Bento Grid com os cards aparecendo aos poucos */}
        <div className={styles.bentoGrid}>
          {FEATURES.map((feature, index) => {
            const isSpan2 = index === 0 || index === 3;
            return (
              <BlurFade
                key={feature.id}
                variant="pop"
                delay={index * 0.08}
                className={isSpan2 ? styles.bentoSpan2 : ''}
              >
                <div className={styles.bentoCard} style={{ height: '100%' }}>
                  <div className={styles.bentoCardContent}>
                    <div className={styles.bentoIconWrapper}>
                      {renderIcon(feature.iconName)}
                    </div>
                    <h3 className={styles.bentoTitle}>{feature.title}</h3>
                    <p className={styles.bentoDescription}>{feature.description}</p>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
