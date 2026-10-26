'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { ProblemDetailsError } from '@/services/api';
import styles from './login.module.css';

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const verifyParam = searchParams.get('verify') === 'true';

  const [email, setEmail] = useState(emailParam);
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modo de exibição: 'login' ou 'verify' (substitui o modal de login)
  const [viewMode, setViewMode] = useState<'login' | 'verify'>(verifyParam ? 'verify' : 'login');

  // Estado dos 6 dígitos individuais
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Refs para cada uma das 6 caixas de texto
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasRequestedInitialCode = useRef(false);

  // Se entrou em modo verify vindo do registro, dispara a solicitação para imprimir o código no console
  useEffect(() => {
    if (verifyParam && emailParam && !hasRequestedInitialCode.current) {
      hasRequestedInitialCode.current = true;
      authService.solicitarVerificacaoEmail(emailParam).catch(() => {});
    }
  }, [verifyParam, emailParam]);

  // Foco automático na primeira caixa ao mudar para o modo de verificação
  useEffect(() => {
    if (viewMode === 'verify') {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Submissão do login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !senha) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      setLoading(true);
      await login({ email, senha });
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        // Se o erro for 403 informando que o e-mail não está verificado
        const isNotVerified =
          err.status === 403 &&
          (err.title?.toLowerCase().includes('e-mail') ||
            err.detail?.toLowerCase().includes('e-mail') ||
            err.detail?.toLowerCase().includes('verificado'));

        if (isNotVerified) {
          // Exibe o código no console para ambiente de desenvolvimento
          const devCode = err.data?.codigoDev as string | undefined;
          if (devCode) {
            console.log(
              `%c[DEV - CORTEX]%c Código de verificação para %c${email}%c:\n` +
              `%c ${devCode} %c\n` +
              `⏱️ Tempo limite de expiração: 15 minutos (gerado automaticamente no login).`,
              'background: #7B4FC9; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
              'color: inherit;',
              'color: #a78bfa; font-weight: bold;',
              'color: inherit;',
              'background: #18223B; color: #2ecc71; font-size: 20px; font-weight: bold; letter-spacing: 4px; padding: 4px 10px; border: 1px dashed #2ecc71; border-radius: 4px; margin: 4px 0;',
              'color: #8E9BAE;'
            );
          } else {
            // Se não veio no erro, solicita o envio agora para garantir que apareça no console
            authService.solicitarVerificacaoEmail(email).catch(() => {});
          }

          // Substitui o modal de login pelo modal próprio de verificação
          setViewMode('verify');
          setVerifyError(null);
          setVerifySuccess(null);
          return;
        }

        setErrorMessage(err.detail || err.title);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Falha ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reenvio de código pelo link no modal
  const handleResendCode = async () => {
    if (resending || !email) return;

    try {
      setResending(true);
      setResendSuccess(null);
      setVerifyError(null);

      await authService.solicitarVerificacaoEmail(email);
      setResendSuccess('Novo código enviado com sucesso! Verifique seu e-mail/console.');

      // Limpa os inputs e foca no primeiro
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      setTimeout(() => {
        setResendSuccess(null);
      }, 5000);
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        setVerifyError(err.detail || err.title);
      } else if (err instanceof Error) {
        setVerifyError(err.message);
      }
    } finally {
      setResending(false);
    }
  };

  // Manipulação de cada caixa de dígito
  const handleDigitChange = (index: number, value: string) => {
    // Aceita apenas números
    const cleanValue = value.replace(/\D/g, '');

    if (!cleanValue) {
      // Limpa dígito atual
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Pega o último caractere digitado caso tenha mais de 1
    const char = cleanValue.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Avança o foco automaticamente para a próxima caixa
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Se a caixa atual está vazia, move o foco para a anterior e a limpa
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    // Foca na posição correta
    const nextEmptyIndex = newDigits.findIndex((d) => d === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Confirmação do código de verificação
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoCompleto = digits.join('');

    if (codigoCompleto.length !== 6) {
      setVerifyError('Por favor, informe todos os 6 dígitos do código.');
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyError(null);

      await authService.verificarEmail(codigoCompleto, email);

      setVerifySuccess('E-mail verificado com sucesso!');

      // Se temos a senha preenchida, realiza login automático
      if (senha) {
        try {
          await login({ email, senha });
          return;
        } catch {
          // Se falhar o auto-login, convida a entrar
        }
      }

      // Retorna para o modal de login pronto para autenticação
      setTimeout(() => {
        setViewMode('login');
        setVerifySuccess(null);
        setErrorMessage(null);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        setVerifyError(err.detail || err.title);
      } else if (err instanceof Error) {
        setVerifyError(err.message);
      } else {
        setVerifyError('Código de verificação inválido ou expirado.');
      }
      // Limpa os dígitos e foca no primeiro para nova tentativa
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* MODO 1: FORMULÁRIO DE LOGIN PADRÃO */}
      {viewMode === 'login' && (
        <div className={styles.card}>
          <div className={styles.logoWrapper}>
            <Image
              src="/logo.png"
              alt="Logo Cortex"
              width={120}
              height={120}
              priority
            />
            <h1 className={styles.headerTitle}>Bem-vindo ao Cortex</h1>
            <p className={styles.headerSubtitle}>Gerenciador de tarefas e equipes</p>
          </div>

          {errorMessage && (
            <div className={styles.errorBanner}>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLogin} className={styles.form}>
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
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="senha" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ocultar' : 'Exibir'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className={styles.footer}>
            <span>Ainda não possui uma conta?</span>
            <Link href="/registro" className={styles.link}>
              Cadastre-se
            </Link>
          </div>
        </div>
      )}

      {/* MODO 2: MODAL PRÓPRIO DE VERIFICAÇÃO DE E-MAIL (SUBSTITUI O LOGIN) */}
      {viewMode === 'verify' && (
        <div className={styles.verifyCard}>
          <div className={styles.verifyHeader}>
            <div className={styles.verifyIconWrapper}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className={styles.verifyTitle}>Verificação de E-mail</h2>
          </div>

          {/* Mensagem de aviso */}
          <div className={styles.warningNotice}>
            Seu e-mail ainda não foi confirmado. Enviamos um código de segurança de 6 dígitos para validar sua conta.
          </div>

          {/* E-mail para o qual o código foi enviado */}
          <div className={styles.emailDisplayWrapper}>
            <span className={styles.emailLabel}>Código enviado para:</span>
            <span className={styles.emailBadge}>{email}</span>
          </div>

          {/* Texto pequeno com aparência de link para reenvio */}
          <div className={styles.resendWrapper}>
            <span>Não recebeu o código?</span>
            <button
              type="button"
              className={styles.resendLink}
              onClick={handleResendCode}
              disabled={resending}
            >
              {resending ? 'Enviando...' : 'Reenviar código'}
            </button>
          </div>

          {resendSuccess && (
            <div className={styles.resendFeedback}>
              {resendSuccess}
            </div>
          )}

          {verifyError && (
            <div className={styles.errorBanner} style={{ marginBottom: '16px' }}>
              <span>{verifyError}</span>
            </div>
          )}

          {verifySuccess && (
            <div style={{ color: '#2ecc71', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginBottom: '16px' }}>
              {verifySuccess}
            </div>
          )}

          <form onSubmit={handleConfirmVerification}>
            {/* Caixa dos 6 dígitos: cada dígito com sua própria caixa de texto */}
            <div className={styles.codeSection}>
              <span className={styles.codeLabel}>Digite o código de 6 dígitos</span>
              <div className={styles.digitGroup} onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={verifyLoading}
                    className={`${styles.digitInput} ${digit ? styles.digitInputFilled : ''}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            <div className={styles.verifyActions}>
              <button
                type="submit"
                disabled={verifyLoading || digits.some((d) => d === '')}
                className={styles.submitBtn}
              >
                {verifyLoading ? 'Verificando...' : 'Confirmar Código'}
              </button>

              <button
                type="button"
                className={styles.backBtn}
                onClick={() => {
                  setViewMode('login');
                  setVerifyError(null);
                  setVerifySuccess(null);
                }}
                disabled={verifyLoading}
              >
                ← Voltar para o login
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
