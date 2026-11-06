'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/services/authService';
import { ProblemDetailsError } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { isValidEmail } from '@/utils/phoneAndEmail';
import styles from './redefinirSenha.module.css';

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preenche e-mail via query param se fornecido
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Critérios da Senha (RN02)
  const hasMinLength = novaSenha.length >= 8;
  const hasUpperCase = /[A-Z]/.test(novaSenha);
  const hasLowerCase = /[a-z]/.test(novaSenha);
  const hasDigit = /[0-9]/.test(novaSenha);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/.test(novaSenha);
  const passwordsMatch = novaSenha.length > 0 && novaSenha === confirmacaoSenha;

  const isFormValid =
    isValidEmail(email) &&
    codigo.trim().length === 6 &&
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasDigit &&
    hasSpecialChar &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passwordsMatch) {
      setErrorMessage('As senhas digitadas não conferem.');
      return;
    }

    if (!isFormValid) {
      setErrorMessage('A nova senha não atende a todos os requisitos de segurança.');
      return;
    }

    try {
      setLoading(true);
      await authService.redefinirSenha({
        email: email.trim(),
        codigo: codigo.trim(),
        novaSenha,
      });

      showToast('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.', 'success');
      router.push('/login');
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        if (err.status === 429) {
          setErrorMessage('Muitas tentativas recentes. Por favor, aguarde 5 minutos antes de tentar novamente.');
        } else {
          setErrorMessage(err.detail || err.title || 'Código inválido ou expirado.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocorreu um erro ao redefinir a senha. Verifique o código e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.card} role="main" aria-labelledby="form-title">
        <div className={styles.logoWrapper}>
          <Image
            src="/logo.png"
            alt="Logo Cortex"
            width={100}
            height={100}
            priority
          />
          <h1 id="form-title" className={styles.headerTitle}>Redefinir Senha</h1>
          <p className={styles.headerSubtitle}>
            Digite o código de 6 dígitos enviado ao seu e-mail e cadastre sua nova senha.
          </p>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert" aria-live="assertive">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-mail
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

          <div className={styles.field}>
            <label htmlFor="codigo" className={styles.label}>
              Código de verificação (6 dígitos)
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${styles.input} ${styles.codeInput}`}
                disabled={loading}
                aria-required="true"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="novaSenha" className={styles.label}>
              Nova Senha
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="novaSenha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Cadastre uma senha forte"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className={styles.input}
                disabled={loading}
                aria-required="true"
                aria-describedby="password-criteria"
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar nova senha' : 'Exibir nova senha em texto claro'}
              >
                {showPassword ? 'Ocultar' : 'Exibir'}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmacaoSenha" className={styles.label}>
              Confirmar Nova Senha
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmacaoSenha"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Repita a nova senha"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                className={styles.input}
                disabled={loading}
                aria-required="true"
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
              >
                {showConfirmPassword ? 'Ocultar' : 'Exibir'}
              </button>
            </div>
          </div>

          {/* Checklist de requisitos de segurança da senha (RN02) */}
          <div id="password-criteria" className={styles.criteriaList} aria-live="polite">
            <span className={styles.criteriaTitle}>Critérios de Segurança (RN02):</span>
            
            <div className={`${styles.criterionItem} ${hasMinLength ? styles.valid : styles.invalid}`}>
              <span className={styles.criterionIcon}>{hasMinLength ? '✓' : '○'}</span>
              <span>Mínimo de 8 caracteres</span>
            </div>

            <div className={`${styles.criterionItem} ${hasUpperCase ? styles.valid : styles.invalid}`}>
              <span className={styles.criterionIcon}>{hasUpperCase ? '✓' : '○'}</span>
              <span>Pelo menos uma letra maiúscula (A-Z)</span>
            </div>

            <div className={`${styles.criterionItem} ${hasLowerCase ? styles.valid : styles.invalid}`}>
              <span className={styles.criterionIcon}>{hasLowerCase ? '✓' : '○'}</span>
              <span>Pelo menos uma letra minúscula (a-z)</span>
            </div>

            <div className={`${styles.criterionItem} ${hasDigit ? styles.valid : styles.invalid}`}>
              <span className={styles.criterionIcon}>{hasDigit ? '✓' : '○'}</span>
              <span>Pelo menos um número (0-9)</span>
            </div>

            <div className={`${styles.criterionItem} ${hasSpecialChar ? styles.valid : styles.invalid}`}>
              <span className={styles.criterionIcon}>{hasSpecialChar ? '✓' : '○'}</span>
              <span>Pelo menos um caractere especial (!@#$...)</span>
            </div>

            {novaSenha.length > 0 && (
              <div className={`${styles.criterionItem} ${passwordsMatch ? styles.valid : styles.invalid}`}>
                <span className={styles.criterionIcon}>{passwordsMatch ? '✓' : '○'}</span>
                <span>As senhas coincidem</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={styles.submitBtn}
            aria-busy={loading}
          >
            {loading ? 'Salvando nova senha...' : 'Redefinir Senha'}
          </button>
        </form>

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

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Carregando...</div>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}

