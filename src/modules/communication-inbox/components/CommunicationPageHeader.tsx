import type { ReactNode } from 'react';

interface CommunicationPageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function CommunicationPageHeader({ title, subtitle, actions, badge }: CommunicationPageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {badge}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
