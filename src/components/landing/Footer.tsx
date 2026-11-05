'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NAV_LINKS, AUTH_ROUTE } from './constants';
import { ShieldCheckIcon } from './LandingIcons';
import styles from './landing.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.landingContainer}>
        <div className={styles.footerInner}>
          {/* Marca / Identificação Oficial */}
          <Link href="/" className={styles.brand} aria-label="Cortex - Ir para o início">
            <Image
              src="/logo-semfundo.png"
              alt="Logo Cortex"
              width={36}
              height={36}
              priority
              className={styles.brandLogoFooter}
            />
            <span className={styles.brandText}>Cortex</span>
          </Link>

          {/* Links de Navegação da Página */}
          <nav aria-label="Links do rodapé">
            <ul className={styles.footerLinks}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.footerLink}>
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href={AUTH_ROUTE} className={styles.footerLink}>
                  Entrar / Cadastrar
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Linha Inferior com Aviso Legal e Ano */}
        <div className={styles.footerBottom}>
          <div className={styles.footerNoticeFree}>
            <ShieldCheckIcon size={16} />
            <span>Sistema 100% gratuito — Sem taxas ou planos de assinatura.</span>
          </div>

          <div>
            <span>&copy; {currentYear} Cortex. Todos os direitos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

