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
   * Remove a foto de perfil do usuário autenticado
   * Utiliza a rota de remoção de anexo /api/anexos/{id} (AnexoController)
   * com fallback para /api/usuario/me/foto
   */
  async removerFotoPerfil(anexoId?: number): Promise<void> {
    if (anexoId) {
      try {
        await apiFetch<void>(`/api/anexos/${anexoId}`, {
          method: 'DELETE',
        });
        return;
      } catch (err: unknown) {
        // Se retornar 404 em /api/anexos/{id}, tenta /api/usuario/me/foto como fallback
        const isNotFound = err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404;
        if (!isNotFound) {
          throw err;
        }
      }
    }
    return apiFetch<void>('/api/usuario/me/foto', {
      method: 'DELETE',
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
