'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrophyIcon, StarIcon, AwardIcon, LayersIcon } from './LandingIcons';
import styles from './landing.module.css';

export default function Gamification() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Contador de média de notas animado ao entrar na tela (alvo: 95 pts)
  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const target = 95;
    const duration = 1000; // ms
    const stepTime = 20;
    const increment = target / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setScoreCount(target);
        clearInterval(timer);
      } else {
        setScoreCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section id="gamificacao" className={`${styles.section} ${styles.sectionDark}`} aria-labelledby="gamification-heading">
      <div className={styles.landingContainer}>
        <div className={styles.gamificationGrid}>
          {/* Lado Esquerdo: Conteúdo Explicativo */}
          <div className={styles.gamificationContent}>
            <div className={styles.gamificationPill}>
              <AwardIcon size={16} />
              <span>Avaliação & Desempenho</span>
            </div>

            <h2 id="gamification-heading" className={styles.sectionTitle}>
              Tarefas com atribuição de nota e avaliação de entregas
            </h2>

            <p className={styles.sectionSubtitle}>
              No Cortex, a conclusão de uma tarefa vai além do simples checklist. Cada entrega com anexo
              pode ser avaliada com nota pelo criador da atividade, gerando histórico de desempenho,
              reconhecimento transparente e métricas consolidadas nos relatórios.
            </p>

            <div className={styles.accessibilityFeaturesList}>
              <div className={styles.accessibilityFeatureItem}>
                <div className={styles.accessibilityIconCircle}>
                  <LayersIcon size={20} />
                </div>
                <div>
                  <h3 className={styles.accessibilityFeatureTitle}>Avaliação por Tarefa</h3>
                  <p className={styles.accessibilityFeatureDesc}>
                    Ao submeter uma entrega com resposta e anexos, o responsável recebe a nota atribuída
                    e comentários do avaliador diretamente no card da tarefa.
                  </p>
                </div>
              </div>

              <div className={styles.accessibilityFeatureItem}>
                <div className={styles.accessibilityIconCircle}>
                  <TrophyIcon size={20} />
                </div>
                <div>
                  <h3 className={styles.accessibilityFeatureTitle}>Média de Notas e Desempenho</h3>
                  <p className={styles.accessibilityFeatureDesc}>
                    As notas alimentam automaticamente a média individual e da equipe, permitindo
                    identificar destaques e pontos de melhoria contínua.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Widget Visual de Avaliação de Tarefas */}
          <div ref={containerRef} className={styles.gamificationInteractiveCard}>
            <div className={styles.gamificationScoreRow}>
              <div className={styles.scoreBlock}>
                <span className={styles.scoreLabel}>Média Geral de Notas</span>
                <span className={styles.scoreValue}>{scoreCount} pts</span>
              </div>
              <div className={styles.badgeLevel}>
                <StarIcon size={14} />
                <span>Desempenho Excelente</span>
              </div>
            </div>

            <div className={styles.goalItemList}>
              {/* Tarefa 1 */}
              <div className={styles.goalItem}>
                <div className={styles.goalItemHeader}>
                  <div>
                    <span className={styles.goalItemTitle}>Relatório de Arquitetura do Sistema</span>
                    <span className={styles.floatingCardSubtitle} style={{ display: 'block', marginTop: '2px' }}>
                      Entrega avaliada por Dono / Admin
                    </span>
                  </div>
                  <span className={styles.goalItemPoints}>Nota: 95 / 100 pts</span>
                </div>
                <div className={styles.goalTrack}>
                  <div
                    className={styles.goalFill}
                    style={{ width: isVisible ? '95%' : '0%' }}
                  />
                </div>
              </div>

              {/* Tarefa 2 */}
              <div className={styles.goalItem}>
                <div className={styles.goalItemHeader}>
                  <div>
                    <span className={styles.goalItemTitle}>Implementação da Interface Responsiva</span>
                    <span className={styles.floatingCardSubtitle} style={{ display: 'block', marginTop: '2px' }}>
                      Entrega avaliada com anexos validados
                    </span>
                  </div>
                  <span className={styles.goalItemPoints}>Nota: 90 / 100 pts</span>
                </div>
                <div className={styles.goalTrack}>
                  <div
                    className={styles.goalFill}
                    style={{ width: isVisible ? '90%' : '0%' }}
                  />
                </div>
              </div>

              {/* Tarefa 3 */}
              <div className={styles.goalItem}>
                <div className={styles.goalItemHeader}>
                  <div>
                    <span className={styles.goalItemTitle}>Revisão e Resolução de Tickets</span>
                    <span className={styles.floatingCardSubtitle} style={{ display: 'block', marginTop: '2px' }}>
                      Entrega aprovada sem impedimentos
                    </span>
                  </div>
                  <span className={styles.goalItemPoints}>Nota: 100 / 100 pts</span>
                </div>
                <div className={styles.goalTrack}>
                  <div
                    className={styles.goalFill}
                    style={{ width: isVisible ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
