'use client';

import { useRouter } from 'next/navigation';
import { Bell, FileText, MessageSquare, RefreshCw } from 'lucide-react';

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lilog/ui';

import { useNotificacoesPortal } from '../hooks/use-notificacoes-portal';
import type { NotificacaoPortalItem } from '../lib/notificacoes-api';

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'agora';
  }

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
}

function NotificacaoIcon({ tipo }: { tipo: NotificacaoPortalItem['tipo'] }) {
  const className = 'size-4 shrink-0';

  switch (tipo) {
    case 'novo_debito':
      return <FileText className={cn(className, 'text-primary')} aria-hidden />;
    case 'status_atualizado':
      return <RefreshCw className={cn(className, 'text-tertiary')} aria-hidden />;
    case 'nova_interacao':
      return (
        <MessageSquare className={cn(className, 'text-secondary')} aria-hidden />
      );
    default:
      return <Bell className={className} aria-hidden />;
  }
}

export function NotificacoesDropdown() {
  const router = useRouter();
  const { notificacoes, totalNaoLidas, isLoading, marcarLidas } =
    useNotificacoesPortal();

  const handleClick = async (notificacao: NotificacaoPortalItem) => {
    if (!notificacao.lida) {
      await marcarLidas([notificacao.id]);
    }

    router.push(notificacao.rotaDestino);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0"
          aria-label={
            totalNaoLidas > 0
              ? `${totalNaoLidas} notificações não lidas`
              : 'Notificações'
          }
        >
          <Bell className="size-4" aria-hidden />
          {totalNaoLidas > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {totalNaoLidas > 0 ? (
            <span className="text-xs font-normal text-muted-foreground">
              {totalNaoLidas} não lida{totalNaoLidas === 1 ? '' : 's'}
            </span>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </div>
        ) : (
          notificacoes.map((notificacao) => (
            <DropdownMenuItem
              key={notificacao.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 p-3',
                !notificacao.lida && 'bg-primary/5',
              )}
              onClick={() => void handleClick(notificacao)}
            >
              <NotificacaoIcon tipo={notificacao.tipo} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {notificacao.titulo}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {notificacao.mensagem}
                </p>
                <p className="text-[10px] text-muted-foreground/80">
                  {formatRelativeTime(notificacao.createdAt)}
                </p>
              </div>
              {!notificacao.lida ? (
                <span
                  className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
