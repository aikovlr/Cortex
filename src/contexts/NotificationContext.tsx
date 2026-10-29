'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, NotificacaoBackendDTO } from '@/services/notificationService';

export type TipoNotificacao =
  | 'tarefa'
  | 'tarefa_vencida'
  | 'tarefa_urgente'
  | 'resposta_ticket'
  | 'ticket_criador'
  | 'sugestao';

export interface NotificacaoItem {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dataCriacao: string;
  lida: boolean;
  tarefaId?: number;
  tarefaTitulo?: string;
  link: string;
  destaque?: boolean;
}

interface NotificationContextData {
  notificacoes: NotificacaoItem[];
  naoLidasCount: number;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  limparNotificacoes: () => Promise<void>;
  removerNotificacao: (id: string) => Promise<void>;
  adicionarNotificacao: (item: Omit<NotificacaoItem, 'id' | 'dataCriacao' | 'lida'>) => void;
  buscarNovasNotificacoes: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

/**
 * Funções mantidas como no-op para compatibilidade com chamadas legadas
 * As notificações agora são geradas e salvas diretamente no banco de dados pelo backend
 */
export function notificarNovoResponsavelTarefa(
  _responsavelUsuarioId: number,
  _tarefaId: number,
  _tarefaTitulo: string,
  _prioridade?: string
) {}

export function notificarCriadorTicketAberto(
  _criadorUsuarioId: number,
  _tarefaId: number,
  _tarefaTitulo: string,
  _descricaoTicket?: string
) {}

export function notificarCriadorSugestaoEnviada(
  _criadorUsuarioId: number,
  _tarefaId: number,
  _tarefaTitulo: string,
  _descricaoSugestao?: string
) {}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);

  // Busca notificações persistidas no banco de dados para o usuário autenticado
  const buscarNovasNotificacoes = useCallback(async () => {
    if (!usuario) {
      setNotificacoes([]);
      return;
    }

    try {
      const listaDb: NotificacaoBackendDTO[] = await notificationService.listarNotificacoes();

      const mapeadas: NotificacaoItem[] = listaDb.map((n) => ({
        id: String(n.id),
        tipo: (n.tipo as TipoNotificacao) || 'tarefa',
        titulo: n.titulo,
        mensagem: n.mensagem,
        dataCriacao: n.dataCriacao,
        lida: Boolean(n.lida),
        destaque: Boolean(n.destaque),
        tarefaId: n.tarefaId || undefined,
        link: n.link || '/minhas-tarefas',
      }));

      // Ordena por data decrescente (mais recentes primeiro)
      mapeadas.sort(
        (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );

      setNotificacoes(mapeadas);
    } catch {
      // Falha silenciosa em caso de indisponibilidade momentânea da API
    }
  }, [usuario]);

  // Carrega notificações ao montar e escuta eventos de alteração
  useEffect(() => {
    buscarNovasNotificacoes();

    // Polling regular a cada 20 segundos
    const interval = setInterval(() => {
      buscarNovasNotificacoes();
    }, 20000);

    const handleAtualizacao = () => {
      buscarNovasNotificacoes();
    };

    window.addEventListener('cortex_tarefas_alteradas', handleAtualizacao);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cortex_tarefas_alteradas', handleAtualizacao);
    };
  }, [buscarNovasNotificacoes]);

  // Marca uma notificação individual como lida
  const marcarComoLida = useCallback(
    async (id: string) => {
      setNotificacoes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, lida: true } : item))
      );

      const numId = Number(id);
      if (!isNaN(numId)) {
        try {
          await notificationService.marcarComoLida(numId);
        } catch {}
      }
    },
    []
  );

  // Marca todas as notificações como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })));

    try {
      await notificationService.marcarTodasComoLidas();
    } catch {}
  }, []);

  // Limpa todas as notificações do usuário no banco de dados
  const limparNotificacoes = useCallback(async () => {
    setNotificacoes([]);

    try {
      await notificationService.limparNotificacoes();
    } catch {}
  }, []);

  // Remove uma notificação individual no banco de dados
  const removerNotificacao = useCallback(async (id: string) => {
    setNotificacoes((prev) => prev.filter((item) => item.id !== id));

    const numId = Number(id);
    if (!isNaN(numId)) {
      try {
        await notificationService.removerNotificacao(numId);
      } catch {}
    }
  }, []);

  const adicionarNotificacao = useCallback(
    (_item: Omit<NotificacaoItem, 'id' | 'dataCriacao' | 'lida'>) => {
      buscarNovasNotificacoes();
    },
    [buscarNovasNotificacoes]
  );

  const naoLidasCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <NotificationContext.Provider
      value={{
        notificacoes,
        naoLidasCount,
        marcarComoLida,
        marcarTodasComoLidas,
        limparNotificacoes,
        removerNotificacao,
        adicionarNotificacao,
        buscarNovasNotificacoes,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
