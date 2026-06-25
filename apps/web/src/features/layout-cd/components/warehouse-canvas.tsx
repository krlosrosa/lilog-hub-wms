'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/layout-cd/components/layout-cd-panel-classes';
import { isGenericPositionLabel } from '@/features/layout-cd/utils/normalize-component-form';
import type {
  OccupancyStatus,
  WarehouseAisle,
  WarehouseDriveInLane,
  WarehousePosition,
  WarehouseTransversalBand,
} from '@/features/layout-cd/types/layout-cd.schema';

const AISLE_COLUMN_MIN_W = 88;

const STATUS_STYLES: Record<
  OccupancyStatus,
  { bg: string; border: string; text: string }
> = {
  available: {
    bg: 'bg-status-active/15',
    border: 'border-status-active/40',
    text: 'text-status-active',
  },
  partial: {
    bg: 'bg-tertiary/15',
    border: 'border-tertiary/40',
    text: 'text-tertiary',
  },
  occupied: {
    bg: 'bg-destructive/15',
    border: 'border-destructive/40',
    text: 'text-destructive',
  },
};

type WarehouseCanvasProps = {
  aisles: WarehouseAisle[];
  transversalBands?: WarehouseTransversalBand[];
  driveInLanes: WarehouseDriveInLane[];
  selectedPosId: string | null;
  onSelectPosition: (position: WarehousePosition) => void;
  zoomPercent: number;
  className?: string;
};

