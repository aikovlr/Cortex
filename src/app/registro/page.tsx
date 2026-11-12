'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalContent, setModalContent] = useState<'termos' | 'privacidade' | null>(null);
  const isMouseDownOnModalOverlay = useRef(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalContent) {
        setModalContent(null);
      }
    };
    if (modalContent) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalContent]);

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

    if (!aceitouTermos) {
      setErrorMessage('O aceite dos Termos de Uso e Política de Privacidade é obrigatório.');
      return;
    }

    try {
      setLoading(true);

      const fullPhone = buildFullPhone(phoneCountry, phoneLocal);

      const formData = new FormData();
      formData.append('Nome', nome);
      formData.append('Email', email.trim());
      formData.append('Senha', senha);
      formData.append('AceitouTermosPrivacidade', String(aceitouTermos));
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

          {/* Consentimento Explícito LGPD (Art. 7º, I e Art. 8º da Lei 13.709/2018) */}
          <div className={styles.consentGroup}>
            <div className={styles.checkboxWrapper}>
              <input
                id="aceitouTermos"
                type="checkbox"
                required
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className={styles.checkboxInput}
                aria-describedby="lgpdExplanation"
              />
              <label htmlFor="aceitouTermos" className={styles.checkboxLabel}>
                Li e concordo com os{' '}
                <button
                  type="button"
                  onClick={() => setModalContent('termos')}
                  className={styles.consentLinkBtn}
                >
                  Termos de Uso
                </button>{' '}
                e a{' '}
                <button
                  type="button"
                  onClick={() => setModalContent('privacidade')}
                  className={styles.consentLinkBtn}
                >
                  Política de Privacidade
                </button>
                . *
              </label>
            </div>
            <p id="lgpdExplanation" className={styles.consentHint}>
              Seus dados serão utilizados apenas para: Nome (identificação e suporte), E-mail (login e notificações essenciais) e Telefone (notificações e segurança 2FA). Não enviamos spam ou e-mails de marketing.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !aceitouTermos}
            className={styles.submitBtn}
          >
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Já possui uma conta?</span>
          <Link href="/login" className={styles.link}>
            Entrar
          </Link>
        </div>
      </div>

      {/* Modal de Termos de Uso e Política de Privacidade */}
      {modalContent && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(e) => {
            isMouseDownOnModalOverlay.current = e.target === e.currentTarget && e.button === 0;
          }}
          onMouseUp={(e) => {
            if (isMouseDownOnModalOverlay.current && e.target === e.currentTarget && e.button === 0) {
              setModalContent(null);
            }
            isMouseDownOnModalOverlay.current = false;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="termsModalTitle"
        >
          <div
            className={styles.termsModalBox}
          >
            <div className={styles.modalHeader}>
              <h2 id="termsModalTitle" className={styles.modalTitle}>
                {modalContent === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
              </h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalContent(null)}
                aria-label="Fechar modal"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className={styles.modalScrollBody}>
              {modalContent === 'termos' ? (
                <>
                  <p>
                    Estes Termos de Uso regulam o acesso e a utilização dos serviços e recursos oferecidos pela plataforma Cortex.
                  </p>
                  <h3>1. Aceitação dos Termos</h3>
                  <p>
                    Ao criar uma conta ou utilizar a plataforma Cortex, você concorda expressamente em cumprir estes Termos de Uso e todas as diretrizes aplicáveis.
                  </p>
                  <h3>2. Uso da Conta e Responsabilidades</h3>
                  <p>
                    O usuário é responsável pela guarda e confidencialidade de suas credenciais de acesso, bem como por todas as atividades realizadas por meio de sua conta.
                  </p>
                  <h3>3. Propriedade Intelectual e Licença de Uso</h3>
                  <p>
                    Todo o conteúdo, layout, logotipos e códigos-fonte da plataforma são de propriedade exclusiva do Cortex e protegidos pela legislação de direitos autorais.
                  </p>
                  <h3>4. Modificações dos Serviços</h3>
                  <p>
                    Reservamo-nos o direito de atualizar, alterar ou descontinuar funcionalidades da plataforma mediante aviso prévio razoável aos usuários cadastrados.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Esta Política de Privacidade descreve como o Cortex coleta, armazena, utiliza e protege os seus dados pessoais, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
                  </p>
                  <h3>1. Finalidade do Tratamento de Dados Pessoais</h3>
                  <p>
                    Coletamos e tratamos apenas os dados estritamente necessários para o funcionamento e a segurança da plataforma:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '4px 0', color: '#94A3B8' }}>
                    <li><strong>Nome Completo:</strong> Identificação do titular, personalização da experiência e suporte técnico.</li>
                    <li><strong>E-mail:</strong> Autenticação na plataforma, recuperação de senha e notificações operacionais essenciais.</li>
                    <li><strong>Telefone:</strong> Alertas operacionais configurados pelo usuário e segurança da conta (autenticação de dois fatores - 2FA).</li>
                  </ul>
                  <h3>2. Base Legal (Art. 7º da LGPD)</h3>
                  <p>
                    O tratamento é realizado com base no consentimento explícito do titular (Art. 7º, I) e para execução de contrato ou procedimentos preliminares (Art. 7º, V).
                  </p>
                  <h3>3. Não Compartilhamento e Ausência de Marketing</h3>
                  <p>
                    Não comercializamos seus dados com terceiros e não enviamos spam ou e-mails promocionais. Seus dados nunca serão utilizados para fins publicitários não solicitados.
                  </p>
                  <h3>4. Armazenamento e Segurança</h3>
                  <p>
                    Os dados são armazenados em ambiente seguro com criptografia em trânsito (TLS) e em repouso, empregando medidas técnicas adequadas para evitar acessos não autorizados.
                  </p>
                  <h3>5. Direitos do Titular (Art. 18 da LGPD)</h3>
                  <p>
                    Você pode a qualquer momento solicitar a confirmação, correção, atualização ou exclusão de seus dados pessoais entrando em contato com nosso canal de privacidade.
                  </p>
                </>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => setModalContent(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
