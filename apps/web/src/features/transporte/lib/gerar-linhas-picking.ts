import type { LinhaMapaPicking } from '@/features/transporte/types/geracao-mapas-separacao.schema';
import type { PedidoPicking } from '@/features/transporte/types/geracao-mapas-separacao.schema';

const PRODUTOS = [
  { sku: 'SKU-88421', nome: 'Arroz Integral 5kg', familia: 'Grãos' },
  { sku: 'SKU-33105', nome: 'Feijão Preto 1kg', familia: 'Grãos' },
  { sku: 'SKU-55290', nome: 'Óleo de Soja 900ml', familia: 'Óleos' },
  { sku: 'SKU-77102', nome: 'Açúcar Cristal 1kg', familia: 'Grãos' },
  { sku: 'SKU-44817', nome: 'Macarrão Espaguete 500g', familia: 'Massas' },
  { sku: 'SKU-90334', nome: 'Leite UHT 1L', familia: 'Laticínios' },
  { sku: 'SKU-22019', nome: 'Café Torrado 500g', familia: 'Bebidas' },
  { sku: 'SKU-66541', nome: 'Detergente Líquido 500ml', familia: 'Limpeza' },
] as const;

const ZONAS = ['Zona A — Eletro', 'Zona B — Acessórios', 'Zona C — Fluidos', 'Zona D — Refrigerados'];

function hashString(valor: string): number {
  let hash = 0;
  for (let i = 0; i < valor.length; i += 1) {
    hash = (hash << 5) - hash + valor.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gerarEndereco(pedidoId: string, indice: number): string {
  const hash = hashString(`${pedidoId}-${indice}`);
  const rua = String.fromCharCode(65 + (hash % 4));
  const corredor = String((hash % 12) + 1).padStart(2, '0');
  const modulo = String((hash % 8) + 1).padStart(2, '0');
  const nivel = String((hash % 5) + 1).padStart(2, '0');
  return `${rua}-${corredor}-${modulo}-${nivel}`;
}

export function gerarLinhasPicking(pedidos: PedidoPicking[]): LinhaMapaPicking[] {
  const linhas: LinhaMapaPicking[] = [];

  pedidos.forEach((pedido) => {
    for (let i = 0; i < pedido.qtdLinhas; i += 1) {
      const produto =
        PRODUTOS[hashString(`${pedido.id}-${i}`) % PRODUTOS.length] ??
        PRODUTOS[0];
      const endereco = gerarEndereco(pedido.id, i);
      const partes = endereco.split('-');
      const zona =
        ZONAS[hashString(endereco) % ZONAS.length] ?? 'Zona A — Eletro';
      const quantidade = 4 + (hashString(`${pedido.id}-qtd-${i}`) % 16);
      const pesoUnitario = Math.max(1, Math.round(pedido.peso / pedido.qtdLinhas));
      const volumeUnitario =
        Math.round((pedido.volume / pedido.qtdLinhas) * 100) / 100;

      linhas.push({
        id: `${pedido.id}-linha-${i + 1}`,
        pedidoId: pedido.id,
        numeroNF: pedido.numeroNF,
        cliente: pedido.cliente,
        sku: produto.sku,
        produto: produto.nome,
        endereco,
        zona,
        corredor: partes[1] ?? '01',
        nivel: partes[3] ?? '01',
        quantidade,
        peso: pesoUnitario,
        volume: volumeUnitario,
        lote: `LT-${hashString(`${pedido.id}-lote-${i}`) % 9999}`,
        sequenciaColeta: 0,
      });
    }
  });

  return linhas;
}
