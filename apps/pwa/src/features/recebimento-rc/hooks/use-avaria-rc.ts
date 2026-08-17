import { listAvarias } from '@lilog/replicache-recebimento';

import { useCallback, useMemo } from 'react';



import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';

import {

  type RegistrarAvariaInput,

  type UseAvariaV2Result,

} from '@/features/recebimento-v2/hooks/use-avaria-v2';

import { resolveConferenceQuantidadePar } from '@/features/recebimento-v2/lib/conferencia-quantidade';

import {

  normalizeSkuParam,

  resolveUnidadesPorCaixa,

} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';

import { resolveProductIdForAvariaPatch } from '@/features/recebimento-v2/lib/resolve-produto-id-for-avaria-patch';

import type { ConferenceRecord } from '@/features/recebimento-v2/local-db/schema';

import {

  deleteAllAvariaMediaForDemand,

} from '@/features/recebimento-v2/services/sync-photo.helpers';

import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';

import {

  useAvariasReplicache,

  useExpectedItemsReplicache,

  useItensConferidosReplicache,

  useReplicache,

} from '@/lib/replicache/hooks';

import {

  isValidationPushError,

  parsePushErrorMessage,

} from '@/lib/replicache/parse-push-error';

import {

  dequeueAllRcAvariaPhotos,

  dequeueRcAvariaPhotos,

  enqueueRcAvariaPhotos,

  processRcAvariaPhotosForDemand,

  scheduleRcAvariaPhotoSync,

} from '../services/sync-avaria-photos-rc.service';



import { mapAvariaViewsToDamageRecords } from '../lib/map-avaria-view-to-damage';

import { mapItensConferidosToConferences } from '../lib/map-item-conferido-to-conference';

import { useParametrosConferenciaRc } from './use-parametros-conferencia-rc';

import { useDemandaRc } from './use-demanda-rc';



function matchesSkuTarget(sku: string, targets: Set<string>): boolean {

  return targets.has(normalizeSkuParam(sku).toUpperCase());

}



/**
 * Deletes all local media records for a specific avaria clientDamageId.
 * Called when an individual avaria is removed so photos don't get uploaded
 * for a non-existent entity.
 */
async function deleteAvariaMediaForClientId(
  preRecebimentoId: string,
  clientDamageId: string,
  avariaId: string,
): Promise<void> {
  // Remove from Dexie media by matching avariaId or clientDamageId in targetEntityId / ownerId
  const allMedia = await recebimentoV2Db.media
    .where('processId')
    .equals(preRecebimentoId)
    .filter(
      (m) =>
        m.ownerType === 'avaria' &&
        (m.ownerId === clientDamageId ||
          m.ownerId === avariaId ||
          m.targetEntityId === clientDamageId ||
          m.targetEntityId === avariaId),
    )
    .toArray();

  if (allMedia.length > 0) {
    await recebimentoV2Db.media.bulkDelete(allMedia.map((m) => m.id));
  }
}



