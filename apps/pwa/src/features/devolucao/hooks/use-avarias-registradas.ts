import { useCallback, useEffect, useState } from 'react';

import {
  getAvariasRegistradas,
  removeAvariaRegistrada,
} from '../lib/conferencia-avarias-store';
import { getAvariaRegistroLabels } from '../lib/avaria-labels';

export function useAvariasRegistradas(demandId: string) {
  const [avariasRegistradas, setAvariasRegistradas] = useState(() =>
    getAvariasRegistradas(demandId)
  );
  const [avariasListExpanded, setAvariasListExpanded] = useState(true);

  const refreshAvarias = useCallback(() => {
    setAvariasRegistradas(getAvariasRegistradas(demandId));
  }, [demandId]);

  useEffect(() => {
    refreshAvarias();
  }, [refreshAvarias]);

  const toggleAvariasListExpanded = useCallback(() => {
    setAvariasListExpanded((prev) => !prev);
  }, []);

  const removeAvaria = useCallback(
    (id: string) => {
      removeAvariaRegistrada(demandId, id);
      refreshAvarias();
    },
    [demandId, refreshAvarias]
  );

  return {
    avariasRegistradas,
    avariasListExpanded,
    toggleAvariasListExpanded,
    removeAvaria,
    getAvariaLabels: getAvariaRegistroLabels,
  };
}
