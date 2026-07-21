export interface Clock {
  now(): number;
}

export interface TimerHandle {
  cancel(): void;
}

export interface Timer {
  setTimeout(callback: () => void, delayMs: number): TimerHandle;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class SystemTimer implements Timer {
  setTimeout(callback: () => void, delayMs: number): TimerHandle {
    const handle = globalThis.setTimeout(callback, delayMs);
    return {
      cancel: () => globalThis.clearTimeout(handle),
    };
  }
}
