// ==========================================
// Cortex — Serviço de Notificações
// ==========================================

import { apiFetch } from './api';
import {
  PreferenciaNotificacaoDTO,
  ConfigurarPreferenciaDTO,
} from '@/types/api';

export const notificacaoService = {
  /**
   * Obtém a lista de preferências de notificação do usuário autenticado para todos os canais
   */
  async obterPreferencias(): Promise<PreferenciaNotificacaoDTO[]> {
    return apiFetch<PreferenciaNotificacaoDTO[]>('/api/notificacoes/preferencias', {
      method: 'GET',
    });
  },

  /**
   * Atualiza as preferências de notificação para um canal específico (RN11)
   */
  async configurarPreferencias(dto: ConfigurarPreferenciaDTO): Promise<PreferenciaNotificacaoDTO> {
    return apiFetch<PreferenciaNotificacaoDTO>('/api/notificacoes/preferencias', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },
};
