import { z } from 'zod';

export const builderToolSchema = z.enum(['select', 'draw', 'move', 'measure']);

export type BuilderTool = z.infer<typeof builderToolSchema>;

export const rackTypeSchema = z.enum([
  'porta-palete',
  'drive-in',
  'flow-rack',
  'pedestrian-path',
  'forklift-street',
  'safety-barrier',
]);

export type RackType = z.infer<typeof rackTypeSchema>;

export const storageLogicSchema = z.enum(['fifo', 'fefo']);

export type StorageLogic = z.infer<typeof storageLogicSchema>;

export const occupancyStatusSchema = z.enum(['available', 'partial', 'occupied']);

export type OccupancyStatus = z.infer<typeof occupancyStatusSchema>;

export const rackAssetSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: rackTypeSchema,
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  loadLevels: z.number().int().min(1).max(12),
  capacityTon: z.number().positive(),
  storageLogic: storageLogicSchema.optional(),
});

export type RackAsset = z.infer<typeof rackAssetSchema>;

export const rackPropertiesFormSchema = z.object({
  loadLevels: z.number().int().min(1).max(12),
  capacityTon: z.number().positive(),
  depthMm: z.number().positive(),
});

export type RackPropertiesForm = z.infer<typeof rackPropertiesFormSchema>;

export const rackConfigFormSchema = z.object({
  heightPerLevelMm: z.number().int().positive(),
  positionsPerLevel: z.union([z.literal(3), z.literal(4)]),
  capacityKg: z.number().min(500).max(3000),
  storageLogic: storageLogicSchema,
  rackType: rackTypeSchema,
  activeLevel: z.number().int().min(1).max(5),
});

export type RackConfigForm = z.infer<typeof rackConfigFormSchema>;

export const canvasItemSchema = z.object({
  id: z.string(),
  type: rackTypeSchema,
  label: z.string(),
  x: z.number(),
  y: z.number(),
  widthPx: z.number().positive(),
  heightPx: z.number().positive(),
  loadLevels: z.number().int().min(1).max(12),
  capacityTon: z.number().positive(),
  depthMm: z.number().positive(),
  config: rackConfigFormSchema,
});

export type CanvasItem = z.infer<typeof canvasItemSchema>;

/** Grid snap interval in pixels (matches blueprint major grid). */
export const BUILDER_GRID_PX = 40;

export const canvasStateSchema = z.object({
  zoomPercent: z.number().positive(),
  gridSizeMm: z.number().positive(),
  cursorX: z.number(),
  cursorY: z.number(),
});

export type CanvasState = z.infer<typeof canvasStateSchema>;

export const warehouseLevelSchema = z.object({
  level: z.number().int().min(1).max(4),
  status: occupancyStatusSchema,
});

export type WarehouseLevel = z.infer<typeof warehouseLevelSchema>;

export const warehousePositionSchema = z.object({
  posId: z.string(),
  /** Código exibido (ex.: P01) — vem do componente no construtor. */
  displayCode: z.string().optional(),
  /** Nome/rótulo da posição — vem do componente no construtor. */
  label: z.string().optional(),
  aisleId: z.string().optional(),
  laneId: z.string().optional(),
  type: z.enum(['standard', 'drive-in']),
  typeLabel: z.string(),
  levels: z.array(warehouseLevelSchema),
  maxLoadKg: z.number().positive(),
  clearanceMm: z.number().positive(),
  sourceStreetId: z.string().optional(),
  sourceCabecaId: z.string().optional(),
  sourceStructureId: z.string().optional(),
  sourceComponentId: z.string().optional(),
});

export type WarehousePosition = z.infer<typeof warehousePositionSchema>;

export const warehouseAisleSchema = z.object({
  aisleNumber: z.number().int().positive(),
  aisleCode: z.string().optional(),
  aisleName: z.string().optional(),
  /** Posições nos lados do corredor (profundidade / vertical no mapa). */
  sides: z.array(
    z.object({
      side: z.union([z.literal(1), z.literal(2)]),
      positions: z.array(warehousePositionSchema),
    }),
  ),
});

export type WarehouseAisle = z.infer<typeof warehouseAisleSchema>;

/** Faixa horizontal transversal (cabeceira) que atravessa várias ruas/corredores. */
export const warehouseTransversalBandSchema = z.object({
  bandId: z.string(),
  bandCode: z.string(),
  bandName: z.string().optional(),
  end: z.enum(['inicio', 'fim']),
  aisleNumbers: z.array(z.number().int().positive()),
  streetCodes: z.array(z.string()),
  positions: z.array(warehousePositionSchema),
});

export type WarehouseTransversalBand = z.infer<typeof warehouseTransversalBandSchema>;

export const warehouseDriveInLaneSchema = z.object({
  laneNumber: z.number().int().positive(),
  laneCode: z.string().optional(),
  laneName: z.string().optional(),
  positions: z.array(warehousePositionSchema),
});

export type WarehouseDriveInLane = z.infer<typeof warehouseDriveInLaneSchema>;

export const warehouseLayoutSchema = z.object({
  aisles: z.array(warehouseAisleSchema),
  transversalBands: z.array(warehouseTransversalBandSchema).optional(),
  driveInLanes: z.array(warehouseDriveInLaneSchema),
  sourceItemCount: z.number().int().nonnegative().optional(),
  publishedAt: z.string().optional(),
});

export type WarehouseLayout = z.infer<typeof warehouseLayoutSchema>;

