// ==========================================
// Cortex — Serviço de Notificações (/api/notificacoes)
// ==========================================

import { apiFetch } from './api';

export interface NotificacaoBackendDTO {
  id: number;
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string;
  lida: boolean;
  destaque: boolean;
  tarefaId?: number | null;
  dataCriacao: string;
}

export const notificationService = {
  /**
   * Obtém a lista de notificações do usuário logado diretamente do banco de dados
   */
  async listarNotificacoes(): Promise<NotificacaoBackendDTO[]> {
    return apiFetch<NotificacaoBackendDTO[]>('/api/notificacoes', {
      method: 'GET',
    });
  },

  /**
   * Marca uma notificação individual como lida no banco de dados
   */
  async marcarComoLida(id: number): Promise<void> {
    await apiFetch<void>(`/api/notificacoes/${id}/lida`, {
      method: 'PUT',
    });
  },

  /**
   * Marca todas as notificações do usuário como lidas no banco de dados
   */
  async marcarTodasComoLidas(): Promise<void> {
    await apiFetch<void>('/api/notificacoes/marcar-todas-lidas', {
      method: 'PUT',
    });
  },

  /**
   * Limpa todas as notificações do usuário logado no banco de dados
   */
  async limparNotificacoes(): Promise<void> {
    await apiFetch<void>('/api/notificacoes', {
      method: 'DELETE',
    });
  },

  /**
   * Remove uma notificação individual do banco de dados
   */
  async removerNotificacao(id: number): Promise<void> {
    await apiFetch<void>(`/api/notificacoes/${id}`, {
      method: 'DELETE',
    });
  },
};
