import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Copy, LayoutDashboard, Lock, Network, Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { analyticsService } from '../../../services/analyticsService';
import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import type { DashboardCatalog, DashboardTemplate, DashboardTemplateScope } from '../../../types/analytics';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 };
const input: React.CSSProperties = { padding: '9px 11px', border: '1px solid #CBD5E1', borderRadius: 8, background: '#fff' };
const button: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 };

function Shell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }}><div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 18 }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#6366F1', color: '#fff' }}><LayoutDashboard size={21} /></span><div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1><p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>{description}</p></div><Link to="/analytics" style={{ ...button, textDecoration: 'none', color: '#475569' }}>Meu dashboard</Link><Link to="/analytics/catalog" style={{ ...button, textDecoration: 'none', color: '#475569' }}>Catálogo</Link></header>
    {children}
  </div></div>;
}

const scopeLabel: Record<DashboardTemplateScope, string> = { network: 'Toda rede', unit: 'Unidades', role: 'Perfil', user: 'Usuário' };

export function AnalyticsTemplatesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const load = async () => { setLoading(true); try { setTemplates(await analyticsService.templates()); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const widgets = await analyticsService.widgets();
      const template = await analyticsService.createTemplate({ name: name.trim(), description: 'Criado a partir do dashboard atual.', widgets });
      toast.success('Template criado.'); navigate(`/analytics/templates/${template.id}`);
    } finally { setCreating(false); }
  };
  const remove = async (template: DashboardTemplate) => {
    if (!window.confirm(`Excluir o template "${template.name}"?`)) return;
    await analyticsService.deleteTemplate(template.id); toast.success('Template excluído.'); await load();
  };
  const columns = useMemo<ColumnDef[]>(() => [
    { key: 'name', label: 'Nome' }, { key: 'scope', label: 'Escopo' }, { key: 'profile', label: 'Perfil/alvo' },
    { key: 'status', label: 'Status' }, { key: 'default', label: 'Padrão' }, { key: 'lock', label: 'Bloqueado' },
  ], []);
  const rows = templates.map(template => ({
    id: template.id, name: template.name, scope: scopeLabel[template.targetScope], profile: template.targetIds.join(', ') || '—',
    status: template.published ? 'Publicado' : 'Rascunho', default: template.isDefault ? 'Sim' : 'Não', lock: template.locked ? 'Sim' : 'Não', source: template,
  }));
  if (loading && !templates.length) return <ModuleStateView state="loading" />;
  return <Shell title="Templates de Dashboard" description="Governança dos dashboards distribuídos para perfis, unidades e toda a rede.">
    {hasPermission('tenant.analytics.templates.create') && <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><input value={name} onChange={event => setName(event.target.value)} placeholder="Nome do novo template" style={{ ...input, flex: 1, minWidth: 240 }} /><button onClick={() => void create()} disabled={creating || !name.trim()} style={{ ...button, background: '#6366F1', color: '#fff', border: 0 }}><Plus size={14} />Criar a partir do dashboard atual</button></div>}
    <DynamicTableRenderer columns={columns} data={rows} keyField="id" emptyMessage="Nenhum template disponível." onRowClick={row => navigate(`/analytics/templates/${row.id}`)} actions={row => {
      const template = row.source as DashboardTemplate;
      return template.ownership === 'mine' && hasPermission('tenant.analytics.templates.delete') ? <button onClick={event => { event.stopPropagation(); void remove(template); }} style={{ ...button, color: '#DC2626' }}><Trash2 size={13} />Excluir</button> : null;
    }} />
  </Shell>;
}

