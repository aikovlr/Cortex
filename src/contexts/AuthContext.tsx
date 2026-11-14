'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConsultaUsuarioDTO, DadosLoginDTO } from '@/types/api';
import { authService } from '@/services/authService';

interface AuthContextType {
  usuario: ConsultaUsuarioDTO | null;
  loading: boolean;
  isLoggingOut: boolean;
  login: (dto: DadosLoginDTO) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  recarregarPerfil: () => Promise<void>;
  simularXp: (quantidade?: number) => void;
  simularNivel: (novoNivel?: number) => void;
  simularLevelUp: (xpBonus?: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<ConsultaUsuarioDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const recarregarPerfil = useCallback(async () => {
    try {
      const perfil = await authService.obterPerfil();
      setUsuario(perfil);
    } catch {
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    authService.obterPerfil()
      .then((perfil) => {
        if (isMounted) setUsuario(perfil);
      })
      .catch(() => {
        if (isMounted) setUsuario(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (dto: DadosLoginDTO) => {
    const res = await authService.login(dto);
    setUsuario(res.usuario);
    router.push('/minhas-tarefas');
  };

  const simularXp = useCallback((quantidade: number = 50) => {
    const qtd = Number(quantidade) || 50;
    setUsuario((prev) => {
      if (!prev) {
        console.warn('[Cortex Dev] Nenhum usuário logado. Inicializando perfil de teste temporário...');
        return {
          id: 9999,
          nome: 'Usuário Teste',
          email: 'teste@cortex.io',
          nivel: 1,
          experiencia: qtd,
          dataCriacao: new Date().toISOString(),
        } as ConsultaUsuarioDTO;
      }
      const xpAtual = prev.experiencia || 0;
      const novoXp = xpAtual + qtd;
      console.log(
        `%c[Cortex Dev] Simulação de XP: +${qtd} XP (${xpAtual} -> ${novoXp} XP)`,
        'color: #10b981; font-weight: bold;'
      );
      return {
        ...prev,
        experiencia: novoXp,
      };
    });
  }, []);

  const simularNivel = useCallback((novoNivel?: number) => {
    setUsuario((prev) => {
      if (!prev) {
        const prox = novoNivel !== undefined && !isNaN(Number(novoNivel)) ? Number(novoNivel) : 2;
        return {
          id: 9999,
          nome: 'Usuário Teste',
          email: 'teste@cortex.io',
          nivel: prox,
          experiencia: 0,
          dataCriacao: new Date().toISOString(),
        } as ConsultaUsuarioDTO;
      }
      const nivelAtual = prev.nivel || 1;
      const proxNivel =
        novoNivel !== undefined && !isNaN(Number(novoNivel)) ? Number(novoNivel) : nivelAtual + 1;
      console.log(
        `%c[Cortex Dev] Simulação de Nível: Nível ${nivelAtual} -> Nível ${proxNivel}`,
        'color: #7b4fc9; font-weight: bold;'
      );
      return {
        ...prev,
        nivel: proxNivel,
      };
    });
  }, []);

  const simularLevelUp = useCallback((xpBonus: number = 100) => {
    setUsuario((prev) => {
      const nivelAtual = prev?.nivel || 1;
      const xpAtual = prev?.experiencia || 0;
      const proxNivel = nivelAtual + 1;
      const novoXp = xpAtual + xpBonus;
      console.log(
        `%c[Cortex Dev] 🎉 LEVEL UP SIMULADO! Nível ${nivelAtual} -> Nível ${proxNivel} (+${xpBonus} XP)`,
        'color: #f59e0b; font-weight: bold; font-size: 13px;'
      );
      if (!prev) {
        return {
          id: 9999,
          nome: 'Usuário Teste',
          email: 'teste@cortex.io',
          nivel: proxNivel,
          experiencia: novoXp,
          dataCriacao: new Date().toISOString(),
        } as ConsultaUsuarioDTO;
      }
      return {
        ...prev,
        nivel: proxNivel,
        experiencia: novoXp,
      };
    });
  }, []);

  // Registra as funções de simulação no console global do navegador
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resetarSimulacao = () => {
      console.log('%c[Cortex Dev] Recarregando dados reais do perfil a partir do backend...', 'color: #3b82f6; font-weight: bold;');
      recarregarPerfil();
    };

    (window as any).simularXp = simularXp;
    (window as any).simularNivel = simularNivel;
    (window as any).simularLevelUp = simularLevelUp;
    (window as any).resetarSimulacao = resetarSimulacao;
    (window as any).cortex = {
      simularXp,
      simularNivel,
      simularLevelUp,
      resetarSimulacao,
    };

    console.log(
      '%c🎮 [Cortex Dev] Funções de teste de Gamificação disponíveis no console:\n' +
      '  • simularXp(50)         -> Simula ganho de XP com badge flutuante (+50 XP) e animação da barra\n' +
      '  • simularNivel(2)       -> Simula subida para o nível especificado (ou +1) com pulso dourado e banner\n' +
      '  • simularLevelUp(100)   -> Simula subida de nível + ganho de XP juntos\n' +
      '  • resetarSimulacao()    -> Restaura os dados reais de nível e XP do backend',
      'color: #7b4fc9; font-weight: 600;'
    );

    return () => {
      delete (window as any).simularXp;
      delete (window as any).simularNivel;
      delete (window as any).simularLevelUp;
      delete (window as any).resetarSimulacao;
      delete (window as any).cortex;
    };
  }, [simularXp, simularNivel, simularLevelUp, recarregarPerfil]);

  const logout = async (redirectTo: string = '/') => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // Ignora falha de rede no logout e limpa o estado local
    } finally {
      setUsuario(null);
      router.push(redirectTo);
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        isLoggingOut,
        login,
        logout,
        recarregarPerfil,
        simularXp,
        simularNivel,
        simularLevelUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
