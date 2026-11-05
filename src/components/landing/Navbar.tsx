'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AUTH_ROUTE, NAV_LINKS } from './constants';
import { MenuIcon, XIcon, ArrowRightIcon } from './LandingIcons';
import styles from './landing.module.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
      <div className={`${styles.landingContainer} ${styles.navbarInner}`}>
        {/* Logotipo Oficial do Cortex (logo-semfundo com texto estilizado) */}
        <Link href="/" className={styles.brand} aria-label="Cortex - Página inicial">
          <Image
            src="/logo-semfundo.png"
            alt="Logo Cortex"
            width={56}
            height={56}
            priority
            className={styles.brandLogo}
          />
          <span className={styles.brandText}>Cortex</span>
        </Link>

        {/* Links de Navegação Desktop */}
        <nav aria-label="Navegação principal">
          <ul className={styles.navLinksDesktop}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botão de Ação / Login */}
        <div className={styles.navActions}>
          <Link
            href={AUTH_ROUTE}
            className={`${styles.btnPrimary} ${styles.btnNav}`}
            aria-label="Entrar no Cortex"
          >
            <span>Entrar</span>
            <ArrowRightIcon size={16} />
          </Link>

          {/* Botão Hamburger Mobile */}
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* Menu Gaveta Mobile */}
      {isMobileMenuOpen && (
        <div className={`${styles.mobileMenuDrawer} ${styles.mobileMenuDrawerOpen}`}>
          <ul className={styles.mobileNavLinks}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={styles.mobileNavLink}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            href={AUTH_ROUTE}
            className={styles.btnPrimary}
            onClick={closeMobileMenu}
            aria-label="Entrar no Cortex"
          >
            <span>Entrar</span>
            <ArrowRightIcon size={18} />
          </Link>
        </div>
      )}
    </header>
  );
}

