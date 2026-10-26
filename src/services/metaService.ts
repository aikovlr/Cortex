// ==========================================
// Cortex — Serviço de Metas & Gamificação (Charter 6.5)
// ==========================================

import { apiFetch } from './api';
import {
  CriarMetaDTO,
  AtualizarMetaDTO,
  ConsultaMetaDTO,
} from '@/types/api';

export const metaService = {
  /**
   * Lista as metas do usuário (ou todas as acessíveis ao solicitante).
   */
  async listar(usuarioId?: number): Promise<ConsultaMetaDTO[]> {
    const url = usuarioId ? `/api/metas?usuarioId=${usuarioId}` : '/api/metas';
    return apiFetch<ConsultaMetaDTO[]>(url, {
      method: 'GET',
    });
  },

  /**
   * Lista todas as metas vinculadas a uma tarefa específica.
   */
  async listarPorTarefa(tarefaId: number): Promise<ConsultaMetaDTO[]> {
    return apiFetch<ConsultaMetaDTO[]>(`/api/tarefas/${tarefaId}/metas`, {
      method: 'GET',
    });
  },

  /**
   * Obtém detalhes de uma meta por ID.
   */
  async obterPorId(id: number): Promise<ConsultaMetaDTO> {
    return apiFetch<ConsultaMetaDTO>(`/api/metas/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Cria uma nova meta vinculada obrigatoriamente a uma tarefa (RN07, RN15).
   */
  async criar(dto: CriarMetaDTO): Promise<ConsultaMetaDTO> {
    return apiFetch<ConsultaMetaDTO>('/api/metas', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Atualiza dados de uma meta existente ou seu status de conclusão (RN08).
   */
  async atualizar(id: number, dto: AtualizarMetaDTO): Promise<ConsultaMetaDTO> {
    return apiFetch<ConsultaMetaDTO>(`/api/metas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Exclui uma meta existente.
   */
  async deletar(id: number): Promise<void> {
    return apiFetch<void>(`/api/metas/${id}`, {
      method: 'DELETE',
    });
  },
};
