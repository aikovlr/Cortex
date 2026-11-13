import React from 'react';
import { CriticalActionDialogProps } from './CriticalActionDialog';
import { TrashIcon, ShieldIcon, CheckCircleIcon, AlertCircleIcon } from '@/components/common/Icons/Icons';

export interface DeleteActionOptions {
  title?: string;
  itemName: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  requireTextMatch?: boolean;
  matchText?: string;
}

/**
 * Cria a configuração pronta para diálogos de exclusão irreversível com mensagem única e direta
 */
export function createDeleteDialogConfig({
  title,
  itemName,
  itemType = 'item',
  onConfirm,
  requireTextMatch = false,
  matchText,
}: DeleteActionOptions): Omit<CriticalActionDialogProps, 'isOpen' | 'onClose'> {
  const matchValue = matchText || itemName;

  return {
    variant: 'danger',
    title: title || `Excluir ${itemType}`,
    description: (
      <>
        Tem certeza de que deseja excluir permanentemente <strong>&quot;{itemName}&quot;</strong>? Esta ação é irreversível e todos os dados associados serão perdidos.
      </>
    ),
    confirmLabel: 'Excluir permanentemente',
    cancelLabel: 'Cancelar',
    icon: <TrashIcon size={24} strokeWidth={2} />,
    confirmTextMatch: requireTextMatch ? matchValue : undefined,
    confirmTextLabel: requireTextMatch
      ? `Para confirmar a exclusão definitiva, digite "${matchValue}" abaixo:`
      : undefined,
    onConfirm,
  };
}

export interface RejectSuggestionOptions {
  suggestionTitle: string;
  suggestionAuthor?: string;
  reasonNotes?: string;
  onConfirm: () => void | Promise<void>;
}

/**
 * Cria a configuração para rejeição de sugestões com mensagem única e direta
 */
export function createRejectSuggestionDialogConfig({
  suggestionTitle,
  suggestionAuthor,
  onConfirm,
}: RejectSuggestionOptions): Omit<CriticalActionDialogProps, 'isOpen' | 'onClose'> {
  return {
    variant: 'warning',
    title: 'Rejeitar sugestão',
    description: (
      <>
        Deseja realmente rejeitar a sugestão <strong>&quot;{suggestionTitle}&quot;</strong>{suggestionAuthor ? ` enviada por ${suggestionAuthor}` : ''}? Esta ação não pode ser desfeita e a sugestão será arquivada como recusada.
      </>
    ),
    confirmLabel: 'Rejeitar sugestão',
    cancelLabel: 'Voltar',
    icon: <AlertCircleIcon size={24} strokeWidth={2.2} />,
    onConfirm,
  };
}

export interface ResolveTicketOptions {
  ticketId: string | number;
  ticketTitle: string;
  assigneeName?: string;
  onConfirm: () => void | Promise<void>;
}

/**
 * Cria a configuração para marcar tickets como resolvidos com mensagem única e direta
 */
export function createResolveTicketDialogConfig({
  ticketId,
  ticketTitle,
  onConfirm,
}: ResolveTicketOptions): Omit<CriticalActionDialogProps, 'isOpen' | 'onClose'> {
  return {
    variant: 'success',
    title: `Resolver ticket #${ticketId}`,
    description: (
      <>
        Deseja marcar o ticket <strong>&quot;{ticketTitle}&quot;</strong> como resolvido? O solicitante será notificado e esta ação não poderá ser desfeita.
      </>
    ),
    confirmLabel: 'Marcar como resolvido',
    cancelLabel: 'Cancelar',
    icon: <CheckCircleIcon size={24} strokeWidth={2.2} />,
    onConfirm,
  };
}

export interface ChangeUserRoleOptions {
  userName: string;
  userEmail?: string;
  currentRole: string;
  newRole: string;
  onConfirm: () => void | Promise<void>;
  isPrivilegeEscalation?: boolean;
}

/**
 * Cria a configuração para alteração de cargo de usuário com mensagem única e direta
 */
export function createChangeRoleDialogConfig({
  userName,
  currentRole,
  newRole,
  onConfirm,
  isPrivilegeEscalation = false,
}: ChangeUserRoleOptions): Omit<CriticalActionDialogProps, 'isOpen' | 'onClose'> {
  return {
    variant: isPrivilegeEscalation ? 'warning' : 'info',
    title: 'Alterar cargo de usuário',
    description: (
      <>
        Deseja alterar o cargo de <strong>{userName}</strong> de <strong>{currentRole}</strong> para <strong>{newRole}</strong>?{isPrivilegeEscalation ? ' Este usuário terá acesso a configurações e permissões administrativas da organização.' : ''}
      </>
    ),
    confirmLabel: 'Confirmar alteração',
    cancelLabel: 'Cancelar',
    icon: <ShieldIcon size={24} strokeWidth={2} />,
    onConfirm,
  };
}
