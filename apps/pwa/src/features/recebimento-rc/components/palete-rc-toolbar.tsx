import { cn } from '@lilog/ui';
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { PaleteBipSheet } from '@/features/recebimento-v2/components/palete-bip-sheet';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  generateUnitizadorCodigoRc,
  getActivePaleteCodigoRc,
  setActivePaleteCodigoRc,
} from '../services/palete-session-rc.service';

export type PaleteSheetIntent = 'default' | 'conferencia-pendente';

interface PaleteRcToolbarProps {
  demandId: string;
  controlaPalete: boolean;
  className?: string;
  variant?: 'toolbar' | 'header';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sheetIntent?: PaleteSheetIntent;
  onConfirmPalete?: (codigo: string) => Promise<void>;
  allowAutoGenerate?: boolean;
}

function truncatePaleteCodigo(codigo: string, max = 10): string {
  const trimmed = codigo.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function PaleteRcToolbar({
  demandId,
  controlaPalete,
  className,
  variant = 'toolbar',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  sheetIntent = 'default',
  onConfirmPalete,
  allowAutoGenerate = false,
}: PaleteRcToolbarProps) {
  const [activePaleteCodigo, setActivePaleteCodigo] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);

  const sheetOpen = controlledOpen ?? internalOpen;
  const setSheetOpen = controlledOnOpenChange ?? setInternalOpen;

  useEffect(() => {
    setActivePaleteCodigo(getActivePaleteCodigoRc(demandId));
  }, [demandId]);

  if (!controlaPalete) {
    return null;
  }

  async function handleSetPalete(codigo: string) {
    if (onConfirmPalete) {
      await onConfirmPalete(codigo);
      return;
    }

    const previous = activePaleteCodigo;
    if (previous === codigo) {
      hapticLight();
      toast.message('Palete mantido');
      return;
    }

    setActivePaleteCodigoRc(demandId, codigo);
    setActivePaleteCodigo(codigo);
    hapticMedium();
    toast.success(previous ? `Palete alterado para ${codigo}` : `Palete ${codigo} definido`);
  }

  async function handleAutoGenerate() {
    await handleSetPalete(generateUnitizadorCodigoRc());
  }

  const hasPalete = Boolean(activePaleteCodigo);
  const isConferenciaPendente = sheetIntent === 'conferencia-pendente';
  const sheetTitle = isConferenciaPendente
    ? 'Informar palete'
    : hasPalete
      ? 'Trocar palete'
      : 'Informar palete';
  const sheetDescription = isConferenciaPendente
    ? 'Bipe o palete físico para vincular e salvar esta conferência.'
    : hasPalete
      ? `Palete atual: ${activePaleteCodigo}. Informe outro código para trocar ou cancele para manter.`
      : 'Bipe o palete físico antes de conferir itens.';
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
      title={activePaleteCodigo ?? 'Informar palete'}
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
          ? `Palete ${activePaleteCodigo}. Toque para trocar.`
          : 'Informar palete (obrigatório)'
      }
    >
      <QrCode className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className={cn(hasPalete && 'truncate')}>
        {hasPalete ? truncatePaleteCodigo(activePaleteCodigo!) : 'Palete'}
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
        onAutoGenerate={allowAutoGenerate ? handleAutoGenerate : undefined}
      />
    </div>
  );
}

export function getActivePaleteForDemand(demandId: string): string | null {
  return getActivePaleteCodigoRc(demandId);
}
