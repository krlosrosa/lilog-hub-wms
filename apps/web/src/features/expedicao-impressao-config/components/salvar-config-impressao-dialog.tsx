'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import { fieldInputClassName } from '@/features/expedicao-impressao-config/components/panel-styles';

type SalvarConfigImpressaoDialogProps = {
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (nome: string) => void | Promise<void>;
};

export function SalvarConfigImpressaoDialog({
  open,
  isSaving,
  onOpenChange,
  onConfirmar,
}: SalvarConfigImpressaoDialogProps) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNome('');
      setErro(null);
    }
  }, [open]);

  const confirmar = async () => {
    const nomeNormalizado = nome.trim();

    if (!nomeNormalizado) {
      setErro('Informe um nome para a configuração.');
      return;
    }

    if (nomeNormalizado.length < 3) {
      setErro('O nome deve ter ao menos 3 caracteres.');
      return;
    }

    setErro(null);
    await onConfirmar(nomeNormalizado);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Salvar como nova configuração
          </DialogTitle>
          <DialogDescription>
            Crie uma configuração nomeada com os valores atuais para reutilizar
            depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <label
            htmlFor="nome-config-impressao"
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Nome da configuração
          </label>
          <input
            id="nome-config-impressao"
            type="text"
            value={nome}
            onChange={(event) => {
              setNome(event.target.value);
              if (erro) setErro(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void confirmar();
              }
            }}
            placeholder="Ex.: Conferência por SKU"
            className={cn(fieldInputClassName, 'text-sm')}
            autoFocus
            disabled={isSaving}
          />
          {erro ? (
            <p className="text-[11px] text-destructive">{erro}</p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void confirmar()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar configuração'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
