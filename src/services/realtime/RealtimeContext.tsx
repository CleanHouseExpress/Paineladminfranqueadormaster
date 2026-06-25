import { createContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { defaultRealtimeProvider } from './createRealtimeProvider';
import type { RealtimeProvider } from './RealtimeProvider';

export const RealtimeContext = createContext<RealtimeProvider>(defaultRealtimeProvider);

export function RealtimeContextProvider({
  children,
  provider = defaultRealtimeProvider,
}: {
  children: ReactNode;
  provider?: RealtimeProvider;
}) {
  useEffect(() => {
    void provider.connect();
    return () => provider.disconnect();
  }, [provider]);

  return (
    <RealtimeContext.Provider value={provider}>
      {children}
    </RealtimeContext.Provider>
  );
}
