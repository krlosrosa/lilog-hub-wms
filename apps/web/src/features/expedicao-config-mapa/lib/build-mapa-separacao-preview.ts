import {
  CONFERENCE_CLASSIFICATION_LABELS,
  GROUPING_RULE_LABELS,
  PALLETIZATION_TYPE_LABELS,
  PRINT_TYPE_LABELS,
  type GroupingRules,
  type MapaSeparacaoPreview,
  type MapaSeparacaoPreviewLine,
  type PalletizationConfig,
  type PrintConfig,
  type Transport,
} from '@/features/expedicao-config-mapa/types/config-mapa.schema';

const MOCK_PRODUTOS = [
  { sku: 'SKU-8842', produto: 'Arroz Integral 5kg', endereco: 'A-01-03-02' },
  { sku: 'SKU-3310', produto: 'Feijão Carioca 1kg', endereco: 'A-02-01-04' },
  { sku: 'SKU-5521', produto: 'Óleo Soja 900ml', endereco: 'B-03-02-01' },
  { sku: 'SKU-1190', produto: 'Açúcar Refinado 1kg', endereco: 'B-04-01-03' },
  { sku: 'SKU-7744', produto: 'Macarrão Espaguete', endereco: 'C-01-02-05' },
  { sku: 'SKU-2208', produto: 'Leite UHT 1L', endereco: 'C-02-03-01' },
  { sku: 'SKU-9931', produto: 'Café Torrado 500g', endereco: 'D-01-01-02' },
  { sku: 'SKU-4412', produto: 'Sabão em Pó 1kg', endereco: 'D-02-04-01' },
];

function buildLinhas(count: number): MapaSeparacaoPreviewLine[] {
  const limite = Math.min(count, MOCK_PRODUTOS.length);

  return Array.from({ length: limite }, (_, index) => {
    const produto = MOCK_PRODUTOS[index % MOCK_PRODUTOS.length]!;

    return {
      sequencia: index + 1,
      endereco: produto.endereco,
      sku: produto.sku,
      produto: produto.produto,
      quantidade: ((index % 3) + 1) * 2,
    };
  });
}

function formatPaletizacao(config: PalletizationConfig) {
  if (!config.enabled) {
    return 'Desabilitada';
  }

  const tipo = PALLETIZATION_TYPE_LABELS[config.type];

  if (config.type === 'full') {
    return `${tipo} · ${config.percentual}% · ${config.linhas} linhas`;
  }

  return `${tipo} · ${config.quantidadeUnidades} un.`;
}

function formatConferencia(
  printConfig: PrintConfig,
  groupingRules: GroupingRules,
) {
  if (printConfig.conferenciaSegueSeparacao) {
    const regrasAtivas = (
      [
        groupingRules.segregate.enabled && GROUPING_RULE_LABELS.segregate,
        groupingRules.byClient.enabled && GROUPING_RULE_LABELS.byClient,
        groupingRules.byTransport.enabled && GROUPING_RULE_LABELS.byTransport,
        groupingRules.byShipment.enabled && GROUPING_RULE_LABELS.byShipment,
      ] as (string | false)[]
    ).filter(Boolean);

    return regrasAtivas.length > 0
      ? `Segue separação (${regrasAtivas.join(' · ')})`
      : 'Segue separação';
  }

  return CONFERENCE_CLASSIFICATION_LABELS[
    printConfig.campoClassificacaoConferencia
  ];
}

function createMapa(
  id: string,
  codigo: string,
  titulo: string,
  subtitulo: string,
  agrupamento: string,
  palletization: PalletizationConfig,
  printConfig: PrintConfig,
  groupingRules: GroupingRules,
  transporte?: string,
  linhasCount = 6,
): MapaSeparacaoPreview {
  const linhas = buildLinhas(linhasCount);
  const totalLinhas =
    !palletization.enabled
      ? linhasCount
      : palletization.type === 'full'
        ? Math.max(linhasCount, palletization.linhas)
        : Math.max(linhasCount, Math.min(palletization.quantidadeUnidades, 8));

  return {
    id,
    codigo,
    titulo,
    subtitulo,
    transporte,
    agrupamento,
    paletizacao: formatPaletizacao(palletization),
    tipoImpressao: PRINT_TYPE_LABELS[printConfig.tipoImpressao],
    conferencia: formatConferencia(printConfig, groupingRules),
    linhas,
    totalLinhas,
  };
}