export function AnalyticsTemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [template, setTemplate] = useState<DashboardTemplate | null>(null);
  const [scope, setScope] = useState<DashboardTemplateScope>('network');
  const [targets, setTargets] = useState('');
  const [locked, setLocked] = useState(true);
  const load = async () => { if (id) setTemplate(await analyticsService.template(id)); };
  useEffect(() => { void load(); }, [id]);
  if (!template) return <ModuleStateView state="loading" />;
  const clone = async () => { const copy = await analyticsService.cloneTemplate(template.id); toast.success('Sua versão foi criada.'); navigate(`/analytics/templates/${copy.id}`); };
  const publish = async () => {
    const targetIds = scope === 'network' ? [] : targets.split(',').map(value => value.trim()).filter(Boolean).map(value => scope === 'unit' || scope === 'user' ? Number(value) : value);
    const next = await analyticsService.publishTemplate(template.id, { target_scope: scope, target_ids: targetIds, is_default: true, locked });
    setTemplate(next); toast.success('Template publicado para o escopo selecionado.');
  };
  return <Shell title={template.name} description={template.description ?? 'Configuração do template corporativo.'}>
    {template.locked && <div style={{ ...card, background: '#F5F3FF', color: '#6D28D9' }}><Lock size={15} style={{ display: 'inline', marginRight: 7 }} />Dashboard corporativo bloqueado para alterações dos destinatários.</div>}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <section style={card}><h2 style={{ marginTop: 0, fontSize: 16 }}>Widgets ({template.widgets.length})</h2><div style={{ display: 'grid', gap: 8 }}>{template.widgets.map(widget => <div key={widget.id} style={{ padding: 12, background: '#F8FAFC', borderRadius: 9, display: 'flex', justifyContent: 'space-between' }}><strong>{String(widget.config.title ?? widget.metricKey)}</strong><span style={{ color: '#64748B', fontSize: 12 }}>{widget.viewType} · posição {widget.position + 1}</span></div>)}</div></section>
      <aside style={{ display: 'grid', gap: 12, alignContent: 'start' }}><div style={card}><strong>Status</strong><p style={{ color: '#64748B', fontSize: 12 }}>{template.published ? 'Publicado' : 'Rascunho'} · {scopeLabel[template.targetScope]}</p><button onClick={() => void clone()} style={{ ...button, width: '100%', justifyContent: 'center' }}><Copy size={14} />Criar Minha Versão</button></div></aside>
    </div>
    {template.ownership === 'mine' && hasPermission('tenant.analytics.templates.publish') && <section style={card}><h2 style={{ marginTop: 0, fontSize: 16 }}><Send size={16} /> Publicar para rede</h2><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><select value={scope} onChange={event => setScope(event.target.value as DashboardTemplateScope)} style={input}><option value="network">Toda rede</option><option value="role">Perfil</option><option value="unit">Unidades</option><option value="user">Usuários</option></select>{scope !== 'network' && <input value={targets} onChange={event => setTargets(event.target.value)} placeholder={scope === 'role' ? 'financeiro, comercial' : 'IDs separados por vírgula'} style={{ ...input, minWidth: 260 }} />}<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={locked} onChange={event => setLocked(event.target.checked)} />Bloquear edição</label><button onClick={() => void publish()} style={{ ...button, background: '#6366F1', color: '#fff', border: 0 }}><Network size={14} />Publicar</button></div></section>}
  </Shell>;
}

export function AnalyticsCatalogPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<DashboardCatalog | null>(null);
  useEffect(() => { void analyticsService.catalog().then(setCatalog); }, []);
  if (!catalog) return <ModuleStateView state="loading" />;
  const sections: Array<[string, DashboardTemplate[]]> = [['Meus templates', catalog.mine], ['Templates da rede', catalog.network], ['Compartilhados comigo', catalog.shared]];
  return <Shell title="Catálogo de Dashboards" description="Dashboards prontos para Diretoria, Financeiro, Operação, Comercial e Franqueados.">
    {sections.map(([title, templates]) => <section key={title}><h2 style={{ fontSize: 16 }}>{title}</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>{templates.map(template => <button key={template.id} onClick={() => navigate(`/analytics/templates/${template.id}`)} style={{ ...card, textAlign: 'left', cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{template.name}</strong>{template.locked && <Lock size={14} color="#7C3AED" />}</div><p style={{ color: '#64748B', fontSize: 12, minHeight: 34 }}>{template.description ?? 'Dashboard compartilhado pela rede.'}</p><span style={{ color: '#6366F1', fontSize: 11, fontWeight: 700 }}>{scopeLabel[template.targetScope]} · {template.widgets.length} widgets</span></button>)}</div>{!templates.length && <p style={{ color: '#94A3B8', fontSize: 12 }}>Nenhum dashboard nesta categoria.</p>}</section>)}
  </Shell>;
}
