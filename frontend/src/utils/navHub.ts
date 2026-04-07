/**
 * NavHub Utility
 * Manages temporary session state for cross-module redirections.
 * Allows jumping from one creation form to another and returning seamlessly.
 */

const HUB_KEY = 'ERMAY_NAV_HUB';

export interface NavState {
  returnPath: string;
  formData: any;
  editingId: number | null;
}

export const navHub = {
  /**
   * Saves the current context before jumping to another module.
   */
  saveContext: (state: NavState) => {
    sessionStorage.setItem(HUB_KEY, JSON.stringify(state));
  },

  /**
   * Retrieves and clears the saved context for resuming.
   */
  consumeContext: (): NavState | null => {
    const saved = sessionStorage.getItem(HUB_KEY);
    if (saved) {
      sessionStorage.removeItem(HUB_KEY);
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing NavHub context', e);
      }
    }
    return null;
  },

  /**
   * Checks if there is a pending return path.
   */
  getReturnPath: (): string | null => {
    const saved = sessionStorage.getItem(HUB_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.returnPath;
      } catch (e) {}
    }
    return null;
  }
};
