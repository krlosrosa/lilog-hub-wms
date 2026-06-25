import { z } from 'zod';

export const CabecalhoGrupoMapaSchema = z.object({
  transporte: z.string(),
  placa: z.string().nullable(),
  transportadora: z.string().nullable(),
  codPrimeiroCliente: z.string(),
  primeiroCliente: z.string(),
  codTodosClientes: z.string(),
  todosClientes: z.string(),
  pesoTotal: z.number(),
  totalCaixas: z.number().int(),
  totalUnidades: z.number().int(),
  totalPaletes: z.number().int(),
  nomeGrupo: z.string(),
  quantidadeLinhas: z.number().int(),
  categoria: z.string(),
  empresa: z.string(),
  microUuid: z.string(),
});

export type CabecalhoGrupoMapa = z.infer<typeof CabecalhoGrupoMapaSchema>;

export type ContextoVariaveisCabecalhoMapa = {
  sequencia?: number;
  infoAdicionaisI?: string;
  infoAdicionaisII?: string;
};

export const QR_CODE_VARIAVEL = '{{qr_code}}';

export type VariavelCabecalhoMapaCatalogo = {
  chave: string;
  label: string;
  descricao: string;
  exemplo: string;
};

export const VARIAVEIS_CABECALHO_MAPA_CATALOGO: VariavelCabecalhoMapaCatalogo[] = [
  {
    chave: '{{codigo_primeiro_cliente}}',
    label: 'Código primeiro cliente',
    descricao: 'Código do primeiro cliente do mapa (cabecalho.codPrimeiroCliente)',
    exemplo: 'C001',
  },
  {
    chave: '{{primeiro_cliente}}',
    label: 'Primeiro cliente',
    descricao: 'Nome do primeiro cliente do mapa (cabecalho.primeiroCliente)',
    exemplo: 'Cliente A',
  },
  {
    chave: '{{codigo_todos_clientes}}',
    label: 'Código todos os clientes',
    descricao: 'Códigos de todos os clientes, separados por · (cabecalho.codTodosClientes)',
    exemplo: 'C001 · C002',
  },
  {
    chave: '{{todos_clientes}}',
    label: 'Todos os clientes',
    descricao: 'Nomes de todos os clientes, separados por · (cabecalho.todosClientes)',
    exemplo: 'Cliente A · Cliente B',
  },
  {
    chave: '{{placa}}',
    label: 'Placa',
    descricao: 'Placa do veículo (cabecalho.placa)',
    exemplo: 'ABC-1234',
  },
  {
    chave: '{{transportadora}}',
    label: 'Transportadora',
    descricao: 'Transportadora atribuída (cabecalho.transportadora)',
    exemplo: 'TransLog',
  },
  {
    chave: '{{rota}}',
    label: 'Rota',
    descricao: 'Nome da rota / transporte (cabecalho.transporte)',
    exemplo: 'Rota A',
  },
  {
    chave: '{{empresas_transporte}}',
    label: 'Empresas no transporte',
    descricao:
      'Alias temporário de cabecalho.empresa (lógica de múltiplas empresas será adicionada depois)',
    exemplo: 'Empresa X',
  },
  {
    chave: '{{empresa}}',
    label: 'Empresa',
    descricao: 'Empresa principal do mapa (cabecalho.empresa)',
    exemplo: 'Empresa X',
  },
  {
    chave: '{{categoria}}',
    label: 'Categoria',
    descricao: 'Categoria dos itens do mapa (cabecalho.categoria)',
    exemplo: 'seco',
  },
  {
    chave: '{{grupo}}',
    label: 'Grupo',
    descricao: 'Nome do grupo do mapa (cabecalho.nomeGrupo)',
    exemplo: 'Rota A',
  },
  {
    chave: '{{sequencia}}',
    label: 'Sequência',
    descricao: 'Número sequencial do mapa no lote (contexto.sequencia, 3 dígitos)',
    exemplo: '001',
  },
  {
    chave: '{{id_mapa}}',
    label: 'ID mapa',
    descricao: 'Identificador único do mapa (cabecalho.microUuid)',
    exemplo: 'Rota-A-V1StGXR8_Z5jdHi6B-myT',
  },
  {
    chave: '{{qtd_palete_total}}',
    label: 'Qtd. palete total',
    descricao: 'Quantidade total de paletes (cabecalho.totalPaletes)',
    exemplo: '1',
  },
  {
    chave: '{{qtd_unidade_total}}',
    label: 'Qtd. unidade total',
    descricao: 'Quantidade total de unidades (cabecalho.totalUnidades)',
    exemplo: '0',
  },
  {
    chave: '{{qtd_caixa_total}}',
    label: 'Qtd. caixa total',
    descricao: 'Quantidade total de caixas (cabecalho.totalCaixas)',
    exemplo: '2',
  },
  {
    chave: '{{peso}}',
    label: 'Peso',
    descricao: 'Peso total do mapa formatado (cabecalho.pesoTotal)',
    exemplo: '132,00 kg',
  },
  {
    chave: '{{qtd_linhas}}',
    label: 'Qtd. de linhas',
    descricao: 'Quantidade de linhas do mapa (cabecalho.quantidadeLinhas)',
    exemplo: '2',
  },
  {
    chave: '{{info_adicionais_i}}',
    label: 'Info adicionais I',
    descricao: 'Campo livre (contexto.infoAdicionaisI; vazio por padrão na impressão)',
    exemplo: '',
  },
  {
    chave: '{{info_adicionais_ii}}',
    label: 'Info adicionais II',
    descricao: 'Campo livre (contexto.infoAdicionaisII; vazio por padrão na impressão)',
    exemplo: '',
  },
  {
    chave: QR_CODE_VARIAVEL,
    label: 'QR Code',
    descricao: 'Código QR do mapa — valor = cabecalho.microUuid (obrigatório)',
    exemplo: '[QR]',
  },
];

