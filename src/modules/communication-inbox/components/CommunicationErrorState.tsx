import { AlertCircle, RefreshCcw } from 'lucide-react';

interface CommunicationErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function CommunicationErrorState({ title = 'Nao foi possivel carregar esta area.', description, onRetry }: CommunicationErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-red-700">{description}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