export function WarehouseCanvas({
  aisles,
  transversalBands = [],
  driveInLanes,
  selectedPosId,
  onSelectPosition,
  zoomPercent,
  className,
}: WarehouseCanvasProps) {
  const inicioBands = transversalBands.filter((b) => b.end === 'inicio');
  const fimBands = transversalBands.filter((b) => b.end === 'fim');
  return (
    <div className={cn('relative flex-1 overflow-hidden blueprint-grid', className)}>
      <div className="absolute inset-0 blueprint-grid-minor opacity-30" />
      <div className="custom-scrollbar absolute inset-0 overflow-auto p-12">
        <div
          className="relative min-w-[1400px] border-2 border-outline-variant bg-surface-lowest p-10 shadow-2xl"
          style={{ width: 'fit-content' }}
        >
          <div className="flex flex-col gap-8">
            {inicioBands.length > 0 ? (
              <div className="flex flex-col gap-3">
                {inicioBands.map((band) => (
                  <TransversalBandRow
                    key={band.bandId}
                    band={band}
                    aisles={aisles}
                    selectedPosId={selectedPosId}
                    onSelect={onSelectPosition}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex items-start gap-12">
              <div className="flex gap-10">
                {aisles.length > 0 ? (
                  aisles.map((aisle) => (
                    <AisleColumn
                      key={aisle.aisleNumber}
                      aisle={aisle}
                      selectedPosId={selectedPosId}
                      onSelect={onSelectPosition}
                    />
                  ))
                ) : (
                  <div className="flex min-h-[400px] min-w-[400px] items-center justify-center rounded-lg border border-dashed border-outline-variant p-8">
                    <p className="max-w-xs text-center text-sm text-muted-foreground">
                      Nenhum rack padrão no layout. Volte ao construtor e adicione
                      Porta-palete ou Flow-rack.
                    </p>
                  </div>
                )}
              </div>

            {driveInLanes.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="rounded border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-secondary">
                  DRIVE-IN ZONE (HIGH DENSITY)
                </div>
                <div className="flex gap-2 rounded border border-outline-variant/20 bg-surface-high/20 p-2">
                  {driveInLanes.map((lane) => (
                    <DriveInLaneColumn
                      key={lane.laneNumber}
                      lane={lane}
                      selectedPosId={selectedPosId}
                      onSelect={onSelectPosition}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            </div>

            {fimBands.length > 0 ? (
              <div className="flex flex-col gap-3">
                {fimBands.map((band) => (
                  <TransversalBandRow
                    key={band.bandId}
                    band={band}
                    aisles={aisles}
                    selectedPosId={selectedPosId}
                    onSelect={onSelectPosition}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          glassPanelClassName,
          'absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-8 px-6 py-3',
        )}
      >
        <div className="flex items-center gap-8">
          <LegendItem icon="inventory" title="Porta-palete" subtitle="Standard Rack" />
          <LegendItem
            icon="forklift"
            title="Drive-in"
            subtitle="High Density (LIFO)"
            variant="secondary"
          />
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <div className="flex gap-3 font-mono text-[10px] text-foreground">
          <span className="rounded border border-outline-variant bg-card px-2 py-1">
            Grid: 4px
          </span>
          <span className="rounded border border-outline-variant bg-card px-2 py-1">
            Zoom: {zoomPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

function AisleColumn({
  aisle,
  selectedPosId,
  onSelect,
}: {
  aisle: WarehouseAisle;
  selectedPosId: string | null;
  onSelect: (p: WarehousePosition) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded border border-outline-variant bg-surface-high px-3 py-1.5 text-center">
        <p className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
          {aisle.aisleCode ?? `AISLE 0${aisle.aisleNumber}`}
        </p>
        {aisle.aisleName ? (
          <p className="truncate font-mono text-[9px] text-primary/80">{aisle.aisleName}</p>
        ) : null}
      </div>
      {aisle.sides.length > 0 ? (
        <div
          className="flex justify-between gap-1 rounded border border-outline-variant/10 bg-surface-low/30 p-0.5"
          style={{ minWidth: AISLE_COLUMN_MIN_W }}
        >
          {aisle.sides.map((side) => (
            <div
              key={side.side}
              className={cn(
                'flex flex-1 flex-col gap-px',
                side.side === 1 ? 'items-start' : 'items-end',
              )}
            >
              {side.positions.map((pos) => (
                <RackPositionCell
                  key={pos.posId}
                  position={pos}
                  selected={selectedPosId === pos.posId}
                  onSelect={onSelect}
                  variant="standard"
                  align={side.side === 1 ? 'left' : 'right'}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Espaço vazio para alinhar a faixa transversal com as colunas dos corredores abaixo. */
function BandAlignSpacer() {
  return (
    <div
      className="shrink-0"
      style={{ minWidth: AISLE_COLUMN_MIN_W, width: AISLE_COLUMN_MIN_W }}
      aria-hidden
    />
  );
}

function TransversalBandRow({
  band,
  aisles,
  selectedPosId,
  onSelect,
}: {
  band: WarehouseTransversalBand;
  aisles: WarehouseAisle[];
  selectedPosId: string | null;
  onSelect: (p: WarehousePosition) => void;
}) {
  const endLabel = band.end === 'inicio' ? 'Início' : 'Fim';

  if (band.aisleNumbers.length === 0) {
    return (
      <div className="w-fit rounded-lg border border-dashed border-primary/25 bg-primary/5 px-4 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
          {band.bandCode} · {endLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vincule corredores em Propriedades para definir a largura da cabeceira.
        </p>
      </div>
    );
  }

  const bandSet = new Set(band.aisleNumbers);
  const bandMin = Math.min(...band.aisleNumbers);
  const bandMax = Math.max(...band.aisleNumbers);

  const columns: ReactNode[] = [];

  for (const aisle of aisles) {
    const n = aisle.aisleNumber;
    if (n < bandMin) {
      columns.push(<BandAlignSpacer key={`lead-${n}`} />);
      continue;
    }
    if (n > bandMax) break;

    const aislePrefix = `A${String(n).padStart(2, '0')}`;
    const columnPositions = band.positions.filter((p) => p.aisleId === aislePrefix);
    const inBand = bandSet.has(n);

    columns.push(
      <div
        key={n}
        className="flex min-w-[88px] flex-wrap justify-center gap-px"
        style={{ minWidth: AISLE_COLUMN_MIN_W }}
      >
        {inBand ? (
          columnPositions.length > 0 ? (
            columnPositions.map((pos) => (
              <RackPositionCell
                key={pos.posId}
                position={pos}
                selected={selectedPosId === pos.posId}
                onSelect={onSelect}
                variant="standard"
                align="left"
              />
            ))
          ) : (
            <span className="px-1 font-mono text-[8px] text-muted-foreground">—</span>
          )
        ) : (
          <span className="px-1 font-mono text-[8px] text-muted-foreground/40">·</span>
        )}
      </div>,
    );
  }

  return (
    <div className="w-fit max-w-full rounded-lg border border-primary/25 bg-primary/5 px-2 py-2">
      <p className="mb-2 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
        {band.bandCode} · {endLabel}
        <span className="ml-2 font-normal text-muted-foreground">
          {band.streetCodes.join(' · ')}
        </span>
      </p>
      <div className="flex gap-10">{columns}</div>
    </div>
  );
}

function DriveInLaneColumn({
  lane,
  selectedPosId,
  onSelect,
}: {
  lane: WarehouseDriveInLane;
  selectedPosId: string | null;
  onSelect: (p: WarehousePosition) => void;
}) {
  return (
    <div className="flex flex-col items-end gap-px">
      <div className="mb-1 w-10 text-right">
        <p className="font-mono text-[9px] font-bold text-secondary">
          {lane.laneCode ?? `L${lane.laneNumber}`}
        </p>
        {lane.laneName ? (
          <p className="truncate font-mono text-[8px] text-muted-foreground">{lane.laneName}</p>
        ) : null}
      </div>
      {lane.positions.map((pos) => (
        <RackPositionCell
          key={pos.posId}
          position={pos}
          selected={selectedPosId === pos.posId}
          onSelect={onSelect}
          variant="drive-in"
          align="right"
        />
      ))}
    </div>
  );
}

function aggregateLevelStatus(
  levels: WarehousePosition['levels'],
): OccupancyStatus {
  if (levels.some((l) => l.status === 'occupied')) return 'occupied';
  if (levels.some((l) => l.status === 'partial')) return 'partial';
  return 'available';
}

function positionCellName(position: WarehousePosition): string {
  const code = position.displayCode ?? position.posId;
  const label = position.label?.trim() ?? '';
  if (
    label &&
    !isGenericPositionLabel(label) &&
    label !== code
  ) {
    return label;
  }
  return code;
}

function RackPositionCell({
  position,
  selected,
  onSelect,
  variant,
  align = 'left',
}: {
  position: WarehousePosition;
  selected: boolean;
  onSelect: (p: WarehousePosition) => void;
  variant: 'standard' | 'drive-in';
  align?: 'left' | 'right';
}) {
  const levelCount = position.levels.length;
  const levelStyle = STATUS_STYLES[aggregateLevelStatus(position.levels)];
  const cellLabel = `${positionCellName(position)} | ${levelCount}`;
  const isRight = align === 'right';

  return (
    <button
      type="button"
      onClick={() => onSelect(position)}
      className={cn(
        'rack-position flex w-10 shrink-0 border px-px py-0 transition-all',
        isRight ? 'self-end' : 'self-start',
        variant === 'drive-in'
          ? 'border-secondary/10 bg-surface-low hover:bg-secondary/5'
          : 'border-outline-variant/30 bg-card hover:bg-surface-high',
        selected && 'ring-2 ring-primary',
      )}
    >
      <div
        className={cn(
          'level-indicator flex min-h-[22px] w-full items-center rounded-[2px] border py-0.5',
          isRight ? 'justify-end pr-1 pl-0.5' : 'justify-start pl-1 pr-0.5',
          levelStyle.bg,
          levelStyle.border,
          variant === 'drive-in' && 'border-l-2 border-l-secondary/50',
        )}
      >
        <span
          className={cn(
            'whitespace-nowrap font-mono text-[7px] font-bold leading-tight',
            levelStyle.text,
          )}
        >
          {cellLabel}
        </span>
      </div>
    </button>
  );
}

function LegendItem({
  title,
  subtitle,
  variant = 'primary',
}: {
  icon: string;
  title: string;
  subtitle: string;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded border',
          variant === 'secondary'
            ? 'border-secondary bg-secondary/10'
            : 'border-primary bg-primary/10',
        )}
      >
        <span
          className={cn(
            'text-[10px] font-bold',
            variant === 'secondary' ? 'text-secondary' : 'text-primary',
          )}
        >
          •
        </span>
      </div>
      <div>
        <p className="font-mono text-[11px] leading-none text-foreground">{title}</p>
        <p className="font-mono text-[9px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
