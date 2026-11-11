'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Header from '@/app/Components/Header/header';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility, FontSize, Theme, FONT_SIZE_OPTIONS, toNumericFontSize } from '@/contexts/AccessibilityContext';
import { usuarioService } from '@/services/usuarioService';
import { authService } from '@/services/authService';
import { notificacaoService } from '@/services/notificacaoService';
import { CanalNotificacao, PreferenciaNotificacaoDTO } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import { PhoneInput } from '@/components/ui/PhoneInput/PhoneInput';
import { parseStoredPhone, buildFullPhone } from '@/utils/phoneAndEmail';
import { AccountLevelWidget } from '@/components/gamification/AccountLevelWidget/AccountLevelWidget';
import styles from './page.module.css';

type ConfigTab = 'account' | 'accessibility' | 'notifications';

interface CanalPreferenciaState {
  ativo: boolean;
  antecedenciaHoras: number;
  ativoNovaAtribuicao: boolean;
  ativoVencimento: boolean;
  ativoConclusaoMeta: boolean;
  ativoTicket: boolean;
  ativoSugestao: boolean;
  ativoEquipe: boolean;
  ativoGeral: boolean;
}

const TIPOS_NOTIFICACAO_CONFIG = [
  {
    campo: 'ativoNovaAtribuicao' as const,
    titulo: 'Nova Atribuição de Tarefa',
    descricao: 'Alertas quando você for designado para uma nova tarefa ou quando houver atualizações na tarefa',
  },
  {
    campo: 'ativoVencimento' as const,
    titulo: 'Tarefas Próximas ao Vencimento',
    descricao: 'Alertas com a antecedência configurada antes da data limite da tarefa',
  },
  {
    campo: 'ativoConclusaoMeta' as const,
    titulo: 'Conclusão e Progresso de Metas',
    descricao: 'Notificações quando metas e tarefas vinculadas forem finalizadas ou atualizadas',
  },
  {
    campo: 'ativoTicket' as const,
    titulo: 'Tickets de Suporte e Problemas',
    descricao: 'Avisos quando tickets de suporte forem abertos, respondidos ou atualizados',
  },
  {
    campo: 'ativoSugestao' as const,
    titulo: 'Sugestões em Tarefas',
    descricao: 'Alertas sobre novas sugestões enviadas, aprovadas ou rejeitadas nas tarefas',
  },
  {
    campo: 'ativoEquipe' as const,
    titulo: 'Atividades e Convites de Equipe',
    descricao: 'Notificações quando você for adicionado a equipes ou houver mudanças de cargo e membros',
  },
  {
    campo: 'ativoGeral' as const,
    titulo: 'Comunicados Gerais do Sistema',
    descricao: 'Avisos globais da plataforma, comunicados administrativos e informativos do sistema',
  },
];

