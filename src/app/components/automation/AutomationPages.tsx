import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AlertTriangle, CheckCircle2, Clock3, ListTodo, Plus, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { automationService } from '../../../services/automationService';
import { DynamicFormRenderer } from '../../../shared/components/DynamicFormRenderer';
import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import type { DynamicFieldSchema } from '../../../types/userManagement';
import type { ActionTask, AutomationRule } from '../../../types/automation';

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 };
const button: React.CSSProperties = { border: 0, borderRadius: 8, padding: '9px 13px', cursor: 'pointer', fontWeight: 600 };
const events = ['checklist.completed', 'checklist.overdue', 'training.completed', 'training.overdue', 'royalty.generated', 'royalty.overdue', 'cmv.threshold_exceeded', 'contract.expiring', 'contract.expired', 'lead.stale', 'lead.lost', 'sale.created', 'sale.cancelled', 'inventory.low_stock', 'inventory.critical_stock'];
const ruleSchema: DynamicFieldSchema[] = [
  { key: 'name', label: 'Nome', type: 'text', required: true, order: 10 },
  { key: 'description', label: 'Descrição', type: 'textarea', order: 20 },
  { key: 'event_key', label: 'Evento', type: 'select', required: true, options: events.map(value => ({ label: value, value })), order: 30 },
  { key: 'conditions_json', label: 'Condições JSON', type: 'textarea', placeholder: '{"threshold": 40}', order: 40 },
  { key: 'action_type', label: 'Ação', type: 'select', required: true, options: [{ label: 'Criar tarefa', value: 'create_task' }, { label: 'Criar alerta NOC', value: 'create_noc_alert' }, { label: 'Somente auditoria', value: 'audit_only' }], order: 50 },
  { key: 'action_config_json', label: 'Configuração da ação JSON', type: 'textarea', placeholder: '{"title":"Ação necessária","priority":"high"}', order: 60 },
  { key: 'is_active', label: 'Ativa', type: 'boolean', order: 70 },
];
const priority = {
  low: { label: 'Baixa', color: '#0369A1', bg: '#E0F2FE' },
  medium: { label: 'Média', color: '#A16207', bg: '#FEF9C3' },
  high: { label: 'Alta', color: '#C2410C', bg: '#FFEDD5' },
  critical: { label: 'Crítica', color: '#B91C1C', bg: '#FEE2E2' },
};
const statuses = {
  open: { label: 'Aberta', color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'Em andamento', color: '#7C3AED', bg: '#EDE9FE' },
  completed: { label: 'Concluída', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelada', color: '#64748B', bg: '#F1F5F9' },
};

function Shell({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ padding: 24, display: 'grid', gap: 18 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><h1 style={{ margin: 0, fontSize: 25 }}>{title}</h1><p style={{ margin: '5px 0 0', color: '#64748B' }}>{description}</p></div>{action}</div>{children}</div>;
}

export function AutomationRulesPage() {
  const [rows, setRows] = useState<AutomationRule[]>([]); const [editing, setEditing] = useState<AutomationRule | null>(); const [values, setValues] = useState<Record<string, unknown>>({});
  const load = () => automationService.rules({ per_page: 100 }).then(result => setRows(result.data));
  useEffect(() => { void load(); }, []);
  const open = (rule?: AutomationRule) => { setEditing(rule ?? null); setValues(rule ? { ...rule, conditions_json: JSON.stringify(rule.conditions_json ?? {}, null, 2), action_config_json: JSON.stringify(rule.action_config_json ?? {}, null, 2) } : { event_key: events[0], action_type: 'create_task', is_active: true, conditions_json: '{}', action_config_json: '{}' }); };
  const save = async () => {
    try {
      const payload = { ...values, conditions_json: JSON.parse(String(values.conditions_json || '{}')), action_config_json: JSON.parse(String(values.action_config_json || '{}')) };
      editing ? await automationService.updateRule(editing.id, payload) : await automationService.createRule(payload);
      toast.success('Regra salva.'); setEditing(undefined); await load();
    } catch { toast.error('Revise os campos e os JSONs informados.'); }
  };
  const columns: ColumnDef[] = [
    { key: 'name', label: 'Regra' }, { key: 'event_key', label: 'Evento' }, { key: 'action_type', label: 'Ação' },
    { key: 'is_active', label: 'Ativa', type: 'boolean' },
  ];
  return <Shell title="Automation Engine" description="Evento → regra → ação → task" action={<button style={{ ...button, background: '#4F46E5', color: '#fff' }} onClick={() => open()}><Plus size={15} /> Nova regra</button>}>
    <DynamicTableRenderer columns={columns} data={rows as unknown as Record<string, unknown>[]} onRowClick={row => open(rows.find(item => item.id === row.id))} actions={[
      { label: 'Ativar/desativar', onClick: row => void automationService.toggleRule(Number(row.id)).then(load) },
      { label: 'Excluir', variant: 'danger', onClick: row => void automationService.deleteRule(Number(row.id)).then(load) },
    ]} />
    {editing !== undefined && <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,.45)', display: 'grid', placeItems: 'center' }}><div style={{ ...card, width: 'min(720px,92vw)', maxHeight: '90vh', overflow: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h2>{editing ? 'Editar regra' : 'Nova regra'}</h2><button onClick={() => setEditing(undefined)}><X /></button></div><DynamicFormRenderer schema={ruleSchema} values={values} onChange={(key, value) => setValues(current => ({ ...current, [key]: value }))} /><div style={{ textAlign: 'right', marginTop: 16 }}><button style={{ ...button, background: '#4F46E5', color: '#fff' }} onClick={() => void save()}>Salvar regra</button></div></div></div>}
  </Shell>;
}

const taskColumns: ColumnDef[] = [
  { key: 'title', label: 'Tarefa' }, { key: 'priority', label: 'Prioridade', type: 'badge', badgeConfig: priority },
  { key: 'status', label: 'Status', type: 'badge', badgeConfig: statuses }, { key: 'due_date', label: 'Prazo', type: 'date' },
  { key: 'unit_name', label: 'Unidade' }, { key: 'user_name', label: 'Responsável' }, { key: 'source_type', label: 'Origem' },
];

export function TasksPage() {
  const navigate = useNavigate(); const [rows, setRows] = useState<ActionTask[]>([]); const [metrics, setMetrics] = useState({ open: 0, overdue: 0, critical: 0, completed_today: 0, completed: 0 }); const [scope, setScope] = useState('');
  const load = async () => { const [page, values] = await Promise.all([automationService.tasks({ per_page: 100, scope: scope || undefined }), automationService.metrics()]); setRows(page.data); setMetrics(values); };
  useEffect(() => { void load(); }, [scope]);
  const data = useMemo(() => rows.map(task => ({ ...task, unit_name: task.assigned_unit?.name ?? '—', user_name: task.assigned_user?.name ?? '—' })), [rows]);
  const cards = [['Abertas', metrics.open, ListTodo, '#2563EB'], ['Vencidas', metrics.overdue, Clock3, '#DC2626'], ['Críticas', metrics.critical, AlertTriangle, '#B91C1C'], ['Concluídas hoje', metrics.completed_today, CheckCircle2, '#059669']] as const;
  return <Shell title="Tasks & Action Center" description="Priorize e acompanhe as ações geradas pela operação">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>{cards.map(([label, value, Icon, color]) => <div key={label} style={card}><Icon size={18} color={color} /><strong style={{ display: 'block', marginTop: 9, fontSize: 27, color }}>{value}</strong><span style={{ color: '#64748B', fontSize: 12 }}>{label}</span></div>)}</div>
    <div style={{ display: 'flex', gap: 8 }}>{[['', 'Todas'], ['open', 'Pendentes'], ['overdue', 'Em atraso'], ['completed', 'Concluídas']].map(([value, label]) => <button key={value} style={{ ...button, background: scope === value ? '#4F46E5' : '#E2E8F0', color: scope === value ? '#fff' : '#475569' }} onClick={() => setScope(value)}>{label}</button>)}</div>
    <DynamicTableRenderer columns={taskColumns} data={data as unknown as Record<string, unknown>[]} searchable onRowClick={row => navigate(`/tasks/${row.id}`)} />
  </Shell>;
}

export function TaskDetailPage() {
  const { id = '' } = useParams(); const [task, setTask] = useState<ActionTask>();
  const load = () => automationService.task(id).then(setTask); useEffect(() => { void load(); }, [id]);
  if (!task) return <Shell title="Detalhe da tarefa" description="Carregando..."><div style={card}>Carregando...</div></Shell>;
  const act = async (action: 'complete' | 'cancel' | 'reopen') => { await ({ complete: automationService.completeTask, cancel: automationService.cancelTask, reopen: automationService.reopenTask }[action])(task.id); await load(); };
  return <Shell title={task.title} description={`Origem: ${task.source_type ?? 'manual'}`} action={<button style={{ ...button, background: '#E2E8F0' }} onClick={() => void load()}><RefreshCw size={15} /></button>}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}><div style={card}><h3>Descrição</h3><p style={{ color: '#475569' }}>{task.description || 'Sem descrição.'}</p><h3>Histórico</h3><div style={{ color: '#64748B', fontSize: 13 }}>Criada em {task.created_at ? new Date(task.created_at).toLocaleString('pt-BR') : '—'}</div>{task.completed_at && <div style={{ color: '#059669', marginTop: 6 }}>Concluída em {new Date(task.completed_at).toLocaleString('pt-BR')}</div>}</div><div style={card}><p><strong>Status:</strong> {statuses[task.status].label}</p><p><strong>Prioridade:</strong> {priority[task.priority].label}</p><p><strong>Prazo:</strong> {task.due_date ? new Date(task.due_date).toLocaleString('pt-BR') : '—'}</p><p><strong>Responsável:</strong> {task.assigned_user?.name ?? '—'}</p><p><strong>Unidade:</strong> {task.assigned_unit?.name ?? '—'}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{task.status !== 'completed' && <button style={{ ...button, background: '#059669', color: '#fff' }} onClick={() => void act('complete')}>Concluir</button>}{task.status !== 'cancelled' && <button style={{ ...button, background: '#FEE2E2', color: '#B91C1C' }} onClick={() => void act('cancel')}>Cancelar</button>}{['completed', 'cancelled'].includes(task.status) && <button style={{ ...button, background: '#DBEAFE', color: '#2563EB' }} onClick={() => void act('reopen')}>Reabrir</button>}</div></div></div>
  </Shell>;
}
