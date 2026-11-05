'use client';

import React, { useEffect, useRef, useState } from 'react';
import { STEPS } from './constants';
import styles from './landing.module.css';

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isDrawn, setIsDrawn] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsDrawn(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className={`${styles.section} ${styles.sectionLightAlt}`}
      aria-labelledby="how-it-works-heading"
    >
      <div className={styles.landingContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrowLight}>Fluxo de Trabalho</span>
          <h2 id="how-it-works-heading" className={styles.sectionTitleLight}>
            Como o Cortex funciona na prática
          </h2>
          <p className={styles.sectionSubtitleLight}>
            Quatro etapas simples para estruturar seu fluxo pessoal ou colaborar com sua equipe em minutos.
          </p>
        </div>

        <div className={styles.stepsWrapper}>
          {/* Linha Conectora Animada em Modo Claro */}
          <div className={styles.stepsConnectorLineLight} aria-hidden="true">
            <div
              className={`${styles.stepsConnectorLineActive} ${
                isDrawn ? styles.drawn : ''
              }`}
            />
          </div>

          {STEPS.map((step) => (
            <div key={step.number} className={styles.stepCardLight}>
              <div className={styles.stepNumberCircleLight} aria-hidden="true">
                {step.number}
              </div>
              <h3 className={styles.stepTitleLight}>{step.title}</h3>
              <p className={styles.stepDescriptionLight}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
