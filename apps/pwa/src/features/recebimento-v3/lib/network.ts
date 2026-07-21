import { NetworkRequiredError } from '../types/conference-mode';

export function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function assertNetworkOnline(message?: string): void {
  if (!isBrowserOnline()) {
    throw new NetworkRequiredError(message);
  }
}
