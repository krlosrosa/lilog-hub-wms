import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileJson,
  ImageIcon,
  Loader2,
  Monitor,
  QrCode,
  Smartphone,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUnidade } from '@/features/unidade';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import type { OutboxEntry } from '@/lib/offline/db';
import {
  buildSyncExportPackage,
  chunkExportForQr,
  copyJsonToClipboard,
  downloadAllExportPhotos,
  downloadExportPhoto,
  downloadJsonFile,
  type SyncExportPackage,
} from '@/lib/offline/sync-export';

import { SheetHeaderClose } from './sheet-header-close';

interface SyncExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: OutboxEntry[];
}

function InstructionStep({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: typeof Monitor;
}) {
  return (
    <li className="flex gap-3 rounded-lg border border-outline-variant/80 bg-surface-container-low px-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-container font-mono text-label-sm font-bold text-on-secondary-container">
        {step}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-body-sm font-semibold text-on-surface">
          <Icon className="h-4 w-4 text-secondary" aria-hidden />
          {title}
        </p>
        <p className="mt-0.5 text-label-sm text-on-surface-variant">{description}</p>
      </div>
    </li>
  );
}

export function SyncExportModal({
  open,
  onOpenChange,
  entries,
}: SyncExportModalProps) {
  const { unidadeSelecionada } = useUnidade();
  const [pkg, setPkg] = useState<SyncExportPackage | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isCopying, setIsCopying] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);

  const qrChunks = useMemo(() => (pkg ? chunkExportForQr(pkg) : []), [pkg]);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const totalPhotos = pkg?.entries.reduce((sum, entry) => sum + entry.photoRefs.length, 0) ?? 0;

  const scrollToChunk = useCallback((index: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const slide = container.children.item(index) as HTMLElement | null;
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  useEffect(() => {
    if (!open) {
      setPkg(null);
      setBuildError(null);
      setChunkIndex(0);
      setCopyFeedback(null);
      setPhotoFeedback(null);
      setPhotoProgress(null);
      return;
    }

    if (entries.length === 0) return;

    let cancelled = false;
    setIsBuilding(true);
    setBuildError(null);

    void buildSyncExportPackage(entries, 'errors', unidadeSelecionada?.id)
      .then((built) => {
        if (!cancelled) {
          setPkg(built);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setBuildError(
            error instanceof Error ? error.message : 'Falha ao preparar exportação',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBuilding(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entries, open, unidadeSelecionada?.id]);

  const handlePrevChunk = useCallback(() => {
    hapticLight();
    setChunkIndex((index) => {
      const next = Math.max(0, index - 1);
      requestAnimationFrame(() => scrollToChunk(next));
      return next;
    });
  }, [scrollToChunk]);

  const handleNextChunk = useCallback(() => {
    hapticLight();
    setChunkIndex((index) => {
      const next = Math.min(qrChunks.length - 1, index + 1);
      requestAnimationFrame(() => scrollToChunk(next));
      return next;
    });
  }, [qrChunks.length, scrollToChunk]);

  const handleCarouselScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container || qrChunks.length <= 1) return;

    const slides = Array.from(container.children) as HTMLElement[];
    if (slides.length === 0) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setChunkIndex((current) => (current === closestIndex ? current : closestIndex));
  }, [qrChunks.length]);

  const handleCopyJson = useCallback(async () => {
    if (!pkg) return;
    hapticMedium();
    setIsCopying(true);
    setCopyFeedback(null);
    try {
      await copyJsonToClipboard(pkg);
      setCopyFeedback('JSON copiado para a área de transferência.');
    } catch {
      setCopyFeedback('Não foi possível copiar. Use o download do JSON.');
    } finally {
      setIsCopying(false);
    }
  }, [pkg]);

  const handleDownloadJson = useCallback(() => {
    if (!pkg) return;
    hapticMedium();
    downloadJsonFile(pkg);
  }, [pkg]);

  const handleDownloadAllPhotos = useCallback(async () => {
    if (!pkg || totalPhotos === 0) return;
    hapticMedium();
    setIsDownloadingPhotos(true);
    setPhotoFeedback(null);
    setPhotoProgress({ current: 0, total: totalPhotos });

    try {
      const result = await downloadAllExportPhotos(pkg, (current, total) => {
        setPhotoProgress({ current, total });
      });

      if (result.failed === 0) {
        setPhotoFeedback(`${result.downloaded} foto(s) salva(s) no aparelho.`);
      } else {
        setPhotoFeedback(
          `${result.downloaded} salva(s), ${result.failed} não encontrada(s).`,
        );
      }
    } catch {
      setPhotoFeedback('Falha ao baixar fotos. Tente item por item.');
    } finally {
      setIsDownloadingPhotos(false);
    }
  }, [pkg, totalPhotos]);

  const handleDownloadPhoto = useCallback(
    async (photoId: number, filename: string) => {
      hapticLight();
      const success = await downloadExportPhoto(photoId, filename);
      setPhotoFeedback(
        success ? `Foto ${filename} salva no aparelho.` : 'Foto não encontrada no cache.',
      );
    },
    [],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="z-[60] flex max-h-[92vh] flex-col gap-0 rounded-t-2xl border-outline-variant bg-surface p-0"
      >
        <div className="shrink-0 border-b border-outline-variant/60 px-margin-mobile pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />
          <div className="flex items-start gap-3">
            <SheetHeader className="min-w-0 flex-1 text-left">
            <SheetTitle className="flex items-center gap-2 text-headline-md text-on-surface">
              <QrCode className="h-5 w-5 text-secondary" aria-hidden />
              Exportar para computador
            </SheetTitle>
            <SheetDescription className="text-body-sm text-on-surface-variant">
              Transfira os dados com falha via QR code e salve as fotos no celular para enviar ao
              computador.
            </SheetDescription>
          </SheetHeader>
            <SheetHeaderClose />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-margin-mobile pb-[calc(20px+env(safe-area-inset-bottom,0px))] hide-scrollbar">

          <section className="mt-4" aria-labelledby="sync-export-instructions">
            <h3
              id="sync-export-instructions"
              className="mb-2 text-label-md font-semibold text-on-surface"
            >
              Como funciona
            </h3>
            <ol className="space-y-2">
              <InstructionStep
                step={1}
                icon={Monitor}
                title="Escaneie o QR no computador"
                description="Use a câmera ou leitor 2D no portal. Se houver vários QRs, deslize para o lado e escaneie na ordem."
              />
              <InstructionStep
                step={2}
                icon={Smartphone}
                title="Baixe as fotos no celular"
                description="Salve as imagens no aparelho e transfira por cabo, e-mail ou nuvem."
              />
              <InstructionStep
                step={3}
                icon={FileJson}
                title="Associe pelo nome do arquivo"
                description="Cada foto segue o padrão kls-{id}-item{n}-foto{n}.ext para casar com o JSON."
              />
            </ol>
          </section>

          {isBuilding && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low py-10">
              <Loader2 className="h-5 w-5 animate-spin text-secondary" aria-hidden />
              <span className="text-body-sm text-on-surface-variant">Preparando exportação…</span>
            </div>
          )}

          {buildError && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-error-container/10 px-3 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <p className="text-label-sm text-destructive">{buildError}</p>
            </div>
          )}

          {pkg && !isBuilding && (
            <>
              <section className="mt-6" aria-labelledby="sync-export-summary">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-2.5 py-2.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
                      Itens
                    </p>
                    <p className="mt-0.5 font-mono text-headline-md font-bold text-on-surface">
                      {pkg.entries.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-2.5 py-2.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
                      Fotos
                    </p>
                    <p className="mt-0.5 font-mono text-headline-md font-bold text-on-surface">
                      {totalPhotos}
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-2.5 py-2.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
                      QR codes
                    </p>
                    <p className="mt-0.5 font-mono text-headline-md font-bold text-on-surface">
                      {qrChunks.length}
                    </p>
                  </div>
                </div>
                <p className="mt-2 font-mono text-label-sm text-on-surface-variant">
                  Pacote {pkg.exportId} · {new Date(pkg.exportedAt).toLocaleString('pt-BR')}
                </p>
              </section>

              <section className="mt-6" aria-labelledby="sync-export-qr">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 id="sync-export-qr" className="text-label-md font-semibold text-on-surface">
                    QR code
                  </h3>
                  {qrChunks.length > 1 && (
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-mono text-label-sm font-bold text-secondary">
                      {chunkIndex + 1} / {qrChunks.length}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-white p-3">
                  <div
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    className={cn(
                      'flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1',
                      '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    )}
                    aria-label="Carrossel de QR codes"
                  >
                    {qrChunks.map((value, index) => (
                      <div
                        key={`${pkg.exportId}-qr-${index}`}
                        className="flex w-full shrink-0 snap-center flex-col items-center gap-2 px-1"
                      >
                        <div
                          className="flex items-center justify-center rounded-lg bg-white p-2"
                          role="img"
                          aria-label={`QR code ${index + 1} de ${qrChunks.length}`}
                        >
                          <QRCode
                            value={value}
                            size={220}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="M"
                          />
                        </div>
                        {qrChunks.length > 1 && (
                          <p className="font-mono text-label-sm font-semibold text-on-surface">
                            Parte {index + 1} de {qrChunks.length}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {qrChunks.length > 1 && (
                    <>
                      <div className="flex items-center justify-center gap-1.5">
                        {qrChunks.map((_, index) => (
                          <button
                            key={`dot-${index}`}
                            type="button"
                            aria-label={`Ir para QR ${index + 1}`}
                            onClick={() => {
                              hapticLight();
                              setChunkIndex(index);
                              scrollToChunk(index);
                            }}
                            className={cn(
                              'h-2 w-2 rounded-full transition-colors',
                              index === chunkIndex
                                ? 'bg-secondary'
                                : 'bg-outline-variant',
                            )}
                          />
                        ))}
                      </div>

                      <div className="flex w-full gap-2">
                        <button
                          type="button"
                          disabled={chunkIndex === 0}
                          onClick={handlePrevChunk}
                          className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-surface text-label-sm font-semibold text-on-surface disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden />
                          Anterior
                        </button>
                        <button
                          type="button"
                          disabled={chunkIndex >= qrChunks.length - 1}
                          onClick={handleNextChunk}
                          className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-surface text-label-sm font-semibold text-on-surface disabled:opacity-40"
                        >
                          Próximo
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </>
                  )}

                  <p className="text-center text-label-sm text-on-surface-variant">
                    {qrChunks.length > 1
                      ? 'Deslize para o lado ou use as setas. Escaneie todos na ordem no computador.'
                      : 'Escaneie este QR no computador para importar os dados.'}
                  </p>
                </div>
              </section>

              <section className="mt-4" aria-labelledby="sync-export-json">
                <h3 id="sync-export-json" className="mb-2 text-label-md font-semibold text-on-surface">
                  Arquivo JSON
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyJson()}
                    disabled={isCopying}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container text-label-sm font-semibold text-on-surface"
                  >
                    {isCopying ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4 text-secondary" aria-hidden />
                    )}
                    Copiar JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container text-label-sm font-semibold text-on-surface"
                  >
                    <Download className="h-4 w-4 text-secondary" aria-hidden />
                    Baixar JSON
                  </button>
                </div>
                {copyFeedback && (
                  <p className="mt-2 text-label-sm text-on-surface-variant">{copyFeedback}</p>
                )}
              </section>

              <section className="mt-6" aria-labelledby="sync-export-photos">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 id="sync-export-photos" className="text-label-md font-semibold text-on-surface">
                    Fotos
                  </h3>
                  {totalPhotos > 0 && (
                    <button
                      type="button"
                      disabled={isDownloadingPhotos}
                      onClick={() => void handleDownloadAllPhotos()}
                      className="flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3 text-label-sm font-semibold text-on-secondary disabled:opacity-50"
                    >
                      {isDownloadingPhotos ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Baixar todas
                    </button>
                  )}
                </div>

                {totalPhotos === 0 ? (
                  <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-6 text-center">
                    <ImageIcon className="mx-auto h-6 w-6 text-outline" aria-hidden />
                    <p className="mt-2 text-body-sm text-on-surface-variant">
                      Nenhuma foto vinculada aos itens com falha.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {pkg.entries.flatMap((entry) =>
                      entry.photoRefs.map((photo) => (
                        <li key={`${entry.outboxId}-${photo.photoId}`}>
                          <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
                              <ImageIcon
                                className="h-5 w-5 text-on-secondary-container"
                                aria-hidden
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-body-sm font-semibold text-on-surface">
                                {entry.label}
                              </p>
                              <p className="truncate font-mono text-label-sm text-on-surface-variant">
                                {photo.filename}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void handleDownloadPhoto(photo.photoId, photo.filename)
                              }
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                'border border-outline-variant bg-surface-container text-secondary',
                              )}
                              aria-label={`Baixar ${photo.filename}`}
                            >
                              <Download className="h-4 w-4" aria-hidden />
                            </button>
                          </article>
                        </li>
                      )),
                    )}
                  </ul>
                )}

                {photoProgress && isDownloadingPhotos && (
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    Baixando {photoProgress.current} de {photoProgress.total}…
                  </p>
                )}
                {photoFeedback && !isDownloadingPhotos && (
                  <p className="mt-2 text-label-sm text-on-surface-variant">{photoFeedback}</p>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
