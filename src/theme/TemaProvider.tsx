import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { aplicarTema, lerTemaSalvo, proximoTema, salvarTema, TemaContext, type ModoTema } from './tema';

export function TemaProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoTema>(lerTemaSalvo);

  useEffect(() => {
    aplicarTema(modo);
    salvarTema(modo);
  }, [modo]);

  const valor = useMemo(() => ({ modo, alternar: () => setModo(proximoTema) }), [modo]);
  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}
