import { Injectable } from '@nestjs/common';

import type { ISyncAdapter } from './sync-adapter.interface.js';

@Injectable()
export class SyncAdapterRegistry {
  private readonly adapters = new Map<string, ISyncAdapter>();

  register(adapter: ISyncAdapter): void {
    this.adapters.set(adapter.adapter, adapter);
  }

  find(adapterName: string): ISyncAdapter | null {
    return this.adapters.get(adapterName) ?? null;
  }

  hasAdapter(adapterName: string): boolean {
    return this.adapters.has(adapterName);
  }
}
