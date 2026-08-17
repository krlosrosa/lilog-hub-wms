import {

  AdicionarItemManualArgsSchema,

  avariaKey,

  ConferirItemArgsSchema,

  EncerrarConferenciaArgsSchema,

  LimparAvariasArgsSchema,

  RegistrarAvariaArgsSchema,

  RemoverAvariaArgsSchema,

  RemoverConferenciaArgsSchema,

  RemoverExpectedItemArgsSchema,

  SyncDemandaFromServerArgsSchema,

  UpsertChecklistArgsSchema,

  UpsertTemperaturaBauArgsSchema,

  checklistKey,

  demandKey,

  expectedItemKey,

  itemConferidoKey,

  temperaturaBauKey,

  type AdicionarItemManualArgs,

  type AvariaView,

  type ConferirItemArgs,

  type ChecklistView,

  type DemandView,

  type EncerrarConferenciaArgs,

  type ExpectedItemView,

  type ItemConferidoView,

  type LimparAvariasArgs,

  type RegistrarAvariaArgs,

  type RemoverAvariaArgs,

  type RemoverConferenciaArgs,

  type RemoverExpectedItemArgs,

  type SyncDemandaFromServerArgs,

  type TemperaturaBauView,

  type UpsertChecklistArgs,

  type UpsertTemperaturaBauArgs,

} from '@lilog/contracts';

import type { WriteTransaction } from 'replicache';



function buildOptimisticItem(

  args: ConferirItemArgs,

  recordId: string,

  recebimentoId: string | null,

): ItemConferidoView {

  return {

    id: recordId,

    recebimentoId,

    produtoId: args.produtoId,

    sku: args.produtoId,

    descricao: 'Conferindo...',

    quantidadeRecebida: args.quantidadeRecebida,

    unidadeMedida: args.unidadeMedida,

    loteRecebido: args.loteRecebido ?? null,

    validade: args.validade ?? null,

    pesoRecebido: args.pesoRecebido ?? null,

    etiquetaCodigo: args.etiquetaCodigo ?? null,

    pesagemId: null,

    recebimentoItemId: recordId,

    unitizadorCodigo: args.unitizadorCodigo ?? null,

  };

}



