// ---------------------------------------------------------------------------
// Connectivity probe — checks real API reachability, not just navigator.onLine
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5_000;

export class ConnectivityProbe {
  private lastResult: boolean | undefined = undefined;
  private lastCheckedAt = 0;

  /**
   * Probes a URL with a HEAD request.
   * Results are cached for 5 seconds to avoid hammering the endpoint.
   *
   * @param probeUrl - URL to check (typically the API base URL)
   * @param timeoutMs - max time to wait for a response (default 5 s)
   */
  async probe(probeUrl: string, timeoutMs = 5_000): Promise<boolean> {
    const now = Date.now();

    if (this.lastResult !== undefined && now - this.lastCheckedAt < CACHE_TTL_MS) {
      return this.lastResult;
    }

    try {
      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(probeUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timerId);

      this.lastResult = response.ok || response.status < 500;
    } catch {
      this.lastResult = false;
    }

    this.lastCheckedAt = Date.now();
    return this.lastResult;
  }

  /** Clears the cached result, forcing the next call to probe immediately. */
  invalidate(): void {
    this.lastResult = undefined;
    this.lastCheckedAt = 0;
  }
}
