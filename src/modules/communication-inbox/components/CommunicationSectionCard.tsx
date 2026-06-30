import type { ReactNode } from 'react';

interface CommunicationSectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CommunicationSectionCard({
  title,
  description,
  actions,
  children,
  className = '',
}: CommunicationSectionCardProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`.trim()}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
