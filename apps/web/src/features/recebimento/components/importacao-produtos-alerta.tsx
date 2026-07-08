'use client';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { AlertTriangle, ExternalLink } from 'lucide-react';

type ImportacaoProdutosAlertaProps = {
  produtosSemCadastro: string[];
};

export function ImportacaoProdutosAlerta({
  produtosSemCadastro,
}: ImportacaoProdutosAlertaProps) {
  if (produtosSemCadastro.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5"
      role="alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-destructive">
              {produtosSemCadastro.length} produto(s) sem cadastro
            </p>
            <p className="mt-0.5 text-[11px] text-destructive/90">
              Cadastre os produtos abaixo antes de registrar os recebimentos.
              Itens sem cadastro estão destacados na tabela.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 shrink-0 border-destructive/30 text-[11px] text-destructive hover:bg-destructive/10"
        >
          <Link href="/produtos/novo" target="_blank" rel="noopener noreferrer">
            Cadastrar produto
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </Button>
      </div>

      <ul className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pl-6">
        {produtosSemCadastro.map((codigo) => (
          <li
            key={codigo}
            className="rounded border border-destructive/25 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-destructive"
          >
            {codigo}
          </li>
        ))}
      </ul>
    </div>
  );
}
