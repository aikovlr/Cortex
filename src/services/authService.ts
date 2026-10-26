// ==========================================
// Cortex — Serviço de Autenticação e Conta
// ==========================================

import { apiFetch } from './api';
import {
  ConsultaUsuarioDTO,
  DadosLoginDTO,
  LoginResponseDTO,
  AlterarSenhaDTO,
} from '@/types/api';

export const authService = {
  /**
   * Realiza login. O backend grava automaticamente o cookie HttpOnly cortex_token.
   */
  async login(dto: DadosLoginDTO): Promise<LoginResponseDTO> {
    return apiFetch<LoginResponseDTO>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Encerra a sessão atual e instrui o backend a deletar o cookie cortex_token.
   */
  async logout(): Promise<void> {
    return apiFetch<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Cadastra um novo usuário no sistema (RF001 / RN01 / RN02).
   */
  async registrar(formData: FormData): Promise<ConsultaUsuarioDTO> {
    return apiFetch<ConsultaUsuarioDTO>('/api/usuario', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Retorna os dados do usuário atualmente logado (valida cookie ativo).
   */
  async obterPerfil(): Promise<ConsultaUsuarioDTO> {
    return apiFetch<ConsultaUsuarioDTO>('/api/usuario/me', {
      method: 'GET',
    });
  },

  /**
   * Solicita envio de código de verificação para o e-mail.
   */
  async solicitarVerificacaoEmail(email?: string): Promise<{ message: string }> {
    if (email) {
      return apiFetch<{ message: string }>('/api/auth/solicitar-verificacao-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    }

    return apiFetch<{ message: string }>('/api/usuario/solicitar-verificacao-email', {
      method: 'POST',
    });
  },

  /**
   * Valida o código recebido por e-mail para ativar a conta.
   */
  async verificarEmail(codigo: string, email?: string): Promise<{ message: string }> {
    if (email) {
      return apiFetch<{ message: string }>('/api/auth/verificar-email', {
        method: 'POST',
        body: JSON.stringify({ email, codigo }),
      });
    }

    return apiFetch<{ message: string }>('/api/usuario/verificar-email', {
      method: 'POST',
      body: JSON.stringify({ codigo }),
    });
  },

  /**
   * Altera a senha do usuário autenticado.
   */
  async alterarSenha(dto: AlterarSenhaDTO): Promise<void> {
    return apiFetch<void>('/api/auth/alterar-senha', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
