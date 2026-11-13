'use client';

import { useState, useCallback } from 'react';
import { CriticalActionDialogProps } from './CriticalActionDialog';

export type CriticalActionConfig = Omit<CriticalActionDialogProps, 'isOpen' | 'onClose'>;

export function useCriticalAction() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<CriticalActionConfig | null>(null);

  const openAction = useCallback((dialogConfig: CriticalActionConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  }, []);

  const closeAction = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dialogProps: CriticalActionDialogProps = {
    isOpen,
    onClose: closeAction,
    onConfirm: async () => {
      if (config?.onConfirm) {
        await config.onConfirm();
      }
      closeAction();
    },
    variant: config?.variant || 'danger',
    title: config?.title || '',
    description: config?.description || '',
    confirmLabel: config?.confirmLabel,
    cancelLabel: config?.cancelLabel,
    details: config?.details,
    icon: config?.icon,
    confirmTextMatch: config?.confirmTextMatch,
    confirmTextPlaceholder: config?.confirmTextPlaceholder,
    confirmTextLabel: config?.confirmTextLabel,
    loading: config?.loading,
    disabled: config?.disabled,
    closeOnOverlayClick: config?.closeOnOverlayClick,
    maxWidth: config?.maxWidth,
  };

  return {
    isOpen,
    openAction,
    closeAction,
    dialogProps,
  };
}

