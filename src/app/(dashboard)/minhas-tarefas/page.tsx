'use client';

import React from 'react';
import Header from '@/app/Components/Header/header';
import styles from './page.module.css';

export default function MinhasTarefasPage() {
  return (
    <>
      <Header titulo="Minhas tarefas" />
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Carregando tarefas...</h2>
          <p>Esta área será populada na Fase 3 com a listagem completa e filtros.</p>
        </div>
      </div>
    </>
  );
}
