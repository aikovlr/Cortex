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
  responsaveisIds?: number[];
  responsavelIds?: number[];
  criadorId?: number;
  dataInicio?: string;
  dataFim?: string;
}

function buildQueryParams(filtro?: FiltroRelatorioQuery): string {
  if (!filtro) return '';
  const params = new URLSearchParams();

  Object.entries(filtro).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            params.append(key, String(item));
          }
        });
      } else {
        params.append(key, String(val));
      }
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const relatorioService = {
  /**
   * Obtém o relatório analítico das tarefas do usuário autenticado (RN09)
   */
  async obterRelatorioTarefas(filtro?: FiltroRelatorioQuery): Promise<RelatorioTarefasDTO> {
    const query = buildQueryParams(filtro);
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
    const query = buildQueryParams(filtro);
    return apiFetch<RelatorioEquipeDTO>(`/api/relatorios/equipes/${equipeId}${query}`, {
      method: 'GET',
    });
  },
};
