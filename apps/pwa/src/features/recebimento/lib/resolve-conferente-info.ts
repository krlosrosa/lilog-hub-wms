import type { AuthUser } from '@/features/auth/types';

import { getConferenciaContextStore } from './conferencia-context-store';
import type { Demand } from '../types/recebimento.schema';

export type ConferenteInfo = {
  conferenteMatricula: string | null;
  conferente: string | null;
};

export function resolveConferenteInfo(
  demandId: string,
  demand?: Demand | null,
  user?: AuthUser | null,
): ConferenteInfo {
  const context = getConferenciaContextStore(demandId);

  const conferenteMatricula =
    context?.conferenteMatricula?.trim() ||
    demand?.conferenteMatricula?.trim() ||
    (user?.id != null ? String(user.id) : null);

  const conferente =
    context?.conferente?.trim() ||
    demand?.conferente?.trim() ||
    user?.name?.trim() ||
    null;

  return { conferenteMatricula, conferente };
}

export function formatConferenteLabel(info: ConferenteInfo): string | null {
  const parts: string[] = [];

  if (info.conferenteMatricula) {
    parts.push(info.conferenteMatricula);
  }

  if (info.conferente) {
    parts.push(info.conferente);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
