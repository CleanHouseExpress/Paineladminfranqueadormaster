import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, ArrowRight, Check, CircleDollarSign, Clock3, Edit3, GripVertical,
  LayoutDashboard, ListFilter, Loader2, Plus, Save, Settings2, Target, Trash2,
  TrendingUp, Trophy, UserRoundCheck, UsersRound, X, XCircle,
} from 'lucide-react';
import { crmService } from '../../../services/crmService';
import { ApiError } from '../../../services/apiClient';
import {
  ACTIVITY_TYPE_CONFIG, LEAD_ORIGIN_CONFIG, LEAD_STATUS_CONFIG,
  type ActivityType, type CrmActivity, type CrmLead, type CrmMetrics,
  type CrmOption, type CrmPipeline, type CrmStage, type LeadOrigin, type LeadStatus,
} from '../../../types/crm';

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 3px rgba(15,23,42,.04)' };
const input = { width: '100%', border: '1px solid #CBD5E1', borderRadius: 9, padding: '9px 11px', background: '#fff', color: '#0F172A', boxSizing: 'border-box' as const };
const button = { border: 0, borderRadius: 9, padding: '9px 14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 };
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const date = (value?: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

function Page({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: '100%', background: '#F8FAFC', padding: 24 }}>{children}</div>;
}
function Header({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
    <div><h1 style={{ margin: 0, fontSize: 26, color: '#0F172A' }}>{title}</h1>{description && <p style={{ margin: '5px 0 0', color: '#64748B' }}>{description}</p>}</div>{action}
  </div>;
}
function CrmNav() {
  const { pathname } = useLocation();
  const links = [['Visão Geral', '/crm'], ['Kanban', '/crm/kanban'], ['Leads', '/crm/leads'], ['Pipelines', '/crm/pipelines'], ['Configurações', '/crm/settings']];
  return <div style={{ display: 'flex', gap: 5, marginBottom: 20, overflowX: 'auto' }}>{links.map(([label, to]) => {
    const active = pathname === to;
    return <Link key={to} to={to} style={{ whiteSpace: 'nowrap', textDecoration: 'none', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: active ? '#fff' : '#64748B', background: active ? '#4F46E5' : '#fff', border: `1px solid ${active ? '#4F46E5' : '#E2E8F0'}` }}>{label}</Link>;
  })}</div>;
}
function Busy() { return <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}><Loader2 size={24} className="animate-spin" /> Carregando...</div>; }
function Empty({ text }: { text: string }) { return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>{text}</div>; }
function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sua sessão não é válida nesta origem. Entre novamente usando esta mesma porta.';
    if (error.status === 403) return 'Seu usuário não possui a permissão tenant.crm.view.';
    if (error.status === 404) return 'Os endpoints do CRM não foram encontrados na API configurada.';
    return `A API do CRM respondeu com erro ${error.status}.`;
  }
  return 'Não foi possível conectar ao backend do CRM.';
}
function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div style={{ ...card, maxWidth: 620, margin: '50px auto', padding: 28, textAlign: 'center' }}>
    <XCircle size={30} color="#DC2626" />
    <h3 style={{ color: '#0F172A' }}>Não foi possível carregar o CRM</h3>
    <p style={{ color: '#64748B', lineHeight: 1.6 }}>{message}</p>
    <button onClick={retry} style={{ ...button, color: '#fff', background: '#4F46E5' }}>Tentar novamente</button>
  </div>;
}
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800, color, background: bg }}>{label}</span>;
}
function Score({ value }: { value: number }) {
  const color = value >= 70 ? '#059669' : value >= 40 ? '#D97706' : '#DC2626';
  return <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color, background: `${color}14`, border: `2px solid ${color}` }}>{value}</span>;
}

