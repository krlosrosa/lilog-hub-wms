'use client';

import { useCallback, useRef, useState } from 'react';

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
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { FUNCIONARIO_CARGO_LABELS } from '@lilog/contracts';
import { useImportPessoas } from '@/features/pessoas/hooks/use-import-pessoas';

const ACCEPTED_EXTENSIONS = '.xlsx,.xls';

type ImportPessoasModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCargoLabel(cargo: string): string {
  if (cargo in FUNCIONARIO_CARGO_LABELS) {
    return FUNCIONARIO_CARGO_LABELS[cargo as keyof typeof FUNCIONARIO_CARGO_LABELS];
  }

  return cargo.replaceAll('_', ' ');
}

function StepIndicator({ step }: { step: 'equipes' | 'preview' | 'resultado' }) {
  const steps = [
    { id: 'equipes', label: '1. Equipes' },
    { id: 'preview', label: '2. Preview' },
    { id: 'resultado', label: '3. Resultado' },
  ] as const;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {steps.map((item) => (
        <span
          key={item.id}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            step === item.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface-high text-muted-foreground',
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

function EquipesStep({
  equipes,
  equipesSelecionadas,
  isLoadingEquipes,
  unidadeId,
  onToggleEquipe,
  onSelecionarTodas,
  onBaixarModelo,
}: {
  equipes: ReturnType<typeof useImportPessoas>['equipes'];
  equipesSelecionadas: string[];
  isLoadingEquipes: boolean;
  unidadeId: string;
  onToggleEquipe: (equipeId: string) => void;
  onSelecionarTodas: () => void;
  onBaixarModelo: () => void;
}) {
  if (!unidadeId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione uma unidade operacional no contexto do sistema para continuar.
      </p>
    );
  }

  if (isLoadingEquipes) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (equipes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma equipe ativa encontrada nesta unidade.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Selecione as equipes que terão abas no modelo Excel.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onSelecionarTodas}>
          Selecionar todas
        </Button>
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-outline-variant p-3">
        {equipes.map((equipe) => (
          <label
            key={equipe.id}
            className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-surface-high"
          >
            <input
              type="checkbox"
              checked={equipesSelecionadas.includes(equipe.id)}
              onChange={() => onToggleEquipe(equipe.id)}
              className="mt-0.5 size-4 rounded border-outline-variant"
            />
            <span className="text-sm text-foreground">
              {equipe.nome}
              {equipe.area ? (
                <span className="text-muted-foreground"> — {equipe.area}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="gap-2"
        disabled={equipesSelecionadas.length === 0}
        onClick={onBaixarModelo}
      >
        <Download className="size-4" aria-hidden />
        Baixar Modelo Excel
      </Button>
    </div>
  );
}

function PreviewStep({
  rowsAgrupadas,
  equipes,
  totalValidos,
  totalInvalidos,
  isParsing,
  onProcessarArquivo,
  onCorrigirEquipeRow,
}: {
  rowsAgrupadas: ReturnType<typeof useImportPessoas>['rowsAgrupadas'];
  equipes: ReturnType<typeof useImportPessoas>['equipes'];
  totalValidos: number;
  totalInvalidos: number;
  isParsing: boolean;
  onProcessarArquivo: (file: File) => Promise<void>;
  onCorrigirEquipeRow: (rowId: string, equipeId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragAtivo, setDragAtivo] = useState(false);

  const selecionarArquivo = useCallback(
    (file: File | null) => {
      if (!file) {
        return;
      }

      const nome = file.name.toLowerCase();
      const valido = nome.endsWith('.xlsx') || nome.endsWith('.xls');

      if (!valido) {
        return;
      }

      setArquivo(file);
      void onProcessarArquivo(file);
    },
    [onProcessarArquivo],
  );

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(event) => selecionarArquivo(event.target.files?.[0] ?? null)}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragAtivo(true);
        }}
        onDragLeave={() => setDragAtivo(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragAtivo(false);
          selecionarArquivo(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragAtivo
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant bg-surface-low hover:border-primary/60',
        )}
      >
        {isParsing ? (
          <Loader2 className="mb-2 size-8 animate-spin text-primary" aria-hidden />
        ) : (
          <Upload className="mb-2 size-8 text-primary" aria-hidden />
        )}
        <p className="text-sm font-medium text-foreground">
          Arraste o Excel preenchido ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Formatos aceitos: .xlsx, .xls
        </p>
        {arquivo ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {arquivo.name} ({formatarTamanhoArquivo(arquivo.size)})
          </p>
        ) : null}
      </div>

      {rowsAgrupadas.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-tertiary-container/20 px-3 py-1 text-tertiary">
              {totalValidos} válidos
            </span>
            {totalInvalidos > 0 ? (
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">
                {totalInvalidos} com pendências
              </span>
            ) : null}
          </div>

          <div className="max-h-[42vh] space-y-4 overflow-y-auto pr-1">
            {rowsAgrupadas.map((grupo) => (
              <div key={grupo.key} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {grupo.equipeNome}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-outline-variant">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className={compactTableHeadRowClassName}>
                        <th className={compactTableHeadCellClassName()}>Matrícula</th>
                        <th className={compactTableHeadCellClassName()}>Nome</th>
                        <th className={compactTableHeadCellClassName()}>Cargo</th>
                        <th className={compactTableHeadCellClassName()}>Usuário</th>
                        <th className={compactTableHeadCellClassName()}>Status</th>
                      </tr>
                    </thead>
                    <tbody className={compactTableBodyClassName}>
                      {grupo.rows.map((row) => {
                        const valido = row.erros.length === 0;

                        return (
                          <tr key={row.id}>
                            <td className="px-3 py-2 font-mono text-xs">{row.matricula}</td>
                            <td className="px-3 py-2 text-xs">{row.nome}</td>
                            <td className="px-3 py-2 text-xs">
                              {formatCargoLabel(row.cargo)}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {row.criarUsuario ? 'Sim' : 'Não'}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {valido ? (
                                <span className="inline-flex items-center gap-1 text-tertiary">
                                  <CheckCircle2 className="size-3.5" aria-hidden />
                                  OK
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 text-destructive">
                                    <AlertCircle className="size-3.5" aria-hidden />
                                    Pendente
                                  </span>
                                  {row.erros.includes('Equipe da aba não reconhecida') ? (
                                    <select
                                      value={row.equipeId}
                                      onChange={(event) =>
                                        onCorrigirEquipeRow(row.id, event.target.value)
                                      }
                                      className="mt-1 h-7 w-full rounded border border-outline-variant bg-surface-low px-2 text-xs"
                                    >
                                      <option value="">Selecionar equipe</option>
                                      {equipes.map((equipe) => (
                                        <option key={equipe.id} value={equipe.id}>
                                          {equipe.nome}
                                        </option>
                                      ))}
                                    </select>
                                  ) : null}
                                  <ul className="list-disc pl-4 text-[11px] text-destructive">
                                    {row.erros.map((erro) => (
                                      <li key={erro}>{erro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ResultadoStep({
  resultado,
}: {
  resultado: NonNullable<ReturnType<typeof useImportPessoas>['resultado']>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-outline-variant bg-surface-low p-3 text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold text-foreground">{resultado.total}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-low p-3 text-center">
          <p className="text-xs text-muted-foreground">Sucesso</p>
          <p className="text-lg font-semibold text-tertiary">{resultado.sucesso}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-low p-3 text-center">
          <p className="text-xs text-muted-foreground">Falhas</p>
          <p className="text-lg font-semibold text-destructive">
            {resultado.falhas.length}
          </p>
        </div>
      </div>

      {resultado.falhas.length > 0 ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant">
          <table className={compactTableClassName}>
            <thead>
              <tr className={compactTableHeadRowClassName}>
                <th className={compactTableHeadCellClassName()}>Matrícula</th>
                <th className={compactTableHeadCellClassName()}>Erro</th>
              </tr>
            </thead>
            <tbody className={compactTableBodyClassName}>
              {resultado.falhas.map((falha) => (
                <tr key={falha.matricula}>
                  <td className="px-3 py-2 font-mono text-xs">{falha.matricula}</td>
                  <td className="px-3 py-2 text-xs text-destructive">{falha.erro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-tertiary">
          Todos os funcionários foram importados com sucesso.
        </p>
      )}
    </div>
  );
}

export function ImportPessoasModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportPessoasModalProps) {
  const {
    step,
    setStep,
    unidadeId,
    equipes,
    equipesSelecionadas,
    isLoadingEquipes,
    isParsing,
    isSubmitting,
    rowsAgrupadas,
    totalValidos,
    totalInvalidos,
    resultado,
    toggleEquipe,
    selecionarTodasEquipes,
    baixarModelo,
    processarArquivo,
    corrigirEquipeRow,
    confirmarImportacao,
  } = useImportPessoas({ open, onSuccess });

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (isSubmitting) {
        return;
      }

      onOpenChange(nextOpen);
    },
    [isSubmitting, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="size-5 text-primary" aria-hidden />
            Importar Funcionários em Massa
          </DialogTitle>
          <DialogDescription>
            Baixe o modelo por equipe, preencha no Excel e importe com preview
            antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={step} />

        {step === 'equipes' ? (
          <EquipesStep
            equipes={equipes}
            equipesSelecionadas={equipesSelecionadas}
            isLoadingEquipes={isLoadingEquipes}
            unidadeId={unidadeId}
            onToggleEquipe={toggleEquipe}
            onSelecionarTodas={selecionarTodasEquipes}
            onBaixarModelo={baixarModelo}
          />
        ) : null}

        {step === 'preview' ? (
          <PreviewStep
            rowsAgrupadas={rowsAgrupadas}
            equipes={equipes}
            totalValidos={totalValidos}
            totalInvalidos={totalInvalidos}
            isParsing={isParsing}
            onProcessarArquivo={processarArquivo}
            onCorrigirEquipeRow={corrigirEquipeRow}
          />
        ) : null}

        {step === 'resultado' && resultado ? (
          <ResultadoStep resultado={resultado} />
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => handleClose(false)}
          >
            Fechar
          </Button>

          {step === 'equipes' ? (
            <Button
              type="button"
              disabled={equipesSelecionadas.length === 0}
              onClick={() => setStep('preview')}
            >
              Continuar
            </Button>
          ) : null}

          {step === 'preview' ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isParsing}
                onClick={() => setStep('equipes')}
              >
                Voltar
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || isParsing || totalValidos === 0}
                onClick={() => void confirmarImportacao()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Importando...
                  </>
                ) : (
                  `Confirmar importação (${totalValidos})`
                )}
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
