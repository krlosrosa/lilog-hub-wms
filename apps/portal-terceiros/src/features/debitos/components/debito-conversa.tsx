'use client';

import { useEffect, useRef, useState } from 'react';
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

import { Button, cn } from '@lilog/ui';

import { useSubmeterInteracao } from '../hooks/use-submeter-interacao';
import {
  formatData,
  INTERACAO_AUTOR_LABELS,
  INTERACAO_TIPO_LABELS,
  INTERACAO_TIPO_TRANSPORTADORA_LABELS,
  podeEnviarInteracao,
  temSolicitacaoProvaPendente,
  type InteracaoTipoTransportadora,
  type ProcessoDebitoInteracao,
  type ProcessoDebitoStatus,
} from '../types/debito.types';

type DebitoConversaProps = {
  processoId: string;
  status: ProcessoDebitoStatus;
  interacoes: ProcessoDebitoInteracao[];
  onSuccess?: () => void;
};

function formatTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DebitoConversa({
  processoId,
  status,
  interacoes,
  onSuccess,
}: DebitoConversaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mensagens = [...interacoes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const podeResponder = podeEnviarInteracao(status);
  const acaoPendente = temSolicitacaoProvaPendente(interacoes);

  const {
    tipo,
    setTipo,
    tiposDisponiveis,
    descricao,
    setDescricao,
    arquivos,
    adicionarArquivos,
    removerArquivo,
    submeter,
    isSubmitting,
    temUploadEmProgresso,
  } = useSubmeterInteracao(processoId, onSuccess);

  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (acaoPendente) {
      setAberto(true);
    }
  }, [acaoPendente]);

  const resumoMensagens =
    mensagens.length === 0
      ? 'Nenhuma mensagem'
      : mensagens.length === 1
        ? '1 mensagem'
        : `${mensagens.length} mensagens`;

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
        aria-expanded={aberto}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm font-semibold text-foreground">
                Negociação com o CD
              </h2>
              {acaoPendente ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="size-2.5" aria-hidden />
                  Pendente
                </span>
              ) : null}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {aberto
                ? 'Mensagens e anexos com o centro de distribuição'
                : resumoMensagens}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            aberto && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {aberto ? (
        <>
          <div className="max-h-[min(360px,45vh)] space-y-2 overflow-y-auto border-t border-border/60 px-3 py-3">
            {mensagens.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Nenhuma mensagem ainda. Use o campo abaixo para iniciar a negociação.
              </p>
            ) : (
              mensagens.map((mensagem) => {
                const isTransportadora = mensagem.autor === 'transportadora';

                return (
                  <div
                    key={mensagem.id}
                    className={cn(
                      'flex',
                      isTransportadora ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <article
                      className={cn(
                        'max-w-[92%] rounded-xl border px-2.5 py-2 sm:max-w-[85%]',
                        isTransportadora
                          ? 'border-primary/25 bg-primary/10'
                          : 'border-blue-500/25 bg-blue-50 dark:bg-blue-950/25',
                      )}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        {isTransportadora ? (
                          <Truck className="size-3 text-primary" aria-hidden />
                        ) : (
                          <Building2
                            className="size-3 text-blue-600 dark:text-blue-300"
                            aria-hidden
                          />
                        )}
                        <span className="text-[11px] font-semibold text-foreground">
                          {INTERACAO_AUTOR_LABELS[mensagem.autor]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {INTERACAO_TIPO_LABELS[mensagem.tipo]}
                        </span>
                        <time className="ml-auto text-[10px] text-muted-foreground">
                          {formatData(mensagem.createdAt)}
                        </time>
                      </div>

                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                        {mensagem.descricao}
                      </p>

                      {mensagem.anexoUrls.length > 0 ? (
                        <ul className="mt-1.5 space-y-0.5">
                          {mensagem.anexoUrls.map((url) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                              >
                                <FileText className="size-3" aria-hidden />
                                Ver anexo
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
                'border-t px-3 py-3',
                acaoPendente ? 'bg-amber-500/5' : 'bg-muted/20',
              )}
            >
              {acaoPendente ? (
                <p className="mb-2 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                  O CD solicitou provas adicionais. Envie sua resposta abaixo.
                </p>
              ) : null}

              <div className="space-y-2">
                <select
                  value={tipo}
                  onChange={(event) =>
                    setTipo(event.target.value as InteracaoTipoTransportadora)
                  }
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                  aria-label="Tipo de mensagem"
                >
                  {tiposDisponiveis.map((item) => (
                    <option key={item} value={item}>
                      {INTERACAO_TIPO_TRANSPORTADORA_LABELS[item]}
                    </option>
                  ))}
                </select>

                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  disabled={isSubmitting}
                  placeholder="Escreva sua mensagem…"
                  className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span>{descricao.length}/2000</span>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/50">
                    <Paperclip className="size-3" aria-hidden />
                    Anexar
                    <input
                      ref={inputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
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
                  <ul className="space-y-1">
                    {arquivos.map((arquivo) => (
                      <li
                        key={arquivo.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2 py-1 text-[11px]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{arquivo.file.name}</p>
                          <p className="text-muted-foreground">
                            {formatTamanho(arquivo.file.size)}
                            {arquivo.status === 'uploading' ? ' · enviando…' : null}
                          </p>
                        </div>
                        {arquivo.status === 'uploading' ? (
                          <Loader2 className="size-3 animate-spin text-primary" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => removerArquivo(arquivo.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                            aria-label={`Remover ${arquivo.file.name}`}
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Button
                  type="button"
                  size="sm"
                  onClick={() => void submeter()}
                  disabled={isSubmitting || temUploadEmProgresso}
                  className="h-8 w-full text-xs sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 size-3.5" />
                      {acaoPendente ? 'Enviar resposta' : 'Enviar mensagem'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t bg-muted/20 px-3 py-2 text-center text-[11px] text-muted-foreground">
              Este processo está encerrado. Não é possível enviar novas mensagens.
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
