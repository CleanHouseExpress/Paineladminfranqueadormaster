import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';

interface CommunicationEmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  action?: ReactNode;
}

export function CommunicationEmptyState({ icon: Icon, title, description, action }: CommunicationEmptyStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
