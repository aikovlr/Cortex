// ==========================================
// Cortex — Serviço de Sugestões de Alteração (RF004 / RN14)
// ==========================================

import { apiFetch } from './api';
import { ConsultaSugestaoDTO } from '@/types/api';

export const sugestaoService = {
  /**
   * Submete uma sugestão de alteração para o criador da tarefa
   */
  async submeterSugestao(tarefaId: number, descricao: string): Promise<ConsultaSugestaoDTO> {
    return apiFetch<ConsultaSugestaoDTO>(`/api/tarefas/${tarefaId}/sugestoes`, {
      method: 'POST',
      body: JSON.stringify({ descricao }),
    });
  },

  /**
   * Lista as sugestões enviadas para uma tarefa
   */
  async listarSugestoesDaTarefa(tarefaId: number): Promise<ConsultaSugestaoDTO[]> {
    return apiFetch<ConsultaSugestaoDTO[]>(`/api/tarefas/${tarefaId}/sugestoes`, {
      method: 'GET',
    });
  },

  /**
   * Aprova uma sugestão de alteração (apenas criador da tarefa)
   */
  async aprovarSugestao(sugestaoId: number): Promise<ConsultaSugestaoDTO> {
    return apiFetch<ConsultaSugestaoDTO>(`/api/sugestoes/${sugestaoId}/aprovar`, {
      method: 'PATCH',
    });
  },

  /**
   * Rejeita uma sugestão de alteração (apenas criador da tarefa)
   */
  async rejeitarSugestao(sugestaoId: number): Promise<ConsultaSugestaoDTO> {
    return apiFetch<ConsultaSugestaoDTO>(`/api/sugestoes/${sugestaoId}/rejeitar`, {
      method: 'PATCH',
    });
  },
};
