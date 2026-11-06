'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/services/authService';
import { ProblemDetailsError } from '@/services/api';
import { isValidEmail } from '@/utils/phoneAndEmail';
import styles from './esqueciSenha.module.css';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);

    const emailTrim = email.trim();
    if (!emailTrim) {
      setMensagemErro('Por favor, informe seu endereço de e-mail.');
      return;
    }

    if (!isValidEmail(emailTrim)) {
      setMensagemErro('Por favor, informe um endereço de e-mail válido com domínio completo (ex: nome@empresa.com).');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.solicitarRedefinicaoSenha(emailTrim);
      setEnviado(true);
      setMensagemSucesso(
        res.message || 'Se o e-mail informado estiver cadastrado, um código de verificação de 6 dígitos foi enviado.'
      );
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        if (err.status === 429) {
          setMensagemErro('Muitas solicitações recentes. Por favor, aguarde 5 minutos antes de tentar novamente.');
        } else {
          setMensagemErro(err.detail || err.title || 'Falha ao solicitar código de recuperação.');
        }
      } else if (err instanceof Error) {
        setMensagemErro(err.message);
      } else {
        setMensagemErro('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.card} role="main" aria-labelledby="page-title">
        <div className={styles.logoWrapper}>
          <Image
            src="/logo.png"
            alt="Logo Cortex"
            width={100}
            height={100}
            priority
          />
          <h1 id="page-title" className={styles.headerTitle}>Recuperar Senha</h1>
          <p className={styles.headerSubtitle}>
            Informe seu e-mail para receber um código de 6 dígitos de redefinição de senha.
          </p>
        </div>

        {mensagemErro && (
          <div className={styles.errorBanner} role="alert" aria-live="assertive">
            <span>{mensagemErro}</span>
          </div>
        )}

        {enviado ? (
          <div>
            <div className={styles.feedbackBanner} role="status" aria-live="polite">
              <p style={{ margin: 0, fontWeight: 600 }}>✓ Solicitação enviada!</p>
              <p style={{ margin: '8px 0 0 0' }}>{mensagemSucesso}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                O código tem validade de <strong>15 minutos</strong>. Lembre-se de verificar sua caixa de entrada e a pasta de spam.
              </p>
            </div>

            <div className={styles.actionsAfterSuccess}>
              <Link
                href={`/redefinir-senha?email=${encodeURIComponent(email)}`}
                className={styles.proceedBtn}
              >
                Já tenho o código &bull; Redefinir Senha
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                E-mail cadastrado
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                  aria-required="true"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
              aria-busy={loading}
            >
              {loading ? 'Enviando código...' : 'Enviar Código de Recuperação'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <span>Lembrou sua senha?</span>
          <Link href="/login" className={styles.link}>
            Voltar ao Login
          </Link>
        </div>
      </main>
    </div>
  );
}