/** Nível de seleção no construtor hierárquico. */
export const layoutNodeLevelSchema = z.enum([
  'street',
  'cabeca',
  'structure',
  'component',
]);

export type LayoutNodeLevel = z.infer<typeof layoutNodeLevelSchema>;

/** Tipo de rua / zona no layout. */
export const streetTypeSchema = z.enum([
  'corredor-armazem',
  'zona-drive-in',
  'corredor-trafego',
]);

export type StreetType = z.infer<typeof streetTypeSchema>;

/** Tipo de estrutura dentro da rua. */
export const structureKindSchema = z.enum([
  'lado-estante',
  'bloco-drive-in',
  'flow-rack-bloco',
  'faixa-pedestre',
  'faixa-empilhadeira',
  'barreira-seguranca',
]);

export type StructureKind = z.infer<typeof structureKindSchema>;

export const cabecaEndSchema = z.enum(['inicio', 'fim']);

export type CabecaEnd = z.infer<typeof cabecaEndSchema>;

/** Tipo de componente dentro da estrutura. */
export const componentKindSchema = z.enum([
  'posicao-armazenagem',
  'segmento-via',
  'segmento-barreira',
]);

export type ComponentKind = z.infer<typeof componentKindSchema>;

export const layoutComponentSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  label: z.string(),
  kind: componentKindSchema,
  loadLevels: z.number().int().min(1).max(12),
  capacityTon: z.number().positive(),
  depthMm: z.number().positive(),
  config: rackConfigFormSchema,
});

export type LayoutComponent = z.infer<typeof layoutComponentSchema>;

export const layoutStructureSchema = z.object({
  id: z.string(),
  /** Preenchido quando a estrutura pertence a uma rua. */
  streetId: z.string().optional(),
  /** Preenchido quando a estrutura pertence a uma cabeceira transversal. */
  cabecaId: z.string().optional(),
  code: z.string().min(1),
  label: z.string(),
  kind: structureKindSchema,
  rackType: rackTypeSchema.optional(),
  /** Em cabeceira: coluna (rua) onde as posições desta estrutura aparecem. */
  anchorStreetId: z.string().optional(),
  side: z.union([z.literal(1), z.literal(2)]).optional(),
  /** @deprecated migrado para layoutCabeca — só leitura legada. */
  placement: z.enum(['lateral', 'cabeca-inicio', 'cabeca-fim']).optional(),
  x: z.number(),
  y: z.number(),
  widthPx: z.number().positive(),
  heightPx: z.number().positive(),
  components: z.array(layoutComponentSchema),
});

export type LayoutStructure = z.infer<typeof layoutStructureSchema>;

export const layoutStreetSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string(),
  type: streetTypeSchema,
  order: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  structures: z.array(layoutStructureSchema),
});

export type LayoutStreet = z.infer<typeof layoutStreetSchema>;

/** Cabeceira transversal: atravessa uma ou mais ruas de armazém (não pertence a uma rua só). */
export const layoutCabecaSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string(),
  end: cabecaEndSchema,
  order: z.number().int().positive(),
  streetIds: z.array(z.string()).min(1),
  structures: z.array(layoutStructureSchema),
});

export type LayoutCabeca = z.infer<typeof layoutCabecaSchema>;

export const layoutHierarchySchema = z.object({
  streets: z.array(layoutStreetSchema),
  cabecas: z.array(layoutCabecaSchema).default([]),
});

export type LayoutHierarchy = z.infer<typeof layoutHierarchySchema>;

export const layoutSelectionSchema = z.object({
  level: layoutNodeLevelSchema,
  streetId: z.string().optional(),
  cabecaId: z.string().optional(),
  structureId: z.string().optional(),
  componentId: z.string().optional(),
});

export type LayoutSelection = z.infer<typeof layoutSelectionSchema>;

export const streetFormSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: streetTypeSchema,
});

export type StreetForm = z.infer<typeof streetFormSchema>;

export const structureFormSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  kind: structureKindSchema,
  rackType: rackTypeSchema.optional(),
  side: z.union([z.literal(1), z.literal(2)]).optional(),
  anchorStreetId: z.string().optional(),
});

export type StructureForm = z.infer<typeof structureFormSchema>;

export const cabecaFormSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  end: cabecaEndSchema,
  streetIds: z.array(z.string()).min(1),
});

export type CabecaForm = z.infer<typeof cabecaFormSchema>;

export const componentFormSchema = z.object({
  code: z.string().min(1),
  label: z.string(),
  kind: componentKindSchema,
  loadLevels: z.number().int().min(1).max(12),
  capacityTon: z.number().positive(),
  depthMm: z.number().positive(),
});

export type ComponentForm = z.infer<typeof componentFormSchema>;

export const publishedLayoutSchema = z.object({
  hierarchy: layoutHierarchySchema,
  canvasItems: z.array(canvasItemSchema).optional(),
  warehouse: warehouseLayoutSchema,
});

export type PublishedLayout = z.infer<typeof publishedLayoutSchema>;

export const projectTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  areaLabel: z.string(),
});

export type ProjectTemplate = z.infer<typeof projectTemplateSchema>;

export const partsLibraryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string(),
  category: z.enum(['storage', 'traffic', 'barriers']),
  type: rackTypeSchema,
  highlighted: z.boolean().optional(),
});

export type PartsLibraryItem = z.infer<typeof partsLibraryItemSchema>;
