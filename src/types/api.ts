// ==========================================
// Cortex — Tipos e Contratos da API
// Espelha os DTOs e Enums do Cortex-backend
// ==========================================

export type StatusTarefa = 'Pendente' | 'Atrasada' | 'Concluida';
export type Prioridade = 'Baixa' | 'Media' | 'Alta' | 'Urgente';
export type CargoEquipe = 'Dono' | 'Admin' | 'Membro';
export type StatusSugestao = 'Pendente' | 'Aprovada' | 'Rejeitada';
export type CanalNotificacao = 'Email' | 'Push' | 'Sms';
export type TipoEntidade = 'Tarefa' | 'ResponsavelTarefa' | 'Usuario';

export interface ConsultaAnexoDTO {
  id: number;
  urlCaminho: string;
  nomeOriginal: string;
  mimeType: string;
  dataEnvio: string;
  tipoEntidade?: TipoEntidade;
  tarefaId?: number | null;
}

export interface ConsultaUsuarioDTO {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  emailVerificado?: boolean;
  fotoPerfil?: ConsultaAnexoDTO | null;
}

export interface LoginResponseDTO {
  token?: string;
  tipo: string;
  usuario: ConsultaUsuarioDTO;
}

export interface DadosLoginDTO {
  email: string;
  senha: string;
}

export interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  fotoPerfil?: File;
}

export interface AtualizarUsuarioDTO {
  nome?: string;
  email?: string;
  senha?: string;
  telefone?: string;
  fotoPerfil?: File;
}

export interface AlterarSenhaDTO {
  senhaAtual: string;
  novaSenha: string;
}

export interface ConsultaTarefaDTO {
  id: number;
  titulo: string;
  descricao?: string | null;
  dataVencimento: string;
  pontuacao?: number | null;
  status: StatusTarefa;
  prioridade: Prioridade;
  criadorId: number;
}

export interface ConsultaResponsavelTarefaDTO {
  id: number;
  tarefaId: number;
  usuarioId?: number | null;
  usuario?: ConsultaUsuarioDTO | null;
}

export interface ConsultaRespostaTarefaDTO {
  id: number;
  dataResposta: string;
  usuarioId: number;
  tarefaId: number;
  usuario?: ConsultaUsuarioDTO | null;
  anexos?: ConsultaAnexoDTO[];
}

export interface DetalhesTarefaDTO extends ConsultaTarefaDTO {
  criador?: ConsultaUsuarioDTO | null;
  anexos: ConsultaAnexoDTO[];
  responsaveis: ConsultaResponsavelTarefaDTO[];
  respostas: ConsultaRespostaTarefaDTO[];
}

export interface CriarTarefaDTO {
  titulo: string;
  descricao?: string;
  dataVencimento: string;
  pontuacao?: number;
  status: StatusTarefa;
  prioridade: Prioridade;
}

export interface ConsultaMembroEquipeDTO {
  id: number;
  usuarioId: number;
  equipeId: number;
  cargo: CargoEquipe;
  dataEntrada: string;
  usuario?: ConsultaUsuarioDTO | null;
}

export interface ConsultaEquipeDTO {
  id: number;
  nome: string;
  dataCriacao: string;
  membros: ConsultaMembroEquipeDTO[];
}

export interface CriarEquipeDTO {
  nome: string;
}

export interface ConsultaMetaDTO {
  id: number;
  nome: string;
  dataFechamento?: string | null;
  concluida?: boolean;
  tarefaId: number;
  usuarioId: number;
  tarefa?: { id: number; titulo: string; status?: string } | null;
  usuario?: { id: number; nome: string } | null;
}

export interface CriarMetaDTO {
  nome: string;
  dataFechamento?: string;
  tarefaId: number;
}

export interface AtualizarMetaDTO {
  nome?: string;
  dataFechamento?: string;
  concluida?: boolean;
  tarefaId?: number;
  usuarioId?: number;
}

export interface ConsultaSugestaoDTO {
  id: number;
  descricao: string;
  dataCriacao: string;
  status: StatusSugestao;
  tarefaId: number;
  usuarioId: number;
  usuario?: ConsultaUsuarioDTO | null;
  tarefa?: { id: number; titulo: string } | null;
}

export interface ConsultaTicketReporteDTO {
  id: number;
  descricao: string;
  ativo: boolean;
  dataCriacao: string;
  tarefaId: number;
  usuarioId: number;
  usuario?: ConsultaUsuarioDTO | null;
  tarefa?: { id: number; titulo: string } | null;
}

export interface PreferenciaNotificacaoDTO {
  id: number;
  usuarioId: number;
  canal: CanalNotificacao;
  antecedenciaHoras: number;
  ativoNovaAtribuicao: boolean;
  ativoVencimento: boolean;
  ativoConclusaoMeta: boolean;
  ativoTicket: boolean;
}

export interface ConfigurarPreferenciaDTO {
  canal: CanalNotificacao;
  antecedenciaHoras: number;
  ativoNovaAtribuicao: boolean;
  ativoVencimento: boolean;
  ativoConclusaoMeta: boolean;
  ativoTicket: boolean;
}

export interface RelatorioTarefasDTO {
  totalTarefas: number;
  concluidas: number;
  pendentes: number;
  atrasadas: number;
  taxaConclusaoPercentual: number;
  porPrioridade: Record<string, number>;
  porStatus: Record<string, number>;
  periodoInicio?: string;
  periodoFim?: string;
  geradoEm: string;
  tarefas: ConsultaTarefaDTO[];
}

export interface DesempenhoMembroDTO {
  usuarioId: number;
  nome: string;
  email: string;
  cargo: string;
  totalAtribuidas: number;
  concluidas: number;
  pendentes: number;
  atrasadas: number;
  taxaConclusaoPercentual: number;
}

export interface RelatorioEquipeDTO {
  equipeId: number;
  equipeNome: string;
  totalMembros: number;
  metricasGerais: RelatorioTarefasDTO;
  desempenhoMembros: DesempenhoMembroDTO[];
}

