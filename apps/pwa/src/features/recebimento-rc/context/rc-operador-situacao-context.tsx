import { createContext, useContext } from 'react';

const RcOperadorSituacaoContext = createContext<Map<string, string>>(new Map());

export function RcOperadorSituacaoProvider({
  value,
  children,
}: {
  value: Map<string, string>;
  children: React.ReactNode;
}) {
  return (
    <RcOperadorSituacaoContext.Provider value={value}>
      {children}
    </RcOperadorSituacaoContext.Provider>
  );
}

export function useRcOperadorSituacao(preRecebimentoId: string): string | undefined {
  const map = useContext(RcOperadorSituacaoContext);
  return map.get(preRecebimentoId);
}
