// ==========================================
// Cortex — Utilitários de Gamificação e Nível
// Espelha as regras de negócio de XP do backend
// ==========================================

export type TipoIconeNivel = 'sprout' | 'star' | 'shield' | 'swords' | 'crown' | 'flame';

export interface NivelInfo {
  nome: string;
  tipoIcone: TipoIconeNivel;
  cor: string;
  corFundo: string;
}

/**
 * Retorna a quantidade de XP necessária para avançar do nível informado para o próximo.
 * Regra: Nível * 100 XP (ex.: Nv. 1 precisa de 100 XP; Nv. 2 precisa de 200 XP).
 */
export function obterLimiteXpDoNivel(nivel: number = 1): number {
  const nivelEfetivo = Math.max(1, nivel || 1);
  return nivelEfetivo * 100;
}

/**
 * Retorna as informações de título e insígnia correspondentes ao nível de conta.
 */
export function obterInfoNivel(nivel: number = 1): NivelInfo {
  const n = Math.max(1, nivel || 1);

  if (n < 5) {
    return {
      nome: 'Iniciante',
      tipoIcone: 'sprout',
      cor: '#10B981',
      corFundo: 'rgba(16, 185, 129, 0.18)',
    };
  }
  if (n < 10) {
    return {
      nome: 'Explorador',
      tipoIcone: 'star',
      cor: '#3B82F6',
      corFundo: 'rgba(59, 130, 246, 0.18)',
    };
  }
  if (n < 20) {
    return {
      nome: 'Especialista',
      tipoIcone: 'shield',
      cor: '#7B4FC9',
      corFundo: 'rgba(123, 79, 201, 0.22)',
    };
  }
  if (n < 35) {
    return {
      nome: 'Veterano',
      tipoIcone: 'swords',
      cor: '#F59E0B',
      corFundo: 'rgba(245, 158, 11, 0.2)',
    };
  }
  if (n < 50) {
    return {
      nome: 'Mestre',
      tipoIcone: 'crown',
      cor: '#EC4899',
      corFundo: 'rgba(236, 72, 153, 0.2)',
    };
  }
  return {
    nome: 'Lenda',
    tipoIcone: 'flame',
    cor: '#EF4444',
    corFundo: 'rgba(239, 68, 68, 0.22)',
  };
}

export interface ProgressoXp {
  nivel: number;
  experiencia: number;
  limiteXp: number;
  progressoPercentual: number;
  xpRestante: number;
  info: NivelInfo;
}

/**
 * Calcula todo o progresso de experiência e nível da conta.
 */
export function calcularProgressoXp(
  nivel: number = 1,
  experiencia: number = 0
): ProgressoXp {
  const n = Math.max(1, nivel || 1);
  const xp = Math.max(0, experiencia || 0);
  const limiteXp = obterLimiteXpDoNivel(n);
  const progressoPercentual = Math.min(100, Math.max(0, Math.round((xp / limiteXp) * 100)));
  const xpRestante = Math.max(0, limiteXp - xp);
  const info = obterInfoNivel(n);

  return {
    nivel: n,
    experiencia: xp,
    limiteXp,
    progressoPercentual,
    xpRestante,
    info,
  };
}

