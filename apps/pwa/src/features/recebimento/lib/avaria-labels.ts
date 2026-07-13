import type { AvariaSelectOption } from '../components/avaria-select-field';
import type { AvariaRegistro } from '../types/recebimento.schema';

function option(codigo: number, label: string): AvariaSelectOption {
  return { value: String(codigo), label, codigo };
}

/** Natureza da Não Conformidade */
export const AVARIA_NATUREZA_OPTIONS: readonly AvariaSelectOption[] = [
  option(1, 'Comercial'),
  option(2, 'Logística'),
  option(3, 'Operador Logístico'),
  option(4, 'Unidade Produtora'),
  option(5, 'Transporte'),
] as const;

/** Tipo da Não Conformidade */
export const AVARIA_TIPO_OPTIONS: readonly AvariaSelectOption[] = [
  option(1, 'Amassado'),
  option(2, 'Furado'),
  option(3, 'Estufado'),
  option(4, 'Rasgado'),
  option(5, 'Sujo'),
  option(6, 'Mofado'),
  option(7, 'Molhado de Chuva'),
  option(8, 'Má Apresentação'),
  option(9, 'Fora de Temperatura'),
  option(10, 'Data Divergente'),
  option(11, 'Coalhado'),
  option(12, 'Valia'),
  option(13, 'Vencido'),
  option(14, 'Vazando'),
  option(15, 'Contentor Quebrado'),
  option(16, 'Quebrado'),
  option(17, 'Selo Descolando'),
  option(18, 'Falta de Unidade'),
  option(19, 'Outros'),
] as const;

/** Causas Transporte — Natureza 5 */
const CAUSAS_TRANSPORTE: readonly AvariaSelectOption[] = [
  option(1, 'Carga Pisoteada'),
  option(2, 'Corrente'),
  option(3, 'Lona furada'),
  option(4, 'Falta de forro'),
  option(5, 'Lasca de madeira'),
  option(6, 'Assoalho quebrado'),
  option(7, 'Freada brusca (conformidade pelo motorista)'),
  option(8, 'Fueiro'),
  option(9, 'Prego na carroceria'),
  option(10, 'Ganchos'),
  option(11, 'Materiais sobre produtos'),
  option(12, 'Pallets tombados'),
  option(13, 'Tampas Laterais (Quebrada/Rachada)'),
  option(14, 'Falha/Quebra no Equip. de Frio'),
  option(15, 'Corda'),
  option(16, 'Condições da estrada'),
  option(17, 'Presença de Pragas / Roedores'),
  option(18, 'Molhado pelo sistema do frio'),
  option(19, 'Falta de Higiene'),
  option(20, 'Parede, teto e vedação fora do padrão'),
  option(21, 'Umidade'),
  option(22, 'Manuseio inadequado'),
  option(23, 'Lacre rompido'),
  option(24, 'Carga corrida'),
  option(25, 'Presença de produto químico'),
  option(26, 'Falta/ausência de produtos'),
  option(27, 'Outros (especificar no Parecer Logística)'),
] as const;

/** Causas Logística / Operador Logístico — Naturezas 2 e 3 */
const CAUSAS_LOGISTICA_OPERADOR: readonly AvariaSelectOption[] = [
  option(28, 'Carregamento Errado'),
  option(29, 'Batida de Empilhadeira'),
  option(30, 'Ataque de Pragas/Roedores'),
  option(31, 'Sobra de Produto (informar na Planilha de Falta e Sobra)'),
  option(32, 'Falta de Produto (informar na Planilha de Falta e Sobra)'),
  option(33, 'Mau Paletizado / Palete Misto'),
  option(34, 'Sem Cantoneira'),
  option(35, 'Stretch Apertado'),
  option(36, 'Stretch Frouxo/Pouco Stretch'),
  option(37, 'Ausência de Filme na Base'),
  option(38, 'Nº Maior de Lastros/Sobreposição'),
  option(39, 'Avaria de Carregamento'),
  option(40, 'Carga estivada'),
  option(41, 'Tombado no Drive-in'),
  option(42, 'Desvio Temperatura de Conservação'),
  option(43, 'Contaminação Cruzada'),
  option(44, 'Avaria de Movimentação'),
  option(45, 'Consumo Interno'),
  option(46, 'Goteira no Depósito'),
  option(47, 'Manuseio inadequado'),
  option(48, 'Outros (especificar no Parecer Logística)'),
  option(49, 'Estrado de madeira fora do padrão'),
] as const;

