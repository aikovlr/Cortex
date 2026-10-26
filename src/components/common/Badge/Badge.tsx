import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  type: 'status' | 'prioridade' | 'cargo';
  value: string | number | null | undefined;
  className?: string;
}

const CARGO_MAP: Record<number, string> = {
  0: 'Dono',
  1: 'Admin',
  2: 'Membro',
};

const STATUS_MAP: Record<number, string> = {
  0: 'Pendente',
  1: 'Atrasada',
  2: 'Concluída',
};

const PRIORIDADE_MAP: Record<number, string> = {
  0: 'Baixa',
  1: 'Média',
  2: 'Alta',
  3: 'Urgente',
};

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  // Converte número em texto amigável conforme o tipo de enum
  let displayValue = '';

  if (value === null || value === undefined) {
    displayValue = '-';
  } else if (typeof value === 'number' || (!isNaN(Number(value)) && String(value).trim() !== '')) {
    const num = Number(value);
    if (type === 'cargo') {
      displayValue = CARGO_MAP[num] ?? String(value);
    } else if (type === 'status') {
      displayValue = STATUS_MAP[num] ?? String(value);
    } else if (type === 'prioridade') {
      displayValue = PRIORIDADE_MAP[num] ?? String(value);
    } else {
      displayValue = String(value);
    }
  } else {
    displayValue = String(value);
  }

  const normalized = displayValue.toLowerCase().replace(/[\s_-]+/g, '');

  let styleClass = styles.membro;

  if (type === 'status') {
    if (normalized.includes('pend')) styleClass = styles.pendente;
    else if (normalized.includes('atras')) styleClass = styles.atrasada;
    else if (normalized.includes('concl')) styleClass = styles.concluida;
  } else if (type === 'prioridade') {
    if (normalized.includes('baixa')) styleClass = styles.baixa;
    else if (normalized.includes('med')) styleClass = styles.media;
    else if (normalized.includes('alta')) styleClass = styles.alta;
    else if (normalized.includes('urg')) styleClass = styles.urgente;
  } else if (type === 'cargo') {
    if (normalized.includes('dono')) styleClass = styles.dono;
    else if (normalized.includes('adm')) styleClass = styles.admin;
    else styleClass = styles.membro;
  }

  return <span className={`${styles.badge} ${styleClass} ${className}`}>{displayValue}</span>;
};
