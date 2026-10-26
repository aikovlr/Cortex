'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/app/Components/Sidebar/sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !usuario) {
      router.replace('/login');
    }
  }, [loading, usuario, router]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <Image
          src="/logo.png"
          alt="Cortex"
          width={90}
          height={90}
          priority
        />
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!usuario) {
    return null; // O useEffect já está redirecionando para /login
  }

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        {children}
      </div>
    </div>
  );
}
