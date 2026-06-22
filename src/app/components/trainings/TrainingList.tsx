import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BookOpen,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { TRAINING_CATEGORY_CONFIG, TRAINING_STATUS_CONFIG } from '../../../types/training';
import type { Training, TrainingStats } from '../../../types/training';
import {
  archiveTraining,
  deleteTraining,
  documentDownloadUrl,
  getStats,
  getTrainings,
  publishTraining,
} from '../../../services/trainingService';

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export function TrainingList() {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [mandatoryFilter, setMandatoryFilter] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [items, metrics] = await Promise.all([getTrainings(), getStats()]);
      setTrainings(items);
      setStats(metrics);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trainings.filter(training => {
      const matchSearch = !q
        || training.title.toLowerCase().includes(q)
        || (training.description ?? '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || training.status === statusFilter;
      const matchCategory = !categoryFilter || training.category === categoryFilter;
      const matchMandatory = !mandatoryFilter || (mandatoryFilter === 'sim' ? training.mandatory : !training.mandatory);
      return matchSearch && matchStatus && matchCategory && matchMandatory;
    });
  }, [trainings, search, statusFilter, categoryFilter, mandatoryFilter]);

  const metrics = stats ?? {
    total: trainings.length,
    published: trainings.filter(item => item.status === 'published').length,
    draft: trainings.filter(item => item.status === 'draft').length,
    mandatory: trainings.filter(item => item.mandatory).length,
    avgProgress: 0,
    recentTrainings: [],
    mandatoryTrainings: [],
    topTrainings: [],
  };

  const mandatoryBelow80 = trainings.filter(training => training.mandatory && training.status === 'published' && training.avgProgress < 80);
  const filtersActive = Boolean(search || statusFilter || categoryFilter || mandatoryFilter);

  const columns: ColumnDef[] = [
    {
      key: 'title',
      label: 'Titulo',
      type: 'text',
      sortable: true,
      width: '280px',
      render: (_value, row) => {
        const training = row as unknown as Training;
        const category = TRAINING_CATEGORY_CONFIG[training.category];
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: category.color, flexShrink: 0 }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{training.title}</div>
            </div>
            {training.description ? <div style={{ fontSize: '11px', color: '#94A3B8', marginLeft: '15px' }}>{training.description}</div> : null}
            {training.mandatory ? <span style={{ display: 'inline-block', marginLeft: '15px', marginTop: '4px', fontSize: '10px', fontWeight: 700, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1px 7px', borderRadius: '6px' }}>Obrigatorio</span> : null}
          </div>
        );
      },
    },
    { key: 'category', label: 'Categoria', type: 'badge', width: '130px', badgeConfig: TRAINING_CATEGORY_CONFIG },
    { key: 'status', label: 'Status', type: 'badge', width: '110px', badgeConfig: TRAINING_STATUS_CONFIG },
    {
      key: 'durationMinutes',
      label: 'Duracao',
      type: 'text',
      width: '100px',
      render: (_value, row) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#334155' }}><Clock size={12} color="#94A3B8" />{(row as unknown as Training).durationMinutes || 0} min</span>,
    },
    {
      key: 'avgProgress',
      label: 'Progresso',
      type: 'text',
      width: '140px',
      render: (_value, row) => {
        const training = row as unknown as Training;
        if (training.status !== 'published') return <span style={{ color: '#CBD5E1', fontSize: '13px' }}>-</span>;
        const color = training.avgProgress >= 80 ? '#10B981' : training.avgProgress >= 50 ? '#F59E0B' : '#EF4444';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${training.avgProgress}%`, height: '100%', background: color }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color }}>{training.avgProgress}%</span>
          </div>
        );
      },
    },
    {
      key: 'publishedAt',
      label: 'Publicado em',
      type: 'text',
      sortable: true,
      width: '120px',
      render: (_value, row) => <span style={{ fontSize: '13px', color: '#334155' }}>{formatDate((row as unknown as Training).publishedAt)}</span>,
    },
  ];

  const actions = [
    { label: 'Visualizar', icon: <Eye size={14} />, onClick: (row: Record<string, unknown>) => navigate(`/trainings/${row.id}`) },
    { label: 'Editar', icon: <Edit size={14} />, onClick: (row: Record<string, unknown>) => navigate(`/trainings/${row.id}/edit`), showCondition: (row: Record<string, unknown>) => row.status !== 'archived' },
    {
      label: 'Publicar',
      icon: <CheckCircle size={14} />,
      onClick: async (row: Record<string, unknown>) => {
        await publishTraining(String(row.id));
        await refresh();
      },
      showCondition: (row: Record<string, unknown>) => row.status === 'draft',
    },
    {
      label: 'Arquivar',
      icon: <Archive size={14} />,
      onClick: async (row: Record<string, unknown>) => {
        await archiveTraining(String(row.id));
        await refresh();
      },
      showCondition: (row: Record<string, unknown>) => row.status === 'published',
    },
    {
      label: 'Ver Material',
      icon: <FileText size={14} />,
      onClick: (row: Record<string, unknown>) => {
        const url = documentDownloadUrl(row as unknown as Training);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      },
      showCondition: (row: Record<string, unknown>) => Boolean((row as unknown as Training).documentId),
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      variant: 'danger' as const,
      onClick: async (row: Record<string, unknown>) => {
        if (window.confirm('Confirmar exclusao deste treinamento?')) {
          await deleteTraining(String(row.id));
          await refresh();
        }
      },
      showCondition: (row: Record<string, unknown>) => row.status === 'draft',
    },
  ];

  const statCards = [
    { label: 'Total', value: metrics.total, Icon: BookOpen, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Publicados', value: metrics.published, Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Rascunhos', value: metrics.draft, Icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Obrigatorios', value: metrics.mandatory, Icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Progresso Medio', value: `${metrics.avgProgress}%`, Icon: TrendingUp, color: '#3B82F6', bg: '#EFF6FF' },
  ];

  const selectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '13px', color: '#0F172A', background: '#F8FAFC', outline: 'none' };

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Treinamentos</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>Gestao de capacitacoes e materiais de treinamento da rede</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/trainings/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            <Settings size={14} /> Configuracoes
          </Link>
          <button onClick={() => navigate('/trainings/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Novo Treinamento
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {statCards.map(card => {
          const Icon = card.Icon;
          return (
            <div key={card.label} style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon size={18} color={card.color} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {mandatoryBelow80.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={18} color="#D97706" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>{mandatoryBelow80.length} treinamento(s) obrigatorio(s) com progresso abaixo de 80%.</span>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por titulo ou descricao..." style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={selectStyle}>
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
        <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} style={selectStyle}>
          <option value="">Todas as categorias</option>
          {(Object.keys(TRAINING_CATEGORY_CONFIG) as Array<keyof typeof TRAINING_CATEGORY_CONFIG>).map(key => <option key={key} value={key}>{TRAINING_CATEGORY_CONFIG[key].label}</option>)}
        </select>
        <select value={mandatoryFilter} onChange={event => setMandatoryFilter(event.target.value)} style={selectStyle}>
          <option value="">Obrigatorio: Todos</option>
          <option value="sim">Sim</option>
          <option value="nao">Nao</option>
        </select>
        {filtersActive && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setMandatoryFilter(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>
            <X size={12} /> Limpar
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8' }}>{filtered.length} treinamento(s)</span>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Carregando treinamentos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', padding: '64px 24px', textAlign: 'center' }}>
          <GraduationCap size={32} color="#6366F1" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Nenhum treinamento encontrado</h3>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Crie o primeiro treinamento ou ajuste os filtros.</p>
        </div>
      ) : (
        <DynamicTableRenderer columns={columns} data={filtered as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="Nenhum treinamento encontrado." onRowClick={row => navigate(`/trainings/${row.id}`)} actions={actions} />
      )}
    </div>
  );
}
