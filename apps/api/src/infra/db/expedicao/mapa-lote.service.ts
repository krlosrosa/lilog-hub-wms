import { Inject, Injectable } from '@nestjs/common';

import type {
  IMapaLoteRepository,
  InsertMapaLoteInput,
  MapaLoteListItem,
  MapaLoteRecord,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';
import { deleteMapaLoteDb } from './delete-mapa-lote.drizzle.js';
import { getMapaLoteByIdDb } from './get-mapa-lote-by-id.drizzle.js';
import { insertMapaLoteDb } from './insert-mapa-lote.drizzle.js';
import { listMapasLotesByTransporteIdsDb } from './list-mapas-lotes-by-transporte-ids.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

@Injectable()
export class MapaLoteService implements IMapaLoteRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  inserir(input: InsertMapaLoteInput): Promise<MapaLoteRecord> {
    return insertMapaLoteDb(this.db, input);
  }

  listarPorTransporteIds(
    unidadeId: string,
    transporteIds: string[],
  ): Promise<MapaLoteListItem[]> {
    return listMapasLotesByTransporteIdsDb(this.db, unidadeId, transporteIds);
  }

  obterPorId(id: string, unidadeId: string): Promise<MapaLoteRecord | null> {
    return getMapaLoteByIdDb(this.db, id, unidadeId);
  }

  excluir(id: string, unidadeId: string) {
    return deleteMapaLoteDb(this.db, id, unidadeId);
  }
}
