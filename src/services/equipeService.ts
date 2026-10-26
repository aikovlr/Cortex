// ==========================================
// Cortex — Serviço de Equipes (/api/equipe)
// ==========================================

import { apiFetch } from './api';
import {
  ConsultaEquipeDTO,
  ConsultaMembroEquipeDTO,
  CriarEquipeDTO,
  CargoEquipe,
} from '@/types/api';

export const equipeService = {
  /**
   * Lista as equipes das quais o usuário autenticado participa
   */
  async listarMinhasEquipes(): Promise<ConsultaEquipeDTO[]> {
    return apiFetch<ConsultaEquipeDTO[]>('/api/equipe', {
      method: 'GET',
    });
  },

  /**
   * Obtém detalhes de uma equipe por ID
   */
  async obterPorId(id: number): Promise<ConsultaEquipeDTO> {
    return apiFetch<ConsultaEquipeDTO>(`/api/equipe/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Cria uma nova equipe (o criador se torna Dono)
   */
  async criarEquipe(dto: CriarEquipeDTO): Promise<ConsultaEquipeDTO> {
    return apiFetch<ConsultaEquipeDTO>('/api/equipe', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Atualiza o nome da equipe
   */
  async atualizarEquipe(id: number, nome: string): Promise<ConsultaEquipeDTO> {
    return apiFetch<ConsultaEquipeDTO>(`/api/equipe/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome }),
    });
  },

  /**
   * Exclui uma equipe (Apenas Dono)
   */
  async excluirEquipe(id: number): Promise<void> {
    return apiFetch<void>(`/api/equipe/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Adiciona um novo membro à equipe por ID ou E-mail
   */
  async adicionarMembro(
    equipeId: number,
    dados: { usuarioId?: number; email?: string; cargo?: CargoEquipe } | number,
    cargoLegacy: CargoEquipe = 'Membro'
  ): Promise<ConsultaMembroEquipeDTO> {
    const payload =
      typeof dados === 'number'
        ? { equipeId, usuarioId: dados, cargo: cargoLegacy }
        : { equipeId, ...dados, cargo: dados.cargo || 'Membro' };

    return apiFetch<ConsultaMembroEquipeDTO>(`/api/equipe/${equipeId}/membros`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Remove um membro da equipe
   */
  async removerMembro(equipeId: number, membroId: number): Promise<void> {
    return apiFetch<void>(`/api/equipe/${equipeId}/membros/${membroId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Altera o cargo de um membro (Apenas Dono - RN03)
   */
  async alterarCargo(equipeId: number, membroId: number, cargo: CargoEquipe): Promise<ConsultaMembroEquipeDTO> {
    return apiFetch<ConsultaMembroEquipeDTO>(`/api/equipe/${equipeId}/membros/${membroId}/cargo`, {
      method: 'PATCH',
      body: JSON.stringify({ cargo }),
    });
  },

  /**
   * Lista os membros de uma equipe
   */
  async listarMembros(equipeId: number): Promise<ConsultaMembroEquipeDTO[]> {
    return apiFetch<ConsultaMembroEquipeDTO[]>(`/api/equipe/${equipeId}/membros`, {
      method: 'GET',
    });
  },
};