export function useAvariaRc(preRecebimentoId: string): UseAvariaV2Result {

  const demanda = useDemandaRc(preRecebimentoId);

  const expectedItems = useExpectedItemsReplicache(preRecebimentoId);

  const itensConferidos = useItensConferidosReplicache(preRecebimentoId);

  const conferences = useMemo(

    () => mapItensConferidosToConferences(itensConferidos, preRecebimentoId),

    [itensConferidos, preRecebimentoId],

  );

  const avariaViews = useAvariasReplicache(preRecebimentoId);

  const { rep, isReady } = useReplicache();

  const parametrosConferencia = useParametrosConferenciaRc(demanda?.unidadeId);



  const avarias = useMemo(

    () => mapAvariaViewsToDamageRecords(preRecebimentoId, avariaViews),

    [avariaViews, preRecebimentoId],

  );



  const registrarAvariaReplicada = useCallback(

    async (input: RegistrarAvariaInput): Promise<string> => {

      if (!rep) {

        throw new Error('Replicache não está pronto');

      }



      const skusAlvo = [

        ...new Set((input.skusAlvo ?? []).map((sku) => normalizeSkuParam(sku)).filter(Boolean)),

      ];

      if (skusAlvo.length === 0) {

        throw new Error('Não há itens conferidos para replicar avaria');

      }



      const skuTargets = new Set(skusAlvo.map((sku) => sku.toUpperCase()));

      const conferenceTargets =

        input.conferencesForReplication ??

        conferences.filter((conference) =>

          matchesSkuTarget(conference.sku, skuTargets),

        );



      if (conferenceTargets.length === 0) {

        throw new Error('Não há itens conferidos para replicar avaria');

      }



      const quantidadeModo = input.quantidadeModo ?? parametrosConferencia.quantidadeModo;

      const clientDamageIds: string[] = [];



      for (const conference of conferenceTargets) {

        const sku = normalizeSkuParam(conference.sku);

        const expectedItem = expectedItems.find(

          (item) => normalizeSkuParam(item.sku).toUpperCase() === sku.toUpperCase(),

        );

        const unidadesPorCaixa = resolveUnidadesPorCaixa(expectedItem?.unidadesPorCaixa);

        const quantidade = resolveConferenceQuantidadePar(

          conference,

          quantidadeModo,

          unidadesPorCaixa,

        );



        if (quantidade.caixa <= 0 && quantidade.unidade <= 0) {

          continue;

        }



        const produtoId = await resolveProductIdForAvariaPatch(preRecebimentoId, sku);

        const clientDamageId = crypto.randomUUID();

        clientDamageIds.push(clientDamageId);



        await rep.mutate.registrarAvaria({

          preRecebimentoId,

          produtoId,

          sku,

          lote: conference.lote?.trim() || input.lote,

          tipo: input.tipo,

          natureza: input.natureza,

          causa: input.causa,

          quantidadeCaixas: quantidade.caixa,

          quantidadeUnidades: quantidade.unidade,

          photoCount: input.mediaIds?.length ?? 0,

          clientDamageId,

        });

      }



      if (clientDamageIds.length === 0) {

        throw new Error('Não há quantidade conferida para replicar avaria');

      }



      // Persist photos BEFORE push so they survive offline periods and page reloads
      for (const clientDamageId of clientDamageIds) {

        await enqueueRcAvariaPhotos(preRecebimentoId, clientDamageId, input.mediaIds ?? []);

      }



      try {

        await rep.push({ now: true });
        await rep.pull({ now: true });

      } catch (error) {

        const message = parsePushErrorMessage(error);

        if (isValidationPushError(message)) {

          throw new Error(message);

        }

        // Connectivity error: mutation is queued in Replicache; schedule photo retry
        scheduleRcAvariaPhotoSync(preRecebimentoId);

        return clientDamageIds[0]!;

      }



      // Push succeeded — try to stamp and upload photos immediately
      await processRcAvariaPhotosForDemand(rep, preRecebimentoId);



      return clientDamageIds[0]!;

    },

    [

      conferences,

      expectedItems,

      parametrosConferencia.quantidadeModo,

      preRecebimentoId,

      rep,

    ],

  );



  const registrarAvaria = useCallback(

    async (input: RegistrarAvariaInput): Promise<string> => {

      if (!rep) {

        throw new Error('Replicache não está pronto');

      }



      if (input.replicarParaTodos && input.skusAlvo && input.skusAlvo.length > 0) {

        return registrarAvariaReplicada(input);

      }



      const sku = input.sku?.trim() || undefined;

      const produtoId = sku

        ? await resolveProductIdForAvariaPatch(preRecebimentoId, sku)

        : undefined;

      const clientDamageId = crypto.randomUUID();



      await rep.mutate.registrarAvaria({

        preRecebimentoId,

        produtoId,

        sku,

        lote: input.lote,

        tipo: input.tipo,

        natureza: input.natureza,

        causa: input.causa,

        quantidadeCaixas: input.quantidadeCaixa ?? 0,

        quantidadeUnidades: input.quantidadeUnidade ?? 0,

        photoCount: input.mediaIds?.length ?? 0,

        clientDamageId,

      });



      // Persist photos BEFORE push so they survive offline periods and page reloads
      await enqueueRcAvariaPhotos(preRecebimentoId, clientDamageId, input.mediaIds ?? []);



      try {

        await rep.push({ now: true });
        await rep.pull({ now: true });

      } catch (error) {

        const message = parsePushErrorMessage(error);

        if (isValidationPushError(message)) {

          throw new Error(message);

        }

        // Connectivity error: mutation is queued in Replicache; schedule photo retry
        scheduleRcAvariaPhotoSync(preRecebimentoId);

        return clientDamageId;

      }



      // Push succeeded — try to stamp and upload photos immediately
      await processRcAvariaPhotosForDemand(rep, preRecebimentoId);



      return clientDamageId;

    },

    [preRecebimentoId, registrarAvariaReplicada, rep],

  );



  const removerAvaria = useCallback(

    async (damageId: string): Promise<void> => {

      if (!rep) {

        throw new Error('Replicache não está pronto');

      }



      const avaria = avariaViews.find(

        (item) => item.id === damageId || item.clientDamageId === damageId,

      );

      const avariaId = avaria?.id ?? damageId;

      const clientDamageId = avaria?.clientDamageId ?? damageId;



      await rep.mutate.removerAvaria({

        preRecebimentoId,

        avariaId,

      });



      // Clean up any pending photos for this specific avaria before push attempt
      await dequeueRcAvariaPhotos(preRecebimentoId, clientDamageId);

      await deleteAvariaMediaForClientId(preRecebimentoId, clientDamageId, avariaId);



      try {

        await rep.push({ now: true });

      } catch (error) {

        const message = parsePushErrorMessage(error);

        if (isValidationPushError(message)) {

          throw new Error(message);

        }

        throw error;

      }

    },

    [avariaViews, preRecebimentoId, rep],

  );



  const limparAvarias = useCallback(async (): Promise<void> => {

    if (!rep) {

      throw new Error('Replicache não está pronto');

    }



    if (avariaViews.length === 0) {

      return;

    }



    await rep.mutate.limparAvarias({ preRecebimentoId });



    try {

      await rep.push({ now: true });

    } catch (error) {

      const message = parsePushErrorMessage(error);

      if (isValidationPushError(message)) {

        throw new Error(message);

      }

      throw error;

    }



    await dequeueAllRcAvariaPhotos(preRecebimentoId);

    await deleteAllAvariaMediaForDemand(preRecebimentoId);

  }, [avariaViews.length, preRecebimentoId, rep]);



  const avariasBySku = useCallback(

    (sku: string) => {

      const normalized = normalizeSkuParam(sku).toUpperCase();

      return avarias.filter(

        (avaria) => normalizeSkuParam(avaria.sku ?? '').toUpperCase() === normalized,

      );

    },

    [avarias],

  );



  return {

    registrarAvaria,

    removerAvaria,

    limparAvarias,

    avarias,

    avariasBySku,

    isLoading: !isReady,

  };

}


