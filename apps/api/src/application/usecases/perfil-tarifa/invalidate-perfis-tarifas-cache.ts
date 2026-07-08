import type { Cache } from 'cache-manager';

import type { TipoCarga } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import type { ListPerfisTarifasFilter } from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';

const CACHE_PREFIX = 'perfis-tarifa:';

export function buildPerfisTarifasCacheKey(
  filter: ListPerfisTarifasFilter,
): string {
  return `${CACHE_PREFIX}${JSON.stringify(filter)}`;
}

export async function invalidatePerfisTarifasCache(
  cacheManager: Cache,
  unidadeId: string,
): Promise<void> {
  const tipoCargas: (TipoCarga | undefined)[] = [
    undefined,
    'seco',
    'refrigerado',
  ];
  const keys = new Set<string>([buildPerfisTarifasCacheKey({})]);

  for (const tipoCarga of tipoCargas) {
    keys.add(
      buildPerfisTarifasCacheKey(
        tipoCarga ? { unidadeId, tipoCarga } : { unidadeId },
      ),
    );
    keys.add(
      buildPerfisTarifasCacheKey(tipoCarga ? { tipoCarga } : {}),
    );
  }

  await Promise.all([...keys].map((key) => cacheManager.del(key)));
}