/** Causas Unidade Produtora — Natureza 4 */
const CAUSAS_UNIDADE_PRODUTORA: readonly AvariaSelectOption[] = [
  option(50, 'Mau Paletizado/Palete Misto'),
  option(51, 'Sem Cantoneira'),
  option(52, 'Stretch Apertado'),
  option(53, 'Stretch Frouxo/Pouco Stretch'),
  option(54, 'Ausência de Filme na Base'),
  option(55, 'Nº Maior de Lastros'),
  option(56, 'Divergência Embalagem Secundária'),
  option(57, 'Datação Divergente'),
  option(58, 'Má formação da Embalagem'),
  option(59, 'Avariado pela Esteira (embalagem primária)'),
  option(60, 'Corte Vertical na embalagem primária'),
  option(61, 'Defeito na Selagem Longitudinal / Transversal'),
  option(62, 'Excesso de Temperatura na Selagem das Abas'),
  option(63, 'Aba Dobrada'),
  option(64, 'Resíduo de Material de Embalagem'),
  option(65, 'Desvio de Produção'),
  option(66, 'Resistência da embalagem'),
  option(67, 'Molhado de produto (vazamento)'),
  option(68, 'Data apagada/borrada'),
  option(69, 'Embalagem sem data de fabricação'),
  option(70, 'Embalagem sem código de barras'),
  option(71, 'Aba aberta (embalagem primária)'),
  option(72, 'Aba aberta (embalagem secundária)'),
  option(73, 'Defeito na selagem da embalagem'),
  option(74, 'Falha no DINC'),
  option(75, 'Falha na Fita'),
  option(76, 'Troca de Fita'),
  option(77, 'Troca de bobina'),
  option(78, 'Má formação da tampa'),
  option(79, 'Danificado na cardboard'),
  option(80, 'Dobradora final'),
  option(81, 'Microfuro'),
  option(82, 'Emenda do filme'),
  option(83, 'Riscos na embalagem'),
  option(84, 'Reinício/Parada de máquina'),
  option(85, 'Zona de Risco'),
  option(86, 'Queda do robo'),
  option(87, 'Triagem do robo'),
  option(88, 'Falta de unidade em caixa/fardo lacrado'),
  option(89, 'Falha na tampa'),
  option(90, 'Embalagem sem tampa'),
  option(91, 'Avariado pela Esteira que transporta o pallet'),
  option(92, 'Outros (especificar)'),
] as const;

/** Causas Comercial — Natureza 1 */
const CAUSAS_COMERCIAL: readonly AvariaSelectOption[] = [
  option(93, 'Danificado no depósito do cliente'),
  option(94, 'Vencido no depósito do cliente'),
  option(95, 'Vencido no depósito Lactalis'),
  option(96, 'Temperatura Inadequada no cliente'),
  option(97, 'Ataque de pragas / Roedores no cliente'),
] as const;

/** Mapa de causas filtradas por código de natureza */
export const AVARIA_CAUSA_POR_NATUREZA: Record<string, readonly AvariaSelectOption[]> = {
  '1': CAUSAS_COMERCIAL,
  '2': CAUSAS_LOGISTICA_OPERADOR,
  '3': CAUSAS_LOGISTICA_OPERADOR,
  '4': CAUSAS_UNIDADE_PRODUTORA,
  '5': CAUSAS_TRANSPORTE,
};

/** Todas as causas (para resolução de labels) */
export const AVARIA_CAUSA_OPTIONS: readonly AvariaSelectOption[] = [
  ...CAUSAS_TRANSPORTE,
  ...CAUSAS_LOGISTICA_OPERADOR,
  ...CAUSAS_UNIDADE_PRODUTORA,
  ...CAUSAS_COMERCIAL,
] as const;

export function getAvariaCausaOptions(natureza: string): readonly AvariaSelectOption[] {
  if (!natureza) return [];
  return AVARIA_CAUSA_POR_NATUREZA[natureza] ?? [];
}

function resolveOptionLabel(options: readonly AvariaSelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getAvariaRegistroLabels(registro: AvariaRegistro) {
  return {
    tipo: resolveOptionLabel(AVARIA_TIPO_OPTIONS, registro.tipo),
    natureza: resolveOptionLabel(AVARIA_NATUREZA_OPTIONS, registro.natureza),
    causa: resolveOptionLabel(AVARIA_CAUSA_OPTIONS, registro.causa),
  };
}
