import type { ConnectivityAdapter } from '../network/ConnectivityAdapter.js';

export class FakeConnectivityAdapter implements ConnectivityAdapter {
  private online = true;
  private listeners = new Set<(online: boolean) => void>();

  setOnline(value: boolean): void {
    this.online = value;
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  async isOnline(): Promise<boolean> {
    return this.online;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
