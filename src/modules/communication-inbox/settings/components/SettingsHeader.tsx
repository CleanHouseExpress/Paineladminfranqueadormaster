import { CommunicationPageHeader } from '../../components/CommunicationPageHeader';

interface SettingsHeaderProps {
  title: string;
  subtitle: string;
}

export function SettingsHeader({ title, subtitle }: SettingsHeaderProps) {
  return (
    <CommunicationPageHeader
      title={title}
      subtitle={subtitle}
      badge={<span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Área administrativa</span>}
    />
  );
}
