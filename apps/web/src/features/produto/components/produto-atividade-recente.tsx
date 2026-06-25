'use client';

import {
  ArrowRight,
  CirclePlus,
  History,
  RotateCw,
} from 'lucide-react';

export function ProdutoAtividadeRecente() {
  return (
    <section className="mt-8 border-t border-outline-variant/60 pt-6">
      <h3 className="mb-4 flex items-center gap-2 text-label-md font-bold text-muted-foreground">
        <History className="size-4 shrink-0" aria-hidden />
        Atividades recentes de dados mestres
      </h3>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-glass-bg p-4 backdrop-blur-glass sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-status-active/10 text-status-active">
              <RotateCw className="size-4 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-label-md text-foreground">
                SKU <span className="font-semibold font-mono">FR-7829-X</span>{' '}
                atualizado por{' '}
                <span className="font-bold">Admin Master</span>
              </p>
              <p className="text-caption text-muted-foreground">
                Há 15 minutos — alteração de EAN
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 self-start text-caption font-bold text-primary transition-colors hover:underline sm:self-center"
          >
            Ver detalhes <ArrowRight className="inline size-3 align-text-bottom" />
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-glass-bg p-4 backdrop-blur-glass sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container/20 text-secondary-foreground">
              <CirclePlus className="size-4 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-label-md text-foreground">
                Novo produto catalogado:{' '}
                <span className="font-bold">Kit Manutenção Platinum</span>
              </p>
              <p className="text-caption text-muted-foreground">
                Há 2 horas — categoria Logística
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 self-start text-caption font-bold text-primary transition-colors hover:underline sm:self-center"
          >
            Ver detalhes <ArrowRight className="inline size-3 align-text-bottom" />
          </button>
        </div>
      </div>
    </section>
  );
}
