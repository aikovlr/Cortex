'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { ProblemDetailsError } from '@/services/api';
import { CameraIcon, CheckIcon, XIcon } from '@/components/common/Icons/Icons';
import { PhoneInput } from '@/components/ui/PhoneInput/PhoneInput';
import { buildFullPhone, isValidEmail } from '@/utils/phoneAndEmail';
import styles from './registro.module.css';

export default function RegistroPage() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+55');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [senha, setSenha] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validação dinâmica da regra RN02 (Requisitos de Senha)
  const hasMinLength = senha.length >= 8;
  const hasUpperCase = /[A-Z]/.test(senha);
  const hasLowerCase = /[a-z]/.test(senha);
  const hasNumber = /[0-9]/.test(senha);
  const hasSymbol = /[^A-Za-z0-9]/.test(senha);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoPerfil(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidEmail(email)) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido com domínio completo (ex: nome@empresa.com).');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('A senha não cumpre todos os requisitos de segurança da política de senhas.');
      return;
    }

    try {
      setLoading(true);

      const fullPhone = buildFullPhone(phoneCountry, phoneLocal);

      const formData = new FormData();
      formData.append('Nome', nome);
      formData.append('Email', email.trim());
      formData.append('Senha', senha);
      if (fullPhone) formData.append('Telefone', fullPhone);
      if (fotoPerfil) formData.append('FotoPerfil', fotoPerfil);

      await authService.registrar(formData);

      // Redireciona para o modal próprio de verificação na tela de login
      router.push(`/login?email=${encodeURIComponent(email)}&verify=true`);
    } catch (err: unknown) {
      if (err instanceof ProblemDetailsError) {
        setErrorMessage(err.detail || err.title);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocorreu um erro ao realizar seu cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.headerWrapper}>
          <Image
            src="/logo.png"
            alt="Logo Cortex"
            width={90}
            height={90}
            priority
          />
          <h1 className={styles.headerTitle}>Crie sua conta</h1>
          <p className={styles.headerSubtitle}>Junte-se à plataforma Cortex</p>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert" aria-live="assertive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Upload de Foto de Perfil */}
          <div className={styles.avatarUploadWrapper}>
            {fotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoPreview} alt="Pré-visualização da foto de perfil selecionada" className={styles.avatarPreview} />
            ) : (
              <div className={styles.avatarPlaceholder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CameraIcon size={24} />
              </div>
            )}
            <div className={styles.avatarUploadInfo}>
              <label
                htmlFor="fotoInput"
                className={styles.uploadLabel}
                tabIndex={0}
                role="button"
                aria-describedby="uploadHint"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('fotoInput')?.click();
                  }
                }}
              >
                {fotoPreview ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
              </label>
              <span id="uploadHint" className={styles.uploadHint}>JPG, PNG ou WebP (opcional)</span>
              <input
                id="fotoInput"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="nome" className={styles.label}>
              Nome Completo *
            </label>
            <input
              id="nome"
              type="text"
              required
              placeholder="Ex: João da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-mail *
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu.email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="telefone" className={styles.label}>
              Telefone
            </label>
            <PhoneInput
              id="telefone"
              variant="auth"
              countryCode={phoneCountry}
              localNumber={phoneLocal}
              onCountryChange={setPhoneCountry}
              onNumberChange={setPhoneLocal}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="senha" className={styles.label}>
              Senha *
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Crie uma senha forte"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={styles.input}
            />

            {/* Checklist de requisitos da senha (RN02) */}
            <div className={styles.passwordRequirements}>
              <span className={`${styles.reqItem} ${hasMinLength ? styles.reqItemValid : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {hasMinLength ? <CheckIcon size={13} /> : <XIcon size={13} />} Mínimo 8 caracteres
              </span>
              <span className={`${styles.reqItem} ${hasUpperCase ? styles.reqItemValid : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {hasUpperCase ? <CheckIcon size={13} /> : <XIcon size={13} />} Letra maiúscula
              </span>
              <span className={`${styles.reqItem} ${hasLowerCase ? styles.reqItemValid : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {hasLowerCase ? <CheckIcon size={13} /> : <XIcon size={13} />} Letra minúscula
              </span>
              <span className={`${styles.reqItem} ${hasNumber && hasSymbol ? styles.reqItemValid : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {hasNumber && hasSymbol ? <CheckIcon size={13} /> : <XIcon size={13} />} Número e símbolo
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Já possui uma conta?</span>
          <Link href="/login" className={styles.link}>
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
