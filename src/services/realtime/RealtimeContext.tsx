import { createContext } from 'react';
import type { ReactNode } from 'react';
import { nullRealtimeProvider } from './NullRealtimeProvider';
import type { RealtimeProvider } from './RealtimeProvider';

export const RealtimeContext = createContext<RealtimeProvider>(nullRealtimeProvider);

export function RealtimeContextProvider({
  children,
  provider = nullRealtimeProvider,
}: {
  children: ReactNode;
  provider?: RealtimeProvider;
}) {
  return (
    <RealtimeContext.Provider value={provider}>
      {children}
    </RealtimeContext.Provider>
  );
}