export function buildMapaSeparacaoPreview(input: {
  groupingRules: GroupingRules;
  palletization: PalletizationConfig;
  printConfig: PrintConfig;
  transports: Transport[];
}): MapaSeparacaoPreview[] {
  const { groupingRules, palletization, printConfig, transports } = input;
  const mapas: MapaSeparacaoPreview[] = [];
  const placaPrincipal = transports[0]?.placa ?? 'SEM-PLACA';
  const linhasPreview = !palletization.enabled
    ? 6
    : palletization.type === 'full'
      ? Math.min(palletization.linhas, 8)
      : Math.min(palletization.quantidadeUnidades, 8);

  if (groupingRules.segregate.enabled && groupingRules.segregate.items.length > 0) {
    mapas.push(
      createMapa(
        'preview-segregate',
        `MAP-SEG-${String(mapas.length + 1).padStart(3, '0')}`,
        'Mapa Segregado por Cliente',
        groupingRules.segregate.items.join(' · '),
        GROUPING_RULE_LABELS.segregate,
        palletization,
        printConfig,
        groupingRules,
        placaPrincipal,
        linhasPreview,
      ),
    );
  }

  if (groupingRules.byClient.enabled) {
    groupingRules.byClient.groups.forEach((group, index) => {
      if (group.items.length === 0) return;

      mapas.push(
        createMapa(
          `preview-client-${group.id}`,
          `MAP-CLI-${String(mapas.length + 1).padStart(3, '0')}`,
          group.name.trim() || `Grupo Cliente ${index + 1}`,
          group.items.join(' · '),
          GROUPING_RULE_LABELS.byClient,
          palletization,
          printConfig,
          groupingRules,
          transports[index]?.placa ?? placaPrincipal,
          linhasPreview,
        ),
      );
    });
  }

  if (groupingRules.byTransport.enabled) {
    groupingRules.byTransport.groups.forEach((group, index) => {
      if (group.items.length === 0) return;

      mapas.push(
        createMapa(
          `preview-transport-${group.id}`,
          `MAP-TRN-${String(mapas.length + 1).padStart(3, '0')}`,
          group.name.trim() || `Grupo Transporte ${index + 1}`,
          group.items.join(' · '),
          GROUPING_RULE_LABELS.byTransport,
          palletization,
          printConfig,
          groupingRules,
          group.items[0],
          linhasPreview,
        ),
      );
    });
  }

  if (groupingRules.byShipment.enabled) {
    groupingRules.byShipment.groups.forEach((group, index) => {
      if (group.items.length === 0) return;

      mapas.push(
        createMapa(
          `preview-shipment-${group.id}`,
          `MAP-REM-${String(mapas.length + 1).padStart(3, '0')}`,
          group.name.trim() || `Grupo Remessa ${index + 1}`,
          group.items.join(' · '),
          GROUPING_RULE_LABELS.byShipment,
          palletization,
          printConfig,
          groupingRules,
          transports[index]?.placa ?? placaPrincipal,
          linhasPreview,
        ),
      );
    });
  }

  if (mapas.length === 0) {
    mapas.push(
      createMapa(
        'preview-default',
        'MAP-001',
        'Mapa de Separação',
        `${transports.length} transporte(s) selecionado(s)`,
        'Configuração padrão',
        palletization,
        printConfig,
        groupingRules,
        placaPrincipal,
        linhasPreview,
      ),
    );
  }

  return mapas;
}

export function estimateMapCount(mapas: MapaSeparacaoPreview[]) {
  return mapas.length;
}
