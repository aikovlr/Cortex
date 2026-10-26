// ==========================================
// Cortex — Serviço de Tickets de Reporte (RF008)
// ==========================================

import { apiFetch } from './api';
import { ConsultaTicketReporteDTO } from '@/types/api';

export const ticketService = {
  /**
   * Abre um ticket de reporte / problema em uma tarefa atribuída
   */
  async abrirTicket(tarefaId: number, descricao: string): Promise<ConsultaTicketReporteDTO> {
    return apiFetch<ConsultaTicketReporteDTO>(`/api/tarefas/${tarefaId}/tickets`, {
      method: 'POST',
      body: JSON.stringify({ descricao }),
    });
  },

  /**
   * Lista tickets de uma tarefa específica
   */
  async listarTicketsDaTarefa(tarefaId: number): Promise<ConsultaTicketReporteDTO[]> {
    return apiFetch<ConsultaTicketReporteDTO[]>(`/api/tarefas/${tarefaId}/tickets`, {
      method: 'GET',
    });
  },

  /**
   * Fecha / resolve um ticket de reporte
   */
  async fecharTicket(ticketId: number): Promise<ConsultaTicketReporteDTO> {
    return apiFetch<ConsultaTicketReporteDTO>(`/api/tickets/${ticketId}/fechar`, {
      method: 'PATCH',
    });
  },

  /**
   * Lista tickets de problemas reportados aos gestores de uma equipe
   */
  async listarTicketsPorEquipe(equipeId: number): Promise<ConsultaTicketReporteDTO[]> {
    return apiFetch<ConsultaTicketReporteDTO[]>(`/api/equipes/${equipeId}/tickets`, {
      method: 'GET',
    });
  },
};
