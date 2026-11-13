'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/common/Modal/Modal';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/common/Select/Select';
import { Combobox } from '@/components/common/Combobox/Combobox';
import { Button } from '@/components/common/Button/Button';
import { MarkdownEditor } from '@/components/common/MarkdownEditor/MarkdownEditor';
import { AttachmentGallery } from '@/components/tasks/AttachmentGallery/AttachmentGallery';
import { Prioridade, ConsultaUsuarioDTO, ConsultaEquipeDTO } from '@/types/api';
import { tarefaService } from '@/services/tarefaService';
import { usuarioService } from '@/services/usuarioService';
import { equipeService } from '@/services/equipeService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { notificarNovoResponsavelTarefa } from '@/contexts/NotificationContext';
import { PaperclipIcon, UsersIcon } from '@/components/common/Icons/Icons';
import styles from './TaskCreateModal.module.css';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEquipeId?: number;
}

const getNowLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isPastDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return false;
  const selectedDate = new Date(dateTimeStr);
  const now = new Date();
  const currentMinute = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0
  );
  return selectedDate < currentMinute;
};

const getAvatarUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEquipeId,
}) => {
  const { showToast } = useToast();
  const { usuario } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataErro, setDataErro] = useState('');
  const [responsavelErro, setResponsavelErro] = useState('');
  const [pontuacao, setPontuacao] = useState<number | ''>('');
  const [prioridade, setPrioridade] = useState<Prioridade>('Media');
  const [anexos, setAnexos] = useState<File[]>([]);

  // Gestão de Responsáveis (estilo edição de tarefa)
  const [usuarios, setUsuarios] = useState<ConsultaUsuarioDTO[]>([]);
  const [equipes, setEquipes] = useState<ConsultaEquipeDTO[]>([]);
  const [responsaveis, setResponsaveis] = useState<ConsultaUsuarioDTO[]>([]);
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<number | ''>('');
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<number | ''>('');

  const [submitting, setSubmitting] = useState(false);

  const equipesGerenciaveis = useMemo(() => {
    if (!usuario) return [];
    return equipes.filter((eq) =>
      eq.membros?.some(
        (m) => m.usuarioId === usuario.id && (m.cargo === 'Dono' || m.cargo === 'Admin')
      )
    );
  }, [equipes, usuario]);

  const usuariosDisponiveis = useMemo(() => {
    const idsJaAdicionados = new Set(responsaveis.map((r) => r.id));
    return usuarios.filter((u) => !idsJaAdicionados.has(u.id));
  }, [usuarios, responsaveis]);

  useEffect(() => {
    if (isOpen) {
      usuarioService
        .listarUsuarios()
        .then(setUsuarios)
        .catch(() => {});

      equipeService
        .listarMinhasEquipes()
        .then((dados) => {
          setEquipes(dados);

          if (initialEquipeId) {
            const eqEncontrada = dados.find((eq) => eq.id === initialEquipeId);
            if (eqEncontrada?.membros) {
              usuarioService.listarUsuarios().then((allUsers) => {
                const membrosEq = eqEncontrada.membros
                  ?.map((m) => allUsers.find((u) => u.id === m.usuarioId))
                  .filter((u): u is ConsultaUsuarioDTO => Boolean(u));
                if (membrosEq && membrosEq.length > 0) {
                  setResponsaveis(membrosEq);
                }
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialEquipeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAnexos((prev) => [...prev, ...filesArray]);
    }
    // Permite selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDataVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDataVencimento(value);

    if (value && isPastDateTime(value)) {
      setDataErro('A data de entrega não pode ser anterior à data e hora atual.');
    } else {
      setDataErro('');
    }
  };

  const handleAdicionarUsuario = () => {
    if (!usuarioSelecionadoId) return;
    const user = usuarios.find((u) => u.id === Number(usuarioSelecionadoId));
    if (user && !responsaveis.some((r) => r.id === user.id)) {
      setResponsaveis((prev) => [...prev, user]);
      setUsuarioSelecionadoId('');
      setResponsavelErro('');
    }
  };

  const handleAtribuirEquipeInteira = () => {
    if (!equipeSelecionadaId) return;
    const equipe = equipes.find((eq) => eq.id === Number(equipeSelecionadaId));
    if (!equipe || !equipe.membros) return;

    const novosMembros: ConsultaUsuarioDTO[] = [];
    equipe.membros.forEach((m) => {
      const u = usuarios.find((user) => user.id === m.usuarioId);
      if (u && !responsaveis.some((r) => r.id === u.id) && !novosMembros.some((r) => r.id === u.id)) {
        novosMembros.push(u);
      }
    });

    if (novosMembros.length > 0) {
      setResponsaveis((prev) => [...prev, ...novosMembros]);
      showToast(`${novosMembros.length} membros da equipe "${equipe.nome}" adicionados.`, 'success');
      setResponsavelErro('');
    } else {
      showToast('Todos os membros desta equipe já foram adicionados como responsáveis.', 'info');
    }
    setEquipeSelecionadaId('');
  };

  const handleRemoverResponsavel = (id: number) => {
    setResponsaveis((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!titulo.trim() || !dataVencimento) {
      showToast('Preencha os campos obrigatórios (*)', 'error');
      hasError = true;
    }

    if (isPastDateTime(dataVencimento)) {
      setDataErro('A data de entrega não pode ser anterior à data e hora atual.');
      showToast('A data de entrega não pode ser anterior à data e hora atual.', 'error');
      hasError = true;
    }

    if (descricao && descricao.length > 2000) {
      showToast('A descrição da tarefa ultrapassou o limite de 2000 caracteres.', 'error');
      hasError = true;
    }

    if (responsaveis.length === 0) {
      setResponsavelErro('Adicione ao menos um responsável para a tarefa.');
      showToast('Adicione ao menos um responsável para a tarefa.', 'error');
      hasError = true;
    }

    if (hasError) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('Titulo', titulo.trim());
      if (descricao) formData.append('Descricao', descricao);
      formData.append('DataVencimento', new Date(dataVencimento).toISOString());
      if (pontuacao !== '') formData.append('Pontuacao', pontuacao.toString());
      formData.append('Status', 'Pendente');
      formData.append('Prioridade', prioridade);

      anexos.forEach((file) => {
        formData.append('Anexos', file);
      });

      const novaTarefa = await tarefaService.criarTarefa(formData);

      // Atribuição de todos os responsáveis selecionados
      const responsaveisAtribuidosSucesso: number[] = [];
      for (const resp of responsaveis) {
        try {
          await tarefaService.atribuirResponsavel(novaTarefa.id, resp.id);
          notificarNovoResponsavelTarefa(resp.id, novaTarefa.id, titulo.trim(), prioridade);
          responsaveisAtribuidosSucesso.push(resp.id);
        } catch {
          // Continua para os próximos membros
        }
      }

      // Se nenhum responsável pôde ser vinculado, faz rollback da tarefa para não ficar órfã
      if (responsaveisAtribuidosSucesso.length === 0) {
        try {
          await tarefaService.excluirTarefa(novaTarefa.id);
        } catch {}
        throw new Error('Falha ao atribuir os responsáveis selecionados à tarefa.');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cortex_tarefas_alteradas'));
      }

      showToast('Tarefa criada com sucesso!', 'success');
      onSuccess();
      onClose();

      // Reset dos campos
      setTitulo('');
      setDescricao('');
      setDataVencimento('');
      setDataErro('');
      setResponsavelErro('');
      setPontuacao('');
      setPrioridade('Media');
      setAnexos([]);
      setResponsaveis([]);
      setUsuarioSelecionadoId('');
      setEquipeSelecionadaId('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao criar tarefa', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = useCallback(() => {
    setDataErro('');
    setResponsavelErro('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Criar nova tarefa"
      maxWidth="1020px"
      footer={
        <>
          <Button variant="secondary" onClick={handleModalClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Salvar tarefa
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nome da tarefa *"
          required
          autoFocus
          placeholder="Ex: Desenvolver fluxo de login e validações"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        {/* Editor de Descrição com Toolbar de Markdown e Preview */}
        <MarkdownEditor
          label="Descrição & Instruções"
          value={descricao}
          onChange={setDescricao}
          placeholder="Instruções ou detalhes da tarefa... Use a barra de ferramentas para formatar com Markdown."
          minHeight={140}
        />

        {/* Linha com Vencimento, Prioridade e Pontuação */}
        <div className={styles.row3}>
          <Input
            label="Data de entrega *"
            type="datetime-local"
            required
            min={getNowLocalDateTime()}
            value={dataVencimento}
            error={dataErro}
            onChange={handleDataVencimentoChange}
          />

          <Select
            label="Prioridade *"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as Prioridade)}
            options={[
              { value: 'Baixa', label: 'Baixa' },
              { value: 'Media', label: 'Média' },
              { value: 'Alta', label: 'Alta' },
              { value: 'Urgente', label: 'Urgente' },
            ]}
          />

          <Input
            label="Pontuação"
            type="number"
            min="0"
            placeholder="Ex: 10"
            value={pontuacao}
            onChange={(e) => setPontuacao(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        {/* Seção de Atribuição de Responsáveis (Igual ao componente de edição de tarefas) */}
        <div className={styles.responsaveisSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <UsersIcon size={18} color="var(--cortex-purple)" />
              <span>Pessoas Responsáveis ({responsaveis.length}) *</span>
            </h3>
            <p className={styles.sectionSubtitle}>
              Membros encarregados de realizar a tarefa. Adicione um ou mais usuários ou atribua uma equipe inteira.
            </p>
          </div>

          <div className={styles.addResponsavelBox}>
            <span className={styles.addResponsavelBoxHeader}>
              Atribuir novo responsável ou equipe
            </span>

            <div className={styles.addResponsavelRow}>
              {/* Atribuição Individual */}
              <Combobox
                value={usuarioSelecionadoId}
                onChange={(val) => setUsuarioSelecionadoId(val !== '' ? Number(val) : '')}
                placeholder="Selecione um usuário..."
                searchPlaceholder="Buscar por nome ou email..."
                clearable
                options={usuariosDisponiveis.map((u) => ({
                  value: u.id,
                  label: u.nome,
                  sublabel: u.email,
                }))}
                className={styles.comboboxWrapper}
              />

              <button
                type="button"
                className={styles.addRespBtn}
                disabled={!usuarioSelecionadoId}
                onClick={handleAdicionarUsuario}
              >
                + Adicionar Usuário
              </button>

              {/* Atribuição por Equipe */}
              {equipesGerenciaveis.length > 0 && (
                <>
                  <div className={styles.divider} />

                  <Combobox
                    value={equipeSelecionadaId}
                    onChange={(val) => setEquipeSelecionadaId(val !== '' ? Number(val) : '')}
                    placeholder="Selecione uma equipe..."
                    searchPlaceholder="Buscar equipe..."
                    clearable
                    options={equipesGerenciaveis.map((eq) => ({
                      value: eq.id,
                      label: eq.nome,
                    }))}
                    className={styles.comboboxWrapper}
                  />

                  <button
                    type="button"
                    className={styles.addRespBtn}
                    disabled={!equipeSelecionadaId}
                    onClick={handleAtribuirEquipeInteira}
                  >
                    + Atribuir Equipe Inteira
                  </button>
                </>
              )}
            </div>
          </div>

          {responsavelErro && (
            <span className={styles.errorText}>{responsavelErro}</span>
          )}

          {/* Lista de Responsáveis Adicionados */}
          {responsaveis.length > 0 ? (
            <div className={styles.responsaveisList}>
              {responsaveis.map((resp) => {
                const foto = resp.fotoPerfil?.urlCaminho;
                return (
                  <div key={resp.id} className={styles.responsavelCard}>
                    <div className={styles.responsavelInfo}>
                      {foto && getAvatarUrl(foto) ? (
                        <Image
                          src={getAvatarUrl(foto)}
                          alt={resp.nome}
                          width={36}
                          height={36}
                          className={styles.avatar}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.avatar}>
                          {resp.nome.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className={styles.responsavelDetails}>
                        <span className={styles.responsavelName}>{resp.nome}</span>
                        {resp.email && (
                          <span className={styles.responsavelEmail}>{resp.email}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.removeRespBtn}
                      onClick={() => handleRemoverResponsavel(resp.id)}
                      title={`Remover ${resp.nome}`}
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyResponsaveisBox}>
              Nenhum responsável foi adicionado a esta tarefa ainda. Selecione um usuário ou equipe acima.
            </div>
          )}
        </div>

        {/* Seção de Anexos com o mesmo Preview visto nas Tarefas */}
        <div className={styles.anexosSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <PaperclipIcon size={18} color="var(--cortex-purple)" />
              <span>Anexos da Tarefa ({anexos.length})</span>
            </h3>
            <p className={styles.sectionSubtitle}>
              Envie arquivos de referência, especificações, documentos ou imagens para a tarefa.
            </p>
          </div>

          <label className={styles.uploadLabelBtn}>
            <PaperclipIcon size={16} />
            <span>Adicionar arquivos</span>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {anexos.length > 0 && (
            <AttachmentGallery
              files={anexos}
              podeRemover
              onRemoverFile={handleRemoveFile}
            />
          )}
        </div>
      </form>
    </Modal>
  );
};
