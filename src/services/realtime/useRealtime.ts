import { useContext } from 'react';
import { RealtimeContext } from './RealtimeContext';

export function useRealtime() {
  return useContext(RealtimeContext);
}
