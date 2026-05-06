import { useConfirmStore } from '../store/useConfirmStore';

export const confirmDialog = (message: string, isDestructive: boolean = false): Promise<boolean> => {
  return useConfirmStore.getState().showConfirm(message, isDestructive);
};
