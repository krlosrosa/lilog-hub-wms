'use client';

import { AlertCircle } from 'lucide-react';

import { DebitosTable } from '../components/debitos-table';
import { useDebitosLista } from '../hooks/use-debitos-lista';

export function DebitosListaView() {
  const { filtro, setFiltro, processos, isLoading, error } = useDebitosLista();

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-center gap-2 text-primary">
          <AlertCircle className="size-5" aria-hidden />
          <p className="text-sm font-medium">Gestão de débitos</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Débitos de devolução
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Acompanhe os processos de débito originados de devoluções e envie
          réplicas com anexos quando necessário.
        </p>
      </section>

      <DebitosTable
        filtro={filtro}
        onFiltroChange={setFiltro}
        processos={processos}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
