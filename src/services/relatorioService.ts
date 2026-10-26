// ==========================================
// Cortex — Serviço de Relatórios Analíticos (RF006)
// ==========================================

import { apiFetch } from './api';
import {
  RelatorioTarefasDTO,
  RelatorioEquipeDTO,
} from '@/types/api';

export interface FiltroRelatorioQuery {
  status?: string;
  prioridade?: string;
  equipeId?: number;
  responsavelId?: number;
  dataInicio?: string;
  dataFim?: string;
}

export const relatorioService = {
  /**
   * Obtém o relatório analítico das tarefas do usuário autenticado (RN09)
   */
  async obterRelatorioTarefas(filtro?: FiltroRelatorioQuery): Promise<RelatorioTarefasDTO> {
    const params = new URLSearchParams();
    if (filtro) {
      Object.entries(filtro).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<RelatorioTarefasDTO>(`/api/relatorios/tarefas${query}`, {
      method: 'GET',
    });
  },

  /**
   * Obtém o relatório consolidado da equipe para Donos e Administradores (RN10)
   */
  async obterRelatorioEquipe(
    equipeId: number,
    filtro?: FiltroRelatorioQuery
  ): Promise<RelatorioEquipeDTO> {
    const params = new URLSearchParams();
    if (filtro) {
      Object.entries(filtro).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<RelatorioEquipeDTO>(`/api/relatorios/equipes/${equipeId}${query}`, {
      method: 'GET',
    });
  },
};
