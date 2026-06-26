import { useCallback, useEffect, useMemo, useState, type DependencyList } from 'react';
import { communicationInboxApi } from './api/communicationInboxApi';
import type {
  CommunicationAssignee,
  CommunicationConversation,
  CommunicationMessage,
  ConversationTimelineEvent,
  ConversationFilters,
  InboxSummary,
  MessageDeliveryStatus,
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

interface MutationState<TArgs extends unknown[], TResult> {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: (...args: TArgs) => Promise<TResult>;
  reset: () => void;
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

function useAsyncMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): MutationState<TArgs, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (...args: TArgs) => {
    setIsLoading(true);
    setError(null);
    try {
      return await action(...args);
    } catch (nextError) {
      const normalizedError = toError(nextError);
      setError(normalizedError);
      throw normalizedError;
    } finally {
      setIsLoading(false);
    }
  }, [action]);

  return {
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
    reset: () => setError(null),
  };
}

export function useInboxSummary(filters: ConversationFilters) {
  const stableFilters = useMemo(
    () => filters,
    [filters.search, filters.status, filters.handoff, filters.assignmentStatus],
  );
  return useAsyncQuery<InboxSummary>(
    () => communicationInboxApi.getSummary(stableFilters),
    [stableFilters],
  );
}

export function useInboxConversations(filters: ConversationFilters) {
  const stableFilters = useMemo(
    () => ({ ...filters, page: filters.page ?? 1, perPage: filters.perPage ?? 25 }),
    [filters.search, filters.status, filters.handoff, filters.assignmentStatus, filters.page, filters.perPage],
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

export function useConversationMessageStatuses(conversationId?: string | null) {
  return useAsyncQuery<MessageDeliveryStatus[]>(
    () => communicationInboxApi.listMessageStatuses(conversationId as string),
    [conversationId],
    Boolean(conversationId),
  );
}

export function useConversationTimeline(conversationId?: string | null) {
  return useAsyncQuery<ConversationTimelineEvent[]>(
    () => communicationInboxApi.listTimeline(conversationId as string),
    [conversationId],
    Boolean(conversationId),
  );
}

export function useCommunicationAssignees(search = '', enabled = true) {
  const stableSearch = useMemo(() => search.trim(), [search]);
  return useAsyncQuery<CommunicationAssignee[]>(
    () => communicationInboxApi.listAssignees(stableSearch),
    [stableSearch, enabled],
    enabled,
  );
}

export function useRequestHandoff() {
  return useAsyncMutation((conversationId: string, reason?: string) =>
    communicationInboxApi.requestHandoff(conversationId, reason)
  );
}

export function useAssignConversation() {
  return useAsyncMutation((conversationId: string) =>
    communicationInboxApi.assignConversation(conversationId)
  );
}

export function useCloseConversation() {
  return useAsyncMutation((conversationId: string, reason?: string) =>
    communicationInboxApi.closeConversation(conversationId, reason)
  );
}

export function useReopenConversation() {
  return useAsyncMutation((conversationId: string) =>
    communicationInboxApi.reopenConversation(conversationId)
  );
}

export function useReturnToAi() {
  return useAsyncMutation((conversationId: string, reason?: string) =>
    communicationInboxApi.returnToAi(conversationId, reason)
  );
}

export function useSendMessage() {
  return useAsyncMutation((conversationId: string, text: string) =>
    communicationInboxApi.sendMessage(conversationId, text)
  );
}

export function useTransferConversation() {
  return useAsyncMutation((conversationId: string, assigneeId: string) =>
    communicationInboxApi.transferConversation(conversationId, assigneeId)
  );
}
