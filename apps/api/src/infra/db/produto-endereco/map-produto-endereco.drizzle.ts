import type {
  ProdutoEnderecoRecord,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import type {
  centros,
  enderecos,
  produtoEnderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';

type ProdutoEnderecoRow = typeof produtoEnderecos.$inferSelect;
type ProdutoRow = typeof produtos.$inferSelect;
type EnderecoRow = typeof enderecos.$inferSelect;
type CentroRow = typeof centros.$inferSelect;

export function mapProdutoEnderecoRow(
  alocacao: ProdutoEnderecoRow,
  produto: ProdutoRow,
  endereco: EnderecoRow,
  centro: CentroRow,
): ProdutoEnderecoRecord {
  return {
    id: alocacao.id,
    centroId: alocacao.centroId,
    produtoId: alocacao.produtoId,
    enderecoId: alocacao.enderecoId,
    papel: alocacao.papel,
    ordem: alocacao.ordem,
    ativo: alocacao.ativo,
    createdAt: alocacao.createdAt,
    updatedAt: alocacao.updatedAt,
    produto: {
      sku: produto.sku,
      descricao: produto.descricao,
      produtoId: produto.produtoId,
    },
    endereco: {
      enderecoMascarado: endereco.enderecoMascarado,
      tipo: endereco.tipo,
      zona: endereco.zona,
    },
    centro: {
      centro: centro.centro,
      nome: centro.nome,
      empresa: centro.empresa,
    },
  };
}
