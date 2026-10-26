'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConsultaUsuarioDTO, DadosLoginDTO } from '@/types/api';
import { authService } from '@/services/authService';

interface AuthContextType {
  usuario: ConsultaUsuarioDTO | null;
  loading: boolean;
  login: (dto: DadosLoginDTO) => Promise<void>;
  logout: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<ConsultaUsuarioDTO | null>(null);
  const [loading, setLoading] = useState(true);
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

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignora falha de rede no logout e limpa o estado local
    } finally {
      setUsuario(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, recarregarPerfil }}>
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
