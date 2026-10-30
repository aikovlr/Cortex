// ==========================================
// Cortex — Serviço de Preferências (/api/preferencias)
// Sincronização entre dispositivos (Tema, Alto Contraste, Tamanho de Fonte)
// ==========================================

import { apiFetch } from './api';
import {
  PreferenciaAcessibilidadeDTO,
  AtualizarPreferenciaAcessibilidadeDTO,
} from '@/types/api';

export const preferenciaService = {
  /**
   * Obtém as preferências de acessibilidade sincronizadas do usuário autenticado
   */
  async obterAcessibilidade(): Promise<PreferenciaAcessibilidadeDTO> {
    return apiFetch<PreferenciaAcessibilidadeDTO>('/api/preferencias/acessibilidade', {
      method: 'GET',
    });
  },

  /**
   * Atualiza as preferências de acessibilidade e sincroniza no banco de dados
   */
  async atualizarAcessibilidade(
    dto: AtualizarPreferenciaAcessibilidadeDTO
  ): Promise<PreferenciaAcessibilidadeDTO> {
    return apiFetch<PreferenciaAcessibilidadeDTO>('/api/preferencias/acessibilidade', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },
};

