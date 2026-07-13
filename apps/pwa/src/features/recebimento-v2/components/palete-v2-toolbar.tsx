import { cn } from '@lilog/ui';
import { QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { usePaleteSessionV2 } from '../hooks/use-palete-session-v2';
import { PaleteBipSheet } from './palete-bip-sheet';

type PaleteSheetIntent = 'default' | 'conferencia-pendente';

export type { PaleteSheetIntent };

interface PaleteV2ToolbarProps {
  demandId: string;
  controlaPalete: boolean;
  className?: string;
  /** toolbar = lista de itens; header = pill compacto no sticky header */
  variant?: 'toolbar' | 'header';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sheetIntent?: PaleteSheetIntent;
  onConfirmPalete?: (codigo: string) => Promise<void>;
}

function truncatePaleteCodigo(codigo: string, max = 10): string {
  const trimmed = codigo.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function PaleteV2Toolbar({
  demandId,
  controlaPalete,
  className,
  variant = 'toolbar',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  sheetIntent = 'default',
  onConfirmPalete,
}: PaleteV2ToolbarProps) {
  const palete = usePaleteSessionV2(demandId, controlaPalete);
  const [internalOpen, setInternalOpen] = useState(false);

  const sheetOpen = controlledOpen ?? internalOpen;
  const setSheetOpen = controlledOnOpenChange ?? setInternalOpen;

  if (!palete.enabled) {
    return null;
  }

  async function handleSetPalete(codigo: string) {
    if (onConfirmPalete) {
      await onConfirmPalete(codigo);
      return;
    }

    const previous = palete.activePaleteCodigo;
    if (previous === codigo) {
      hapticLight();
      toast.message('Palete mantido');
      return;
    }

    await palete.setPalete(codigo);
    hapticMedium();
    toast.success(previous ? `Palete alterado para ${codigo}` : `Palete ${codigo} definido`);
  }

  const hasPalete = Boolean(palete.activePaleteCodigo);
  const isConferenciaPendente = sheetIntent === 'conferencia-pendente';
  const sheetTitle = isConferenciaPendente
    ? 'Informar palete'
    : hasPalete
      ? 'Trocar palete'
      : 'Informar palete';
  const sheetDescription = isConferenciaPendente
    ? 'Bipe o palete físico para vincular e salvar esta conferência.'
    : hasPalete
      ? `Palete atual: ${palete.activePaleteCodigo}. Informe outro código para trocar ou cancele para manter. Conferências já salvas não são alteradas.`
      : 'Bipe o palete físico antes de conferir itens. As conferências serão vinculadas a este palete.';
  const sheetConfirmLabel = isConferenciaPendente
    ? 'Salvar conferência'
    : hasPalete
      ? 'Usar este palete'
      : 'Confirmar palete';

  const pillBase =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-medium touch-manipulation transition-transform active:scale-95';

  function openSheet() {
    hapticLight();
    setSheetOpen(true);
  }

  const pillButton = (
    <button
      type="button"
      title={palete.activePaleteCodigo ?? 'Informar palete'}
      onClick={openSheet}
      className={cn(
        pillBase,
        variant === 'header' && hasPalete && 'max-w-[7.5rem]',
        hasPalete
          ? 'bg-secondary-container font-mono text-on-secondary-container'
          : 'border border-warning/40 bg-warning-container/30 text-on-warning-container',
      )}
      aria-label={
        hasPalete
          ? `Palete ${palete.activePaleteCodigo}. Toque para trocar.`
          : 'Informar palete (obrigatório)'
      }
    >
      <QrCode className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className={cn(hasPalete && 'truncate')}>
        {hasPalete ? truncatePaleteCodigo(palete.activePaleteCodigo!) : 'Palete'}
      </span>
    </button>
  );

  return (
    <div className={cn(variant === 'toolbar' ? 'inline-flex' : 'flex items-center', className)}>
      {pillButton}

      <PaleteBipSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={sheetTitle}
        description={sheetDescription}
        confirmLabel={sheetConfirmLabel}
        onConfirm={handleSetPalete}
      />
    </div>
  );
}
