import type { ReactNode } from 'react';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsMenu } from './components/SettingsMenu';

interface CommunicationSettingsLayoutProps {
  title: string;
  subtitle: string;
  activePath: string;
  children: ReactNode;
}

export function CommunicationSettingsLayout({ title, subtitle, activePath, children }: CommunicationSettingsLayoutProps) {
  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <SettingsHeader title={title} subtitle={subtitle} />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SettingsMenu activePath={activePath} />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
