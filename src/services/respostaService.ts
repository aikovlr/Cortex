// =======================================================
// Cortex — Serviço de Respostas de Tarefas (/api/tarefas/{id}/respostas)
// =======================================================

import { apiFetch } from './api';
import { ConsultaRespostaTarefaDTO } from '@/types/api';

export const respostaService = {
  /**
   * Lista todas as respostas de uma tarefa
   */
  async listarPorTarefa(tarefaId: number): Promise<ConsultaRespostaTarefaDTO[]> {
    return apiFetch<ConsultaRespostaTarefaDTO[]>(`/api/tarefas/${tarefaId}/respostas`, {
      method: 'GET',
    });
  },

  /**
   * Envia uma resposta com anexos para a tarefa
   */
  async criarResposta(tarefaId: number, formData: FormData): Promise<ConsultaRespostaTarefaDTO> {
    return apiFetch<ConsultaRespostaTarefaDTO>(`/api/tarefas/${tarefaId}/respostas`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Atribui uma nota para a resposta de um usuário
   */
  async atribuirNota(respostaId: number, nota: number): Promise<ConsultaRespostaTarefaDTO> {
    return apiFetch<ConsultaRespostaTarefaDTO>(`/api/respostas/${respostaId}/nota`, {
      method: 'PATCH',
      body: JSON.stringify({ nota }),
    });
  },

  /**
   * Exclui uma resposta de tarefa
   */
  async excluirResposta(id: number): Promise<void> {
    return apiFetch<void>(`/api/respostas/${id}`, {
      method: 'DELETE',
    });
  },
};

