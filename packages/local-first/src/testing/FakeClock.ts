import type { Clock, Timer, TimerHandle } from '../ports/Clock.js';

export class FakeClock implements Clock {
  nowMs = 0;

  now(): number {
    return this.nowMs;
  }

  advance(ms: number): void {
    this.nowMs += ms;
  }
}

interface ScheduledTask {
  at: number;
  callback: () => void;
  cancelled: boolean;
}

export class FakeTimer implements Timer {
  private tasks: ScheduledTask[] = [];

  setTimeout(callback: () => void, delayMs: number): TimerHandle {
    const task: ScheduledTask = {
      at: delayMs,
      callback,
      cancelled: false,
    };
    this.tasks.push(task);
    return {
      cancel: () => {
        task.cancelled = true;
      },
    };
  }

  runAll(clock: FakeClock): void {
    const pending = this.tasks.filter((task) => !task.cancelled);
    this.tasks = [];
    for (const task of pending) {
      clock.advance(task.at);
      task.callback();
    }
  }
}