export function CrmDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<CrmMetrics>();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => {
    setLoading(true); setError('');
    Promise.all([crmService.metrics(), crmService.leads(), crmService.activities()])
      .then(([m, l, a]) => { setMetrics(m); setLeads(l); setActivities(a); })
      .catch(cause => setError(apiErrorMessage(cause)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  if (loading) return <Page><Busy /></Page>;
  if (error || !metrics) return <Page><ErrorState message={error || 'A resposta da API não contém as métricas esperadas.'} retry={load} /></Page>;
  const kpis = [
    ['Leads totais', metrics.totalLeads, Target, '#4F46E5'], ['Leads abertos', metrics.openLeads, UsersRound, '#2563EB'],
    ['Convertidos', metrics.convertedLeads, UserRoundCheck, '#7C3AED'], ['Perdidos', metrics.lostLeads, XCircle, '#DC2626'],
    ['Conversão', `${metrics.conversionRate}%`, TrendingUp, '#059669'], ['Valor estimado', money(metrics.estimatedValue), CircleDollarSign, '#D97706'],
    ['Atividades pendentes', metrics.pendingActivities, Clock3, '#DB2777'], ['Principal origem', metrics.topSources[0] ? LEAD_ORIGIN_CONFIG[metrics.topSources[0].source]?.label : '—', Trophy, '#0891B2'],
  ] as const;
  return <Page><Header title="CRM" description="Aquisição, relacionamento e conversão comercial." action={<button onClick={() => navigate('/crm/leads/new')} style={{ ...button, color: '#fff', background: '#4F46E5' }}><Plus size={16} /> Novo lead</button>} /><CrmNav />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>{kpis.map(([label, value, Icon, color]) => <div key={label} style={{ ...card, padding: 17 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B', fontSize: 12, fontWeight: 700 }}>{label}</span><Icon size={18} color={color} /></div><strong style={{ display: 'block', marginTop: 12, fontSize: 23, color: '#0F172A' }}>{value}</strong></div>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(280px,.7fr)', gap: 16 }}>
      <section style={{ ...card, padding: 20 }}><h3 style={{ marginTop: 0 }}>Funil comercial</h3>{metrics.totalLeads === 0 ? <Empty text="Ainda não há dados no funil." /> : [
        ['Leads', metrics.totalLeads, '#6366F1'], ['Abertos', metrics.openLeads, '#3B82F6'], ['Convertidos', metrics.convertedLeads, '#10B981'], ['Perdidos', metrics.lostLeads, '#EF4444'],
      ].map(([label, total, color]) => <div key={String(label)} style={{ margin: '13px 0' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><b>{label}</b><span>{total}</span></div><div style={{ height: 10, background: '#F1F5F9', borderRadius: 99, marginTop: 5 }}><div style={{ height: '100%', borderRadius: 99, background: String(color), width: `${Math.max(4, Number(total) / metrics.totalLeads * 100)}%` }} /></div></div>)}</section>
      <section style={{ ...card, padding: 20 }}><h3 style={{ marginTop: 0 }}>Atividades pendentes</h3>{activities.filter(a => !a.completedAt).slice(0, 5).map(a => <div key={a.id} style={{ borderBottom: '1px solid #F1F5F9', padding: '10px 0' }}><b style={{ fontSize: 13 }}>{a.title}</b><div style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>{a.leadName} · {date(a.dueDate)}</div></div>)}{!activities.some(a => !a.completedAt) && <Empty text="Nenhuma atividade pendente." />}</section>
    </div>
    <section style={{ ...card, marginTop: 16, padding: 20 }}><h3 style={{ marginTop: 0 }}>Leads recentes</h3>{leads.slice(0, 6).map(lead => <div key={lead.id} onClick={() => navigate(`/crm/leads/${lead.id}`)} style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}><div style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 11, background: '#EEF2FF', color: '#4F46E5', fontWeight: 800 }}>{initials(lead.name)}</div><div><b>{lead.name}</b><div style={{ fontSize: 12, color: '#64748B' }}>{lead.stageName} · {lead.assignedUserName || 'Sem responsável'}</div></div><Score value={lead.score} /><b>{money(lead.estimatedValue)}</b></div>)}</section>
  </Page>;
}

export function CrmKanban() {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineId, setPipelineId] = useState('');
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [dragId, setDragId] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const pipes = await crmService.pipelines(); const selected = pipelineId || pipes.find(p => p.isDefault)?.id || pipes[0]?.id || '';
    setPipelines(pipes); setPipelineId(selected); setLeads(selected ? await crmService.leads({ pipelineId: selected }) : []); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (pipelineId) crmService.leads({ pipelineId }).then(setLeads); }, [pipelineId]);
  const pipeline = pipelines.find(p => p.id === pipelineId);
  const move = async (leadId: string, stageId: string) => {
    const previous = leads; setLeads(items => items.map(item => item.id === leadId ? { ...item, stageId, stageName: pipeline?.stages.find(s => s.id === stageId)?.name || item.stageName } : item));
    try { await crmService.moveLead(leadId, stageId); } catch { setLeads(previous); }
  };
  if (loading) return <Page><Busy /></Page>;
  return <Page><Header title="Kanban comercial" description="Mova oportunidades entre os estágios do pipeline." action={<button onClick={() => navigate('/crm/leads/new')} style={{ ...button, color: '#fff', background: '#4F46E5' }}><Plus size={16} /> Novo lead</button>} /><CrmNav />
    <select value={pipelineId} onChange={e => setPipelineId(e.target.value)} style={{ ...input, maxWidth: 300, marginBottom: 16 }}>{pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>{pipeline?.stages.filter(s => s.active).map((stage, index) => {
      const items = leads.filter(l => l.stageId === stage.id);
      return <div key={stage.id} onDragOver={e => e.preventDefault()} onDrop={() => dragId && move(dragId, stage.id)} style={{ minWidth: 292, maxWidth: 292, background: '#F1F5F9', borderRadius: 14, borderTop: `4px solid ${stage.color}`, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><div><b>{stage.name}</b><div style={{ color: '#64748B', fontSize: 11 }}>{items.length} leads · {money(items.reduce((sum, lead) => sum + lead.estimatedValue, 0))}</div></div><span style={{ background: '#fff', borderRadius: 99, padding: '4px 8px', fontSize: 12 }}>{items.length}</span></div>
        {items.map(lead => <article key={lead.id} draggable onDragStart={() => setDragId(lead.id)} style={{ ...card, padding: 13, marginBottom: 10, cursor: 'grab' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b onClick={() => navigate(`/crm/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>{lead.name}</b><Score value={lead.score} /></div><div style={{ fontSize: 12, color: '#64748B', margin: '7px 0' }}>{lead.phone || 'Sem telefone'}</div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Badge {...LEAD_ORIGIN_CONFIG[lead.origin]} /><b style={{ fontSize: 12 }}>{money(lead.estimatedValue)}</b></div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 11 }}><button disabled={index === 0} onClick={() => move(lead.id, pipeline.stages[index - 1].id)} style={{ ...button, padding: 6, background: '#F8FAFC' }}><ArrowLeft size={14} /></button><span style={{ fontSize: 11, color: '#64748B' }}>{lead.assignedUserName || 'Sem responsável'}</span><button disabled={index === pipeline.stages.length - 1} onClick={() => move(lead.id, pipeline.stages[index + 1].id)} style={{ ...button, padding: 6, background: '#F8FAFC' }}><ArrowRight size={14} /></button></div></article>)}<button onClick={() => navigate(`/crm/leads/new?stageId=${stage.id}&pipelineId=${pipeline.id}`)} style={{ ...button, width: '100%', justifyContent: 'center', color: '#64748B', background: 'transparent' }}><Plus size={14} /> Adicionar</button>
      </div>;
    })}</div>
  </Page>;
}

export function CrmLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [filters, setFilters] = useState({ search: '', pipelineId: '', stageId: '', status: '', origin: '' });
  const [loading, setLoading] = useState(true);
  useEffect(() => { crmService.pipelines().then(setPipelines); }, []);
  useEffect(() => { const timer = setTimeout(() => crmService.leads(filters as any).then(setLeads).finally(() => setLoading(false)), 250); return () => clearTimeout(timer); }, [filters]);
  const stages = pipelines.find(p => p.id === filters.pipelineId)?.stages ?? pipelines.flatMap(p => p.stages);
  return <Page><Header title="Leads" description="Lista completa das oportunidades comerciais." action={<button onClick={() => navigate('/crm/leads/new')} style={{ ...button, color: '#fff', background: '#4F46E5' }}><Plus size={16} /> Novo lead</button>} /><CrmNav />
    <div style={{ ...card, padding: 14, display: 'grid', gridTemplateColumns: '2fr repeat(4,minmax(130px,1fr))', gap: 10, marginBottom: 14 }}><input placeholder="Buscar nome, e-mail, telefone..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} style={input} /><select value={filters.pipelineId} onChange={e => setFilters({ ...filters, pipelineId: e.target.value, stageId: '' })} style={input}><option value="">Todos os pipelines</option>{pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={filters.stageId} onChange={e => setFilters({ ...filters, stageId: e.target.value })} style={input}><option value="">Todos os estágios</option>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={input}><option value="">Todos os status</option>{Object.entries(LEAD_STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}</select><select value={filters.origin} onChange={e => setFilters({ ...filters, origin: e.target.value })} style={input}><option value="">Todas as origens</option>{Object.entries(LEAD_ORIGIN_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}</select></div>
    <div style={{ ...card, overflow: 'auto' }}>{loading ? <Busy /> : leads.length === 0 ? <Empty text="Nenhum lead encontrado." /> : <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1050 }}><thead><tr>{['Lead', 'Origem', 'Pipeline', 'Estágio', 'Status', 'Score', 'Valor', 'Responsável', 'Criado em'].map(h => <th key={h} style={{ textAlign: 'left', padding: 13, color: '#64748B', fontSize: 11, background: '#F8FAFC' }}>{h}</th>)}</tr></thead><tbody>{leads.map(lead => <tr key={lead.id} onClick={() => navigate(`/crm/leads/${lead.id}`)} style={{ borderTop: '1px solid #F1F5F9', cursor: 'pointer' }}><td style={{ padding: 13 }}><b>{lead.name}</b><div style={{ fontSize: 11, color: '#64748B' }}>{lead.email || lead.phone || '—'}</div></td><td><Badge {...LEAD_ORIGIN_CONFIG[lead.origin]} /></td><td>{lead.pipelineName}</td><td><span style={{ color: lead.stageColor, fontWeight: 700 }}>{lead.stageName}</span></td><td><Badge {...LEAD_STATUS_CONFIG[lead.status]} /></td><td><Score value={lead.score} /></td><td><b>{money(lead.estimatedValue)}</b></td><td>{lead.assignedUserName || '—'}</td><td>{date(lead.createdAt)}</td></tr>)}</tbody></table>}</div>
  </Page>;
}

export function CrmLeadForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [units, setUnits] = useState<CrmOption[]>([]);
  const [users, setUsers] = useState<CrmOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '', pipelineId: params.get('pipelineId') || '', stageId: params.get('stageId') || '', origin: 'manual' as LeadOrigin, unitId: '', assignedUserId: '', estimatedValue: 0, score: 50, notes: '' });
  useEffect(() => { Promise.all([crmService.pipelines(), crmService.units().catch(() => []), crmService.users().catch(() => [])]).then(([p, u, us]) => { setPipelines(p); setUnits(u); setUsers(us); setForm(current => ({ ...current, pipelineId: current.pipelineId || p.find(x => x.isDefault)?.id || p[0]?.id || '' })); }); }, []);
  useEffect(() => { if (id) crmService.lead(id).then(lead => setForm({ name: lead.name, email: lead.email || '', phone: lead.phone || '', document: lead.document || '', pipelineId: lead.pipelineId, stageId: lead.stageId, origin: lead.origin, unitId: lead.unitId || '', assignedUserId: lead.assignedUserId || '', estimatedValue: lead.estimatedValue, score: lead.score, notes: lead.notes || '' })); }, [id]);
  const stages = pipelines.find(p => p.id === form.pipelineId)?.stages ?? [];
  useEffect(() => { if (stages.length && !stages.some(s => s.id === form.stageId)) setForm(current => ({ ...current, stageId: stages[0].id })); }, [form.pipelineId, pipelines.length]);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { const lead = id ? await crmService.updateLead(id, form) : await crmService.createLead(form); navigate(`/crm/leads/${lead.id}`); } finally { setSaving(false); } };
  const field = (key: keyof typeof form, label: string, type = 'text') => <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700 }}>{label}<input type={type} value={String(form[key])} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })} style={input} /></label>;
  return <Page><Header title={id ? 'Editar lead' : 'Novo lead'} description="Cadastre a oportunidade e posicione-a no pipeline." action={<button onClick={() => navigate(-1)} style={{ ...button, background: '#fff', border: '1px solid #E2E8F0' }}><X size={15} /> Cancelar</button>} />
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16 }}><div>
      <section style={{ ...card, padding: 20, marginBottom: 16 }}><h3 style={{ marginTop: 0 }}>Dados do lead</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>{field('name', 'Nome *')}{field('email', 'E-mail', 'email')}{field('phone', 'Telefone')}{field('document', 'Documento')}</div></section>
      <section style={{ ...card, padding: 20 }}><h3 style={{ marginTop: 0 }}>Origem</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>{Object.entries(LEAD_ORIGIN_CONFIG).map(([value, cfg]) => <button type="button" key={value} onClick={() => setForm({ ...form, origin: value as LeadOrigin })} style={{ ...button, justifyContent: 'center', color: cfg.color, background: form.origin === value ? cfg.bg : '#fff', border: `2px solid ${form.origin === value ? cfg.color : '#E2E8F0'}` }}>{cfg.label}</button>)}</div><label style={{ display: 'grid', gap: 6, marginTop: 16, fontSize: 12, fontWeight: 700 }}>Observações<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={5} style={input} /></label></section>
    </div><aside><section style={{ ...card, padding: 20, marginBottom: 16 }}><h3 style={{ marginTop: 0 }}>Pipeline</h3><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700 }}>Pipeline<select value={form.pipelineId} onChange={e => setForm({ ...form, pipelineId: e.target.value, stageId: '' })} style={input}>{pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label style={{ display: 'grid', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700 }}>Estágio<select value={form.stageId} onChange={e => setForm({ ...form, stageId: e.target.value })} style={input}>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></section>
      <section style={{ ...card, padding: 20, marginBottom: 16 }}><h3 style={{ marginTop: 0 }}>Qualificação</h3>{field('estimatedValue', 'Valor estimado', 'number')}<label style={{ display: 'grid', gap: 7, marginTop: 14, fontSize: 12, fontWeight: 700 }}>Score: {form.score}<input type="range" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: Number(e.target.value) })} /></label><label style={{ display: 'grid', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700 }}>Responsável<select value={form.assignedUserId} onChange={e => setForm({ ...form, assignedUserId: e.target.value })} style={input}><option value="">Sem responsável</option>{users.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label style={{ display: 'grid', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700 }}>Unidade<select value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })} style={input}><option value="">Sem unidade</option>{units.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label></section>
      <button disabled={saving || !form.name || !form.pipelineId || !form.stageId} style={{ ...button, width: '100%', justifyContent: 'center', color: '#fff', background: '#4F46E5' }}>{saving ? <Loader2 size={16} /> : <Save size={16} />} Salvar lead</button></aside></form>
  </Page>;
}

export function CrmLeadDetail() {
  const { id = '' } = useParams(); const navigate = useNavigate();
  const [lead, setLead] = useState<CrmLead>(); const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState({ type: 'call' as ActivityType, title: '', description: '', dueDate: '' });
  const load = () => crmService.lead(id).then(setLead); useEffect(load, [id]);
  if (!lead) return <Page><Busy /></Page>;
  const act = async (action: 'won' | 'lost' | 'convert') => {
    if (action === 'won') setLead(await crmService.winLead(id));
    if (action === 'lost') { const reason = window.prompt('Motivo da perda:'); if (reason) setLead(await crmService.loseLead(id, reason)); }
    if (action === 'convert') setLead(await crmService.convertLead(id));
  };
  const addActivity = async (event: FormEvent) => { event.preventDefault(); await crmService.createActivity({ leadId: id, ...activity }); setActivityOpen(false); setActivity({ type: 'call', title: '', description: '', dueDate: '' }); load(); };
  return <Page><Header title={lead.name} description={`${lead.pipelineName} · ${lead.stageName}`} action={<div style={{ display: 'flex', gap: 8 }}><button onClick={() => navigate(`/crm/leads/${id}/edit`)} style={{ ...button, background: '#fff', border: '1px solid #E2E8F0' }}><Edit3 size={15} /> Editar</button>{lead.status === 'open' && <><button onClick={() => act('lost')} style={{ ...button, color: '#B91C1C', background: '#FEF2F2' }}>Perdido</button><button onClick={() => act('won')} style={{ ...button, color: '#047857', background: '#ECFDF5' }}>Ganho</button></>}{lead.status === 'won' && <button onClick={() => act('convert')} style={{ ...button, color: '#fff', background: '#7C3AED' }}><UserRoundCheck size={15} /> Converter cliente</button>}</div>} />
    {lead.customerId && <div style={{ ...card, padding: 15, marginBottom: 16, background: '#ECFDF5', borderColor: '#A7F3D0' }}><b style={{ color: '#047857' }}>Cliente vinculado:</b> {lead.customerName || `#${lead.customerId}`} <Link to={`/customers/${lead.customerId}`} style={{ marginLeft: 10, color: '#047857' }}>Ver cliente →</Link></div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 16 }}><main><section style={{ ...card, padding: 20, marginBottom: 16 }}><h3 style={{ marginTop: 0 }}>Dados gerais</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>{[['Status', <Badge {...LEAD_STATUS_CONFIG[lead.status]} />], ['Origem', <Badge {...LEAD_ORIGIN_CONFIG[lead.origin]} />], ['Score', <Score value={lead.score} />], ['Telefone', lead.phone || '—'], ['E-mail', lead.email || '—'], ['Documento', lead.document || '—'], ['Responsável', lead.assignedUserName || '—'], ['Unidade', lead.unitName || '—'], ['Valor estimado', money(lead.estimatedValue)]].map(([label, value]) => <div key={String(label)}><div style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>{label}</div><b>{value}</b></div>)}</div>{lead.notes && <p style={{ margin: '20px 0 0', color: '#475569' }}>{lead.notes}</p>}</section>
      <section style={{ ...card, padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ marginTop: 0 }}>Atividades</h3><button onClick={() => setActivityOpen(true)} style={{ ...button, background: '#EEF2FF', color: '#4F46E5' }}><Plus size={14} /> Nova atividade</button></div>{lead.activities?.map(a => <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', gap: 12, padding: '13px 0', borderBottom: '1px solid #F1F5F9' }}><span style={{ width: 9, height: 9, borderRadius: 99, marginTop: 5, background: ACTIVITY_TYPE_CONFIG[a.type].color }} /><div><b>{a.title}</b><div style={{ fontSize: 12, color: '#64748B' }}>{ACTIVITY_TYPE_CONFIG[a.type].label} · {a.assignedUserName || 'Sem responsável'} · {date(a.dueDate)}</div></div>{a.completedAt ? <Badge label="Concluída" color="#047857" bg="#ECFDF5" /> : <button onClick={() => crmService.completeActivity(a.id).then(load)} style={{ ...button, padding: 7, background: '#F8FAFC' }}><Check size={14} /></button>}</div>)}{!lead.activities?.length && <Empty text="Nenhuma atividade registrada." />}</section></main>
      <aside><section style={{ ...card, padding: 20 }}><h3 style={{ marginTop: 0 }}>Oportunidade</h3><div style={{ borderLeft: `3px solid ${lead.stageColor}`, paddingLeft: 12 }}><b>{lead.stageName}</b><div style={{ fontSize: 12, color: '#64748B' }}>{lead.pipelineName}</div></div><div style={{ marginTop: 18, fontSize: 12, color: '#64748B' }}>Criado em {date(lead.createdAt)}</div>{lead.lostReason && <div style={{ marginTop: 15, padding: 12, borderRadius: 9, background: '#FEF2F2', color: '#B91C1C' }}><b>Motivo da perda</b><div>{lead.lostReason}</div></div>}</section></aside></div>
    {activityOpen && <div style={{ position: 'fixed', inset: 0, background: '#0F172A80', display: 'grid', placeItems: 'center', zIndex: 50 }}><form onSubmit={addActivity} style={{ ...card, width: 460, padding: 22 }}><h3 style={{ marginTop: 0 }}>Nova atividade</h3><select value={activity.type} onChange={e => setActivity({ ...activity, type: e.target.value as ActivityType })} style={{ ...input, marginBottom: 10 }}>{Object.entries(ACTIVITY_TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}</select><input required placeholder="Título" value={activity.title} onChange={e => setActivity({ ...activity, title: e.target.value })} style={{ ...input, marginBottom: 10 }} /><input type="datetime-local" value={activity.dueDate} onChange={e => setActivity({ ...activity, dueDate: e.target.value })} style={{ ...input, marginBottom: 10 }} /><textarea placeholder="Descrição" value={activity.description} onChange={e => setActivity({ ...activity, description: e.target.value })} style={input} rows={4} /><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 15 }}><button type="button" onClick={() => setActivityOpen(false)} style={{ ...button, background: '#F1F5F9' }}>Cancelar</button><button style={{ ...button, color: '#fff', background: '#4F46E5' }}>Salvar</button></div></form></div>}
  </Page>;
}

export function CrmPipelines() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]); const [selectedId, setSelectedId] = useState('');
  const [pipelineName, setPipelineName] = useState(''); const [stageName, setStageName] = useState('');
  const load = () => crmService.pipelines().then(items => { setPipelines(items); setSelectedId(current => current || items[0]?.id || ''); });
  useEffect(load, []); const selected = pipelines.find(p => p.id === selectedId);
  const addPipeline = async () => { if (!pipelineName.trim()) return; await crmService.createPipeline({ name: pipelineName, active: true, isDefault: pipelines.length === 0, stages: [] }); setPipelineName(''); load(); };
  const addStage = async () => { if (!selected || !stageName.trim()) return; await crmService.createStage({ pipelineId: selected.id, name: stageName, position: selected.stages.length + 1, color: '#6366F1', isWon: false, isLost: false, active: true, id: '' }); setStageName(''); load(); };
  return <Page><Header title="Pipelines e estágios" description="Configure os funis comerciais e suas etapas." /><CrmNav /><div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 16 }}><aside style={{ ...card, padding: 16 }}><h3 style={{ marginTop: 0 }}>Pipelines</h3>{pipelines.map(p => <button key={p.id} onClick={() => setSelectedId(p.id)} style={{ width: '100%', textAlign: 'left', padding: 12, marginBottom: 7, borderRadius: 10, border: `1px solid ${selectedId === p.id ? '#818CF8' : '#E2E8F0'}`, background: selectedId === p.id ? '#EEF2FF' : '#fff', cursor: 'pointer' }}><b>{p.name}</b><div style={{ fontSize: 11, color: '#64748B' }}>{p.stages.length} estágios {p.isDefault && '· padrão'}</div></button>)}<div style={{ display: 'flex', gap: 6, marginTop: 12 }}><input placeholder="Novo pipeline" value={pipelineName} onChange={e => setPipelineName(e.target.value)} style={input} /><button onClick={addPipeline} style={{ ...button, color: '#fff', background: '#4F46E5', padding: 9 }}><Plus size={15} /></button></div></aside>
    <main style={{ ...card, padding: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><h3 style={{ margin: 0 }}>{selected?.name || 'Selecione um pipeline'}</h3><p style={{ color: '#64748B', fontSize: 12 }}>{selected?.description}</p></div>{selected && <button onClick={async () => { await crmService.updatePipeline(selected.id, { isDefault: true }); load(); }} style={{ ...button, background: '#FFFBEB', color: '#B45309' }}>{selected.isDefault ? 'Pipeline padrão' : 'Definir como padrão'}</button>}</div>{selected?.stages.map(stage => <div key={stage.id} style={{ display: 'grid', gridTemplateColumns: '30px 16px 1fr auto auto', gap: 12, alignItems: 'center', padding: 13, border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 8 }}><GripVertical size={16} color="#94A3B8" /><span style={{ width: 12, height: 12, borderRadius: 99, background: stage.color }} /><div><b>{stage.name}</b><div style={{ fontSize: 11, color: '#64748B' }}>Posição {stage.position}</div></div>{stage.isWon && <Badge label="Ganho" color="#047857" bg="#ECFDF5" />}{stage.isLost && <Badge label="Perdido" color="#B91C1C" bg="#FEF2F2" />}<button onClick={async () => { if (window.confirm('Excluir este estágio?')) { await crmService.deleteStage(stage.id); load(); } }} style={{ ...button, padding: 7, color: '#DC2626', background: '#FEF2F2' }}><Trash2 size={14} /></button></div>)}{selected && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><input placeholder="Nome do novo estágio" value={stageName} onChange={e => setStageName(e.target.value)} style={input} /><button onClick={addStage} style={{ ...button, color: '#fff', background: '#4F46E5' }}><Plus size={15} /> Adicionar estágio</button></div>}</main></div>
  </Page>;
}

export function CrmSettings() {
  const entities = [{ key: 'crm_leads', label: 'Leads' }, { key: 'crm_activities', label: 'Atividades' }, { key: 'crm_pipelines', label: 'Pipelines' }, { key: 'crm_stages', label: 'Estágios' }];
  const [entity, setEntity] = useState(entities[0].key); const [metadata, setMetadata] = useState<any>(); const [saving, setSaving] = useState(false);
  useEffect(() => { setMetadata(undefined); crmService.metadata(entity).then(response => setMetadata(response.data)); }, [entity]);
  const fields = Array.isArray(metadata?.form_schema) ? metadata.form_schema : [];
  const save = async () => { setSaving(true); try { await crmService.updateMetadata(entity, metadata); } finally { setSaving(false); } };
  return <Page><Header title="Configurações do CRM" description="Personalize labels, campos e colunas pelo Metadata Engine." action={<button onClick={save} disabled={!metadata || saving} style={{ ...button, color: '#fff', background: '#4F46E5' }}><Save size={15} /> Salvar configurações</button>} /><CrmNav /><div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0,1fr)', gap: 16 }}><aside style={{ ...card, padding: 12 }}>{entities.map(item => <button key={item.key} onClick={() => setEntity(item.key)} style={{ ...button, width: '100%', marginBottom: 5, justifyContent: 'flex-start', color: entity === item.key ? '#4F46E5' : '#475569', background: entity === item.key ? '#EEF2FF' : '#fff' }}><Settings2 size={15} /> {item.label}</button>)}</aside><main style={{ ...card, padding: 22 }}>{!metadata ? <Busy /> : <><h3 style={{ marginTop: 0 }}>Labels</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}><label style={{ fontSize: 12, fontWeight: 700 }}>Singular<input value={metadata.singular_label || ''} onChange={e => setMetadata({ ...metadata, singular_label: e.target.value })} style={{ ...input, marginTop: 6 }} /></label><label style={{ fontSize: 12, fontWeight: 700 }}>Plural<input value={metadata.plural_label || ''} onChange={e => setMetadata({ ...metadata, plural_label: e.target.value })} style={{ ...input, marginTop: 6 }} /></label></div><h3>Campos</h3>{fields.map((field: any, index: number) => <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'center', padding: 11, borderTop: '1px solid #F1F5F9' }}><b>{field.key}</b><input value={field.label || ''} onChange={e => { const next = [...fields]; next[index] = { ...field, label: e.target.value }; setMetadata({ ...metadata, form_schema: next }); }} style={input} /><label style={{ fontSize: 12 }}><input type="checkbox" checked={field.visible !== false} onChange={e => { const next = [...fields]; next[index] = { ...field, visible: e.target.checked }; setMetadata({ ...metadata, form_schema: next }); }} /> Visível</label><label style={{ fontSize: 12 }}><input type="checkbox" checked={Boolean(field.required)} onChange={e => { const next = [...fields]; next[index] = { ...field, required: e.target.checked }; setMetadata({ ...metadata, form_schema: next }); }} /> Obrigatório</label></div>)}</>}</main></div>
  </Page>;
}
