import { z } from 'zod';

import {
  curvaAbcSchema,
  enderecoTipoSchema,
  ENDERECO_DIMENSOES_RACK_DEFAULT,
  type EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export const NIVEIS_LOTE_OPCOES = [10, 20, 30, 40, 50, 60] as const;

export type NivelLote = (typeof NIVEIS_LOTE_OPCOES)[number];

export const enderecoTipoEstruturaLoteSchema = z.enum([
  'porta-palete',
  'drive-in',
  'estante-dinamica',
  'flow-rack',
]);

export const configuracaoLoteSchema = z.object({
  zona: z.string().min(1, 'Informe o galpão/zona').max(10),
  tipoEstrutura: enderecoTipoEstruturaLoteSchema,
  larguraMm: z.number().int().positive(),
  alturaMm: z.number().int().positive(),
  profundidadeMm: z.number().int().positive(),
  cargaMaxKg: z.number().positive(),
  curvaAbc: curvaAbcSchema,
  vinculoSkuFixo: z.boolean(),
  regraLoteUnico: z.boolean(),
});

export type ConfiguracaoLote = z.infer<typeof configuracaoLoteSchema>;

export const ruaLoteSchema = z
  .object({
    id: z.string(),
    rua: z.string().min(1, 'Informe a rua').max(10),
    posicaoInicial: z.number().int().min(1),
    posicaoFinal: z.number().int().min(1),
    niveis: z.array(z.number().int().positive()).min(1, 'Selecione ao menos um nível'),
  })
  .superRefine((data, ctx) => {
    if (data.posicaoFinal < data.posicaoInicial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Posição final deve ser maior ou igual à inicial',
        path: ['posicaoFinal'],
      });
    }
  });

export type RuaLote = z.infer<typeof ruaLoteSchema>;

export const previewItemSchema = z.object({
  _id: z.string(),
  zona: z.string(),
  rua: z.string(),
  posicao: z.string(),
  nivel: z.string(),
  codigo: z.string(),
  tipo: enderecoTipoSchema,
  tipoEstrutura: enderecoTipoEstruturaLoteSchema,
  larguraMm: z.number().int().positive(),
  alturaMm: z.number().int().positive(),
  profundidadeMm: z.number().int().positive(),
  cargaMaxKg: z.number().positive(),
  curvaAbc: curvaAbcSchema,
  vinculoSkuFixo: z.boolean(),
  regraLoteUnico: z.boolean(),
  _editando: z.boolean(),
});

export type PreviewItem = z.infer<typeof previewItemSchema>;

export const CONFIGURACAO_LOTE_DEFAULT: ConfiguracaoLote = {
  zona: 'A',
  tipoEstrutura: 'porta-palete',
  ...ENDERECO_DIMENSOES_RACK_DEFAULT,
  curvaAbc: 'B',
  vinculoSkuFixo: false,
  regraLoteUnico: false,
};

export function resolverTipoPorNivel(nivel: number): EnderecoTipo {
  return nivel === 10 ? 'picking' : 'aereo';
}

export function normalizarRuaLote(rua: string): string {
  return rua.trim().padStart(3, '0');
}

export function normalizarPosicaoLote(posicao: number): string {
  return String(posicao).padStart(4, '0');
}

export function normalizarNivelLote(nivel: number): string {
  return String(nivel).padStart(2, '0');
}

export function buildCodigoLote(
  zona: string,
  rua: string,
  posicao: string,
  nivel: string,
): string {
  return `${zona.trim().toUpperCase()} ${normalizarRuaLote(rua)} ${posicao} ${nivel}`;
}

export function calcularQuantidadeRua(rua: RuaLote): number {
  if (rua.posicaoFinal < rua.posicaoInicial || rua.niveis.length === 0) {
    return 0;
  }

  const posicoes = rua.posicaoFinal - rua.posicaoInicial + 1;
  return posicoes * rua.niveis.length;
}

export function gerarPreviewItems(
  configuracao: ConfiguracaoLote,
  ruas: RuaLote[],
): PreviewItem[] {
  const items: PreviewItem[] = [];

  for (const rua of ruas) {
    if (rua.posicaoFinal < rua.posicaoInicial || rua.niveis.length === 0) {
      continue;
    }

    const ruaNormalizada = normalizarRuaLote(rua.rua);

    for (let posicao = rua.posicaoInicial; posicao <= rua.posicaoFinal; posicao++) {
      const posicaoNormalizada = normalizarPosicaoLote(posicao);

      for (const nivel of rua.niveis) {
        const nivelNormalizado = normalizarNivelLote(nivel);
        const tipo = resolverTipoPorNivel(nivel);

        items.push({
          _id: crypto.randomUUID(),
          zona: configuracao.zona.trim().toUpperCase(),
          rua: ruaNormalizada,
          posicao: posicaoNormalizada,
          nivel: nivelNormalizado,
          codigo: buildCodigoLote(
            configuracao.zona,
            ruaNormalizada,
            posicaoNormalizada,
            nivelNormalizado,
          ),
          tipo,
          tipoEstrutura: configuracao.tipoEstrutura,
          larguraMm: configuracao.larguraMm,
          alturaMm: configuracao.alturaMm,
          profundidadeMm: configuracao.profundidadeMm,
          cargaMaxKg: configuracao.cargaMaxKg,
          curvaAbc: configuracao.curvaAbc,
          vinculoSkuFixo: configuracao.vinculoSkuFixo,
          regraLoteUnico: configuracao.regraLoteUnico,
          _editando: false,
        });
      }
    }
  }

  return items;
}

export function criarRuaLoteVazia(): RuaLote {
  return {
    id: crypto.randomUUID(),
    rua: '001',
    posicaoInicial: 1,
    posicaoFinal: 10,
    niveis: [10, 20, 30],
  };
}
