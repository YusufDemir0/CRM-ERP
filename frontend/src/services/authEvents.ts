/**
 * authEvents — Decoupled event bus for authentication state changes.
 * 
 * API interceptors should NEVER directly manipulate UI state (stores, modals, navigation).
 * Instead, they emit events here. UI components (Layout, App) listen and react.
 * 
 * This enforces Separation of Concerns between the API layer and UI layer.
 */

type AuthEventHandler = () => void;

class AuthEventBus {
  private listeners: Map<string, Set<AuthEventHandler>> = new Map();

  on(event: string, handler: AuthEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit(event: string): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler();
      } catch (e) {
        console.error(`[AuthEventBus] Handler error for "${event}":`, e);
      }
    });
  }
}

export const authEvents = new AuthEventBus();
