import { z } from 'zod';



import { ChecklistPhotoMediaIdsSchema } from '../pwa-sync/index.js';

import { ChecklistConditionsViewSchema } from './views.js';



export const REPLICACHE_MUTATIONS = {

  conferirItem: 'conferirItem',

  removerConferencia: 'removerConferencia',

  upsertChecklist: 'upsertChecklist',

  adicionarItemManual: 'adicionarItemManual',

  removerExpectedItem: 'removerExpectedItem',

  upsertTemperaturaBau: 'upsertTemperaturaBau',

  encerrarConferencia: 'encerrarConferencia',

  registrarAvaria: 'registrarAvaria',

  removerAvaria: 'removerAvaria',

  limparAvarias: 'limparAvarias',

  syncDemandaFromServer: 'syncDemandaFromServer',

} as const;



export type ReplicacheMutationName =

  (typeof REPLICACHE_MUTATIONS)[keyof typeof REPLICACHE_MUTATIONS];



export const ConferirItemArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  produtoId: z.string().min(1).max(50),

  quantidadeRecebida: z.number().nonnegative(),

  unidadeMedida: z.string().min(1).max(20),

  loteRecebido: z.string().optional(),

  pesoRecebido: z.number().positive().optional(),

  etiquetaCodigo: z.string().min(1).max(100).optional(),

  validade: z.string().datetime().optional(),

  numeroSerie: z.string().optional(),

  unitizadorCodigo: z.string().min(1).optional(),

  clientRecordId: z.string().uuid().optional(),

});



export type ConferirItemArgs = z.infer<typeof ConferirItemArgsSchema>;



export const RemoverConferenciaArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  recebimentoItemId: z.string().min(1).max(100),

  produtoId: z.string().min(1).max(50),

  pesagemId: z.string().min(1).max(100).nullable().optional(),

  isPvar: z.boolean(),

  conferenciaRecordId: z.string().min(1).max(100),

});



export type RemoverConferenciaArgs = z.infer<typeof RemoverConferenciaArgsSchema>;



export const UpsertChecklistArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  dockId: z.string().min(1).max(100).optional(),

  dockLabel: z.string().min(1).max(100).optional(),

  lacre: z.string().min(1).max(100),

  tempBau: z.number().nullable().optional(),

  conditions: ChecklistConditionsViewSchema,

  observacoes: z.string().max(2000).optional(),

  photoCount: z.number().int().nonnegative(),

  photoMediaIds: ChecklistPhotoMediaIdsSchema.optional(),

  responsavelId: z.number().int().positive().optional(),

  clientChecklistId: z.string().uuid().optional(),

});



export type UpsertChecklistArgs = z.infer<typeof UpsertChecklistArgsSchema>;



export const AdicionarItemManualArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  produtoId: z.string().min(1).max(50),

  sku: z.string().min(1).max(50),

  clientRecordId: z.string().uuid().optional(),

});



export type AdicionarItemManualArgs = z.infer<typeof AdicionarItemManualArgsSchema>;



export const UpsertTemperaturaBauArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  etapa: z.enum(['inicio', 'meio', 'fim']),

  temperatura: z.number(),

});



export type UpsertTemperaturaBauArgs = z.infer<

  typeof UpsertTemperaturaBauArgsSchema

>;



export const EncerrarConferenciaArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  quantidadePaletes: z.number().int().positive(),

  teveSobreposicaoCarga: z.boolean(),

});



export type EncerrarConferenciaArgs = z.infer<

  typeof EncerrarConferenciaArgsSchema

>;



export const RegistrarAvariaArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  produtoId: z.string().min(1).max(50).optional(),

  sku: z.string().min(1).max(50).optional(),

  lote: z.string().max(100).optional(),

  validade: z.string().datetime().optional(),

  numeroSerie: z.string().max(100).optional(),

  tipo: z.string().min(1).max(100),

  natureza: z.string().min(1).max(100),

  causa: z.string().min(1).max(100),

  quantidadeCaixas: z.number().int().nonnegative(),

  quantidadeUnidades: z.number().int().nonnegative(),

  photoCount: z.number().int().nonnegative(),

  replicarParaTodos: z.boolean().optional(),

  skusAlvo: z.array(z.string().min(1).max(50)).optional(),

  clientDamageId: z.string().uuid().optional(),

});



export type RegistrarAvariaArgs = z.infer<typeof RegistrarAvariaArgsSchema>;



export const RemoverAvariaArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  avariaId: z.string().min(1).max(100),

});



export type RemoverAvariaArgs = z.infer<typeof RemoverAvariaArgsSchema>;



export const LimparAvariasArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

});



export type LimparAvariasArgs = z.infer<typeof LimparAvariasArgsSchema>;

export const RemoverExpectedItemArgsSchema = z.object({

  preRecebimentoId: z.string().min(1).max(100),

  produtoId: z.string().min(1).max(50),

});



export type RemoverExpectedItemArgs = z.infer<typeof RemoverExpectedItemArgsSchema>;

export const SyncDemandaFromServerArgsSchema = z.object({
  preRecebimentoId: z.string().min(1).max(100),
  situacao: z.string().min(1).max(50),
  recebimentoId: z.string().uuid().nullable().optional(),
  dock: z.string().nullable().optional(),
});

export type SyncDemandaFromServerArgs = z.infer<
  typeof SyncDemandaFromServerArgsSchema
>;

