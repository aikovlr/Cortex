'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, NotificacaoBackendDTO } from '@/services/notificationService';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  showPushNotification,
  testPushNotification,
  PushPermissionStatus,
  TestPushResult,
} from '@/services/pushNotificationService';

export type TipoNotificacao =
  | 'tarefa'
  | 'tarefa_vencida'
  | 'tarefa_urgente'
  | 'resposta_ticket'
  | 'ticket_criador'
  | 'ticket'
  | 'sugestao'
  | 'equipe'
  | 'meta'
  | 'meta_expirada';

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
  dispararNotificacaoVisualTeste: (custom?: Partial<NotificacaoItem>) => NotificacaoItem;
  buscarNovasNotificacoes: () => Promise<void>;
  pushPermission: PushPermissionStatus;
  solicitarPermissaoPush: () => Promise<PushPermissionStatus>;
  testarNotificacaoPush: () => Promise<TestPushResult>;
  atualizarPermissaoPush: () => void;
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
  const [pushPermission, setPushPermission] = useState<PushPermissionStatus>('default');

  const notificacoesConhecidasRef = useRef<Set<string>>(new Set());
  const primeiraCargaRef = useRef<boolean>(true);
  const visualNotificacoesRef = useRef<NotificacaoItem[]>([]);

  // Inicializa o Service Worker e obtém o status inicial da permissão no cliente
  useEffect(() => {
    registerServiceWorker();
    setPushPermission(getNotificationPermission());
  }, []);

  // Reseta referências de rastreamento ao trocar de usuário ou deslogar
  useEffect(() => {
    if (!usuario) {
      notificacoesConhecidasRef.current.clear();
      primeiraCargaRef.current = true;
    }
  }, [usuario]);

  // Busca notificações persistidas no banco de dados para o usuário autenticado
  const buscarNovasNotificacoes = useCallback(async () => {
    if (!usuario) {
      setNotificacoes([]);
      return;
    }

    try {
      const listaDb: NotificacaoBackendDTO[] = await notificationService.listarNotificacoes();

      if (!Array.isArray(listaDb)) {
        setNotificacoes([]);
        return;
      }

      const mapeadas: NotificacaoItem[] = listaDb.map((n) => {
        let tipo = (n.tipo as TipoNotificacao) || 'tarefa';

        const isReporteAberto =
          n.tipo === 'ticket_criador' ||
          (n.tipo === 'ticket' &&
            (Boolean(n.destaque) ||
              n.titulo?.toLowerCase().includes('reporte') ||
              n.titulo?.toLowerCase().includes('aberto'))) ||
          Boolean(n.titulo && n.titulo.toLowerCase().includes('ticket de reporte'));

        const isRespostaTicket =
          n.tipo === 'resposta_ticket' ||
          (n.tipo === 'ticket' &&
            (n.titulo?.toLowerCase().includes('resolvido') ||
              n.titulo?.toLowerCase().includes('resposta')));

        const isMetaExpirada =
          n.tipo === 'meta_expirada' ||
          Boolean(n.titulo && (n.titulo.toLowerCase().includes('penalidade') || n.titulo.toLowerCase().includes('meta expirada'))) ||
          Boolean(n.mensagem && (n.mensagem.toLowerCase().includes('penalidade') || n.mensagem.toLowerCase().includes('deduzidos')));

        const isMeta =
          isMetaExpirada ||
          n.tipo === 'meta' ||
          Boolean(n.titulo && n.titulo.toLowerCase().includes('meta')) ||
          Boolean(n.link && n.link.startsWith('/metas'));

        if (isReporteAberto) {
          tipo = 'ticket_criador';
        } else if (isRespostaTicket) {
          tipo = 'resposta_ticket';
        } else if (isMetaExpirada) {
          tipo = 'meta_expirada';
        } else if (isMeta) {
          tipo = 'meta';
        }

        return {
          id: String(n.id),
          tipo,
          titulo: n.titulo,
          mensagem: n.mensagem,
          dataCriacao: n.dataCriacao,
          lida: Boolean(n.lida),
          destaque: isReporteAberto ? true : (isMetaExpirada ? false : Boolean(n.destaque)),
          tarefaId: n.tarefaId || undefined,
          link: n.link || (isMeta ? '/metas' : '/minhas-tarefas'),
        };
      });

      // Ordena por data decrescente (mais recentes primeiro)
      mapeadas.sort(
        (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      );

      // Tratamento de notificações push nativas em tempo real
      if (primeiraCargaRef.current) {
        // Na primeira leitura após carregamento, registra IDs conhecidos sem disparar push em massa
        mapeadas.forEach((item) => notificacoesConhecidasRef.current.add(item.id));
        primeiraCargaRef.current = false;
      } else {
        // Em leituras subsequentes (polling / foco da janela / evento), dispara push para novos itens não lidos
        const novasNotificacoes = mapeadas.filter(
          (item) => !notificacoesConhecidasRef.current.has(item.id) && !item.lida
        );

        mapeadas.forEach((item) => notificacoesConhecidasRef.current.add(item.id));

        if (novasNotificacoes.length > 0 && isPushSupported() && Notification.permission === 'granted') {
          if (novasNotificacoes.length <= 3) {
            novasNotificacoes.forEach((item) => {
              showPushNotification({
                title: item.titulo,
                body: item.mensagem,
                link: item.link,
                tag: `cortex-${item.id}`,
              });
            });
          } else {
            showPushNotification({
              title: `Cortex — ${novasNotificacoes.length} novas notificações`,
              body: `Você possui ${novasNotificacoes.length} novas atualizações pendentes no Cortex.`,
              link: '/minhas-tarefas',
              tag: 'cortex-batch-notif',
            });
          }
        }
      }

      // Preserva notificações visuais locais
      const visualAtivas = visualNotificacoesRef.current.filter(
        (v) => !listaDb.some((db) => String(db.id) === v.id)
      );
      setNotificacoes([...visualAtivas, ...mapeadas]);
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
    window.addEventListener('focus', handleAtualizacao);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cortex_tarefas_alteradas', handleAtualizacao);
      window.removeEventListener('focus', handleAtualizacao);
    };
  }, [buscarNovasNotificacoes]);

  // Marca uma notificação individual como lida
  const marcarComoLida = useCallback(
    async (id: string) => {
      visualNotificacoesRef.current = visualNotificacoesRef.current.map((item) =>
        item.id === id ? { ...item, lida: true } : item
      );
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
    visualNotificacoesRef.current = visualNotificacoesRef.current.map((item) => ({ ...item, lida: true }));
    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })));

    try {
      await notificationService.marcarTodasComoLidas();
    } catch {}
  }, []);

  // Limpa todas as notificações do usuário no banco de dados
  const limparNotificacoes = useCallback(async () => {
    visualNotificacoesRef.current = [];
    setNotificacoes([]);

    try {
      await notificationService.limparNotificacoes();
    } catch {}
  }, []);

  // Remove uma notificação individual no banco de dados
  const removerNotificacao = useCallback(async (id: string) => {
    visualNotificacoesRef.current = visualNotificacoesRef.current.filter((item) => item.id !== id);
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

  const dispararNotificacaoVisualTeste = useCallback((custom?: Partial<NotificacaoItem>): NotificacaoItem => {
    const exemplos: Array<Omit<NotificacaoItem, 'id' | 'dataCriacao' | 'lida'>> = [
      {
        tipo: 'tarefa',
        titulo: 'Nova Tarefa Atribuída',
        mensagem: 'Você recebeu a tarefa "Refatorar componentes de acessibilidade".',
        link: '/minhas-tarefas',
        destaque: true,
      },
      {
        tipo: 'equipe',
        titulo: 'Entrada na Equipe',
        mensagem: 'Você agora faz parte da equipe "Desenvolvimento Core".',
        link: '/equipes',
        destaque: false,
      },
      {
        tipo: 'meta',
        titulo: 'Meta Atualizada',
        mensagem: 'Sua meta "Concluir 10 sprints no trimestre" alcançou 80% do objetivo.',
        link: '/metas',
        destaque: false,
      },
      {
        tipo: 'ticket',
        titulo: 'Ticket Respondido',
        mensagem: 'O ticket #42 aberto na tarefa recebeu uma nova resposta da equipe.',
        link: '/minhas-tarefas',
        destaque: false,
      },
      {
        tipo: 'sugestao',
        titulo: 'Nova Sugestão de Melhoria',
        mensagem: 'Um membro da sua equipe adicionou uma sugestão para revisão.',
        link: '/minhas-tarefas',
        destaque: false,
      },
    ];

    const exemploSorteado = exemplos[Math.floor(Math.random() * exemplos.length)];
    const id = `visual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const novaNotificacao: NotificacaoItem = {
      id,
      tipo: custom?.tipo || exemploSorteado.tipo,
      titulo: custom?.titulo || exemploSorteado.titulo,
      mensagem: custom?.mensagem || exemploSorteado.mensagem,
      link: custom?.link || exemploSorteado.link,
      destaque: custom?.destaque ?? exemploSorteado.destaque,
      dataCriacao: new Date().toISOString(),
      lida: false,
      ...custom,
    };

    visualNotificacoesRef.current = [novaNotificacao, ...visualNotificacoesRef.current];
    notificacoesConhecidasRef.current.add(id);

    setNotificacoes((prev) => [novaNotificacao, ...prev.filter((p) => p.id !== id)]);

    return novaNotificacao;
  }, []);

  const solicitarPermissaoPush = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setPushPermission(perm);
    return perm;
  }, []);

  const testarNotificacaoPush = useCallback(async () => {
    const resultado = await testPushNotification();
    setPushPermission(resultado.status);
    return resultado;
  }, []);

  const atualizarPermissaoPush = useCallback(() => {
    setPushPermission(getNotificationPermission());
  }, []);

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
        dispararNotificacaoVisualTeste,
        buscarNovasNotificacoes,
        pushPermission,
        solicitarPermissaoPush,
        testarNotificacaoPush,
        atualizarPermissaoPush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
