'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/app/Components/Sidebar/sidebar';
import styles from './layout.module.css';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen, closeMobile, setIsMobileOpen } = useSidebar();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isDragging = useRef(false);
  const dragDirection = useRef<'open' | 'close' | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      if (!isMobileOpen) {
        // Para abrir: iniciar arrasto próximo da borda esquerda (até 48px)
        if (clientX <= 48) {
          touchStartX.current = clientX;
          touchStartY.current = clientY;
          touchStartTime.current = Date.now();
          isDragging.current = false;
          dragDirection.current = 'open';
        } else {
          dragDirection.current = null;
        }
      } else {
        // Para fechar: usuário pode arrastar para a esquerda a partir de qualquer ponto
        touchStartX.current = clientX;
        touchStartY.current = clientY;
        touchStartTime.current = Date.now();
        isDragging.current = false;
        dragDirection.current = 'close';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragDirection.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Detecta intenção de arrasto horizontal vs rolagem vertical
      if (!isDragging.current) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          dragDirection.current = null;
          return;
        }

        if (dragDirection.current === 'open' && deltaX > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isDragging.current = true;
        } else if (dragDirection.current === 'close' && deltaX < -8 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isDragging.current = true;
        }
      }

      if (isDragging.current) {
        if (e.cancelable) {
          e.preventDefault();
        }

        const SIDEBAR_WIDTH = 260;
        const sidebarEl = sidebarRef.current;
        const backdropEl = backdropRef.current;

        if (dragDirection.current === 'open') {
          const translateX = Math.min(0, Math.max(-SIDEBAR_WIDTH, -SIDEBAR_WIDTH + deltaX));
          const progress = Math.min(1, Math.max(0, deltaX / SIDEBAR_WIDTH));

          if (sidebarEl) {
            sidebarEl.style.transform = `translateX(${translateX}px)`;
            sidebarEl.style.transition = 'none';
            sidebarEl.style.visibility = 'visible';
            sidebarEl.style.pointerEvents = 'auto';
            sidebarEl.style.boxShadow = '8px 0 36px rgba(0, 0, 0, 0.45)';
          }
          if (backdropEl) {
            backdropEl.style.visibility = 'visible';
            backdropEl.style.pointerEvents = 'auto';
            backdropEl.style.opacity = String(progress);
            backdropEl.style.transition = 'none';
          }
        } else if (dragDirection.current === 'close') {
          const translateX = Math.min(0, Math.max(-SIDEBAR_WIDTH, deltaX));
          const progress = Math.max(0, Math.min(1, 1 + deltaX / SIDEBAR_WIDTH));

          if (sidebarEl) {
            sidebarEl.style.transform = `translateX(${translateX}px)`;
            sidebarEl.style.transition = 'none';
          }
          if (backdropEl) {
            backdropEl.style.opacity = String(progress);
            backdropEl.style.transition = 'none';
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!dragDirection.current) return;

      const sidebarEl = sidebarRef.current;
      const backdropEl = backdropRef.current;

      if (isDragging.current) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const dt = Math.max(1, Date.now() - touchStartTime.current);
        const vx = deltaX / dt;

        // Limpa estilos inline manuais para que as transições CSS assumam com suavidade
        if (sidebarEl) {
          sidebarEl.style.transform = '';
          sidebarEl.style.transition = '';
          sidebarEl.style.visibility = '';
          sidebarEl.style.pointerEvents = '';
          sidebarEl.style.boxShadow = '';
        }
        if (backdropEl) {
          backdropEl.style.transform = '';
          backdropEl.style.transition = '';
          backdropEl.style.opacity = '';
          backdropEl.style.visibility = '';
          backdropEl.style.pointerEvents = '';
        }

        if (dragDirection.current === 'open') {
          // Abertura confirmada se arrastou > 65px ou flick rápido para a direita
          if (deltaX > 65 || (vx > 0.3 && deltaX > 20)) {
            setIsMobileOpen(true);
          } else {
            setIsMobileOpen(false);
          }
        } else if (dragDirection.current === 'close') {
          // Fechamento confirmado se arrastou < -65px ou flick rápido para a esquerda
          if (deltaX < -65 || (vx < -0.3 && deltaX < -20)) {
            closeMobile();
          } else {
            setIsMobileOpen(true);
          }
        }
      }

      isDragging.current = false;
      dragDirection.current = null;
    };

    const handleTouchCancel = () => {
      const sidebarEl = sidebarRef.current;
      const backdropEl = backdropRef.current;

      if (sidebarEl) {
        sidebarEl.style.transform = '';
        sidebarEl.style.transition = '';
        sidebarEl.style.visibility = '';
        sidebarEl.style.pointerEvents = '';
        sidebarEl.style.boxShadow = '';
      }
      if (backdropEl) {
        backdropEl.style.transform = '';
        backdropEl.style.transition = '';
        backdropEl.style.opacity = '';
        backdropEl.style.visibility = '';
        backdropEl.style.pointerEvents = '';
      }

      isDragging.current = false;
      dragDirection.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isMobileOpen, setIsMobileOpen, closeMobile]);

  return (
    <div className={styles.wrapper}>
      {!isMobileOpen && (
        <div className={styles.edgeDragArea} aria-hidden="true" />
      )}
      <div
        ref={backdropRef}
        className={`${styles.backdrop} ${
          isMobileOpen ? styles.backdropVisible : styles.backdropHidden
        }`}
        onClick={closeMobile}
        aria-hidden="true"
      />
      <Sidebar ref={sidebarRef} />
      <div
        className={`${styles.mainContent} ${
          isCollapsed ? styles.mainContentCollapsed : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading, isLoggingOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !usuario && !isLoggingOut) {
      router.replace('/login');
    }
  }, [loading, usuario, isLoggingOut, router]);

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
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
