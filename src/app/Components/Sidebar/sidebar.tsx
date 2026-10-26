'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  const menuItems = [
    {
      label: 'Minhas tarefas',
      href: '/minhas-tarefas',
      icon: '/clipboard-text.svg',
    },
    {
      label: 'Tarefas atribuídas',
      href: '/tarefas-atribuidas',
      icon: '/clipboard-data.svg',
    },
    {
      label: 'Equipes',
      href: '/equipes',
      icon: '/users.svg',
    },
    {
      label: 'Metas',
      href: '/metas',
      icon: '/target.svg',
    },
    {
      label: 'Relatórios',
      href: '/relatorios',
      icon: '/chart-bar.svg',
    },
    {
      label: 'Configurações',
      href: '/configuracoes',
      icon: '/adjustments-horizontal.svg',
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/logo.png"
          alt="Cortex Logo"
          width={130}
          height={130}
          priority
          style={{ objectFit: 'contain' }}
        />
        <span className={styles.brandText}>WORKSPACE</span>
      </div>

      <nav className={styles.menu}>
        {menuItems.map((item) => {
          const isSelected =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link key={item.href} href={item.href} className={styles.link}>
              <div
                className={`${styles.menuItem} ${
                  isSelected ? styles.selected : ''
                }`}
              >
                <div className={styles.menuIcon}>
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={20}
                    height={20}
                  />
                </div>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {usuario?.fotoPerfil?.urlCaminho ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={usuario.fotoPerfil.urlCaminho}
            alt={usuario.nome}
            className={styles.avatar}
          />
        ) : (
          <Image
            src="/perfil.png"
            alt="Perfil"
            width={36}
            height={36}
            className={styles.avatar}
          />
        )}

        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {usuario?.nome || 'Carregando...'}
          </span>
          <span className={styles.userEmail}>
            {usuario?.email || ''}
          </span>
        </div>

        <button
          type="button"
          onClick={logout}
          className={styles.logout}
          title="Encerrar sessão"
          aria-label="Encerrar sessão"
        >
          <Image src="/logout-2.svg" alt="Sair" width={20} height={20} />
        </button>
      </div>
    </aside>
  );
}