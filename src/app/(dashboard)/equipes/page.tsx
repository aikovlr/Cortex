'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { TeamCreateModal } from '@/components/teams/TeamCreateModal/TeamCreateModal';
import { ConsultaEquipeDTO } from '@/types/api';
import { equipeService } from '@/services/equipeService';
import styles from './page.module.css';

export default function EquipesPage() {
  const router = useRouter();
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const recarregar = useCallback(async (novaEquipe?: ConsultaEquipeDTO) => {
    if (novaEquipe) {
      setEquipes((prev) => [novaEquipe, ...prev.filter((eq) => eq.id !== novaEquipe.id)]);
    }
    try {
      setLoading(true);
      const dados = await equipeService.listarMinhasEquipes();
      setEquipes(dados);
    } catch {
      // Mantém a lista atual caso a requisição falhe
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    equipeService
      .listarMinhasEquipes()
      .then((dados) => {
        if (isMounted) {
          setEquipes(dados);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEquipes([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const equipesFiltradas = equipes.filter((eq) =>
    eq.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <>
      <Header titulo="Equipes" subtitulo="Workspace / Cortex" />

      <main className={styles.container}>
        {/* Barra de Busca + Botão Adicionar */}
        <div className={styles.toolbar}>
          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Pesquisar equipe..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            type="button"
            className={styles.addButton}
            onClick={() => setIsCreateOpen(true)}
            title="Criar nova equipe"
            aria-label="Criar nova equipe"
          >
            +
          </button>
        </div>

        {/* Grid de Cards de Equipes (Charter 6.3) */}
        {loading ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <p>Carregando equipes...</p>
          </div>
        ) : equipesFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: '36px' }}>👥</div>
            <h3 className={styles.emptyTitle}>Nenhuma equipe encontrada</h3>
            <p className={styles.emptySubtitle}>
              Você ainda não faz parte de nenhuma equipe ou não há correspondências para a busca.
            </p>
            <button
              type="button"
              className={styles.createFirstBtn}
              onClick={() => setIsCreateOpen(true)}
            >
              + Criar equipe
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {equipesFiltradas.map((equipe) => (
              <div
                key={equipe.id}
                className={styles.card}
                onClick={() => router.push(`/equipes/${equipe.id}`)}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{equipe.nome}</h3>
                  <div className={styles.cardIcon}>👥</div>
                </div>

                <div className={styles.cardMeta}>
                  <span>{equipe.membros?.length || 0} membro(s)</span>
                  <span>
                    Criada em {new Date(equipe.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Criação de Equipe (Charter 6.3.1) */}
      <TeamCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={recarregar}
      />
    </>
  );
}
