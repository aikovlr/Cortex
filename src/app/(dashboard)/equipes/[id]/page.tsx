'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/Components/Header/header';
import { Badge } from '@/components/common/Badge/Badge';
import { AddMemberModal } from '@/components/teams/AddMemberModal/AddMemberModal';
import {
  ConsultaEquipeDTO,
  ConsultaMembroEquipeDTO,
  ConsultaTicketReporteDTO,
  CargoEquipe,
} from '@/types/api';
import { equipeService } from '@/services/equipeService';
import { ticketService } from '@/services/ticketService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

export default function EquipeDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const equipeId = Number(resolvedParams.id);

  const router = useRouter();
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [equipe, setEquipe] = useState<ConsultaEquipeDTO | null>(null);
  const [membros, setMembros] = useState<ConsultaMembroEquipeDTO[]>([]);
  const [tickets, setTickets] = useState<ConsultaTicketReporteDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal adicionar membro
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);

  // Permissões do usuário atual nesta equipe
  const meuMembro = membros.find((m) => m.usuarioId === usuario?.id);
  const isOwner = meuMembro?.cargo === 'Dono';
  const isAdminOrOwner = isOwner || meuMembro?.cargo === 'Admin';

  const recarregar = useCallback(() => {
    if (!equipeId) return;

    setLoading(true);
    Promise.all([
      equipeService.obterPorId(equipeId),
      equipeService.listarMembros(equipeId),
      ticketService.listarTicketsPorEquipe(equipeId).catch(() => []),
    ])
      .then(([eq, mem, tick]) => {
        setEquipe(eq);
        setMembros(mem);
        setTickets(tick);
      })
      .catch((err) => {
        showToast(err.message || 'Erro ao carregar equipe', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [equipeId, showToast]);

  useEffect(() => {
    let isMounted = true;
    if (!equipeId) return;

    Promise.all([
      equipeService.obterPorId(equipeId),
      equipeService.listarMembros(equipeId),
      ticketService.listarTicketsPorEquipe(equipeId).catch(() => []),
    ])
      .then(([eq, mem, tick]) => {
        if (isMounted) {
          setEquipe(eq);
          setMembros(mem);
          setTickets(tick);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast(err.message || 'Erro ao carregar equipe', 'error');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [equipeId, showToast]);

  const handleRemoverMembro = async (membroId: number, nome: string) => {
    if (!window.confirm(`Deseja remover ${nome} da equipe?`)) return;

    try {
      await equipeService.removerMembro(equipeId, membroId);
      showToast('Membro removido com sucesso.', 'success');
      recarregar();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleAlterarCargo = async (membroId: number, novoCargo: CargoEquipe) => {
    try {
      await equipeService.alterarCargo(equipeId, membroId, novoCargo);
      showToast(`Cargo alterado para ${novoCargo}!`, 'success');
      recarregar();
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleExcluirEquipe = async () => {
    if (!equipe) return;
    const confirmacao = window.confirm(
      `Tem certeza de que deseja excluir a equipe "${equipe.nome}"? Esta ação é irreversível e removerá todos os membros e vínculos associados.`
    );
    if (!confirmacao) return;

    try {
      setDeletingTeam(true);
      await equipeService.excluirEquipe(equipeId);
      showToast('Equipe excluída com sucesso!', 'success');
      router.push('/equipes');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao excluir equipe.', 'error');
      }
      setDeletingTeam(false);
    }
  };

  const handleFecharTicket = async (ticketId: number) => {
    try {
      await ticketService.fecharTicket(ticketId);
      showToast('Ticket resolvido e fechado com sucesso!', 'success');
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const formatarData = (isoDate: string) => {
    const data = new Date(isoDate);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      <Header
        titulo={equipe?.nome || 'Equipe'}
        subtitulo="Workspace / Cortex / Equipes"
      />

      <main className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.teamHeading}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => router.push('/equipes')}
            >
              ← Voltar para todas as equipes
            </button>
            <h2 className={styles.teamName}>{equipe?.nome || 'Detalhes da Equipe'}</h2>
            <span className={styles.teamSubtitle}>
              {membros.length} integrante(s) • Criada em{' '}
              {equipe ? formatarData(equipe.dataCriacao) : ''}
            </span>
          </div>

          <div className={styles.actionsWrapper}>
            {isOwner && (
              <button
                type="button"
                className={styles.deleteTeamBtn}
                onClick={handleExcluirEquipe}
                disabled={deletingTeam}
                title="Excluir equipe permanentemente (Apenas Dono)"
              >
                {deletingTeam ? 'Excluindo...' : '🗑️ Excluir equipe'}
              </button>
            )}

            {isAdminOrOwner && (
              <button
                type="button"
                className={styles.addMemberBtn}
                onClick={() => setIsAddMemberOpen(true)}
              >
                + Adicionar membro
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Membros (Charter 6.3.2) */}
        <div className={styles.card}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cortex-gray-text)' }}>
              Carregando integrantes da equipe...
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Integrante</th>
                  <th className={styles.th}>Desde</th>
                  <th className={styles.th}>Cargo</th>
                  {isAdminOrOwner && (
                    <th className={styles.th} style={{ textAlign: 'right' }}>
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {membros.map((membro) => {
                  const nome = membro.usuario?.nome || 'Colaborador';
                  const email = membro.usuario?.email || '';

                  return (
                    <tr key={membro.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.memberInfo}>
                          {membro.usuario?.fotoPerfil?.urlCaminho ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={membro.usuario.fotoPerfil.urlCaminho}
                              alt={nome}
                              className={styles.avatar}
                            />
                          ) : (
                            <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px' }}>
                              👤
                            </div>
                          )}
                          <div className={styles.memberText}>
                            <span className={styles.memberName}>{nome}</span>
                            <span className={styles.memberEmail}>{email}</span>
                          </div>
                        </div>
                      </td>

                      <td className={styles.td}>
                        {formatarData(membro.dataEntrada)}
                      </td>

                      <td className={styles.td}>
                        {isOwner && membro.cargo !== 'Dono' ? (
                          <select
                            value={membro.cargo}
                            className={styles.roleSelect}
                            onChange={(e) =>
                              handleAlterarCargo(membro.id, e.target.value as CargoEquipe)
                            }
                          >
                            <option value="Admin">Admin</option>
                            <option value="Membro">Membro</option>
                          </select>
                        ) : (
                          <Badge type="cargo" value={membro.cargo} />
                        )}
                      </td>

                      {isAdminOrOwner && (
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          {membro.cargo !== 'Dono' && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.removeBtn}`}
                              onClick={() => handleRemoverMembro(membro.id, nome)}
                              title="Remover da equipe"
                            >
                              Remover
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Seção de Tickets de Reporte da Equipe (RF008) */}
        {isAdminOrOwner && tickets.length > 0 && (
          <section className={styles.ticketSection}>
            <h3 className={styles.ticketTitle}>
              🚨 Tickets de Problemas Reportados na Equipe ({tickets.length})
            </h3>
            <div className={styles.ticketGrid}>
              {tickets.map((ticket) => (
                <div key={ticket.id} className={styles.ticketCard}>
                  <div className={styles.ticketHeader}>
                    <span className={styles.ticketAuthor}>
                      👤 {ticket.usuario?.nome || 'Membro'}
                    </span>
                    <Badge type="prioridade" value="Urgente" />
                  </div>
                  <p className={styles.ticketDesc}>{ticket.descricao}</p>
                  <button
                    type="button"
                    className={styles.resolveTicketBtn}
                    onClick={() => handleFecharTicket(ticket.id)}
                  >
                    ✔ Marcar como resolvido
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Adicionar Membro (Charter 6.3.3) */}
      <AddMemberModal
        equipeId={equipeId}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={recarregar}
      />
    </>
  );
}
