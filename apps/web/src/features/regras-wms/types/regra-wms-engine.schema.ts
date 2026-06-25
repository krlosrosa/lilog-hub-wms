import { z } from 'zod';

/**
 * Tipos espelhando a estrutura serializável da json-rules-engine.
 * @see https://github.com/cachecontrol/json-rules-engine/blob/master/docs/rules.md
 * @see https://github.com/cachecontrol/json-rules-engine/blob/master/types/index.d.ts
 */

export const engineConditionLeafSchema = z.object({
  fact: z.string(),
  operator: z.string(),
  value: z.unknown(),
  path: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  name: z.string().optional(),
  priority: z.number().optional(),
});

export type EngineConditionLeaf = z.infer<typeof engineConditionLeafSchema>;

export type EngineTopLevelCondition =
  | { all: EngineNestedCondition[]; name?: string; priority?: number }
  | { any: EngineNestedCondition[]; name?: string; priority?: number }
  | { not: EngineNestedCondition; name?: string; priority?: number }
  | { condition: string; name?: string; priority?: number };

export type EngineNestedCondition =
  | EngineConditionLeaf
  | EngineTopLevelCondition;

export const engineEventSchema = z.object({
  type: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export type EngineEvent = z.infer<typeof engineEventSchema>;

/** Regra no formato nativo da json-rules-engine (sem metadados WMS). */
export const engineRuleSchema = z.object({
  name: z.string().optional(),
  priority: z.number().int().positive().optional(),
  conditions: z.custom<EngineTopLevelCondition>(),
  event: engineEventSchema,
});

export type EngineRule = z.infer<typeof engineRuleSchema>;

/**
 * Payload persistido no backend — engine JSON + metadados do domínio WMS.
 * O conversor produz `engineRule`; o runtime filtra por `gatilho` antes de `engine.run()`.
 */
export const regraWmsPersistidaSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  nome: z.string(),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  gatilho: z.enum(['recebimento', 'movimentacao', 'saida', 'inventario']),
  engineRule: engineRuleSchema,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});

export type RegraWmsPersistida = z.infer<typeof regraWmsPersistidaSchema>;