function formatarPeso(pesoTotal: number): string {
  return `${pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
}

function formatarSequencia(sequencia: number | undefined): string {
  if (sequencia == null || sequencia < 1) {
    return '';
  }

  return String(sequencia).padStart(3, '0');
}

function nullableText(valor: string | null | undefined): string {
  return valor ?? '';
}

export function montarVariaveisCabecalhoMapa(
  cabecalho: CabecalhoGrupoMapa,
  contexto: ContextoVariaveisCabecalhoMapa = {},
): Record<string, string> {
  const empresa = cabecalho.empresa;

  return {
    '{{codigo_primeiro_cliente}}': cabecalho.codPrimeiroCliente,
    '{{primeiro_cliente}}': cabecalho.primeiroCliente,
    '{{codigo_todos_clientes}}': cabecalho.codTodosClientes,
    '{{todos_clientes}}': cabecalho.todosClientes,
    '{{placa}}': nullableText(cabecalho.placa),
    '{{transportadora}}': nullableText(cabecalho.transportadora),
    '{{rota}}': cabecalho.transporte,
    '{{empresas_transporte}}': empresa,
    '{{empresa}}': empresa,
    '{{categoria}}': cabecalho.categoria,
    '{{grupo}}': cabecalho.nomeGrupo,
    '{{sequencia}}': formatarSequencia(contexto.sequencia),
    '{{id_mapa}}': cabecalho.microUuid,
    '{{qtd_palete_total}}': String(cabecalho.totalPaletes),
    '{{qtd_unidade_total}}': String(cabecalho.totalUnidades),
    '{{qtd_caixa_total}}': String(cabecalho.totalCaixas),
    '{{peso}}': formatarPeso(cabecalho.pesoTotal),
    '{{qtd_linhas}}': String(cabecalho.quantidadeLinhas),
    '{{info_adicionais_i}}': contexto.infoAdicionaisI ?? '',
    '{{info_adicionais_ii}}': contexto.infoAdicionaisII ?? '',
    [QR_CODE_VARIAVEL]: cabecalho.microUuid,
  };
}

export function substituirVariaveisCabecalho(
  template: string,
  variaveis: Record<string, string>,
  options?: { preservarQrCode?: boolean },
): string {
  const preservarQrCode = options?.preservarQrCode ?? true;

  return Object.entries(variaveis).reduce((html, [chave, valor]) => {
    if (preservarQrCode && chave === QR_CODE_VARIAVEL) {
      return html;
    }

    return html.replaceAll(chave, valor);
  }, template);
}

export function aplicarVariaveisCabecalhoMapa(
  template: string,
  cabecalho: CabecalhoGrupoMapa,
  contexto: ContextoVariaveisCabecalhoMapa = {},
  options?: { preservarQrCode?: boolean },
): string {
  const variaveis = montarVariaveisCabecalhoMapa(cabecalho, contexto);
  return substituirVariaveisCabecalho(template, variaveis, options);
}

export function montarVariaveisExemploCabecalhoMapa(): Record<string, string> {
  return VARIAVEIS_CABECALHO_MAPA_CATALOGO.reduce<Record<string, string>>(
    (acc, variavel) => {
      acc[variavel.chave] = variavel.exemplo;
      return acc;
    },
    {},
  );
}

export function substituirVariaveisExemploCabecalho(
  template: string,
  options?: { preservarQrCode?: boolean },
): string {
  return substituirVariaveisCabecalho(
    template,
    montarVariaveisExemploCabecalhoMapa(),
    options,
  );
}
