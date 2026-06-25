import type { ItemSeparacao } from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { RemessaItem, TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const PRODUTOS = [
  { sku: 'SKU-88421', nome: 'Arroz Integral 5kg' },
  { sku: 'SKU-33105', nome: 'Feijão Preto 1kg' },
  { sku: 'SKU-55290', nome: 'Óleo de Soja 900ml' },
  { sku: 'SKU-77102', nome: 'Açúcar Cristal 1kg' },
  { sku: 'SKU-44817', nome: 'Macarrão Espaguete 500g' },
  { sku: 'SKU-90334', nome: 'Leite UHT 1L' },
  { sku: 'SKU-22019', nome: 'Café Torrado 500g' },
  { sku: 'SKU-66541', nome: 'Detergente Líquido 500ml' },
] as const;

const PESO_PALETE_FECHADO = 400;
const VOLUME_PALETE_FECHADO = 1;

const SETORES_ENTREGA = [
  'Setor Centro',
  'Setor Norte',
  'Setor Sul',
  'Setor Leste',
  'Setor Oeste',
] as const;

function hashString(valor: string): number {
  let hash = 0;
  for (let i = 0; i < valor.length; i += 1) {
    hash = (hash << 5) - hash + valor.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gerarEndereco(remessaId: string, indice: number): string {
  const hash = hashString(`${remessaId}-${indice}`);
  const zona = String.fromCharCode(65 + (hash % 4));
  const corredor = String((hash % 12) + 1).padStart(2, '0');
  const nivel = String((hash % 5) + 1).padStart(2, '0');
  const posicao = String.fromCharCode(65 + (hash % 3));
  return `${zona}-${corredor}-${nivel}-${posicao}`;
}

function extrairPartesEndereco(endereco: string): {
  zona: string;
  corredor: string;
  nivel: string;
} {
  const [zona = 'A', corredor = '01', nivel = '01'] = endereco.split('-');
  return { zona, corredor, nivel };
}

function definirSetorEntrega(
  transporte: TransporteGrupo,
  cliente: string,
): string {
  const indice =
    hashString(`${transporte.regiao}-${cliente}`) %
    SETORES_ENTREGA.length;
  return SETORES_ENTREGA[indice] ?? SETORES_ENTREGA[0];
}

function quantidadeItensPorRemessa(remessa: RemessaItem): number {
  const base = 3 + (hashString(remessa.id) % 4);
  return Math.min(base, Math.max(3, Math.ceil(remessa.peso / 120)));
}

export function gerarItensSeparacaoTransporte(
  transporte: TransporteGrupo,
): ItemSeparacao[] {
  const itens: ItemSeparacao[] = [];

  transporte.remessas.forEach((remessa) => {
    const qtdItens = quantidadeItensPorRemessa(remessa);
    const pesoUnitario = Math.max(1, Math.round(remessa.peso / qtdItens));
    const volumeUnitario =
      Math.round((remessa.volume / qtdItens) * 100) / 100;
    const setor = definirSetorEntrega(transporte, remessa.cliente);
    const remessaPaleteFechado =
      remessa.peso >= PESO_PALETE_FECHADO ||
      remessa.volume >= VOLUME_PALETE_FECHADO;

    for (let i = 0; i < qtdItens; i += 1) {
      const produto =
        PRODUTOS[hashString(`${remessa.id}-${i}`) % PRODUTOS.length] ??
        PRODUTOS[0];
      const endereco = gerarEndereco(remessa.id, i);
      const { zona, corredor, nivel } = extrairPartesEndereco(endereco);
      const quantidade = 6 + (hashString(`${remessa.id}-qtd-${i}`) % 18);
      const paleteFechado =
        remessaPaleteFechado || quantidade >= 40 || pesoUnitario >= 200;

      itens.push({
        id: `${remessa.id}-item-${i + 1}`,
        remessaId: remessa.id,
        numeroNF: remessa.remessa,
        sku: produto.sku,
        produto: produto.nome,
        endereco,
        zona,
        corredor,
        nivel,
        rotaEntrega: setor,
        quantidade,
        peso: pesoUnitario,
        volume: volumeUnitario,
        destinoCliente: remessa.cliente,
        observacoes: remessa.motivoReentrega,
        paleteFechado,
      });
    }
  });

  return itens;
}
