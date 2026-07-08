import { useCallback, useEffect, useState } from 'react';
import { onboardingProgramService } from '../../services/onboardingProgramService';
import type { OnboardingProgram, OnboardingProgramsMeta } from '../../types/onboardingProgram';

export function useOnboardingPrograms(filters: { search?: string; status?: string; category?: string }) {
  const [programs, setPrograms] = useState<OnboardingProgram[]>([]);
  const [meta, setMeta] = useState<OnboardingProgramsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onboardingProgramService.list(filters);
      setPrograms(result.data);
      setMeta(result.meta);
    } catch (loadError) {
      setError(onboardingProgramService.getErrorMessage(loadError, 'Nao foi possivel carregar os programas.'));
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.search, filters.status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { programs, meta, loading, error, reload: load, setPrograms };
}
