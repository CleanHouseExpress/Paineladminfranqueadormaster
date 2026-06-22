import { createContext, useContext, useEffect, useState } from 'react';
import { franchisePortalService } from '../../services/franchisePortalService';
import type { FranchisePortalContextData } from '../../types/franchisePortal';

interface Value {
  data: FranchisePortalContextData | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const Context = createContext<Value | null>(null);

export function FranchisePortalProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FranchisePortalContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    setLoading(true); setError('');
    try { setData(await franchisePortalService.context()); }
    catch { setError('Não foi possível carregar a unidade vinculada ao portal.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  return <Context.Provider value={{
    data, loading, error, refresh,
    hasPermission: permission => Boolean(data?.permissions.includes(permission)),
  }}>{children}</Context.Provider>;
}

export function useFranchisePortal() {
  const value = useContext(Context);
  if (!value) throw new Error('FranchisePortalProvider ausente.');
  return value;
}
