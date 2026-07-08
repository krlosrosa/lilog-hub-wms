import { useNavigate } from '@tanstack/react-router';

import { useCallback, useEffect, useState } from 'react';



import { useUnidade } from '@/features/unidade/lib/unidade-context';

import { hapticMedium } from '@/lib/haptics';



import {

  findProximaDemandaArmazenagem,

  type ProximaDemandaArmazenagem,

} from '../lib/proxima-demanda';



const AUTO_REDIRECT_MS = 3000;



export type ArmazenagemNavigationPaths = {

  listaPath: string;

  detalhePath: string;

  scanEntryFlow?: boolean;

};



const DEFAULT_PATHS: ArmazenagemNavigationPaths = {

  listaPath: '/movimentacao/armazenagem',

  detalhePath: '/movimentacao/armazenagem/$id',

};



export function useArmazenagemConclusao(

  demandaId: string,

  enabled: boolean,

  paths: ArmazenagemNavigationPaths = DEFAULT_PATHS,

) {

  const navigate = useNavigate();

  const { unidadeSelecionada } = useUnidade();

  const [proximaDemanda, setProximaDemanda] =

    useState<ProximaDemandaArmazenagem | null>(null);

  const [isReady, setIsReady] = useState(false);



  useEffect(() => {

    if (!enabled) {

      setProximaDemanda(null);

      setIsReady(false);

      return;

    }



    if (paths.scanEntryFlow) {

      setProximaDemanda(null);

      setIsReady(true);

      return;

    }



    let cancelled = false;

    const unidadeId = unidadeSelecionada?.id;



    void (async () => {

      if (!unidadeId) {

        if (!cancelled) setIsReady(true);

        return;

      }



      try {

        const next = await findProximaDemandaArmazenagem(

          unidadeId,

          demandaId,

        );

        if (!cancelled) {

          setProximaDemanda(next);

          setIsReady(true);

        }

      } catch {

        if (!cancelled) setIsReady(true);

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [enabled, demandaId, paths.scanEntryFlow, unidadeSelecionada?.id]);



  const irParaDestino = useCallback(() => {

    if (proximaDemanda && !paths.scanEntryFlow) {

      void navigate({

        to: paths.detalhePath,

        params: { id: proximaDemanda.id },

      });

      return;

    }

    void navigate({ to: paths.listaPath });

  }, [navigate, paths.detalhePath, paths.listaPath, paths.scanEntryFlow, proximaDemanda]);



  useEffect(() => {

    if (!enabled || !isReady) return;



    const timer = window.setTimeout(() => {

      hapticMedium();

      irParaDestino();

    }, AUTO_REDIRECT_MS);



    return () => window.clearTimeout(timer);

  }, [enabled, isReady, irParaDestino]);



  const irParaLista = useCallback(() => {

    hapticMedium();

    void navigate({ to: paths.listaPath });

  }, [navigate, paths.listaPath]);



  return {

    proximaDemanda,

    autoRedirectSeconds: AUTO_REDIRECT_MS / 1000,

    irParaDestino,

    irParaLista,

    isReady,

  };

}

