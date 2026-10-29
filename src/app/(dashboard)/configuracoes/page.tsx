'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Header from '@/app/Components/Header/header';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility, FontSize, Theme } from '@/contexts/AccessibilityContext';
import { usuarioService } from '@/services/usuarioService';
import { authService } from '@/services/authService';
import { notificacaoService } from '@/services/notificacaoService';
import { CanalNotificacao, PreferenciaNotificacaoDTO } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import styles from './page.module.css';

type ConfigTab = 'account' | 'accessibility' | 'notifications';

export default function ConfiguracoesPage() {
  const { usuario, recarregarPerfil, logout } = useAuth();
  const { fontSize, setFontSize, highContrast, setHighContrast, theme, setTheme } = useAccessibility();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ConfigTab>('account');

  // Estados da Aba Minha Conta
  const [nome, setNome] = useState(usuario?.nome || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(usuario?.fotoPerfil?.urlCaminho || null);
  const [fotoError, setFotoError] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [removingFoto, setRemovingFoto] = useState(false);

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  // Sincroniza dados quando o usuário autenticado carrega ou é atualizado
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setTelefone(usuario.telefone || '');
      if (usuario.fotoPerfil?.urlCaminho) {
        setFotoPreview(usuario.fotoPerfil.urlCaminho);
        setFotoError(false);
      } else {
        setFotoPreview(null);
      }
    }
  }, [usuario]);


  // Estados de Alteração de Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  // Estados de Notificações
  const [canaisSelecionados, setCanaisSelecionados] = useState<CanalNotificacao[]>([
    CanalNotificacao.Email,
    CanalNotificacao.Push,
  ]);
  const [antecedenciaHoras, setAntecedenciaHoras] = useState(24);
  const [ativoNovaAtribuicao, setAtivoNovaAtribuicao] = useState(true);
  const [ativoVencimento, setAtivoVencimento] = useState(true);
  const [ativoConclusaoMeta, setAtivoConclusaoMeta] = useState(true);
  const [ativoTicket, setAtivoTicket] = useState(true);
  const [savingNotificacoes, setSavingNotificacoes] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carrega preferências de notificações do usuário
  useEffect(() => {
    let isMounted = true;
    notificacaoService
      .obterPreferencias()
      .then((prefs: PreferenciaNotificacaoDTO[]) => {
        if (!isMounted || !prefs || prefs.length === 0) return;

        // Identifica quais canais têm pelo menos uma notificação ativa
        const canaisAtivos = prefs
          .filter(
            (p) =>
              p.ativoNovaAtribuicao ||
              p.ativoVencimento ||
              p.ativoConclusaoMeta ||
              p.ativoTicket
          )
          .map((p) => p.canal);

        setCanaisSelecionados(canaisAtivos);

        // Pega os parâmetros do primeiro canal ativo ou default
        const prefAtual =
          prefs.find((p) => canaisAtivos.includes(p.canal)) || prefs[0];
        if (prefAtual) {
          setAntecedenciaHoras(prefAtual.antecedenciaHoras);
          setAtivoNovaAtribuicao(prefAtual.ativoNovaAtribuicao);
          setAtivoVencimento(prefAtual.ativoVencimento);
          setAtivoConclusaoMeta(prefAtual.ativoConclusaoMeta);
          setAtivoTicket(prefAtual.ativoTicket);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleCanal = (canal: CanalNotificacao) => {
    setCanaisSelecionados((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]
    );
  };

  const handleSelectFontSize = (size: FontSize) => {
    setFontSize(size);
    showToast('Tamanho de fonte atualizado com sucesso!', 'success');
  };

  const handleSelectTheme = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    showToast(
      selectedTheme === 'dark' ? 'Tema escuro ativado!' : 'Tema claro ativado!',
      'info'
    );
  };

  const handleToggleHighContrast = (checked: boolean) => {
    setHighContrast(checked);
    showToast(
      checked ? 'Texto em alto contraste ativado!' : 'Texto em alto contraste desativado!',
      'info'
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
      setFotoError(false);
    }
  };

  // Remover foto de perfil
  const handleRemoverFoto = async () => {
    if (fotoFile) {
      setFotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFotoPreview(usuario?.fotoPerfil?.urlCaminho || null);
      showToast('Seleção de foto cancelada.', 'info');
      return;
    }

    if (!usuario?.fotoPerfil) {
      setFotoPreview(null);
      return;
    }

    if (!confirm('Deseja realmente remover sua foto de perfil?')) {
      return;
    }

    try {
      setRemovingFoto(true);
      const fotoId = usuario.fotoPerfil.id;
      await usuarioService.removerFotoPerfil(fotoId);
      await recarregarPerfil();
      setFotoPreview(null);
      setFotoError(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Foto de perfil removida com sucesso!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao remover foto de perfil.', 'error');
      }
    } finally {
      setRemovingFoto(false);
    }
  };

  // Salvar dados do Perfil
  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('O nome é obrigatório.', 'error');
      return;
    }

    try {
      setSavingPerfil(true);
      const formData = new FormData();
      formData.append('Nome', nome.trim());
      if (telefone) formData.append('Telefone', telefone.trim());
      if (fotoFile) formData.append('FotoPerfil', fotoFile);

      const usuarioAtualizado = await usuarioService.atualizarPerfil(formData);
      await recarregarPerfil();
      setFotoFile(null);
      if (usuarioAtualizado?.fotoPerfil?.urlCaminho) {
        setFotoPreview(usuarioAtualizado.fotoPerfil.urlCaminho);
        setFotoError(false);
      }
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao atualizar perfil.', 'error');
      }
    } finally {
      setSavingPerfil(false);
    }
  };

  // Alterar Senha
  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha) {
      showToast('Preencha a senha atual e a nova senha.', 'error');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      showToast('A nova senha e a confirmação não coincidem.', 'error');
      return;
    }

    try {
      setSavingSenha(true);
      await authService.alterarSenha({
        senhaAtual,
        novaSenha,
      });
      showToast('Senha alterada com sucesso!', 'success');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao alterar senha.', 'error');
      }
    } finally {
      setSavingSenha(false);
    }
  };

  // Excluir Conta (RN05)
  const handleExcluirConta = async () => {
    const confirmacao = prompt(
      'Atenção: Esta ação é irreversível. Para confirmar a exclusão da sua conta, digite "EXCLUIR":'
    );
    if (confirmacao !== 'EXCLUIR') {
      showToast('Exclusão cancelada.', 'info');
      return;
    }

    try {
      await usuarioService.excluirMinhaConta();
      showToast('Sua conta foi excluída com sucesso.', 'success');
      await logout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Não foi possível excluir a conta. Verifique se possui tarefas pendentes (RN05).', 'error');
      }
    }
  };

  // Salvar Preferências de Notificações para todos os métodos selecionados
  const handleSalvarNotificacoes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingNotificacoes(true);

      const todosCanais = [
        CanalNotificacao.Email,
        CanalNotificacao.Push,
        CanalNotificacao.Sms,
      ];

      // Salva preferências para todos os canais: os selecionados ficam ativos com os parâmetros definidos,
      // e os não selecionados têm suas notificações desativadas
      await Promise.all(
        todosCanais.map((canal) => {
          const isAtivo = canaisSelecionados.includes(canal);
          return notificacaoService.configurarPreferencias({
            canal,
            antecedenciaHoras,
            ativoNovaAtribuicao: isAtivo ? ativoNovaAtribuicao : false,
            ativoVencimento: isAtivo ? ativoVencimento : false,
            ativoConclusaoMeta: isAtivo ? ativoConclusaoMeta : false,
            ativoTicket: isAtivo ? ativoTicket : false,
          });
        })
      );

      if (canaisSelecionados.length === 0) {
        showToast('Preferências salvas! Notificações desativadas para todos os canais.', 'info');
      } else {
        const nomesCanais = canaisSelecionados
          .map((c) =>
            c === CanalNotificacao.Email
              ? 'E-mail'
              : c === CanalNotificacao.Push
              ? 'Push Notification'
              : 'SMS'
          )
          .join(', ');

        showToast(`Preferências salvas com sucesso para: ${nomesCanais}!`, 'success');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao salvar preferências de notificação.', 'error');
      }
    } finally {
      setSavingNotificacoes(false);
    }
  };

  return (
    <>
      <Header titulo="Configurações" subtitulo="Workspace / Cortex" />
      <main className={styles.container}>
        {/* Abas de Navegação das Configurações */}
      <div className={styles.tabsHeader}>
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`${styles.tabBtn} ${activeTab === 'account' ? styles.tabBtnActive : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Minha Conta
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accessibility')}
          className={`${styles.tabBtn} ${activeTab === 'accessibility' ? styles.tabBtnActive : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Acessibilidade
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.tabBtnActive : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          Notificações
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: MINHA CONTA */}
      {activeTab === 'account' && (
        <div className={styles.tabContent}>
          {/* Dados do Perfil */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Dados Pessoais</h2>
              <p className={styles.cardSubtitle}>Atualize suas informações cadastrais e foto de perfil</p>
            </div>

            <form onSubmit={handleSalvarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  {fotoPreview && !fotoError ? (
                    <Image
                      src={getAvatarUrl(fotoPreview)}
                      alt="Foto de Perfil"
                      width={76}
                      height={76}
                      className={styles.avatarImage}
                      unoptimized
                      onError={() => setFotoError(true)}
                    />
                  ) : (
                    <span>{usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <div className={styles.avatarActions}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.uploadBtn}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {fotoPreview ? 'Alterar foto' : 'Adicionar foto'}
                    </button>
                    {(fotoPreview || usuario?.fotoPerfil) && (
                      <button
                        type="button"
                        onClick={handleRemoverFoto}
                        className={styles.removePhotoBtn}
                        disabled={removingFoto || savingPerfil}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {removingFoto ? 'Removendo...' : 'Remover foto'}
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--cortex-gray-text)' }}>
                    JPG, PNG ou GIF. Tamanho máximo recomendado: 5MB.
                  </span>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Nome Completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Telefone</label>
                  <input
                    type="tel"
                    placeholder="(XX) XXXXX-XXXX"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>E-mail</label>
                  <div className={styles.emailStatus}>
                    <input
                      type="email"
                      value={usuario?.email || ''}
                      disabled
                      className={styles.input}
                    />
                    <span
                      className={`${styles.statusBadge} ${
                        usuario?.emailVerificado ? styles.verified : styles.unverified
                      }`}
                    >
                      {usuario?.emailVerificado ? 'Verificado' : 'Não verificado'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPerfil}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--cortex-purple)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {savingPerfil ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>

          {/* Alteração de Senha */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Segurança</h2>
              <p className={styles.cardSubtitle}>Altere sua senha de acesso à plataforma</p>
            </div>

            <form onSubmit={handleAlterarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px' }}>
              <div className={styles.field}>
                <label className={styles.label}>Senha Atual</label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nova Senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  placeholder="Mínimo de 8 caracteres, maiúscula, número e símbolo"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmarNovaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={savingSenha || !senhaAtual || !novaSenha}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--cortex-purple)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  opacity: !senhaAtual || !novaSenha ? 0.6 : 1,
                }}
              >
                {savingSenha ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </form>
          </div>

          {/* Zona de Perigo / Excluir Conta (RN05) */}
          <div className={`${styles.card} ${styles.dangerCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>Zona de Perigo</h2>
              <p className={styles.cardSubtitle}>
                A exclusão da conta é permanente e só é permitida caso você não possua tarefas pendentes ou em andamento (Regra RN05).
              </p>
            </div>

            <button
              type="button"
              onClick={handleExcluirConta}
              className={styles.deleteBtn}
            >
              Excluir Minha Conta
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: ACESSIBILIDADE */}
      {activeTab === 'accessibility' && (
        <div className={styles.tabContent}>
          {/* Opção de Tema da Interface */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Tema da Interface</h2>
              <p className={styles.cardSubtitle}>
                Escolha a aparência visual do Cortex de acordo com a sua preferência ou iluminação do ambiente
              </p>
            </div>

            <div className={styles.fontSizeGrid}>
              <div
                onClick={() => handleSelectTheme('light')}
                className={`${styles.fontSizeOption} ${theme === 'light' ? styles.fontSizeOptionActive : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={theme === 'light'}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTheme('light')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Image
                    src="/sun.svg"
                    alt=""
                    width={22}
                    height={22}
                    style={{ filter: 'var(--icon-filter)' }}
                  />
                </div>
                Modo Claro
              </div>

              <div
                onClick={() => handleSelectTheme('dark')}
                className={`${styles.fontSizeOption} ${theme === 'dark' ? styles.fontSizeOptionActive : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={theme === 'dark'}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTheme('dark')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Image
                    src="/moon.svg"
                    alt=""
                    width={22}
                    height={22}
                    style={{ filter: 'var(--icon-filter)' }}
                  />
                </div>
                Modo Escuro
              </div>
            </div>
          </div>

          {/* Opção de Alto Contraste */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Contraste de Cores</h2>
              <p className={styles.cardSubtitle}>
                Ajuste os parâmetros visuais para garantir maior nitidez e conforto na leitura dos conteúdos
              </p>
            </div>

            <div className={styles.toggleRow} style={{ borderBottom: 'none', padding: '6px 0' }}>
              <div className={styles.toggleLabel}>
                <span className={styles.toggleTitle}>Texto em alto contraste</span>
                <span className={styles.toggleDesc}>
                  Aumenta o contraste entre o texto, bordas e fundos, otimizando a visualização e legibilidade em todo o sistema
                </span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => handleToggleHighContrast(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          {/* Opção de Tamanho da Fonte */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Tamanho da Fonte</h2>
              <p className={styles.cardSubtitle}>
                Ajuste a escala tipográfica aplicada globalmente em todas as páginas do sistema
              </p>
            </div>

            <div className={styles.fontSizeGrid}>
              <div
                onClick={() => handleSelectFontSize('small')}
                className={`${styles.fontSizeOption} ${fontSize === 'small' ? styles.fontSizeOptionActive : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectFontSize('small')}
              >
                <span style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Aa</span>
                Pequena (14px)
              </div>

              <div
                onClick={() => handleSelectFontSize('medium')}
                className={`${styles.fontSizeOption} ${fontSize === 'medium' ? styles.fontSizeOptionActive : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectFontSize('medium')}
              >
                <span style={{ fontSize: '16px', display: 'block', marginBottom: '6px' }}>Aa</span>
                Média (Padrão 16px)
              </div>

              <div
                onClick={() => handleSelectFontSize('large')}
                className={`${styles.fontSizeOption} ${fontSize === 'large' ? styles.fontSizeOptionActive : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectFontSize('large')}
              >
                <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>Aa</span>
                Grande (18px)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: NOTIFICAÇÕES */}
      {activeTab === 'notifications' && (
        <div className={styles.tabContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Canais de Notificação</h2>
              <p className={styles.cardSubtitle}>
                Escolha os canais e configure suas preferências (você pode selecionar múltiplos canais simultaneamente)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleToggleCanal(CanalNotificacao.Email)}
                className={`${styles.uploadBtn} ${
                  canaisSelecionados.includes(CanalNotificacao.Email)
                    ? styles.fontSizeOptionActive
                    : ''
                }`}
              >
                E-mail {canaisSelecionados.includes(CanalNotificacao.Email) ? '✓' : ''}
              </button>
              <button
                type="button"
                onClick={() => handleToggleCanal(CanalNotificacao.Sms)}
                className={`${styles.uploadBtn} ${
                  canaisSelecionados.includes(CanalNotificacao.Sms)
                    ? styles.fontSizeOptionActive
                    : ''
                }`}
              >
                SMS {canaisSelecionados.includes(CanalNotificacao.Sms) ? '✓' : ''}
              </button>
              <button
                type="button"
                onClick={() => handleToggleCanal(CanalNotificacao.Push)}
                className={`${styles.uploadBtn} ${
                  canaisSelecionados.includes(CanalNotificacao.Push)
                    ? styles.fontSizeOptionActive
                    : ''
                }`}
              >
                Push Notification {canaisSelecionados.includes(CanalNotificacao.Push) ? '✓' : ''}
              </button>
            </div>

            {canaisSelecionados.includes(CanalNotificacao.Email) && !usuario?.emailVerificado && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(234, 179, 8, 0.12)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  color: '#b45309',
                  fontSize: '13px',
                }}
              >
                <span>⚠️</span>
                <span>
                  <strong>Atenção:</strong> Seu e-mail ainda não está verificado. Segundo a regra do sistema (RN13), confirme seu e-mail para receber notificações por esse método.
                </span>
              </div>
            )}

            <form onSubmit={handleSalvarNotificacoes} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className={styles.field} style={{ maxWidth: '320px' }}>
                <label className={styles.label}>Antecedência de Notificação de Vencimento</label>
                <select
                  value={antecedenciaHoras}
                  onChange={(e) => setAntecedenciaHoras(Number(e.target.value))}
                  className={styles.input}
                >
                  <option value={1}>1 hora antes</option>
                  <option value={6}>6 horas antes</option>
                  <option value={12}>12 horas antes</option>
                  <option value={24}>24 horas antes (1 dia)</option>
                  <option value={48}>48 horas antes (2 dias)</option>
                  <option value={72}>72 horas antes (3 dias)</option>
                  <option value={168}>168 horas antes (7 dias - Máximo RN11)</option>
                </select>
                <span style={{ fontSize: '11px', color: 'var(--cortex-gray-text)' }}>
                  Regra RN11: Antecedência mínima de 1 hora e máxima de 7 dias (168h).
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>Nova Atribuição de Tarefa</span>
                    <span className={styles.toggleDesc}>Receba alertas quando você for designado para uma nova tarefa</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoNovaAtribuicao}
                      onChange={(e) => setAtivoNovaAtribuicao(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>Tarefas Próximas ao Vencimento</span>
                    <span className={styles.toggleDesc}>Alertas com antecedência configurada antes da data limite</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoVencimento}
                      onChange={(e) => setAtivoVencimento(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>Conclusão de Metas</span>
                    <span className={styles.toggleDesc}>Notificações quando metas e tarefas vinculadas forem finalizadas</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoConclusaoMeta}
                      onChange={(e) => setAtivoConclusaoMeta(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>Tickets de Reporte de Problemas</span>
                    <span className={styles.toggleDesc}>Avisos quando tickets forem abertos ou respondidos</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoTicket}
                      onChange={(e) => setAtivoTicket(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingNotificacoes}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--cortex-purple)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '12px',
                }}
              >
                {savingNotificacoes ? 'Salvando...' : 'Salvar Preferências'}
              </button>
            </form>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