export const recebimentoMutators = {

  async conferirItem(tx: WriteTransaction, args: ConferirItemArgs) {

    const parsed = ConferirItemArgsSchema.parse(args);

    const tempId = parsed.clientRecordId ?? `temp-${crypto.randomUUID()}`;

    const existingDemand = (await tx.get(

      demandKey(parsed.preRecebimentoId),

    )) as DemandView | undefined;

    const optimistic = buildOptimisticItem(

      parsed,

      tempId,

      existingDemand?.recebimentoId ?? null,

    );

    await tx.set(

      itemConferidoKey(parsed.preRecebimentoId, parsed.produtoId, tempId),

      optimistic,

    );

  },



  async removerConferencia(tx: WriteTransaction, args: RemoverConferenciaArgs) {

    const parsed = RemoverConferenciaArgsSchema.parse(args);

    await tx.del(

      itemConferidoKey(

        parsed.preRecebimentoId,

        parsed.produtoId,

        parsed.conferenciaRecordId,

      ),

    );

  },



  async adicionarItemManual(tx: WriteTransaction, args: AdicionarItemManualArgs) {

    const parsed = AdicionarItemManualArgsSchema.parse(args);

    const optimistic: ExpectedItemView = {

      preRecebimentoId: parsed.preRecebimentoId,

      produtoId: parsed.produtoId,

      sku: parsed.sku,

      descricao: 'Adicionando...',

      unidadeMedida: 'UN',

      unidadesPorCaixa: 1,

      quantidadeEsperada: 0,

      config: {

        controlaLote: false,

        controlaValidade: false,

        controlaPeso: false,

        pesoVariavel: false,

        exigirEtiquetaPesoVariavel: false,

        controlaNumeroSerie: false,

      },

      isNovo: true,

    };

    await tx.set(

      expectedItemKey(parsed.preRecebimentoId, parsed.produtoId),

      optimistic,

    );

  },



  async removerExpectedItem(tx: WriteTransaction, args: RemoverExpectedItemArgs) {

    const parsed = RemoverExpectedItemArgsSchema.parse(args);

    await tx.del(expectedItemKey(parsed.preRecebimentoId, parsed.produtoId));

  },



  async upsertChecklist(tx: WriteTransaction, args: UpsertChecklistArgs) {

    const parsed = UpsertChecklistArgsSchema.parse(args);

    const existing = (await tx.get(

      checklistKey(parsed.preRecebimentoId),

    )) as ChecklistView | undefined;



    const dock =

      parsed.dockLabel?.trim() ||

      parsed.dockId?.trim() ||

      existing?.dock?.trim() ||

      null;



    const optimistic: ChecklistView = {

      preRecebimentoId: parsed.preRecebimentoId,

      recebimentoId: existing?.recebimentoId ?? null,

      dock,

      lacre: parsed.lacre,

      tempBau: parsed.tempBau ?? null,

      conditions: parsed.conditions,

      observacoes: parsed.observacoes ?? null,

      photoCount: parsed.photoCount,

      savedAt: new Date().toISOString(),

    };



    await tx.set(checklistKey(parsed.preRecebimentoId), optimistic);



    const existingDemand = (await tx.get(

      demandKey(parsed.preRecebimentoId),

    )) as DemandView | undefined;



    if (existingDemand && existingDemand.situacao !== 'impedido') {

      await tx.set(demandKey(parsed.preRecebimentoId), {

        ...existingDemand,

        dock,

        situacao: 'em_conferencia',

      });

    }

  },



  async upsertTemperaturaBau(tx: WriteTransaction, args: UpsertTemperaturaBauArgs) {

    const parsed = UpsertTemperaturaBauArgsSchema.parse(args);

    const existingDemand = (await tx.get(

      demandKey(parsed.preRecebimentoId),

    )) as DemandView | undefined;

    const optimistic: TemperaturaBauView = {

      recebimentoId: existingDemand?.recebimentoId ?? null,

      etapa: parsed.etapa,

      temperatura: parsed.temperatura,

      medidoEm: new Date().toISOString(),

    };

    await tx.set(

      temperaturaBauKey(parsed.preRecebimentoId, parsed.etapa),

      optimistic,

    );

  },



  async encerrarConferencia(_tx: WriteTransaction, args: EncerrarConferenciaArgs) {
    EncerrarConferenciaArgsSchema.parse(args);
    // Situação da demanda vem do pull (servidor). Atualização otimista para
    // conferido impedia o pull de corrigir demandas com finalização pendente.
  },



  async syncDemandaFromServer(tx: WriteTransaction, args: SyncDemandaFromServerArgs) {
    const parsed = SyncDemandaFromServerArgsSchema.parse(args);
    const existingDemand = (await tx.get(
      demandKey(parsed.preRecebimentoId),
    )) as DemandView | undefined;

    if (!existingDemand) {
      return;
    }

    await tx.set(demandKey(parsed.preRecebimentoId), {
      ...existingDemand,
      situacao: parsed.situacao,
      recebimentoId: parsed.recebimentoId ?? existingDemand.recebimentoId,
      dock: parsed.dock ?? existingDemand.dock,
    });
  },



  async registrarAvaria(tx: WriteTransaction, args: RegistrarAvariaArgs) {

    const parsed = RegistrarAvariaArgsSchema.parse(args);

    const tempId = parsed.clientDamageId ?? crypto.randomUUID();

    const existingDemand = (await tx.get(

      demandKey(parsed.preRecebimentoId),

    )) as DemandView | undefined;



    const optimistic: AvariaView = {

      id: tempId,

      recebimentoId: existingDemand?.recebimentoId ?? null,

      produtoId: parsed.produtoId ?? null,

      sku: parsed.sku ?? null,

      descricao: parsed.sku

        ? `Avaria SKU ${parsed.sku}`

        : 'Registrando avaria...',

      tipo: parsed.tipo,

      natureza: parsed.natureza,

      causa: parsed.causa,

      quantidadeCaixas: parsed.quantidadeCaixas,

      quantidadeUnidades: parsed.quantidadeUnidades,

      lote: parsed.lote ?? null,

      validade: parsed.validade ?? null,

      numeroSerie: parsed.numeroSerie ?? null,

      photoCount: parsed.photoCount,

      replicado: parsed.replicarParaTodos ?? false,

      clientDamageId: tempId,

      createdAt: new Date().toISOString(),

    };



    await tx.set(avariaKey(parsed.preRecebimentoId, tempId), optimistic);

  },



  async removerAvaria(tx: WriteTransaction, args: RemoverAvariaArgs) {

    const parsed = RemoverAvariaArgsSchema.parse(args);

    await tx.del(avariaKey(parsed.preRecebimentoId, parsed.avariaId));

  },



  async limparAvarias(tx: WriteTransaction, args: LimparAvariasArgs) {

    const parsed = LimparAvariasArgsSchema.parse(args);

    const prefix = `avaria/${parsed.preRecebimentoId}/`;

    for await (const key of tx.scan({ prefix }).keys()) {

      await tx.del(key);

    }

  },

};



export type RecebimentoMutators = typeof recebimentoMutators;


