import { useEffect, useState } from 'react';

import {
  getChecklist,
  getParametrosConferencia,
  listDemandas,
  listExpectedItems,
  listItensConferidos,
  listTemperaturasBau,
  listAvarias,
} from '@lilog/replicache-recebimento';
import type {
  AvariaView,
  ChecklistView,
  DemandView,
  ExpectedItemView,
  ItemConferidoView,
  ParametrosConferenciaView,
  TemperaturaBauView,
} from '@lilog/contracts';
import type { ReadTransaction } from 'replicache';

import { useReplicache } from './replicache-provider';

export { useReplicache } from './replicache-provider';

export function useDemandasReplicache(): DemandView[] {
  const { rep } = useReplicache();
  const [data, setData] = useState<DemandView[]>([]);

  useEffect(() => {
    if (!rep) {
      setData([]);
      return;
    }

    return rep.subscribe(listDemandas, {
      onData: setData,
    });
  }, [rep]);

  return data;
}

export function useItensConferidosReplicache(
  preRecebimentoId: string | null | undefined,
): ItemConferidoView[] {
  const { rep } = useReplicache();
  const [data, setData] = useState<ItemConferidoView[]>([]);

  useEffect(() => {
    if (!rep || !preRecebimentoId) {
      setData([]);
      return;
    }

    const read = (tx: ReadTransaction) => listItensConferidos(tx, preRecebimentoId);

    return rep.subscribe(read, {
      onData: setData,
    });
  }, [rep, preRecebimentoId]);

  return data;
}

export function useExpectedItemsReplicache(
  preRecebimentoId: string | null | undefined,
): ExpectedItemView[] {
  const { rep } = useReplicache();
  const [data, setData] = useState<ExpectedItemView[]>([]);

  useEffect(() => {
    if (!rep || !preRecebimentoId) {
      setData([]);
      return;
    }

    const read = (tx: ReadTransaction) => listExpectedItems(tx, preRecebimentoId);

    return rep.subscribe(read, {
      onData: setData,
    });
  }, [rep, preRecebimentoId]);

  return data;
}

export function useParametrosConferenciaReplicache(
  unidadeId: string | null | undefined,
): ParametrosConferenciaView | null {
  const { rep } = useReplicache();
  const [data, setData] = useState<ParametrosConferenciaView | null>(null);

  useEffect(() => {
    if (!rep || !unidadeId) {
      setData(null);
      return;
    }

    const read = (tx: ReadTransaction) => getParametrosConferencia(tx, unidadeId);

    return rep.subscribe(read, {
      onData: setData,
    });
  }, [rep, unidadeId]);

  return data;
}

export function useChecklistReplicache(
  preRecebimentoId: string | null | undefined,
): ChecklistView | null {
  const { rep } = useReplicache();
  const [data, setData] = useState<ChecklistView | null>(null);

  useEffect(() => {
    if (!rep || !preRecebimentoId) {
      setData(null);
      return;
    }

    const read = (tx: ReadTransaction) => getChecklist(tx, preRecebimentoId);

    return rep.subscribe(read, {
      onData: setData,
    });
  }, [rep, preRecebimentoId]);

  return data;
}

export function useTemperaturasBauReplicache(
  preRecebimentoId: string | null | undefined,
): TemperaturaBauView[] {
  const { rep } = useReplicache();
  const [data, setData] = useState<TemperaturaBauView[]>([]);

  useEffect(() => {
    if (!rep || !preRecebimentoId) {
      setData([]);
      return;
    }

    const read = (tx: ReadTransaction) => listTemperaturasBau(tx, preRecebimentoId);

    return rep.subscribe(read, {
      onData: setData,
    });
  }, [rep, preRecebimentoId]);

  return data;
}

export function useAvariasReplicache(
  preRecebimentoId: string | null | undefined,
): AvariaView[] {
  const { rep } = useReplicache();
  const [data, setData] = useState<AvariaView[]>([]);

  useEffect(() => {
    if (!rep || !preRecebimentoId) {
      setData([]);
      return;
    }

    const read = (tx: ReadTransaction) => listAvarias(tx, preRecebimentoId);

    return rep.subscribe(read, {
      onData: setData,
    });
  }, [rep, preRecebimentoId]);

  return data;
}
