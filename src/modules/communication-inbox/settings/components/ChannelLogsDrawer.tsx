import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CommunicationChannel, CommunicationChannelLog } from '../../channelTypes';
import { communicationChannelsService } from '../../communicationChannelsService';

interface ChannelLogsDrawerProps {
  open: boolean;
  channel: CommunicationChannel | null;
  onClose: () => void;
}

const sensitiveKeys = ['token', 'secret', 'password', 'authorization', 'qr', 'qrcode', 'qr_code', 'raw'];

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function sanitizeMetadata(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        return [key, '[redacted]'];
      }
      return [key, sanitizeMetadata(item)];
    }),
  );
}

export function ChannelLogsDrawer({ open, channel, onClose }: ChannelLogsDrawerProps) {
  const [logs, setLogs] = useState<CommunicationChannelLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !channel) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    communicationChannelsService.logs(channel.id)
      .then(nextLogs => {
        if (!cancelled) setLogs(nextLogs);
      })
      .catch(nextError => {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Nao foi possivel carregar os logs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [channel?.id, open]);

  if (!open || !channel) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Logs do canal</h3>
            <p className="mt-1 text-sm text-slate-600">{channel.name}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : logs.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Nenhum log encontrado para este canal.</div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <article key={log.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{log.level}</span>
                    {log.status && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{log.status}</span>}
                    <span className="text-xs text-slate-500">{formatDateTime(log.occurredAt ?? log.createdAt)}</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-950">{log.event}</div>
                  <p className="mt-1 text-sm text-slate-700">{log.message}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                      <summary className="cursor-pointer font-medium">Payload sanitizado</summary>
                      <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(sanitizeMetadata(log.metadata), null, 2)}
                      </pre>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