export default function ConfiguracoesPage() {
  const { usuario, recarregarPerfil, logout } = useAuth();
  const { fontSize, setFontSize, highContrast, setHighContrast, theme, setTheme } = useAccessibility();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ConfigTab>('account');

  const obterAbaDaUrl = (): ConfigTab | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const abaParam = (params.get('aba') || params.get('tab') || '').toLowerCase().trim();
    if (abaParam === 'account' || abaParam === 'conta' || abaParam === 'minha-conta') return 'account';
    if (abaParam === 'accessibility' || abaParam === 'acessibilidade') return 'accessibility';
    if (abaParam === 'notifications' || abaParam === 'notificacoes' || abaParam === 'notificacao') return 'notifications';
    return null;
  };

  const trocarAba = (tab: ConfigTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const slug = tab === 'account' ? 'minha-conta' : tab === 'accessibility' ? 'acessibilidade' : 'notificacoes';
      url.searchParams.set('aba', slug);
      url.searchParams.delete('tab');
      window.history.pushState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const sincronizarAba = () => {
      const abaUrl = obterAbaDaUrl();
      if (abaUrl) {
        setActiveTab(abaUrl);
      }
    };

    sincronizarAba();
    window.addEventListener('popstate', sincronizarAba);
    return () => {
      window.removeEventListener('popstate', sincronizarAba);
    };
  }, []);

  // Estados da Aba Minha Conta
  const [nome, setNome] = useState(usuario?.nome || '');
  const [phoneCountry, setPhoneCountry] = useState('+55');
  const [phoneLocal, setPhoneLocal] = useState('');
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
      const parsed = parseStoredPhone(usuario.telefone);
      setPhoneCountry(parsed.countryCode);
      setPhoneLocal(parsed.localNumber);
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

  // Estados de Notificações por Canal
  const [canaisConfig, setCanaisConfig] = useState<Record<CanalNotificacao, CanalPreferenciaState>>({
    [CanalNotificacao.Email]: {
      ativo: true,
      antecedenciaHoras: 24,
      ativoNovaAtribuicao: true,
      ativoVencimento: true,
      ativoConclusaoMeta: true,
      ativoTicket: true,
      ativoSugestao: true,
      ativoEquipe: true,
      ativoGeral: true,
    },
    [CanalNotificacao.Push]: {
      ativo: true,
      antecedenciaHoras: 24,
      ativoNovaAtribuicao: true,
      ativoVencimento: true,
      ativoConclusaoMeta: true,
      ativoTicket: true,
      ativoSugestao: true,
      ativoEquipe: true,
      ativoGeral: true,
    },
    [CanalNotificacao.Sms]: {
      ativo: false,
      antecedenciaHoras: 24,
      ativoNovaAtribuicao: false,
      ativoVencimento: false,
      ativoConclusaoMeta: false,
      ativoTicket: false,
      ativoSugestao: false,
      ativoEquipe: false,
      ativoGeral: false,
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carrega preferências de notificações do usuário para cada canal
  useEffect(() => {
    let isMounted = true;
    notificacaoService
      .obterPreferencias()
      .then((prefs: PreferenciaNotificacaoDTO[]) => {
        if (!isMounted || !prefs || prefs.length === 0) return;

        setCanaisConfig((prev) => {
          const next = { ...prev };
          prefs.forEach((p) => {
            const canal = p.canal as CanalNotificacao;
            if (next[canal]) {
              const temAlgumaAtiva =
                p.ativoNovaAtribuicao ||
                p.ativoVencimento ||
                p.ativoConclusaoMeta ||
                p.ativoTicket ||
                Boolean(p.ativoSugestao) ||
                Boolean(p.ativoEquipe) ||
                Boolean(p.ativoGeral);

              next[canal] = {
                ativo: temAlgumaAtiva,
                antecedenciaHoras: p.antecedenciaHoras || 24,
                ativoNovaAtribuicao: p.ativoNovaAtribuicao,
                ativoVencimento: p.ativoVencimento,
                ativoConclusaoMeta: p.ativoConclusaoMeta,
                ativoTicket: p.ativoTicket,
                ativoSugestao: p.ativoSugestao ?? true,
                ativoEquipe: p.ativoEquipe ?? true,
                ativoGeral: p.ativoGeral ?? true,
              };
            }
          });
          return next;
        });
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, []);

  // Salva preferências no backend automaticamente
  const salvarCanalAsync = async (canal: CanalNotificacao, configParaSalvar: CanalPreferenciaState) => {
    try {
      await notificacaoService.configurarPreferencias({
        canal,
        antecedenciaHoras: configParaSalvar.antecedenciaHoras,
        ativoNovaAtribuicao: configParaSalvar.ativo ? configParaSalvar.ativoNovaAtribuicao : false,
        ativoVencimento: configParaSalvar.ativo ? configParaSalvar.ativoVencimento : false,
        ativoConclusaoMeta: configParaSalvar.ativo ? configParaSalvar.ativoConclusaoMeta : false,
        ativoTicket: configParaSalvar.ativo ? configParaSalvar.ativoTicket : false,
        ativoSugestao: configParaSalvar.ativo ? configParaSalvar.ativoSugestao : false,
        ativoEquipe: configParaSalvar.ativo ? configParaSalvar.ativoEquipe : false,
        ativoGeral: configParaSalvar.ativo ? configParaSalvar.ativoGeral : false,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao salvar preferências de notificação.', 'error');
      }
    }
  };

  // Ativar ou desativar o canal mestre (com salvamento automático)
  const handleToggleCanalAtivo = (canal: CanalNotificacao, checked: boolean) => {
    if (canal === CanalNotificacao.Email && checked && usuario?.emailVerificado === false) {
      showToast(
        'Seu e-mail precisa estar verificado para ativar as notificações por e-mail.',
        'error'
      );
      return;
    }

    const atual = canaisConfig[canal];
    let novoConfig: CanalPreferenciaState;

    if (checked) {
      const todasDesligadas =
        !atual.ativoNovaAtribuicao &&
        !atual.ativoVencimento &&
        !atual.ativoConclusaoMeta &&
        !atual.ativoTicket &&
        !atual.ativoSugestao &&
        !atual.ativoEquipe &&
        !atual.ativoGeral;

      novoConfig = {
        ...atual,
        ativo: true,
        ativoNovaAtribuicao: todasDesligadas ? true : atual.ativoNovaAtribuicao,
        ativoVencimento: todasDesligadas ? true : atual.ativoVencimento,
        ativoConclusaoMeta: todasDesligadas ? true : atual.ativoConclusaoMeta,
        ativoTicket: todasDesligadas ? true : atual.ativoTicket,
        ativoSugestao: todasDesligadas ? true : atual.ativoSugestao,
        ativoEquipe: todasDesligadas ? true : atual.ativoEquipe,
        ativoGeral: todasDesligadas ? true : atual.ativoGeral,
      };
    } else {
      novoConfig = {
        ...atual,
        ativo: false,
      };
    }

    setCanaisConfig((prev) => ({
      ...prev,
      [canal]: novoConfig,
    }));

    salvarCanalAsync(canal, novoConfig);
  };

  // Alterar campo de evento específico de um canal (com salvamento automático)
  const handleToggleCanalCampo = (
    canal: CanalNotificacao,
    campo:
      | 'ativoNovaAtribuicao'
      | 'ativoVencimento'
      | 'ativoConclusaoMeta'
      | 'ativoTicket'
      | 'ativoSugestao'
      | 'ativoEquipe'
      | 'ativoGeral',
    checked: boolean
  ) => {
    if (canal === CanalNotificacao.Email && checked && usuario?.emailVerificado === false) {
      showToast(
        'Seu e-mail precisa estar verificado para ativar notificações por e-mail.',
        'error'
      );
      return;
    }

    const atual = canaisConfig[canal];
    const novoConfig: CanalPreferenciaState = {
      ...atual,
      [campo]: checked,
    };

    if (checked && !atual.ativo) {
      novoConfig.ativo = true;
    }

    const algumAtivo =
      novoConfig.ativoNovaAtribuicao ||
      novoConfig.ativoVencimento ||
      novoConfig.ativoConclusaoMeta ||
      novoConfig.ativoTicket ||
      novoConfig.ativoSugestao ||
      novoConfig.ativoEquipe ||
      novoConfig.ativoGeral;

    novoConfig.ativo = algumAtivo;

    setCanaisConfig((prev) => ({
      ...prev,
      [canal]: novoConfig,
    }));

    salvarCanalAsync(canal, novoConfig);
  };

  // Alterar antecedência de um canal (com salvamento automático)
  const handleChangeAntecedencia = (canal: CanalNotificacao, horas: number) => {
    const novoConfig: CanalPreferenciaState = {
      ...canaisConfig[canal],
      antecedenciaHoras: horas,
    };

    setCanaisConfig((prev) => ({
      ...prev,
      [canal]: novoConfig,
    }));

    salvarCanalAsync(canal, novoConfig);
  };

  const handleSelectFontSize = (size: FontSize) => {
    setFontSize(size);
    const num = toNumericFontSize(size);
    showToast(`Tamanho de fonte atualizado para ${num}px!`, 'success');
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
      const fullPhone = buildFullPhone(phoneCountry, phoneLocal);

      const formData = new FormData();
      formData.append('Nome', nome.trim());
      if (fullPhone) formData.append('Telefone', fullPhone);
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
        showToast('Não foi possível excluir a conta. Verifique se possui tarefas pendentes.', 'error');
      }
    }
  };


  return (
    <>
      <Header titulo="Configurações" />
      <main id="conteudo-principal" className={styles.container}>
        {/* Abas de Navegação das Configurações */}
        <div className={styles.tabsHeader}>
          <button
            type="button"
            onClick={() => trocarAba('account')}
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
            onClick={() => trocarAba('accessibility')}
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
            onClick={() => trocarAba('notifications')}
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
            {/* Nível de Conta e Gamificação */}
            <AccountLevelWidget
              nivel={usuario?.nivel}
              experiencia={usuario?.experiencia}
              variant="card"
            />

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
                    <PhoneInput
                      id="telefone-config"
                      variant="dashboard"
                      countryCode={phoneCountry}
                      localNumber={phoneLocal}
                      onCountryChange={setPhoneCountry}
                      onNumberChange={setPhoneLocal}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>E-mail</label>
                    <input
                      type="email"
                      value={usuario?.email || ''}
                      disabled
                      className={styles.input}
                    />
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
                  A exclusão da conta é permanente e só é permitida caso você não possua tarefas pendentes ou atrasadas.
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
                  Ajuste a escala tipográfica aplicada globalmente em todas as páginas do sistema (12px a 24px, somente números pares)
                </p>
              </div>

              {/* Slider de ajuste fino com step 2 (somente números pares entre 12px e 24px) */}
              <div style={{ marginBottom: '20px', padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--cortex-gray-text)', fontWeight: 500 }}>
                    Ajuste contínuo (Pares: 12px a 24px)
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cortex-purple)' }}>
                    {toNumericFontSize(fontSize)}px
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={24}
                  step={2}
                  value={toNumericFontSize(fontSize)}
                  onChange={(e) => handleSelectFontSize(Number(e.target.value) as FontSize)}
                  style={{
                    width: '100%',
                    accentColor: 'var(--cortex-purple)',
                    cursor: 'pointer',
                  }}
                  aria-label="Escala de tamanho da fonte (12px a 24px, somente números pares)"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--cortex-gray-text)' }}>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <span
                      key={opt.value}
                      style={{
                        cursor: 'pointer',
                        fontWeight: toNumericFontSize(fontSize) === opt.value ? 700 : 400,
                        color: toNumericFontSize(fontSize) === opt.value ? 'var(--cortex-purple)' : 'inherit',
                      }}
                      onClick={() => handleSelectFontSize(opt.value)}
                    >
                      {opt.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid de opções de tamanho com preview Aa e descrições */}
              <div className={styles.fontSizeGrid}>
                {FONT_SIZE_OPTIONS.map((opt) => {
                  const isActive = toNumericFontSize(fontSize) === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelectFontSize(opt.value)}
                      className={`${styles.fontSizeOption} ${isActive ? styles.fontSizeOptionActive : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectFontSize(opt.value)}
                    >
                      <span
                        style={{
                          fontSize: `${opt.value}px`,
                          display: 'block',
                          marginBottom: '6px',
                          lineHeight: 1.2,
                          fontWeight: 600,
                        }}
                      >
                        Aa
                      </span>
                      <div style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500 }}>
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: isActive ? 'var(--cortex-purple)' : 'var(--cortex-gray-text)',
                          marginTop: '2px',
                        }}
                      >
                        {opt.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: NOTIFICAÇÕES */}
        {activeTab === 'notifications' && (
          <div className={styles.tabContent}>
            {/* Cabeçalho explicativo */}
            <div className={styles.card}>
              <div className={styles.cardHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 className={styles.cardTitle}>Preferências de Notificação</h2>
                <p className={styles.cardSubtitle}>
                  Gerencie individualmente as preferências para cada meio de canal (E-mail, Push Notification e SMS).
                  Você pode ativar ou desativar cada canal por completo ou personalizar os eventos desejados.
                </p>
              </div>
            </div>

            {/* Cards individuais por Canal */}
            {[
              {
                id: CanalNotificacao.Email,
                nome: 'E-mail',
                subtitulo: 'Receba resumos, lembretes e avisos importantes na sua caixa de entrada cadastrada.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ),
                destino: usuario?.email ? `Endereço: ${usuario.email}` : undefined,
                aviso:
                  usuario?.emailVerificado === false
                    ? {
                      tipo: 'warning' as const,
                      texto:
                        'Seu endereço de e-mail ainda não foi verificado. De acordo com as políticas do Cortex, verifique seu e-mail para ativar notificações neste canal.',
                    }
                    : undefined,
              },
              {
                id: CanalNotificacao.Push,
                nome: 'Push Notification',
                subtitulo: 'Alertas instantâneos em tempo real no navegador ou dispositivo enquanto utiliza o Cortex.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                ),
                destino: 'Navegador Web / Dispositivo Conectado',
                aviso: undefined,
              },
              {
                id: CanalNotificacao.Sms,
                nome: 'SMS',
                subtitulo: 'Mensagens de texto via celular para notificações urgentes e prazos críticos.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                destino: usuario?.telefone ? `Celular: ${usuario.telefone}` : undefined,
                aviso: !usuario?.telefone
                  ? {
                    tipo: 'info' as const,
                    texto:
                      'Nenhum telefone celular cadastrado no perfil. Acesse a aba "Minha Conta" para informar seu telefone e habilitar o recebimento de SMS.',
                  }
                  : undefined,
              },
            ].map((info) => {
              const conf = canaisConfig[info.id];

              return (
                <div
                  key={info.id}
                  className={`${styles.channelCard} ${!conf.ativo ? styles.channelCardInactive : ''}`}
                >
                  {/* Header do Canal com switch geral */}
                  <div className={styles.channelHeaderWrapper}>
                    <div className={styles.channelHeaderLeft}>
                      <div className={styles.channelIcon}>{info.icon}</div>
                      <div className={styles.channelHeaderTitles}>
                        <div className={styles.channelTitle}>{info.nome}</div>
                        <div className={styles.channelSubtitle}>
                          <span>{info.subtitulo}</span>
                          {info.destino && (
                            <div className={styles.channelDestino}>
                              {info.destino}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.channelHeaderRight}>
                      <label className={styles.switch} title={`Ativar ou desativar canal ${info.nome}`}>
                        <input
                          type="checkbox"
                          checked={conf.ativo}
                          onChange={(e) => handleToggleCanalAtivo(info.id, e.target.checked)}
                          aria-label={`Ativar ou desativar canal ${info.nome}`}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </div>

                  {/* Banner de Aviso específico */}
                  {info.aviso && (
                    <div
                      className={`${styles.channelNotice} ${info.aviso.tipo === 'warning' ? styles.channelNoticeWarning : styles.channelNoticeInfo
                        }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{info.aviso.texto}</span>
                    </div>
                  )}

                  {/* Aviso quando o canal estiver desativado */}
                  {!conf.ativo && (
                    <div className={`${styles.channelNotice} ${styles.channelNoticeDisabled}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      <span>Canal desativado. Ative a chave acima para configurar e receber notificações por {info.nome}.</span>
                    </div>
                  )}

                  {/* Opções e Eventos do Canal */}
                  <div className={`${styles.channelBody} ${!conf.ativo ? styles.channelBodyDisabled : ''}`}>
                    <div className={styles.antecedenciaField}>
                      <label className={styles.label}>Antecedência de Notificação de Vencimento</label>
                      <select
                        value={conf.antecedenciaHoras}
                        onChange={(e) => handleChangeAntecedencia(info.id, Number(e.target.value))}
                        className={styles.input}
                        disabled={!conf.ativo}
                      >
                        <option value={1}>1 hora antes</option>
                        <option value={6}>6 horas antes</option>
                        <option value={12}>12 horas antes</option>
                        <option value={24}>24 horas antes (1 dia)</option>
                        <option value={48}>48 horas antes (2 dias)</option>
                        <option value={72}>72 horas antes (3 dias)</option>
                        <option value={168}>168 horas antes (7 dias - Máximo)</option>
                      </select>
                      <span style={{ fontSize: '11px', color: 'var(--cortex-gray-text)' }}>
                        Antecedência para alertas de prazos (de 1h até 168h).
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {TIPOS_NOTIFICACAO_CONFIG.map((tipo) => (
                        <label
                          key={tipo.campo}
                          className={`${styles.toggleRow} ${!conf.ativo ? styles.toggleRowDisabled : ''}`}
                        >
                          <div className={styles.toggleLabel}>
                            <span className={styles.toggleTitle}>{tipo.titulo}</span>
                            <span className={styles.toggleDesc}>{tipo.descricao}</span>
                          </div>
                          <span className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={Boolean(conf[tipo.campo])}
                              onChange={(e) =>
                                handleToggleCanalCampo(info.id, tipo.campo, e.target.checked)
                              }
                              disabled={!conf.ativo}
                              aria-label={tipo.titulo}
                            />
                            <span className={styles.slider}></span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
