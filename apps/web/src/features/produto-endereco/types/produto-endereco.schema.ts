import { z } from 'zod';

export const produtoEnderecoPapelSchema = z.enum([
  'picking_primario',
  'picking_secundario',
  'pulmao',
]);

export type ProdutoEnderecoPapelForm = z.infer<typeof produtoEnderecoPapelSchema>;

export const produtoEnderecoFormSchema = z.object({
  centroId: z.string().uuid('Selecione um centro'),
  produtoId: z.string().uuid('Selecione um produto'),
  enderecoId: z.string().uuid('Selecione um endereço'),
  papel: produtoEnderecoPapelSchema,
  ordem: z.number().int().min(1).max(32767),
  ativo: z.boolean(),
});

export type ProdutoEnderecoFormValues = z.infer<typeof produtoEnderecoFormSchema>;

export type ProdutoEnderecoListaItem = {
  id: string;
  sku: string;
  descricao: string;
  enderecoMascarado: string;
  centroLabel: string;
  papel: ProdutoEnderecoPapelForm;
  ordem: number;
  ativo: boolean;
};

export type FiltroPapelProdutoEndereco = 'todos' | ProdutoEnderecoPapelForm;

export type FiltroAtivoProdutoEndereco = 'todos' | 'ativos' | 'inativos';

export const PAPEL_PRODUTO_ENDERECO_LABELS: Record<
  ProdutoEnderecoPapelForm,
  string
> = {
  picking_primario: 'Picking primário',
  picking_secundario: 'Picking secundário',
  pulmao: 'Pulmão',
};

export function enderecoTipoParaPapel(
  papel: ProdutoEnderecoPapelForm,
): 'picking' | 'pulmao' {
  return papel === 'pulmao' ? 'pulmao' : 'picking';
}

export function papelDefaultPorTipoEndereco(
  tipo: 'picking' | 'pulmao' | string,
): ProdutoEnderecoPapelForm {
  return tipo === 'pulmao' ? 'pulmao' : 'picking_primario';
}

export type SlottingLinhaDraft = {
  alocacaoId: string | null;
  produtoId: string | null;
  produtoSku: string | null;
  produtoDescricao: string | null;
  papel: ProdutoEnderecoPapelForm;
  ordem: number;
  ativo: boolean;
};

export type SlottingEnderecoLinha = {
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  rua: string;
  tipo: string;
  draft: SlottingLinhaDraft;
  isDirty: boolean;
  isSaving: boolean;
};

export function buildSlottingDraft(
  alocacao: {
    id: string;
    produtoId: string;
    papel: ProdutoEnderecoPapelForm;
    ordem: number;
    ativo: boolean;
    produto: { sku: string; descricao: string };
  } | undefined,
  enderecoTipo: string,
): SlottingLinhaDraft {
  if (alocacao) {
    return {
      alocacaoId: alocacao.id,
      produtoId: alocacao.produtoId,
      produtoSku: alocacao.produto.sku,
      produtoDescricao: alocacao.produto.descricao,
      papel: alocacao.papel,
      ordem: alocacao.ordem,
      ativo: alocacao.ativo,
    };
  }

  return {
    alocacaoId: null,
    produtoId: null,
    produtoSku: null,
    produtoDescricao: null,
    papel: papelDefaultPorTipoEndereco(enderecoTipo),
    ordem: 1,
    ativo: true,
  };
}

export function slottingDraftsEqual(
  a: SlottingLinhaDraft,
  b: SlottingLinhaDraft,
): boolean {
  return (
    a.alocacaoId === b.alocacaoId &&
    a.produtoId === b.produtoId &&
    a.papel === b.papel &&
    a.ordem === b.ordem &&
    a.ativo === b.ativo
  );
}

type AlocacaoOrdemResumo = {
  id?: string | null;
  produtoId: string;
  ordem: number;
  papel: ProdutoEnderecoPapelForm;
};

export function proximaOrdemProdutoCentro(
  produtoId: string,
  alocacoes: AlocacaoOrdemResumo[],
  excluirAlocacaoId?: string | null,
): number {
  const ordensUsadas = new Set(
    alocacoes
      .filter(
        (item) =>
          item.produtoId === produtoId && item.id !== excluirAlocacaoId,
      )
      .map((item) => item.ordem),
  );

  let ordem = 1;
  while (ordensUsadas.has(ordem)) {
    ordem += 1;
  }

  return ordem;
}

export function papelSugeridoParaNovaAlocacao(
  produtoId: string,
  enderecoTipo: string,
  alocacoes: AlocacaoOrdemResumo[],
  excluirAlocacaoId?: string | null,
): ProdutoEnderecoPapelForm {
  const papelBase = papelDefaultPorTipoEndereco(enderecoTipo);

  if (papelBase !== 'picking_primario') {
    return papelBase;
  }

  const jaTemPrimario = alocacoes.some(
    (item) =>
      item.produtoId === produtoId &&
      item.papel === 'picking_primario' &&
      item.id !== excluirAlocacaoId,
  );

  return jaTemPrimario ? 'picking_secundario' : 'picking_primario';
}

export function resolverDraftNovaAlocacao(
  draft: SlottingLinhaDraft,
  enderecoTipo: string,
  alocacoes: AlocacaoOrdemResumo[],
  excluirAlocacaoId?: string | null,
): SlottingLinhaDraft {
  if (!draft.produtoId) {
    return draft;
  }

  return {
    ...draft,
    ordem: proximaOrdemProdutoCentro(
      draft.produtoId,
      alocacoes,
      excluirAlocacaoId,
    ),
    papel: papelSugeridoParaNovaAlocacao(
      draft.produtoId,
      enderecoTipo,
      alocacoes,
      excluirAlocacaoId,
    ),
  };
}
