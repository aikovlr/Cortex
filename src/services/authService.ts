// ==========================================
// Cortex — Serviço de Autenticação e Conta
// ==========================================

import { apiFetch } from './api';
import {
  ConsultaUsuarioDTO,
  DadosLoginDTO,
  LoginResponseDTO,
  AlterarSenhaDTO,
  RedefinirSenhaDTO,
  MensagemRespostaDTO,
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
  async solicitarVerificacaoEmail(email?: string): Promise<{ message: string; expiraEmMinutos?: number }> {
    let result: { message: string; expiraEmMinutos?: number };

    if (email) {
      result = await apiFetch<{ message: string; expiraEmMinutos?: number }>(
        '/api/auth/solicitar-verificacao-email',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );
    } else {
      result = await apiFetch<{ message: string; expiraEmMinutos?: number }>(
        '/api/usuario/solicitar-verificacao-email',
        {
          method: 'POST',
        }
      );
    }

    return result;
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

  /**
   * Solicita envio de código para recuperação de senha (RF001).
   */
  async solicitarRedefinicaoSenha(email: string): Promise<MensagemRespostaDTO> {
    return apiFetch<MensagemRespostaDTO>('/api/auth/esqueci-senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Redefine a senha com código de 6 dígitos recebido por e-mail (RF001).
   */
  async redefinirSenha(dto: RedefinirSenhaDTO): Promise<MensagemRespostaDTO> {
    return apiFetch<MensagemRespostaDTO>('/api/auth/redefinir-senha', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
