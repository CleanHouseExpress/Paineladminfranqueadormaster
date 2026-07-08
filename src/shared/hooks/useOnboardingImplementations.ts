import { useCallback, useEffect, useState } from 'react';
import { onboardingImplementationService } from '../../services/onboardingImplementationService';
import type { OnboardingImplementation, OnboardingImplementationsMeta } from '../../types/onboardingImplementation';

export function useOnboardingImplementations(filters: { search?: string; status?: string; program_id?: string; unit_id?: string }) {
  const [implementations, setImplementations] = useState<OnboardingImplementation[]>([]);
  const [meta, setMeta] = useState<OnboardingImplementationsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onboardingImplementationService.list(filters);
      setImplementations(result.data);
      setMeta(result.meta);
    } catch (loadError) {
      setError(onboardingImplementationService.getErrorMessage(loadError, 'Nao foi possivel carregar as implementations.'));
    } finally {
      setLoading(false);
    }
  }, [filters.program_id, filters.search, filters.status, filters.unit_id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { implementations, meta, loading, error, reload: load, setImplementations };
}
