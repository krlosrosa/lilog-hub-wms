import type { MetricTags } from '../types/index.js';

export interface MetricsTimer {
  stop(): void;
}

export interface MetricsPort {
  increment(name: string, value?: number, tags?: MetricTags): void;
  histogram(name: string, value: number, tags?: MetricTags): void;
  gauge(name: string, value: number, tags?: MetricTags): void;
  timer(name: string, tags?: MetricTags): MetricsTimer;
}

export class NoOpMetricsPort implements MetricsPort {
  increment(): void {}
  histogram(): void {}
  gauge(): void {}
  timer(): MetricsTimer {
    return { stop: () => {} };
  }
}

export class InMemoryMetricsPort implements MetricsPort {
  readonly counters = new Map<string, number>();
  readonly histograms = new Map<string, number[]>();
  readonly gauges = new Map<string, number>();

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  histogram(name: string, value: number): void {
    const values = this.histograms.get(name) ?? [];
    values.push(value);
    this.histograms.set(name, values);
  }

  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  timer(name: string): MetricsTimer {
    const start = Date.now();
    return {
      stop: () => {
        this.histogram(name, Date.now() - start);
      },
    };
  }
}
