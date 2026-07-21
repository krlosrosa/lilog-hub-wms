import { useMemo } from 'react';

import type { LoteModo, QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';

import type { ConferirItemV2Input } from '@/features/recebimento-v2/hooks/use-conferencia-v2';

import { resolveItemConferidoRecordId } from '@lilog/contracts';

import { mapConferenciaV2SyncPayload } from '@/features/recebimento-v2/lib/map-conferencia-v2-sync-payload';

import {

  CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG,

  calcConferenceQuantityInUnidades,

  isResolvableCatalogProduct,

  normalizeSkuParam,

  resolveProdutoConferenciaV2,

  resolveUnidadesPorCaixa,

} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';

import type { ConferenceRecord } from '@/features/recebimento-v2/local-db/schema';

import type { DivergenciaItem } from '@/features/recebimento-v2/types/recebimento-v2.schema';

import {

  useExpectedItemsReplicache,

  useItensConferidosReplicache,

  useAvariasReplicache,

  useReplicache,

} from '@/lib/replicache/hooks';

import {

  isValidationPushError,

  parsePushErrorMessage,

} from '@/lib/replicache/parse-push-error';



import { computeDivergenciasRc } from '../lib/compute-divergencias-rc';

import { mapAvariaViewsToDamageRecords } from '../lib/map-avaria-view-to-damage';

import { findExpectedItemBySku } from '../lib/map-expected-item-to-product';

import { mapItensConferidosToConferences } from '../lib/map-item-conferido-to-conference';


import {

  getActivePaleteCodigoRc,

  PALETE_OBRIGATORIO_MSG_RC,

} from '../services/palete-session-rc.service';



export function useConferenciaRc(preRecebimentoId: string) {

  const expectedItems = useExpectedItemsReplicache(preRecebimentoId);

  const itensConferidos = useItensConferidosReplicache(preRecebimentoId);

  const { rep, isReady } = useReplicache();



  const conferences = useMemo(

    () => mapItensConferidosToConferences(itensConferidos, preRecebimentoId),

    [itensConferidos, preRecebimentoId],

  );

  const avariaViews = useAvariasReplicache(preRecebimentoId);

  const damages = useMemo(

    () => mapAvariaViewsToDamageRecords(preRecebimentoId, avariaViews),

    [avariaViews, preRecebimentoId],

  );



  async function conferirItem(input: ConferirItemV2Input): Promise<string> {

    if (!rep) {

      throw new Error('Replicache não está pronto');

    }



    if (!isResolvableCatalogProduct(input.product)) {

      throw new Error(CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG);

    }



    const expectedItem =

      findExpectedItemBySku(expectedItems, input.sku) ??

      expectedItems.find((item) => item.produtoId === input.product.produtoId);



    const produtoConfig = resolveProdutoConferenciaV2(input.product, input.parametros);

    const produtoId = input.product.produtoId;



    const needsUnitizador =

      input.parametros.controlaPalete || produtoConfig.pesoVariavel;

    const activePalete = needsUnitizador

      ? getActivePaleteCodigoRc(preRecebimentoId)

      : null;

    const unitizadorCodigo = needsUnitizador

      ? input.unitizadorCodigo?.trim() || activePalete || undefined

      : undefined;



    if (needsUnitizador && !unitizadorCodigo) {

      throw new Error(PALETE_OBRIGATORIO_MSG_RC);

    }



    const unidadesPorCaixa = resolveUnidadesPorCaixa(

      expectedItem?.unidadesPorCaixa,

      input.product.unidadesPorCaixa,

    );



    const recebidaCaixa = produtoConfig.pesoVariavel ? 1 : input.recebidaCaixa;

    const recebidaUnidade = produtoConfig.pesoVariavel ? 0 : input.recebidaUnidade;



    const tempRecord: ConferenceRecord = {

      id: crypto.randomUUID(),

      demandId: preRecebimentoId,

      sku: input.product.sku,

      lote: input.lote,

      fabricacao: input.fabricacao,

      validade: input.validade,

      quantity: calcConferenceQuantityInUnidades({

        recebidaCaixa,

        recebidaUnidade,

        unidadesPorCaixa,

        pesoVariavel: produtoConfig.pesoVariavel,

      }),

      recebidaCaixa,

      recebidaUnidade,

      peso: input.peso,

      etiquetaCodigo: input.etiquetaCodigo,

      unitizadorCodigo,

      isPvarBox: produtoConfig.pesoVariavel,

      conferidoAt: new Date().toISOString(),

      syncStatus: 'pending',

      updatedAt: Date.now(),

    };



    const payload = mapConferenciaV2SyncPayload(

      tempRecord,

      {

        produtoId,

        unidadesPorCaixa,

        pesoVariavel: produtoConfig.pesoVariavel,

        controlaLote: produtoConfig.controlaLote,

        controlaValidade: produtoConfig.controlaValidade,

        quantidadeModo: input.parametros.quantidadeModo,

        controlaPalete: input.parametros.controlaPalete,

      },

      input.parametros.loteModo as LoteModo,

    );



    const clientRecordId = tempRecord.id;



    await rep.mutate.conferirItem({

      preRecebimentoId,

      produtoId: payload.produtoId,

      quantidadeRecebida: payload.quantidadeRecebida,

      unidadeMedida: payload.unidadeMedida,

      loteRecebido: payload.loteRecebido,

      validade: payload.validade,

      pesoRecebido: payload.pesoRecebido,

      etiquetaCodigo: payload.etiquetaCodigo,

      unitizadorCodigo: payload.unitizadorCodigo,

      clientRecordId,

    });



    try {

      await rep.push({ now: true });

    } catch (error) {

      const message = parsePushErrorMessage(error);

      if (isValidationPushError(message)) {

        throw new Error(message);

      }

      throw error;

    }



    return clientRecordId;

  }



  function getConferenciasBySku(sku: string): ConferenceRecord[] {

    const normalized = sku.trim().replace(/^["']+|["']+$/g, '').toUpperCase();

    return conferences.filter(

      (conference) =>

        conference.sku.trim().replace(/^["']+|["']+$/g, '').toUpperCase() === normalized,

    );

  }



  function getDivergencias(quantidadeModo: QuantidadeModo = 'ambos'): DivergenciaItem[] {

    return computeDivergenciasRc({

      expectedItems,

      conferences,

      damages,

      quantidadeModo,

    });

  }



  async function deletarConferencia(conferenceId: string): Promise<void> {

    if (!rep) {

      throw new Error('Replicache não está pronto');

    }



    const conference = conferences.find((entry) => entry.id === conferenceId);

    if (!conference) {

      throw new Error('Conferência não encontrada');

    }



    const recebimentoItemId =
      conference.serverItemId?.trim() || conference.id;



    const expectedItem = findExpectedItemBySku(expectedItems, conference.sku);

    const itemConferido = itensConferidos.find(

      (item) => item.recebimentoItemId === recebimentoItemId,

    );

    const produtoId = expectedItem?.produtoId ?? itemConferido?.produtoId;



    if (!produtoId) {

      throw new Error('Produto não encontrado na demanda');

    }



    const isPvar = conference.isPvarBox === true;

    const pesagemId = isPvar ? (conference.serverPesagemId ?? null) : null;

    const conferenciaRecordId = resolveItemConferidoRecordId(

      conference.serverPesagemId,

      recebimentoItemId,

    );



    await rep.mutate.removerConferencia({

      preRecebimentoId,

      recebimentoItemId,

      produtoId,

      pesagemId,

      isPvar,

      conferenciaRecordId,

    });



    try {

      await rep.push({ now: true });

    } catch (error) {

      const message = parsePushErrorMessage(error);

      if (isValidationPushError(message)) {

        throw new Error(message);

      }

      throw error;

    }

  }



  async function removerItemAdicionado(sku: string): Promise<void> {

    if (!rep) {

      throw new Error('Replicache não está pronto');

    }



    const normalized = normalizeSkuParam(sku).toUpperCase();

    const item = expectedItems.find(

      (ei) => ei.isNovo && normalizeSkuParam(ei.sku).toUpperCase() === normalized,

    );



    if (!item) {

      throw new Error('Este item não pode ser excluído');

    }



    const activeConferences = conferences.filter(

      (c) =>

        !c.deletedAt &&

        normalizeSkuParam(c.sku).toUpperCase() === normalized,

    );



    if (activeConferences.length > 0) {

      throw new Error('Remova as conferências deste item antes de excluí-lo');

    }



    await rep.mutate.removerExpectedItem({

      preRecebimentoId,

      produtoId: item.produtoId,

    });



    try {

      await rep.push({ now: true });

    } catch (error) {

      const message = parsePushErrorMessage(error);

      if (isValidationPushError(message)) {

        throw new Error(message);

      }

      // Connectivity error: mutation queued in Replicache, silently swallow

    }

  }



  return {

    conferirItem,

    deletarConferencia,

    removerItemAdicionado,

    getConferenciasBySku,

    getDivergencias,

    conferences,

    expectedItems,

    isLoading: !isReady,

  };

}


