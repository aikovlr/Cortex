// =======================================================
// Cortex — Serviço de Anexos (/api/anexos)
// =======================================================

import { apiFetch } from './api';
import { ConsultaAnexoDTO } from '@/types/api';

export const anexoService = {
  /**
   * Obtém detalhes de um anexo por ID
   */
  async obterPorId(id: number): Promise<ConsultaAnexoDTO> {
    return apiFetch<ConsultaAnexoDTO>(`/api/anexos/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Exclui um anexo pelo ID
   */
  async excluirAnexo(id: number): Promise<void> {
    return apiFetch<void>(`/api/anexos/${id}`, {
      method: 'DELETE',
    });
  },
};

