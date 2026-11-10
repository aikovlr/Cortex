import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Gamification from '@/components/landing/Gamification';
import Audience from '@/components/landing/Audience';
import AccessibilitySection from '@/components/landing/AccessibilitySection';
import FinalCta from '@/components/landing/FinalCta';
import Footer from '@/components/landing/Footer';
import { AUTH_ROUTE } from '@/components/landing/constants';
import styles from '@/components/landing/landing.module.css';

// Rota centralizada conforme requisito da Seção 4 do prompt
export { AUTH_ROUTE };

export const metadata: Metadata = {
  title: 'Cortex — Gerenciador de Tarefas e Equipes | 100% Gratuito',
  description:
    'O Cortex é um sistema web moderno e gratuito para organizar tarefas pessoais e colaborativas, promovendo comunicação ágil, gamificação e foco em resultados.',
};

export default function HomePage() {
  return (
    <div className={styles.landingRoot}>
      <a href="#conteudo-principal" className={styles.skipLink}>
        Pular para o conteúdo principal
      </a>
      {/* 1. Cabeçalho (Navbar Fixa) */}
      <Navbar />

      <main id="conteudo-principal">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Sobre o Cortex */}
        <About />

        {/* 4. Recursos */}
        <Features />

        {/* 5. Como Funciona */}
        <HowItWorks />

        {/* 6. Gamificação e Metas */}
        <Gamification />

        {/* 7. Benefícios / Para Quem É */}
        <Audience />

        {/* 8. Acessibilidade */}
        <AccessibilitySection />

        {/* 9. Chamada Final (CTA) */}
        <FinalCta />
      </main>

      {/* 10. Rodapé */}
      <Footer />
    </div>
  );
}
