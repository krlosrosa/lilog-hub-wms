'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  ChevronDown,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import {
  registrarInteracaoCD,
  uploadInteracaoAnexoCD,
  type InteracaoTipoCd,
} from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import { isStatusEmInvestigacao } from '@/features/debito-transportadora/lib/map-processo-debito';
import type {
  DebitoInteracao,
  DebitoStatus,
} from '@/features/debito-transportadora/types/debito.schema';
import {
  DEBITO_INTERACAO_AUTOR_LABELS,
  DEBITO_INTERACAO_TIPO_CD_LABELS,
  DEBITO_INTERACAO_TIPO_LABELS,
} from '@/features/debito-transportadora/types/debito.schema';

type ArquivoUpload = {
  id: string;
  file: File;
  chave?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

type DebitoConversaProps = {
  processoId: string;
  unidadeId: string;
  status: DebitoStatus;
  interacoes: DebitoInteracao[];
  onSuccess?: () => void;
};

const TIPOS_CD: InteracaoTipoCd[] = [
  'solicitacao_prova',
  'parecer',
  'observacao_cd',
];

const MAX_ARQUIVOS = 5;
const MAX_TAMANHO_BYTES = 10 * 1024 * 1024;

function formatarData(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function nomeAnexo(chave: string, index: number): string {
  const segmentos = chave.split('/');
  const nome = segmentos[segmentos.length - 1];
  return nome?.trim() ? nome : `Anexo ${index + 1}`;
}

function temMensagemTransportadoraPendente(
  interacoes: DebitoInteracao[],
): boolean {
  if (interacoes.length === 0) {
    return false;
  }

  const ultima = [...interacoes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return ultima?.autor === 'transportadora';
}

export function DebitoConversa({
  processoId,
  unidadeId,
  status,
  interacoes,
  onSuccess,
}: DebitoConversaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<InteracaoTipoCd>('solicitacao_prova');
  const [descricao, setDescricao] = useState('');
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mensagens = [...interacoes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const podeResponder = isStatusEmInvestigacao(status);
  const novaMensagemTransportadora = temMensagemTransportadoraPendente(interacoes);

  useEffect(() => {
    if (novaMensagemTransportadora && podeResponder) {
      setAberto(true);
    }
  }, [novaMensagemTransportadora, podeResponder]);

  const temUploadEmProgresso = arquivos.some(
    (arquivo) => arquivo.status === 'pending' || arquivo.status === 'uploading',
  );

  const adicionarArquivos = useCallback(
    async (files: FileList | File[]) => {
      const lista = Array.from(files);

      if (arquivos.length + lista.length > MAX_ARQUIVOS) {
        toast.error(`Máximo de ${MAX_ARQUIVOS} arquivos por mensagem`);
        return;
      }

      for (const file of lista) {
        if (file.size > MAX_TAMANHO_BYTES) {
          toast.error(`${file.name} excede 10 MB`);
          continue;
        }

        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
        const entrada: ArquivoUpload = {
          id,
          file,
          status: 'uploading',
        };

        setArquivos((atual) => [...atual, entrada]);

        try {
          const { chave } = await uploadInteracaoAnexoCD(
            processoId,
            unidadeId,
            file,
          );
          setArquivos((atual) =>
            atual.map((item) =>
              item.id === id ? { ...item, chave, status: 'done' } : item,
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Falha no upload';
          setArquivos((atual) =>
            atual.map((item) =>
              item.id === id ? { ...item, status: 'error', error: message } : item,
            ),
          );
          toast.error(message);
        }
      }
    },
    [arquivos.length, processoId, unidadeId],
  );

  const removerArquivo = useCallback((id: string) => {
    setArquivos((atual) => atual.filter((item) => item.id !== id));
  }, []);

  const resetForm = useCallback(() => {
    setTipo('solicitacao_prova');
    setDescricao('');
    setArquivos([]);
  }, []);

  const enviar = useCallback(async () => {
    if (descricao.trim().length < 10) {
      toast.error('Descreva a mensagem com pelo menos 10 caracteres');
      return;
    }

    if (temUploadEmProgresso) {
      toast.error('Aguarde o término dos uploads');
      return;
    }

    const anexoChaves = arquivos
      .filter((item) => item.status === 'done' && item.chave)
      .map((item) => item.chave!);

    setIsSubmitting(true);

    try {
      await registrarInteracaoCD(processoId, unidadeId, {
        tipo,
        descricao: descricao.trim(),
        anexoChaves,
      });
      toast.success('Mensagem enviada à transportadora');
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    arquivos,
    descricao,
    onSuccess,
    processoId,
    resetForm,
    temUploadEmProgresso,
    tipo,
    unidadeId,
  ]);

  const resumoMensagens =
    mensagens.length === 0
      ? 'Nenhuma mensagem'
      : mensagens.length === 1
        ? '1 mensagem'
        : `${mensagens.length} mensagens`;

  return (
    <section className="rounded-2xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20 sm:px-5"
        aria-expanded={aberto}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                Negociação com Transportadora
              </h2>
              {novaMensagemTransportadora && podeResponder ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="size-3" aria-hidden />
                  Nova mensagem
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {aberto
                ? 'Troque mensagens e anexos com a transportadora'
                : resumoMensagens}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform',
            aberto && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {aberto ? (
        <>
          <div className="max-h-[min(420px,50vh)] space-y-3 overflow-y-auto border-t border-outline-variant/50 px-4 py-4 sm:px-5">
            {mensagens.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma mensagem ainda. Use o campo abaixo para iniciar a
                negociação.
              </p>
            ) : (
              mensagens.map((mensagem) => {
                const isCd = mensagem.autor === 'cd';

                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${isCd ? 'justify-end' : 'justify-start'}`}
                  >
                    <article
                      className={cn(
                        'max-w-[92%] rounded-2xl border px-3 py-2.5 sm:max-w-[80%] sm:px-4 sm:py-3',
                        isCd
                          ? 'border-blue-500/25 bg-blue-500/10'
                          : 'border-primary/25 bg-primary/10',
                      )}
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        {isCd ? (
                          <Building2
                            className="size-3.5 text-blue-600 dark:text-blue-300"
                            aria-hidden
                          />
                        ) : (
                          <Truck className="size-3.5 text-primary" aria-hidden />
                        )}
                        <span className="text-xs font-semibold text-foreground">
                          {DEBITO_INTERACAO_AUTOR_LABELS[mensagem.autor]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {DEBITO_INTERACAO_TIPO_LABELS[mensagem.tipo]}
                        </span>
                        <time className="ml-auto text-[10px] text-muted-foreground">
                          {formatarData(mensagem.createdAt)}
                        </time>
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {mensagem.descricao}
                      </p>

                      {mensagem.anexoUrls.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {mensagem.anexoUrls.map((url, anexoIndex) => (
                            <li key={`${mensagem.id}-${url}`}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                <FileText className="size-3.5" aria-hidden />
                                {nomeAnexo(
                                  mensagem.anexoChaves[anexoIndex] ?? '',
                                  anexoIndex,
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  </div>
                );
              })
            )}
          </div>

          {podeResponder ? (
            <div
              className={cn(
                'border-t px-4 py-4 sm:px-5',
                novaMensagemTransportadora ? 'bg-amber-500/5' : 'bg-muted/20',
              )}
            >
              {novaMensagemTransportadora ? (
                <p className="mb-3 text-xs font-medium text-amber-800 dark:text-amber-200">
                  A transportadora enviou uma nova mensagem. Responda abaixo.
                </p>
              ) : null}

              <div className="space-y-3">
                <select
                  value={tipo}
                  onChange={(event) =>
                    setTipo(event.target.value as InteracaoTipoCd)
                  }
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  aria-label="Tipo de mensagem"
                >
                  {TIPOS_CD.map((item) => (
                    <option key={item} value={item}>
                      {DEBITO_INTERACAO_TIPO_CD_LABELS[item]}
                    </option>
                  ))}
                </select>

                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  disabled={isSubmitting}
                  placeholder="Escreva sua mensagem à transportadora…"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span>{descricao.length}/2000</span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                    <Paperclip className="size-3.5" aria-hidden />
                    Anexar
                    <input
                      ref={inputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,image/*"
                      disabled={isSubmitting}
                      onChange={(event) => {
                        if (event.target.files?.length) {
                          void adicionarArquivos(event.target.files);
                          event.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {arquivos.length > 0 ? (
                  <ul className="space-y-1.5">
                    {arquivos.map((arquivo) => (
                      <li
                        key={arquivo.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {arquivo.file.name}
                          </p>
                          <p className="text-muted-foreground">
                            {formatTamanho(arquivo.file.size)}
                            {arquivo.status === 'uploading' ? ' · enviando…' : null}
                          </p>
                        </div>
                        {arquivo.status === 'uploading' ? (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => removerArquivo(arquivo.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            aria-label={`Remover ${arquivo.file.name}`}
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Button
                  type="button"
                  onClick={() => void enviar()}
                  disabled={isSubmitting || temUploadEmProgresso}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Enviar ao transportador
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground sm:px-5">
              Este processo está encerrado. Não é possível enviar novas mensagens.
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
