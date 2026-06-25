import { useCallback, useEffect, useMemo, useState, type DependencyList } from 'react';
import { communicationInboxApi } from './api/communicationInboxApi';
import type {
  CommunicationConversation,
  CommunicationMessage,
  ConversationFilters,
  InboxSummary,
  MessageFilters,
  PaginatedResult,
} from './types';

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error('Nao foi possivel carregar os dados.');
}

function useAsyncQuery<T>(
  load: () => Promise<T>,
  deps: DependencyList,
  enabled = true,
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (nextError) {
      setError(toError(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, load]);

  useEffect(() => {
    let active = true;
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);
    load()
      .then(nextData => {
        if (active) setData(nextData);
      })
      .catch(nextError => {
        if (active) setError(toError(nextError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
    refetch,
  };
}

export function useInboxSummary(filters: ConversationFilters) {
  const stableFilters = useMemo(() => filters, [filters.status, filters.handoff, filters.assignmentStatus]);
  return useAsyncQuery<InboxSummary>(
    () => communicationInboxApi.getSummary(stableFilters),
    [stableFilters],
  );
}

export function useInboxConversations(filters: ConversationFilters) {
  const stableFilters = useMemo(
    () => ({ ...filters, page: filters.page ?? 1, perPage: filters.perPage ?? 25 }),
    [filters.status, filters.handoff, filters.assignmentStatus, filters.page, filters.perPage],
  );
  return useAsyncQuery<PaginatedResult<CommunicationConversation>>(
    () => communicationInboxApi.listConversations(stableFilters),
    [stableFilters],
  );
}

export function useConversation(conversationId?: string | null) {
  return useAsyncQuery<CommunicationConversation>(
    () => communicationInboxApi.getConversation(conversationId as string),
    [conversationId],
    Boolean(conversationId),
  );
}

export function useConversationMessages(conversationId?: string | null, filters: MessageFilters = {}) {
  const stableFilters = useMemo(
    () => ({ ...filters, page: filters.page ?? 1, perPage: filters.perPage ?? 50 }),
    [filters.page, filters.perPage],
  );
  return useAsyncQuery<PaginatedResult<CommunicationMessage>>(
    () => communicationInboxApi.listMessages(conversationId as string, stableFilters),
    [conversationId, stableFilters],
    Boolean(conversationId),
  );
}
