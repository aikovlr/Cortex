'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { TeamCreateModal } from '@/components/teams/TeamCreateModal/TeamCreateModal';
import { SearchBar } from '@/components/common/SearchBar/SearchBar';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { UsersIcon, PlusIcon, SpinnerIcon } from '@/components/common/Icons/Icons';
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
        {/* Barra de Busca Padronizada + Botão Adicionar */}
        <div className={styles.toolbar}>
          <SearchBar
            value={termoBusca}
            onChange={setTermoBusca}
            placeholder="Pesquisar equipe..."
            maxWidth={480}
          />

          <button
            type="button"
            className={styles.addButton}
            onClick={() => setIsCreateOpen(true)}
            title="Criar nova equipe"
            aria-label="Criar nova equipe"
          >
            <PlusIcon size={20} color="#ffffff" />
          </button>
        </div>

        {/* Grid de Cards de Equipes (Charter 6.3) */}
        {loading ? (
          <EmptyState
            icon={<SpinnerIcon size={32} color="var(--cortex-purple)" />}
            title="Carregando equipes..."
            description="Aguarde um momento enquanto buscamos as equipes."
          />
        ) : equipesFiltradas.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={32} color="var(--cortex-purple)" />}
            title="Nenhuma equipe encontrada"
            description="Você ainda não faz parte de nenhuma equipe ou não há correspondências para a busca."
            action={
              <button
                type="button"
                className={styles.createFirstBtn}
                onClick={() => setIsCreateOpen(true)}
              >
                <PlusIcon size={16} /> Criar equipe
              </button>
            }
          />
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
                  <div className={styles.cardIcon}>
                    <UsersIcon size={18} color="var(--cortex-purple)" />
                  </div>
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
