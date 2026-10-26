import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  type: 'status' | 'prioridade' | 'cargo';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, '');

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

  return <span className={`${styles.badge} ${styleClass} ${className}`}>{value}</span>;
};
