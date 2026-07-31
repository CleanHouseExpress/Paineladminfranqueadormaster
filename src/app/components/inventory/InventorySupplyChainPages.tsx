import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService } from '../../../services/inventoryService';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import type { InventorySettings } from '../../../types/inventory';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 };
const button: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700 };

function Shell({ title, description, settings, children }: { title: string; description: string; settings?: InventorySettings | null; children: ReactNode }) {
  const links = [['/inventory', 'Visao Geral'], ['/inventory/items', 'Itens'], ['/inventory/movements', 'Movimentacoes'], ['/inventory/settings', 'Configuracoes']];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 16 }}>
        <header>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p style={{ color: '#64748B', fontSize: 13 }}>{description}</p>
          <nav style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {links.map(([path, label]) => <Link key={path} to={path} style={{ ...button, textDecoration: 'none', color: '#475569' }}>{label}</Link>)}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}

const flagLabels: Record<string, string> = {
  enable_stock_minimum: 'Estoque minimo',
  enable_stock_ideal: 'Estoque ideal',
  enable_reorder_point: 'Ponto de reposicao',
  enable_coverage: 'Cobertura em dias',
  enable_inventory_alerts: 'Alertas de estoque',
  enable_purchase_flow: 'Fluxo de compras',
  enable_recipes: 'Receitas',
  enable_supplier_management: 'Fornecedores',
  enable_cost_tracking: 'Acompanhamento de custos',
  enable_multi_unit_inventory: 'Estoque por unidade',
};

export function InventorySettingsPage() {
  const { hasPermission } = usePermission();
  const [settings, setSettings] = useState<InventorySettings | null>(null);

  useEffect(() => { void inventoryService.getSettings().then(setSettings); }, []);

  if (!settings) return <ModuleStateView state="loading" />;

  const save = async () => {
    setSettings(await inventoryService.updateSettings({
      ...settings,
      enable_transfers: false,
      enable_inventory_counts: false,
    }));
    toast.success('Configuracoes aplicadas imediatamente.');
  };

  return (
    <Shell title="Configuracoes de Estoque" description="Ative somente os recursos usados pela operacao desta rede." settings={settings}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
        {Object.entries(flagLabels).map(([flag, label]) => (
          <label key={flag} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>
              <strong>{label}</strong>
              <small style={{ display: 'block', color: '#64748B', marginTop: 4 }}>Configuracao por tenant</small>
            </span>
            <input type="checkbox" checked={Boolean(settings[flag as keyof InventorySettings])} onChange={event => setSettings(current => current ? { ...current, [flag]: event.target.checked } : current)} />
          </label>
        ))}
      </div>
      {hasPermission('tenant.inventory.settings.update') && <button onClick={() => void save()} style={{ ...button, background: '#6366F1', color: '#fff', border: 0, width: 'fit-content' }}><Save size={15} />Salvar configuracoes</button>}
    </Shell>
  );
}

function Unavailable({ title, description, hint }: { title: string; description: string; hint: string }) {
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  useEffect(() => { void inventoryService.getSettings().then(setSettings); }, []);
  if (!settings) return <ModuleStateView state="loading" />;

  return (
    <Shell title={title} description={description} settings={settings}>
      <ModuleStateView state="empty" emptyHint={hint} />
    </Shell>
  );
}

export function InventoryTransfersPage() {
  return <Unavailable title="Transferencias" description="Reimplementacao planejada sobre o ledger novo." hint="Transferencias estao temporariamente indisponiveis nesta fase." />;
}

export function InventoryTransferDetailPage() {
  return <Unavailable title="Transferencia indisponivel" description="Este fluxo sera reimplementado em fase propria." hint="A rota direta de transferencias esta bloqueada temporariamente." />;
}

export function InventoryCountsPage() {
  return <Unavailable title="Inventario Fisico" description="Reimplementacao planejada sobre o ledger novo." hint="Contagens estao temporariamente indisponiveis nesta fase." />;
}

export function InventoryCountDetailPage() {
  return <Unavailable title="Contagem indisponivel" description="Este fluxo sera reimplementado em fase propria." hint="A rota direta de contagens esta bloqueada temporariamente." />;
}
