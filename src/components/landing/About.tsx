'use client';

import React from 'react';
import { LayersIcon, SparklesIcon, ShieldCheckIcon } from './LandingIcons';
import styles from './landing.module.css';

export default function About() {
  return (
    <section id="sobre" className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="about-heading">
      <div className={styles.landingContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrowLight}>Sobre o Cortex</span>
          <h2 id="about-heading" className={styles.sectionTitleLight}>
            Produtividade focada na clareza e no engajamento
          </h2>
          <p className={styles.sectionSubtitleLight}>
            Criado para substituir anotações dispersas e a sobrecarga de ferramentas complexas
            por uma experiência intuitiva e completa.
          </p>
        </div>

        <div className={styles.aboutCardLight}>
          <p className={styles.aboutLeadTextLight}>
            O Cortex é um sistema web moderno e 100% gratuito para gerenciamento de tarefas pessoais,
            administrativas e colaborativas. Desenvolvido para estudantes, profissionais e equipes
            com qualquer nível de familiaridade tecnológica, o Cortex centraliza o ciclo de vida
            das suas atividades em um ambiente simples, eliminando anotações manuais em papel e a
            complexidade excessiva de softwares técnicos que dificultam a rotina.
          </p>

          <div className={styles.aboutGrid}>
            <div className={styles.aboutItemLight}>
              <div className={styles.aboutItemIconLight}>
                <LayersIcon size={22} />
              </div>
              <h3 className={styles.aboutItemTitleLight}>Ciclo de Vida no Centro</h3>
              <p className={styles.aboutItemTextLight}>
                Acompanhe o estado de cada tarefa do início à conclusão, com prazos claros,
                priorização assertiva e histórico rastreável.
              </p>
            </div>

            <div className={styles.aboutItemLight}>
              <div className={styles.aboutItemIconLight}>
                <SparklesIcon size={22} />
              </div>
              <h3 className={styles.aboutItemTitleLight}>Simplicidade sem Sobrecarga</h3>
              <p className={styles.aboutItemTextLight}>
                Sem configurações intermináveis ou termos técnicos. Uma interface limpa e
                acessível pensada para começar a usar de imediato.
              </p>
            </div>

            <div className={styles.aboutItemLight}>
              <div className={styles.aboutItemIconLight}>
                <ShieldCheckIcon size={22} />
              </div>
              <h3 className={styles.aboutItemTitleLight}>100% Gratuito e Aberto</h3>
              <p className={styles.aboutItemTextLight}>
                Sem planos pagos, sem limites artificiais de tarefas ou equipes e sem surpresas.
                Todos os recursos estão liberados para todos os usuários.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
