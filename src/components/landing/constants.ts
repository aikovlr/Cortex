/**
 * Constantes da Landing Page Institucional do Cortex
 * Centraliza rotas, textos e dados estruturados oficiais.
 */

// Rota oficial de login e registro conforme exigência do Prompt
export const AUTH_ROUTE = '/login';
export const REGISTER_ROUTE = '/registro';
export const DASHBOARD_ROUTE = '/minhas-tarefas';

export interface NavLinkItem {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLinkItem[] = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Gamificação', href: '#gamificacao' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Acessibilidade', href: '#acessibilidade' },
];

export interface FeatureItem {
  id: string;
  iconName: 'layers' | 'users' | 'collaboration' | 'target' | 'chart' | 'bell' | 'accessibility';
  title: string;
  description: string;
}

export const FEATURES: FeatureItem[] = [
  {
    id: 'tarefas',
    iconName: 'layers',
    title: 'Gestão de tarefas',
    description: 'Crie, edite, atribua, conclua e reabra tarefas com prioridade, vencimento, pontuação e status em tempo real.',
  },
  {
    id: 'equipes',
    iconName: 'users',
    title: 'Equipes',
    description: 'Crie equipes colaborativas, convide novos membros e defina permissões com hierarquia clara de Dono, Admin e Membro.',
  },
  {
    id: 'colaboracao',
    iconName: 'collaboration',
    title: 'Colaboração',
    description: 'Envie entregas com anexos e notas, aprove sugestões de alteração e abra tickets para reportar impedimentos.',
  },
  {
    id: 'gamificacao',
    iconName: 'target',
    title: 'Metas e gamificação',
    description: 'Vincule metas a tarefas com acompanhamento de progresso, pontuação e recompensas pelo avanço conquistado.',
  },
  {
    id: 'relatorios',
    iconName: 'chart',
    title: 'Relatórios',
    description: 'Acompanhe indicadores de conclusão, distribuição por prioridade, média de notas e desempenho detalhado por responsável.',
  },
  {
    id: 'notificacoes',
    iconName: 'bell',
    title: 'Notificações',
    description: 'Receba alertas imediatos de novas atribuições, prazos de vencimento e metas concluídas via e-mail, push ou SMS.',
  },
  {
    id: 'acessibilidade',
    iconName: 'accessibility',
    title: 'Acessibilidade e personalização',
    description: 'Alterne entre tema claro e escuro, modo alto contraste e ajuste o tamanho da fonte para seu conforto visual.',
  },
];

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Cadastre-se em segundos de forma 100% gratuita, sem cartão de crédito nem taxas ocultas.',
  },
  {
    number: '02',
    title: 'Crie tarefas e equipes',
    description: 'Estruture suas atividades pessoais ou monte equipes convidando colegas com cargos específicos.',
  },
  {
    number: '03',
    title: 'Acompanhe entregas e metas',
    description: 'Centralize anexos, avalie entregas, resolva impedimentos e acumule pontos a cada meta batida.',
  },
  {
    number: '04',
    title: 'Analise seu desempenho',
    description: 'Consulte relatórios completos com métricas de produtividade, média de notas e histórico de entregas.',
  },
];

export interface AudienceItem {
  id: string;
  iconName: 'students' | 'professionals' | 'teams';
  title: string;
  subtitle: string;
  benefits: string[];
}

export const AUDIENCE_LIST: AudienceItem[] = [
  {
    id: 'estudantes',
    iconName: 'students',
    title: 'Estudantes',
    subtitle: 'Organização acadêmica e trabalhos em grupo',
    benefits: [
      'Controle prazos de trabalhos, provas e atividades sem perder vencimentos.',
      'Trabalhe em grupo com divisão clara de tarefas e aprovação de sugestões.',
      'Mantenha a motivação alta com gamificação e metas de estudo semanais.',
    ],
  },
  {
    id: 'profissionais',
    iconName: 'professionals',
    title: 'Profissionais',
    subtitle: 'Foco diário e produtividade sem atrito',
    benefits: [
      'Substitua anotações manuais e planilhas dispersas por um fluxo unificado.',
      'Priorize demandas críticas com filtros dinâmicos e alertas pontuais.',
      'Acompanhe seu rendimento individual através de indicadores precisos.',
    ],
  },
  {
    id: 'equipes',
    iconName: 'teams',
    title: 'Equipes',
    subtitle: 'Alinhamento estratégico e gestão transparente',
    benefits: [
      'Hierarquia bem definida entre Dono, Administrador e Membro.',
      'Comunicação direta por meio de tickets de impedimento e avaliação de entregas.',
      'Relatórios consolidados de desempenho e distribuição de carga por membro.',
    ],
  },
];

