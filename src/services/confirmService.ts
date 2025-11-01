// Confirm Service - Global confirm dialog management
// Provides a programmatic way to show confirmation dialogs

import { store } from '../store';
import { confirmActions } from '../store/confirm/confirmSlice';
import { t } from '../utils/translations';

export type ConfirmType = 'info' | 'warning' | 'error' | 'question';
export type ConfirmVariant = 'outlined' | 'text' | 'contained';

// Non-serializable options kept separate
interface ConfirmCallbacks {
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

// Serializable options that go into Redux
export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  confirmColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  cancelColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  fullWidth?: boolean;
  persistent?: boolean; // If true, user can't close by clicking outside
}

// Store callbacks separately outside Redux
let pendingCallbacks: ConfirmCallbacks | null = null;

export const confirmService = {
  /**
   * Show a confirmation dialog
   * Returns a promise that resolves to true if confirmed, false if cancelled
   */
  async show(options: ConfirmOptions & ConfirmCallbacks): Promise<boolean> {
    return new Promise((resolve) => {
      // Store callbacks outside Redux
      pendingCallbacks = {
        onConfirm: async () => {
          if (options.onConfirm) {
            await options.onConfirm();
          }
          confirmService.hide();
          resolve(true);
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel();
          }
          confirmService.hide();
          resolve(false);
        },
      };

      // Dispatch only serializable options to Redux
      const { onConfirm, onCancel, ...serializableOptions } = options;
      store.dispatch(confirmActions.showConfirm(serializableOptions));
    });
  },

  /**
   * Get current pending callbacks (used by ConfirmDialog)
   */
  getCallbacks(): ConfirmCallbacks | null {
    return pendingCallbacks;
  },

  /**
   * Show a simple delete confirmation
   */
  async confirmDelete(itemName?: string, language: string = 'tr'): Promise<boolean> {
    const message = itemName
      ? `'${itemName}' ${t('confirm_delete', language)}`
      : t('confirm_delete', language);

    return confirmService.show({
      message,
      type: 'error',
      confirmText: t('delete', language),
      cancelText: t('cancel', language),
      confirmColor: 'error',
      variant: 'outlined',
    });
  },

  /**
   * Show a simple info confirmation
   */
  async confirmInfo(message: string, title?: string, language: string = 'tr'): Promise<boolean> {
    return confirmService.show({
      title,
      message,
      type: 'info',
      confirmText: t('ok', language),
      cancelText: t('cancel', language),
      variant: 'contained',
    });
  },

  /**
   * Hide the current confirmation dialog
   */
  hide(): void {
    pendingCallbacks = null;
    store.dispatch(confirmActions.hideConfirm());
  },
};

export default confirmService;
