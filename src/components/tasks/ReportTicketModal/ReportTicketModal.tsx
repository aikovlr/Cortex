'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { ticketService } from '@/services/ticketService';
import { useToast } from '@/contexts/ToastContext';

interface ReportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarefaId: number;
  tarefaTitulo: string;
  onSuccess?: () => void;
}

export const ReportTicketModal: React.FC<ReportTicketModalProps> = ({
  isOpen,
  onClose,
  tarefaId,
  tarefaTitulo,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      showToast('Por favor, detalhe o problema ou impedimento.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await ticketService.abrirTicket(tarefaId, descricao.trim());
      showToast('Ticket de reporte registrado e notificado aos superiores!', 'success');
      setDescricao('');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Falha ao abrir ticket de reporte.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reportar Problema na Tarefa"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={submitting}>
            Registrar Ticket
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '13px', color: '#ff9999', lineHeight: '1.4' }}>
          Você está abrindo um chamado de alerta para a tarefa <strong>{tarefaTitulo}</strong>. Esse ticket será enviado com prioridade máxima aos gestores e superiores da equipe.
        </p>

        <textarea
          style={{
            width: '100%',
            minHeight: '120px',
            backgroundColor: 'var(--cortex-dark-input)',
            border: '1px solid rgba(214, 49, 49, 0.4)',
            borderRadius: '8px',
            padding: '12px',
            color: 'var(--cortex-white)',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
          }}
          placeholder="Descreva o bloqueio, erro ou situação crítica que está impedindo a conclusão..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
};
