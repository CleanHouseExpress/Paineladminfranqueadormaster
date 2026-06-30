import type { ReactNode } from 'react';
import { CommunicationSectionCard } from '../../components/CommunicationSectionCard';

interface SettingsCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({ title, description, actions, children, className = '' }: SettingsCardProps) {
  return (
    <CommunicationSectionCard title={title} description={description} actions={actions} className={className}>
      {children}
    </CommunicationSectionCard>
  );
}
