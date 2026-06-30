import { Settings2 } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { CommunicationEmptyState } from '../../components/CommunicationEmptyState';

interface EmptyConfigurationStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}

export function EmptyConfigurationState({ title, description, action, icon: Icon = Settings2 }: EmptyConfigurationStateProps) {
  return <CommunicationEmptyState icon={Icon} title={title} description={description} action={action} />;
}
