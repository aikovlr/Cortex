'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { ProblemDetailsError } from '@/services/api';
import styles from './login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);

  // Modal para confirmação de código de e-mail não verificado
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsEmailUnverified(false);

    if (!email || !senha) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      setLoading(true);
      await login({ email, senha });
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        if (err.status === 403 && err.title?.toLowerCase().includes('e-mail')) {
          setIsEmailUnverified(true);
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

  const handleOpenVerifyModal = async () => {
    setShowVerifyModal(true);
    setVerifySuccess(null);
    try {
      await authService.solicitarVerificacaoEmail(email);
    } catch {
      // Ignora erro caso já tenha sido enviado
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    try {
      setVerifyLoading(true);
      await authService.verificarEmail(verificationCode, email);
      setVerifySuccess('E-mail verificado com sucesso! Você já pode entrar.');
      setIsEmailUnverified(false);
      setErrorMessage(null);
      setTimeout(() => {
        setShowVerifyModal(false);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className={styles.container}>
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
            {isEmailUnverified && (
              <button
                type="button"
                className={styles.verifyBtn}
                onClick={handleOpenVerifyModal}
              >
                Validar código de e-mail agora
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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

      {showVerifyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>Confirmar E-mail</h2>
            <p className={styles.modalText}>
              Insira o código numérico enviado para <strong>{email}</strong> para ativar sua conta.
            </p>

            {verifySuccess ? (
              <p style={{ color: '#2ecc71', fontSize: '13px', fontWeight: 600 }}>
                {verifySuccess}
              </p>
            ) : (
              <form onSubmit={handleConfirmVerification} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className={styles.input}
                  maxLength={6}
                />
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowVerifyModal(false)}
                    disabled={verifyLoading}
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className={styles.confirmBtn}
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Verificando...' : 'Confirmar Código'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
