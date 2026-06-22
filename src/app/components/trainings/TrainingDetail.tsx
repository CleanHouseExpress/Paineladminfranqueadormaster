import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Archive,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Lock,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';

import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { TRAINING_CATEGORY_CONFIG, TRAINING_STATUS_CONFIG } from '../../../types/training';
import type { Training, TrainingAssignment, UserProgress } from '../../../types/training';
import {
  archiveTraining,
  assignUnits,
  assignUsers,
  deleteTraining,
  documentDownloadUrl,
  getAssignments,
  getProgress,
  getTraining,
  getUnitOptions,
  getUserOptions,
  publishTraining,
} from '../../../services/trainingService';
import type { ApiOption } from '../../../services/trainingService';

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function progressColor(pct: number) {
  if (pct >= 80) return '#10B981';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color, background: bg, border: `1px solid ${color}30` }}>{label}</span>;
}

function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>;
}

export function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [training, setTraining] = useState<Training | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [users, setUsers] = useState<ApiOption[]>([]);
  const [units, setUnits] = useState<ApiOption[]>([]);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'unidades'>('usuarios');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!id) return;
    setLoading(true);
    try {
      const [item, progressItems, assignmentItems, userOptions, unitOptions] = await Promise.all([
        getTraining(id),
        getProgress(id),
        getAssignments(id),
        getUserOptions(),
        getUnitOptions(),
      ]);
      setTraining(item);
      setProgress(progressItems);
      setAssignments(assignmentItems);
      setUsers(userOptions);
      setUnits(unitOptions);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  const filteredProgress = useMemo(() => progress.filter(item => item.userName.toLowerCase().includes(userSearch.toLowerCase())), [progress, userSearch]);
  const unitAssignments = assignments.filter(item => item.type === 'unit');
  const assignedUserIds = new Set(progress.map(item => item.userId));
  const assignedUnitIds = new Set(unitAssignments.map(item => item.targetId));
  const availableUsers = users.filter(option => !assignedUserIds.has(String(option.value)));
  const availableUnits = units.filter(option => !assignedUnitIds.has(String(option.value)));

  if (loading) {
    return <div style={{ padding: '40px', minHeight: '100vh', background: '#F8FAFC', color: '#64748B' }}>Carregando treinamento...</div>;
  }

  if (!training) {
    return (
      <div style={{ padding: '40px', minHeight: '100vh', background: '#F8FAFC' }}>
        <ModuleStateView state="error" errorMessage="Treinamento nao encontrado. Verifique o ID e tente novamente." onRetry={() => navigate('/trainings')} />
      </div>
    );
  }

  const status = TRAINING_STATUS_CONFIG[training.status];
  const category = TRAINING_CATEGORY_CONFIG[training.category];
  const color = progressColor(training.avgProgress);
  const card: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px' };
  const cardTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 18px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' };

  async function handleAssignUsers() {
    if (!id || selectedUsers.length === 0) return;
    await assignUsers(id, [...progress.map(item => item.userId), ...selectedUsers]);
    setSelectedUsers([]);
    await refresh();
  }

  async function handleAssignUnits() {
    if (!id || selectedUnits.length === 0) return;
    await assignUnits(id, [...unitAssignments.map(item => item.targetId), ...selectedUnits]);
    setSelectedUnits([]);
    await refresh();
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/trainings" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>Treinamentos</Link>
        <ChevronRight size={14} color="#94A3B8" />
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{training.title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>{training.title}</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge label={category.label} color={category.color} bg={category.bg} />
            <Badge label={status.label} color={status.color} bg={status.bg} />
            {training.mandatory ? <Badge label="Obrigatorio" color="#92400E" bg="#FFFBEB" /> : null}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {training.status !== 'archived' ? <button onClick={() => navigate(`/trainings/${training.id}/edit`)} style={buttonStyle()}><Edit size={14} /> Editar</button> : null}
          {training.status === 'draft' ? <button onClick={async () => { await publishTraining(training.id); await refresh(); }} style={buttonStyle('#fff', '#10B981', '#10B981')}><CheckCircle size={14} /> Publicar</button> : null}
          {training.status === 'published' ? <button onClick={async () => { await archiveTraining(training.id); await refresh(); }} style={buttonStyle('#92400E', '#FFFBEB', '#FCD34D')}><Archive size={14} /> Arquivar</button> : null}
          {training.documentId ? <button onClick={() => { const url = documentDownloadUrl(training); if (url) window.open(url, '_blank', 'noopener,noreferrer'); }} style={buttonStyle()}><FileText size={14} /> Ver Material</button> : null}
          {training.status === 'draft' ? <button onClick={async () => { if (window.confirm('Confirmar exclusao deste treinamento?')) { await deleteTraining(training.id); navigate('/trainings'); } }} style={buttonStyle('#EF4444', '#fff', '#FECACA')}><Trash2 size={14} /> Excluir</button> : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 65%', minWidth: 0 }}>
          <div style={card}>
            <h2 style={cardTitle}>Dados Gerais</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', color: '#0F172A' }}>
              <Prop label="Categoria"><Badge label={category.label} color={category.color} bg={category.bg} /></Prop>
              <Prop label="Status"><Badge label={status.label} color={status.color} bg={status.bg} /></Prop>
              <Prop label="Obrigatorio">{training.mandatory ? 'Sim' : 'Nao'}</Prop>
              <Prop label="Duracao"><Clock size={14} color="#64748B" /> {formatDuration(training.durationMinutes || 0)}</Prop>
              <Prop label="Publicado em">{formatDate(training.publishedAt)}</Prop>
              <Prop label="Criado por"><Avatar initials={training.createdByAvatar} size={24} /> {training.createdBy}</Prop>
              <Prop label="Criado em">{formatDate(training.createdAt)}</Prop>
              <Prop label="Atualizado em">{formatDate(training.updatedAt)}</Prop>
            </div>
            {training.description ? <p style={{ margin: '20px 0 0', fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>{training.description}</p> : null}
          </div>

          {training.status === 'published' && (
            <div style={card}>
              <h2 style={cardTitle}>Progresso Geral</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <MiniStat label="Atribuidos" value={training.assignedUsers} icon={<Users size={16} color="#6366F1" />} bg="#EEF2FF" color="#6366F1" />
                <MiniStat label="Concluidos" value={training.completedUsers} icon={<CheckCircle size={16} color="#10B981" />} bg="#ECFDF5" color="#10B981" />
                <MiniStat label="Pendentes" value={Math.max(training.assignedUsers - training.completedUsers, 0)} icon={<Clock size={16} color="#F59E0B" />} bg="#FFFBEB" color="#F59E0B" />
                <MiniStat label="Progresso Medio" value={`${training.avgProgress}%`} icon={<TrendingUp size={16} color="#3B82F6" />} bg="#EFF6FF" color="#3B82F6" />
              </div>
              <div style={{ height: '12px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${training.avgProgress}%`, background: color }} />
              </div>
            </div>
          )}

          <div style={card}>
            <h2 style={cardTitle}>Atribuicoes</h2>
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '20px', width: 'fit-content' }}>
              <button onClick={() => setActiveTab('usuarios')} style={tabStyle(activeTab === 'usuarios')}>Usuarios</button>
              <button onClick={() => setActiveTab('unidades')} style={tabStyle(activeTab === 'unidades')}>Unidades</button>
            </div>

            {activeTab === 'usuarios' ? (
              <div>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={userSearch} onChange={event => setUserSearch(event.target.value)} placeholder="Buscar usuario..." style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '13px', color: '#0F172A', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {filteredProgress.map(item => <ProgressRow key={item.userId} item={item} />)}
                  {filteredProgress.length === 0 ? <p style={{ fontSize: '13px', color: '#94A3B8' }}>Nenhum usuario atribuido.</p> : null}
                </div>
                <Picker options={availableUsers} selected={selectedUsers} setSelected={setSelectedUsers} onConfirm={() => void handleAssignUsers()} label="Atribuir usuarios" />
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {unitAssignments.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <Building2 size={16} color="#6366F1" />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{item.targetName}</div>
                    </div>
                  ))}
                  {unitAssignments.length === 0 ? <p style={{ fontSize: '13px', color: '#94A3B8' }}>Nenhuma unidade atribuida.</p> : null}
                </div>
                <Picker options={availableUnits} selected={selectedUnits} setSelected={setSelectedUnits} onConfirm={() => void handleAssignUnits()} label="Atribuir unidades" />
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: '0 0 35%', minWidth: 0, position: 'sticky', top: '24px' }}>
          <div style={card}>
            <h2 style={cardTitle}>Material Vinculado</h2>
            {training.document ? (
              <div>
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <FileText size={28} color="#6366F1" />
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#0F172A', wordBreak: 'break-word' }}>{training.document.name}</div>
                </div>
                <button onClick={() => { const url = documentDownloadUrl(training); if (url) window.open(url, '_blank', 'noopener,noreferrer'); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Visualizar / baixar
                </button>
              </div>
            ) : (
              <div style={{ border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '12px', padding: '28px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <FileText size={32} color="#94A3B8" />
                <p>Nenhum material vinculado</p>
              </div>
            )}
          </div>

          <div style={{ ...card, background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)', opacity: 0.85 }}>
            <h2 style={{ ...cardTitle, color: '#94A3B8' }}>Funcionalidades Futuras</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Player de Video', 'Quiz', 'Certificado', 'Trilhas', 'Notificacoes', 'Portal Franqueado'].map(item => (
                <div key={item} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 8px', borderRadius: '10px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <Lock size={14} color="#94A3B8" />
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>{item}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '1px 7px', borderRadius: '999px' }}>Em breve</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{children}</div>
    </div>
  );
}

function MiniStat({ label, value, icon, bg, color }: { label: string; value: string | number; icon: React.ReactNode; bg: string; color: string }) {
  return (
    <div style={{ background: bg, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {icon}
      <span style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>{label}</span>
    </div>
  );
}

function ProgressRow({ item }: { item: UserProgress }) {
  const color = progressColor(item.progressPercent);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.05)' }}>
      <Avatar initials={item.userAvatar} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{item.userName}</div>
        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}><div style={{ width: `${item.progressPercent}%`, height: '100%', background: color }} /></div>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{item.progressPercent}%</span>
    </div>
  );
}

function Picker({ options, selected, setSelected, onConfirm, label }: { options: ApiOption[]; selected: string[]; setSelected: (value: string[]) => void; onConfirm: () => void; label: string }) {
  if (options.length === 0) return null;
  return (
    <div style={{ border: '1.5px solid rgba(99,102,241,0.2)', borderRadius: '12px', background: '#FAFBFF', padding: '14px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1', marginBottom: '10px' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
        {options.map(option => (
          <label key={String(option.value)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: selected.includes(String(option.value)) ? '#EEF2FF' : '#fff', cursor: 'pointer', fontSize: '13px', color: '#0F172A' }}>
            <input type="checkbox" checked={selected.includes(String(option.value))} onChange={() => setSelected(selected.includes(String(option.value)) ? selected.filter(item => item !== String(option.value)) : [...selected, String(option.value)])} style={{ accentColor: '#6366F1' }} />
            {option.label}
          </label>
        ))}
      </div>
      <button disabled={selected.length === 0} onClick={onConfirm} style={{ marginTop: '12px', padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#6366F1', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Confirmar ({selected.length})</button>
    </div>
  );
}

function buttonStyle(color = '#64748B', background = '#fff', borderColor = 'rgba(0,0,0,0.1)'): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${borderColor}`, background, color };
}

function tabStyle(active: boolean): React.CSSProperties {
  return { padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: active ? '#fff' : 'transparent', color: active ? '#6366F1' : '#64748B', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' };
}
