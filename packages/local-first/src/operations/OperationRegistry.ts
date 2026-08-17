import type { OperationHandler } from './OperationHandler.js';

export class OperationRegistry {
  private readonly handlers = new Map<string, OperationHandler>();

  register(operationType: string, handler: OperationHandler): void {
    this.handlers.set(operationType, handler);
  }

  get(operationType: string): OperationHandler | undefined {
    return this.handlers.get(operationType);
  }

  has(operationType: string): boolean {
    return this.handlers.has(operationType);
  }

  list(): string[] {
    return [...this.handlers.keys()];
  }
}
