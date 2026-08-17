import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createRecebimentoReplicache,
  type RecebimentoReplicache,
} from '@lilog/replicache-recebimento';
import { dropDatabase } from 'replicache';

import { useAuth } from '@/features/auth';
import { useUnidade } from '@/features/unidade';

import { buildReplicacheUrls } from './api-urls';
import { createRcReplicachePushObserver } from './rc-push-observer';
import { setActiveReplicache } from './replicache-registry';

type ReplicacheContextValue = {
  rep: RecebimentoReplicache | null;
  isReady: boolean;
  resetLocalReplicache: () => Promise<void>;
};

const ReplicacheContext = createContext<ReplicacheContextValue>({
  rep: null,
  isReady: false,
  resetLocalReplicache: async () => {},
});

export function ReplicacheProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { unidadeSelecionada } = useUnidade();
  const [rep, setRep] = useState<RecebimentoReplicache | null>(null);
  const repRef = useRef<RecebimentoReplicache | null>(null);
  const [resetCounter, setResetCounter] = useState(0);

  const configKey = useMemo(() => {
    if (!user || !unidadeSelecionada) {
      return null;
    }
    return `${user.id}:${unidadeSelecionada.id}`;
  }, [user, unidadeSelecionada]);

  const resetLocalReplicache = useMemo(
    () => async () => {
      const current = repRef.current;
      if (current) {
        const idbName = current.idbName;
        repRef.current = null;
        setActiveReplicache(null);
        setRep(null);
        await current.close();
        await dropDatabase(idbName);
      }
      setResetCounter((value) => value + 1);
    },
    [],
  );

  useEffect(() => {
    if (!configKey || !user || !unidadeSelecionada) {
      const current = repRef.current;
      repRef.current = null;
      setActiveReplicache(null);
      setRep(null);
      if (current) {
        void current.close();
      }
      return;
    }

    let cancelled = false;

    const urls = buildReplicacheUrls(unidadeSelecionada.id);
    const instance = createRecebimentoReplicache({
      userId: user.id,
      unidadeId: unidadeSelecionada.id,
      pullURL: urls.pullURL,
      pushURL: urls.pushURL,
      pushObserver: createRcReplicachePushObserver(),
    });

    repRef.current = instance;
    setActiveReplicache(instance);
    setRep(instance);

    return () => {
      cancelled = true;
      repRef.current = null;
      setActiveReplicache(null);
      setRep(null);
      void instance.close().catch(() => {
        if (!cancelled) return;
      });
    };
  }, [configKey, user, unidadeSelecionada, resetCounter]);

  const value = useMemo(
    () => ({
      rep,
      isReady: rep != null,
      resetLocalReplicache,
    }),
    [rep, resetLocalReplicache],
  );

  return (
    <ReplicacheContext.Provider value={value}>{children}</ReplicacheContext.Provider>
  );
}

export function useReplicacheContext() {
  return useContext(ReplicacheContext);
}

export function useReplicache() {
  const { rep, isReady, resetLocalReplicache } = useReplicacheContext();
  return { rep, isReady, resetLocalReplicache };
}
