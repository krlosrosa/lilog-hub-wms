'use client';

import { Button } from '@lilog/ui';
import { CirclePlus, LayoutGrid, Pencil, Trash2 } from 'lucide-react';

import { labelEmpresa } from '@/features/filiais/types/centro-cadastro.schema';
import type { CentroAtrelado } from '@/features/filiais/types/filial.schema';

import { sectionCardClassName } from './form-field-classes';

export type CentrosCardProps = {
  centros: CentroAtrelado[];
  onAdicionarCentro: () => void;
  onEditarCentro: (centro: CentroAtrelado) => void;
  onExcluirCentro: (centro: CentroAtrelado) => void;
};

export function CentrosCard({
  centros,
  onAdicionarCentro,
  onEditarCentro,
  onExcluirCentro,
}: CentrosCardProps) {
  return (
    <section className={sectionCardClassName}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid className="size-6 shrink-0 text-primary" aria-hidden />
          </span>
          <h3 className="text-headline-md font-semibold text-foreground">
            Centros atrelados <span className="text-destructive">*</span>
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-auto px-2 py-1 text-primary hover:bg-muted hover:text-primary"
          onClick={onAdicionarCentro}
        >
          <CirclePlus className="size-[18px]" aria-hidden />
          Adicionar centro
        </Button>
      </div>

      {centros.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center text-body-md text-muted-foreground">
          Nenhum centro vinculado. Informe o código de 4 dígitos, nome e empresa
          de cada centro operacional.
        </p>
      ) : (
        <ul className="space-y-4">
          {centros.map((centro) => (
            <li
              key={centro.id}
              className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-low p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-caption text-muted-foreground">
                  {centro.centro}
                </p>
                <p className="text-label-md text-foreground">{centro.nome}</p>
                <p className="text-caption text-muted-foreground">
                  {labelEmpresa(centro.empresa)}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:bg-surface-high hover:text-foreground"
                  onClick={() => onEditarCentro(centro)}
                >
                  <Pencil className="size-4 shrink-0" aria-hidden />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onExcluirCentro(centro)}
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
