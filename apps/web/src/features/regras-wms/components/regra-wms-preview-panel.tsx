'use client';

import { cn } from '@lilog/ui';
import {
  ArrowRight,
  GitBranch,
  Lightbulb,
  ScrollText,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { ArvorePreview } from '@/features/regras-wms/components/arvore-preview';
import {
  premiumCardClassName,
  sectionCardClassName,
} from '@/features/regras-wms/components/regra-wms-form-field-classes';
import {
  listDepositos,
  mapDepositoToListaItem,
} from '@/features/depositos/lib/deposito-api';
import type { DepositoListaItem } from '@/features/depositos/types/depositos-gestao.schema';
import {
  GATILHO_LABELS,
  TIPO_ACAO_LABELS,
} from '@/features/regras-wms/types/regra-wms.schema';
import type {
  RegraWmsV2,
  RegraWmsV2Form,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

type RegraWmsPreviewPanelProps = {
  existingRegra?: RegraWmsV2;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function RegraWmsPreviewPanel({
  existingRegra,
}: RegraWmsPreviewPanelProps) {
  const { watch } = useFormContext<RegraWmsV2Form>();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const nome = watch('nome');
  const ativo = watch('ativo');
  const prioridade = watch('prioridade');
  const gatilho = watch('gatilho');
  const arvoreCondicoes = watch('arvoreCondicoes');
  const acao = watch('acao');

  const [depositos, setDepositos] = useState<DepositoListaItem[]>([]);

  useEffect(() => {
    if (!unidadeId) {
      setDepositos([]);
      return;
    }

    let cancelled = false;

    async function loadDepositos() {
      try {
        const response = await listDepositos(unidadeId!);
        if (!cancelled) {
          setDepositos(response.items.map(mapDepositoToListaItem));
        }
      } catch {
        if (!cancelled) {
          setDepositos([]);
        }
      }
    }

    void loadDepositos();

    return () => {
      cancelled = true;
    };
  }, [unidadeId]);

  const depositoSelecionado = depositos.find(
    (deposito) => deposito.id === acao.parametros.depositoId,
  );

  const acaoDetalhe =
    acao.parametros.depositoId && depositoSelecionado
      ? `${TIPO_ACAO_LABELS[acao.tipo]} → ${depositoSelecionado.codigo} (${depositoSelecionado.nome})`
      : acao.parametros.zonaDestino
        ? `${TIPO_ACAO_LABELS[acao.tipo]} → ${acao.parametros.zonaDestino}`
        : TIPO_ACAO_LABELS[acao.tipo];

  return (
    <aside className="col-span-12 xl:col-span-4">
      <div className="sticky top-16 z-10 flex flex-col gap-3">
      <div className={sectionCardClassName}>
        <div className="mb-3 flex items-center gap-1.5">
          <ScrollText className="size-3.5 text-primary" aria-hidden />
          <h2 className="text-label-sm font-semibold uppercase tracking-wide text-primary">
            Pré-visualização
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Nome</p>
            <p className="text-body-sm font-medium text-foreground">
              {nome || 'Sem nome definido'}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold',
                ativo
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'bg-muted text-muted-foreground ring-1 ring-outline-variant',
              )}
            >
              <span
                className={cn(
                  'size-1 rounded-full',
                  ativo ? 'bg-primary' : 'bg-muted-foreground',
                )}
                aria-hidden
              />
              {ativo ? 'Ativa' : 'Inativa'}
            </span>
            <span className="inline-flex rounded-full bg-surface-highest px-2 py-0.5 text-[9px] font-medium text-foreground">
              Prio. {prioridade}
            </span>
            <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[9px] font-medium text-secondary-foreground">
              {GATILHO_LABELS[gatilho]}
            </span>
          </div>

          <div className="rounded-md border border-outline-variant bg-surface-low/50 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              <GitBranch className="size-3" aria-hidden />
              Condições
            </div>
            <ArvorePreview arvore={arvoreCondicoes} />
          </div>

          <div className="flex items-center gap-1.5 text-caption">
            <ArrowRight
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
              <Zap className="size-3 text-primary" aria-hidden />
              <span className="font-medium text-foreground">{acaoDetalhe}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(sectionCardClassName, 'relative overflow-hidden p-3')}>
        <div
          className="pointer-events-none absolute -right-2 -top-2 text-primary opacity-10"
          aria-hidden
        >
          <Lightbulb className="size-16" />
        </div>
        <h2 className="relative mb-1.5 text-label-sm font-bold text-primary">
          Boas práticas
        </h2>
        <ul className="relative space-y-1 text-[10px] leading-relaxed text-foreground">
          <li className="flex gap-1.5">
            <span aria-hidden className="text-primary">
              ✔
            </span>
            Use subgrupos para combinar E/OU com clareza
          </li>
          <li className="flex gap-1.5">
            <span aria-hidden className="text-primary">
              ✔
            </span>
            NÃO nega um único bloco de condições
          </li>
          <li className="flex gap-1.5">
            <span aria-hidden className="text-primary">
              ✔
            </span>
            Compatível com json-rules-engine via conversor
          </li>
        </ul>
      </div>

      {existingRegra && (
        <div className={cn(premiumCardClassName, 'p-3')}>
          <p className="text-[10px] font-medium text-muted-foreground">
            Metadados
          </p>
          <dl className="mt-2 space-y-1 text-[10px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Criada</dt>
              <dd className="font-medium text-foreground">
                {formatDate(existingRegra.criadoEm)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Atualizada</dt>
              <dd className="font-medium text-foreground">
                {formatDate(existingRegra.atualizadoEm)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-foreground">{existingRegra.id}</dd>
            </div>
          </dl>
        </div>
      )}
      </div>
    </aside>
  );
}
