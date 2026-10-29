// ==========================================
// Cortex — Serviço de Tarefas (/api/tarefa)
// ==========================================

import { apiFetch } from './api';
import {
  ConsultaTarefaDTO,
  DetalhesTarefaDTO,
  ConsultaResponsavelTarefaDTO,
  StatusTarefa,
  Prioridade,
} from '@/types/api';

export interface FiltroTarefasDTO {
  status?: StatusTarefa;
  prioridade?: Prioridade;
  responsavelId?: number;
  criadorId?: number;
  dataInicio?: string;
  dataFim?: string;
  termoBusca?: string;
}

export const tarefaService = {
  /**
   * Lista tarefas com filtros opcionais
   */
  async listarTarefas(filtros: FiltroTarefasDTO = {}): Promise<ConsultaTarefaDTO[]> {
    const params = new URLSearchParams();

    if (filtros.status) params.append('status', filtros.status);
    if (filtros.prioridade) params.append('prioridade', filtros.prioridade);
    if (filtros.responsavelId) params.append('responsavelId', filtros.responsavelId.toString());
    if (filtros.criadorId) params.append('criadorId', filtros.criadorId.toString());
    if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros.termoBusca) params.append('termoBusca', filtros.termoBusca);

    const qs = params.toString();
    const endpoint = `/api/tarefa${qs ? `?${qs}` : ''}`;

    return apiFetch<ConsultaTarefaDTO[]>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Obtém os detalhes completos de uma tarefa por ID
   */
  async obterPorId(id: number): Promise<DetalhesTarefaDTO> {
    return apiFetch<DetalhesTarefaDTO>(`/api/tarefa/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Cria uma nova tarefa (multipart/form-data para suportar anexos)
   */
  async criarTarefa(formData: FormData): Promise<DetalhesTarefaDTO> {
    return apiFetch<DetalhesTarefaDTO>('/api/tarefa', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Atualiza os dados de uma tarefa existente
   */
  async atualizarTarefa(id: number, formData: FormData): Promise<DetalhesTarefaDTO> {
    return apiFetch<DetalhesTarefaDTO>(`/api/tarefa/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  /**
   * Exclui uma tarefa por ID
   */
  async excluirTarefa(id: number): Promise<void> {
    return apiFetch<void>(`/api/tarefa/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Marca uma tarefa como concluída
   */
  async concluirTarefa(id: number): Promise<DetalhesTarefaDTO> {
    return apiFetch<DetalhesTarefaDTO>(`/api/tarefa/${id}/concluir`, {
      method: 'PATCH',
    });
  },

  /**
   * Cancela a conclusão de uma tarefa (reverte para Pendente ou Atrasada)
   */
  async cancelarConclusaoTarefa(id: number): Promise<DetalhesTarefaDTO> {
    return apiFetch<DetalhesTarefaDTO>(`/api/tarefa/${id}/cancelar-conclusao`, {
      method: 'PATCH',
    });
  },

  /**
   * Adiciona anexos a uma tarefa existente (/api/tarefas/{id}/anexos)
   */
  async adicionarAnexos(tarefaId: number, formData: FormData) {
    return apiFetch(`/api/tarefas/${tarefaId}/anexos`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Remove um anexo da tarefa (/api/anexos/{id})
   */
  async removerAnexo(anexoId: number): Promise<void> {
    return apiFetch<void>(`/api/anexos/${anexoId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Atribui um responsável individual a uma tarefa
   */
  async atribuirResponsavel(tarefaId: number, usuarioId: number): Promise<ConsultaResponsavelTarefaDTO> {
    return apiFetch<ConsultaResponsavelTarefaDTO>(`/api/tarefa/${tarefaId}/responsaveis`, {
      method: 'POST',
      body: JSON.stringify({ tarefaId, usuarioId }),
    });
  },

  /**
   * Atribui todos os membros de uma equipe a uma tarefa
   */
  async atribuirEquipe(tarefaId: number, equipeId: number): Promise<ConsultaResponsavelTarefaDTO[]> {
    return apiFetch<ConsultaResponsavelTarefaDTO[]>(`/api/tarefa/${tarefaId}/responsaveis/equipe`, {
      method: 'POST',
      body: JSON.stringify({ equipeId }),
    });
  },

  /**
   * Remove um responsável da tarefa
   */
  async removerResponsavel(tarefaId: number, responsavelId: number): Promise<void> {
    return apiFetch<void>(`/api/tarefa/${tarefaId}/responsaveis/${responsavelId}`, {
      method: 'DELETE',
    });
  },
};
