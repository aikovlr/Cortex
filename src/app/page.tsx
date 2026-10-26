'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (usuario) {
        router.replace('/minhas-tarefas');
      } else {
        router.replace('/login');
      }
    }
  }, [usuario, loading, router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#12192C',
        gap: '16px',
      }}
    >
      <Image
        src="/logo.png"
        alt="Cortex"
        width={100}
        height={100}
        priority
        style={{ filter: 'drop-shadow(0 4px 16px rgba(123, 79, 201, 0.4))' }}
      />
      <p style={{ color: '#898899', fontSize: '14px', letterSpacing: '0.1em' }}>
        CARREGANDO CORTEX...
      </p>
    </div>
  );
}
