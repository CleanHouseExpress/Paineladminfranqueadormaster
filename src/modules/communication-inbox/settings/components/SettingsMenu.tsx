import { Link } from 'react-router';
import {
  Bot,
  BriefcaseBusiness,
  CircleDashed,
  LayoutGrid,
  MessageCircleMore,
  Settings2,
  Sparkles,
  Tags,
  Workflow,
} from 'lucide-react';

const menuItems = [
  { label: 'Canais', path: '/communication/settings/channels', icon: MessageCircleMore, description: 'WhatsApp, Z-API e conectores' },
  { label: 'Departamentos', path: '/communication/settings/departments', icon: BriefcaseBusiness, description: 'Estrutura organizacional' },
  { label: 'Horários', path: '/communication/settings/schedules', icon: LayoutGrid, description: 'Janelas e disponibilidade' },
  { label: 'Distribuição', path: '/communication/settings/distribution', icon: Workflow, description: 'Regras de roteamento' },
  { label: 'SLA', path: '/communication/settings/sla', icon: CircleDashed, description: 'Prazos e tempo de resposta' },
  { label: 'Etiquetas', path: '/communication/settings/tags', icon: Tags, description: 'Organização e categorização' },
  { label: 'IA', path: '/communication/settings/ai', icon: Sparkles, description: 'Assistência e automação' },
  { label: 'Webhooks', path: '/communication/settings/webhooks', icon: Settings2, description: 'Integrações e eventos' },
] as const;

interface SettingsMenuProps {
  activePath: string;
}

function isActive(path: string, activePath: string) {
  return activePath === path || activePath.startsWith(`${path}/`);
}

export function SettingsMenu({ activePath }: SettingsMenuProps) {
  return (
    <nav aria-label="Menu de configurações de comunicação" className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Configurações</div>
      <div className="mt-2 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path, activePath);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-start gap-3 rounded-lg px-3 py-3 text-sm transition ${
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`mt-0.5 rounded-md p-2 ${active ? 'bg-white text-blue-700 shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className={`mt-1 text-xs ${active ? 'text-blue-600' : 'text-slate-500'}`}>{item.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
