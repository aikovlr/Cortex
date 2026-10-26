// ==========================================
// Cortex — Serviço de Usuários (/api/usuario)
// ==========================================

import { apiFetch } from './api';
import { ConsultaUsuarioDTO } from '@/types/api';

export const usuarioService = {
  /**
   * Lista todos os usuários cadastrados
   */
  async listarUsuarios(): Promise<ConsultaUsuarioDTO[]> {
    return apiFetch<ConsultaUsuarioDTO[]>('/api/usuario', {
      method: 'GET',
    });
  },

  /**
   * Obtém detalhes de um usuário por ID
   */
  async obterPorId(id: number): Promise<ConsultaUsuarioDTO> {
    return apiFetch<ConsultaUsuarioDTO>(`/api/usuario/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Atualiza os dados do perfil do usuário autenticado
   */
  async atualizarPerfil(formData: FormData): Promise<ConsultaUsuarioDTO> {
    return apiFetch<ConsultaUsuarioDTO>('/api/usuario/me', {
      method: 'PUT',
      body: formData,
    });
  },

  /**
   * Exclui a conta do usuário autenticado (RN05: bloqueia se houver tarefas em andamento)
   */
  async excluirMinhaConta(): Promise<void> {
    return apiFetch<void>('/api/usuario/minha-conta', {
      method: 'DELETE',
    });
  },
};
