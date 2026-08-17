export interface ConnectivityAdapter {
  isOnline(): Promise<boolean>;
  subscribe(callback: (online: boolean) => void): () => void;
}
