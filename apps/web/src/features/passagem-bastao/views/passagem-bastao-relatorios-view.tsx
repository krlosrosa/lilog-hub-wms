'use client';

import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  ImageIcon,
  Loader2,
  Sparkles,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { AreaStatusBadge } from '@/features/passagem-bastao/components/area-status-badge';
import { KpiCard } from '@/features/passagem-bastao/components/kpi-card';
import { glassPanelClassName } from '@/features/passagem-bastao/components/passagem-bastao-panel-classes';
import { RackItemRow } from '@/features/passagem-bastao/components/rack-item';
import { usePassagemBastaoRelatorios } from '@/features/passagem-bastao/hooks/use-passagem-bastao-relatorios';

const CHECKLIST_HEADERS = [
  { label: 'Área', className: 'min-w-[100px]' },
  { label: 'Limpeza', className: 'w-20' },
  { label: 'Responsável', className: 'hidden sm:table-cell min-w-[120px]' },
  { label: 'Auditoria', className: 'w-24 text-right' },
] as const;

export function PassagemBastaoRelatoriosView() {
  const {
    isLoading,
    auditoria,
    kpis,
    checklistAreas,
    racks,
    evidencias,
    handoverNota,
    anexarEvidencias,
    gerarPdf,
    confirmarCondicoes,
    responderNota,
    arquivarNota,
    chamarManutencao,
  } = usePassagemBastaoRelatorios();

  const handleAnexar = async () => {
    const result = await anexarEvidencias();
    if (result.success) toast.success('Anexo de evidências iniciado.');
  };

  const handlePdf = async () => {
    const result = await gerarPdf();
    if (result.success) toast.success('Geração de PDF iniciada.');
  };

  const handleConfirmar = async () => {
    const result = await confirmarCondicoes();
    if (result.success) toast.success('Condições confirmadas com sucesso.');
  };

  const handleResponder = async () => {
    const result = await responderNota();
    if (result.success) toast.success('Resposta registrada.');
  };

  const handleArquivar = async () => {
    const result = await arquivarNota();
    if (result.success) toast.success('Observação arquivada.');
  };

  const handleManutencao = async () => {
    const result = await chamarManutencao();
    if (result.success) toast.success('Manutenção acionada via rádio canal 09.');
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          {/* Header */}
          <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-tertiary/30 bg-tertiary/15 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-tertiary">
                  Facility Status
                </span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {auditoria.auditId}
                </span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                {auditoria.titulo}
                <span className="ml-1.5 text-primary">
                  {auditoria.turnoOrigem} → {auditoria.turnoDestino}
                </span>
              </h1>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span>{auditoria.data}</span>
                <span aria-hidden>·</span>
                <span>Início {auditoria.horarioInicio}</span>
                <span aria-hidden>·</span>
                <span>Término prev. {auditoria.horarioPrevisto}</span>
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={isLoading}
                onClick={handleAnexar}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
                Evidências
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={isLoading}
                onClick={handlePdf}
              >
                <FileText className="size-3.5" />
                PDF
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={isLoading}
                onClick={handleConfirmar}
              >
                <CheckCircle2 className="size-3.5" />
                Confirmar
              </Button>
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Índice de Limpeza Geral"
              value={`${kpis.indiceLimpezaPercent}%`}
              progressPercent={kpis.indiceLimpezaPercent}
              caption={kpis.indiceLimpezaDelta}
              variant="tertiary"
              icon={Sparkles}
            />
            <KpiCard
              label="Zonas Críticas de Limpeza"
              value={String(kpis.zonasCriticas).padStart(2, '0')}
              progressPercent={100}
              caption="Ação imediata necessária"
              variant="destructive"
              icon={TriangleAlert}
              pulse
              criticalBorder
            />
            <KpiCard
              label="Integridade de Estruturas"
              value={kpis.integridadeLabel}
              progressPercent={kpis.integridadePercent}
              caption={`${kpis.integridadePercent}% conformidade de racks`}
              variant="secondary"
              icon={ClipboardCheck}
            />
          </section>

          {/* Main grid */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {/* Checklist table */}
              <div className={`${glassPanelClassName} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-outline-variant/30 px-3 py-2">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ClipboardCheck
                      className="size-3.5 text-tertiary"
                      aria-hidden
                    />
                    Checklist de Conservação por Área
                  </h2>
                  <button
                    type="button"
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    Ver detalhes
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
                        {CHECKLIST_HEADERS.map((header) => (
                          <th
                            key={header.label}
                            className={cn(
                              'border-b border-outline-variant/30 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                              header.className,
                            )}
                          >
                            {header.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {checklistAreas.map((area) => (
                        <tr
                          key={area.id}
                          className="transition-colors hover:bg-surface-highest/50"
                        >
                          <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-primary">
                            {area.area}
                          </td>
                          <td className="px-2 py-1.5">
                            <AreaStatusBadge status={area.status} compact />
                          </td>
                          <td className="hidden max-w-[140px] truncate px-2 py-1.5 text-[11px] text-foreground sm:table-cell">
                            {area.responsavel}
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                            {area.ultimaAuditoria}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Evidences + Racks */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={`${glassPanelClassName} p-3`}>
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ImageIcon className="size-3.5 text-primary" aria-hidden />
                    Evidências (Antes/Depois)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {evidencias.map((ev) => (
                      <div key={ev.id} className="space-y-0.5">
                        <div
                          className={cn(
                            'relative aspect-[4/3] overflow-hidden rounded-md bg-surface-high',
                            ev.tipo === 'depois' && 'ring-1 ring-tertiary/40',
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ev.imageUrl}
                            alt={ev.label}
                            className={cn(
                              'size-full object-cover',
                              ev.tipo === 'antes' && 'opacity-60',
                            )}
                          />
                          <span
                            className={cn(
                              'absolute bottom-0.5 left-0.5 rounded px-1 text-[7px] font-bold uppercase',
                              ev.tipo === 'antes'
                                ? 'bg-foreground/70 text-background'
                                : 'bg-tertiary/90 text-on-tertiary',
                            )}
                          >
                            {ev.tipo === 'antes' ? 'Antes' : 'Depois'}
                          </span>
                        </div>
                        <p className="truncate text-center font-mono text-[9px] text-muted-foreground">
                          {ev.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${glassPanelClassName} p-3`}>
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ClipboardCheck
                      className="size-3.5 text-secondary"
                      aria-hidden
                    />
                    Inspeção de Racks
                  </h3>
                  <div className="space-y-1.5">
                    {racks.map((rack) => (
                      <RackItemRow key={rack.id} item={rack} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3 lg:col-span-4">
              <section className={`${glassPanelClassName} p-3`}>
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <History className="size-3.5 text-secondary" aria-hidden />
                    Observações do Ambiente
                  </h3>
                  {handoverNota && (
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {handoverNota.turno}
                    </span>
                  )}
                </div>
                {handoverNota ? (
                  <div className="rounded-lg border border-outline-variant/30 bg-surface-low p-2.5">
                    <div className="mb-2 flex items-center gap-2">
                      {handoverNota.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={handoverNota.avatarUrl}
                          alt={handoverNota.supervisor}
                          width={32}
                          height={32}
                          className="size-8 rounded-full border border-outline object-cover"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                          <span className="text-xs font-bold text-muted-foreground">
                            {handoverNota.supervisor.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-foreground">
                          {handoverNota.supervisor}
                        </p>
                        <p className="text-[9px] uppercase text-muted-foreground">
                          {handoverNota.cargo}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] italic leading-relaxed text-foreground">
                      &ldquo;{handoverNota.mensagem}&rdquo;
                    </p>
                    <div className="mt-2.5 flex gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 flex-1 text-[10px] font-semibold"
                        disabled={isLoading}
                        onClick={handleResponder}
                      >
                        Responder
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 flex-1 text-[10px] font-semibold"
                        disabled={isLoading}
                        onClick={handleArquivar}
                      >
                        Arquivar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Nenhuma observação pendente para este turno.
                  </p>
                )}
              </section>

              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                  Suporte Predial
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Para vazamentos ou incidentes estruturais graves, acione a
                  manutenção via rádio canal 09.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2.5 h-8 w-full gap-1.5 text-[10px] font-bold"
                  disabled={isLoading}
                  onClick={handleManutencao}
                >
                  <Wrench className="size-3.5" />
                  Chamar Manutenção
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </SidebarMain>
  );
}
