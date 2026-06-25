'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  PackageSearch,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import type {
  RelatorioDownloadStatus,
  RelatorioItem,
} from '@/features/devolucao/types/devolucao-relatorios.schema';

const ICON_BY_ID: Record<string, LucideIcon> = {
  'contagem-fisica': PackageSearch,
  'notas-fiscais': FileText,
  anomalias: AlertTriangle,
};

const VARIANT_STYLES = {
  primary: {
    iconContainer: 'bg-primary-container text-primary-on-container',
    hoverBorder: 'hover:border-primary/20',
    downloadButton: 'bg-primary text-primary-foreground hover:opacity-90',
    downloadHover: '',
  },
  secondary: {
    iconContainer: 'bg-secondary-container text-secondary-on-container',
    hoverBorder: 'hover:border-secondary/20',
    downloadButton: 'bg-surface-highest text-foreground',
    downloadHover: 'hover:bg-secondary hover:text-secondary-foreground',
  },
  destructive: {
    iconContainer:
      'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20',
    hoverBorder: 'hover:border-destructive/40',
    downloadButton: 'bg-surface-highest text-foreground',
    downloadHover:
      'hover:bg-destructive hover:text-destructive-foreground',
  },
} as const;

export type DevolucaoReportCardProps = {
  report: RelatorioItem;
  downloadStatus: RelatorioDownloadStatus;
  onDownload: (reportId: string) => void;
};

export function DevolucaoReportCard({
  report,
  downloadStatus,
  onDownload,
}: DevolucaoReportCardProps) {
  const Icon = ICON_BY_ID[report.id] ?? FileText;
  const styles = VARIANT_STYLES[report.variant];
  const isFull = report.layout === 'full';

  const downloadLabel =
    downloadStatus === 'loading'
      ? 'Processando...'
      : downloadStatus === 'success'
        ? 'Concluído'
        : 'Baixar Excel';

  const DownloadIcon =
    downloadStatus === 'loading'
      ? Loader2
      : downloadStatus === 'success'
        ? CheckCircle2
        : Download;

  return (
    <article
      className={cn(
        'group',
        isFull ? 'md:col-span-12' : 'md:col-span-6',
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col rounded-2xl border border-transparent bg-glass-bg p-8 shadow-inner-glow backdrop-blur-glass transition-all duration-300 hover:bg-surface-high',
          styles.hoverBorder,
        )}
      >
        <div
          className={cn(
            'mb-6',
            isFull
              ? 'flex items-start justify-between gap-4'
              : 'flex flex-col',
          )}
        >
          {isFull ? (
            <>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex size-14 items-center justify-center rounded-2xl',
                    styles.iconContainer,
                  )}
                >
                  <Icon className="size-8" aria-hidden />
                </div>
                <div>
                  <h3 className="text-headline-md font-medium text-foreground">
                    {report.title}
                  </h3>
                  {report.badge && (
                    <span className="mt-1 inline-block rounded bg-tertiary-container px-2 py-0.5 text-[10px] font-bold uppercase text-tertiary-on-container">
                      {report.badge}
                    </span>
                  )}
                </div>
              </div>
              {report.lastUpdated && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-caption">{report.lastUpdated}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className={cn(
                  'mb-6 flex size-12 items-center justify-center rounded-xl',
                  styles.iconContainer,
                )}
              >
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="mb-2 text-headline-md font-medium text-foreground">
                {report.title}
              </h3>
            </>
          )}
        </div>

        <p className="mb-8 flex-1 text-body-md text-muted-foreground">
          {report.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {report.recordCount && (
              <span className="text-caption text-muted-foreground">
                {report.recordCount}
              </span>
            )}
            {report.alertText && (
              <>
                <span
                  className="size-2 animate-pulse rounded-full bg-destructive"
                  aria-hidden
                />
                <span className="text-caption text-destructive">
                  {report.alertText}
                </span>
              </>
            )}
          </div>

          <Button
            type="button"
            disabled={downloadStatus === 'loading'}
            onClick={() => onDownload(report.id)}
            className={cn(
              'gap-2 font-semibold transition-all',
              isFull ? 'rounded-xl px-6 py-3' : 'rounded-lg px-5 py-2.5',
              downloadStatus === 'success'
                ? 'bg-tertiary text-tertiary-foreground'
                : cn(styles.downloadButton, styles.downloadHover),
            )}
          >
            <DownloadIcon
              className={cn(
                'size-4',
                downloadStatus === 'loading' && 'animate-spin',
              )}
              aria-hidden
            />
            {downloadLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
