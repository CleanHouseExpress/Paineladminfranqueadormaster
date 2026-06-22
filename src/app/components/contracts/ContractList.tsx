import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Plus,
  ScrollText,
  Search,
  Settings,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { CONTRACT_STATUS_CONFIG } from '../../../types/contract';
import type { Contract, ContractStats } from '../../../types/contract';
import {
  activateContract,
  cancelContract,
  deleteContract,
  documentDownloadUrl,
  getContracts,
  getStats,
} from '../../../services/contractService';

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

export function ContractList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [startFrom, setStartFrom] = useState('');
  const [endUntil, setEndUntil] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [items, metrics] = await Promise.all([getContracts(), getStats()]);
      setContracts(items);
      setStats(metrics);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    contracts.forEach(contract => {
      if (contract.clientId) map.set(contract.clientId, contract.clientName);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [contracts]);

  const unitOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code?: string }>();
    contracts.forEach(contract => {
      if (contract.unitId && contract.unitName) {
        map.set(contract.unitId, { id: contract.unitId, name: contract.unitName, code: contract.unitCode });
      }
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [contracts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter(contract => {
      const matchSearch = !q
        || contract.title.toLowerCase().includes(q)
        || contract.number.toLowerCase().includes(q)
        || contract.clientName.toLowerCase().includes(q);
      const matchStatus = !statusFilter || contract.status === statusFilter;
      const matchClient = !clientFilter || contract.clientId === clientFilter;
      const matchUnit = !unitFilter || contract.unitId === unitFilter;
      const matchStart = !startFrom || contract.startDate >= startFrom;
      const matchEnd = !endUntil || contract.endDate <= endUntil;
      return matchSearch && matchStatus && matchClient && matchUnit && matchStart && matchEnd;
    });
  }, [contracts, search, statusFilter, clientFilter, unitFilter, startFrom, endUntil]);

  const metrics = stats ?? {
    total: contracts.length,
    active: contracts.filter(item => item.status === 'active').length,
    draft: contracts.filter(item => item.status === 'draft').length,
    expired: contracts.filter(item => item.status === 'expired').length,
    cancelled: contracts.filter(item => item.status === 'cancelled').length,
    expiringSoon: contracts.filter(item => item.isExpiringSoon).length,
    recentContracts: [],
    expiringContracts: [],
  };

  const expiringContracts = contracts.filter(contract => contract.isExpiringSoon);
  const filtersActive = Boolean(search || statusFilter || clientFilter || unitFilter || startFrom || endUntil);

  const columns: ColumnDef[] = [
    {
      key: 'title',
      label: 'Titulo',
      type: 'text',
      sortable: true,
      width: '260px',
      render: (_value, row) => {
        const contract = row as unknown as Contract;
        return (
          <div>
            <div style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '2px 7px', borderRadius: '6px', marginBottom: '4px' }}>
              {contract.number}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{contract.title}</div>
          </div>
        );
      },
    },
    {
      key: 'clientName',
      label: 'Cliente',
      type: 'text',
      width: '180px',
      render: (_value, row) => {
        const contract = row as unknown as Contract;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
              {contract.clientAvatar}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{contract.clientName}</span>
          </div>
        );
      },
    },
    { key: 'unitName', label: 'Unidade', type: 'text', width: '160px' },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '120px',
      badgeConfig: CONTRACT_STATUS_CONFIG,
    },
    { key: 'startDate', label: 'Inicio', type: 'date', sortable: true, width: '110px' },
    {
      key: 'endDate',
      label: 'Fim',
      type: 'text',
      sortable: true,
      width: '150px',
      render: (_value, row) => {
        const contract = row as unknown as Contract;
        return (
          <div>
            <div style={{ fontSize: '13px', color: '#334155' }}>{formatDate(contract.endDate)}</div>
            {contract.isExpiringSoon && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontSize: '10px', fontWeight: 600, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '6px' }}>
                Vence em {contract.daysRemaining} dias
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const actions = [
    { label: 'Visualizar', icon: <Eye size={14} />, onClick: (row: Record<string, unknown>) => navigate(`/contracts/${row.id}`) },
    { label: 'Editar', icon: <Edit size={14} />, onClick: (row: Record<string, unknown>) => navigate(`/contracts/${row.id}/edit`) },
    {
      label: 'Ativar',
      icon: <CheckCircle size={14} />,
      onClick: async (row: Record<string, unknown>) => {
        await activateContract(String(row.id));
        await refresh();
      },
      showCondition: (row: Record<string, unknown>) => row.status === 'draft',
    },
    {
      label: 'Cancelar',
      icon: <XCircle size={14} />,
      variant: 'danger' as const,
      onClick: async (row: Record<string, unknown>) => {
        if (window.confirm('Confirmar cancelamento deste contrato?')) {
          await cancelContract(String(row.id));
          await refresh();
        }
      },
      showCondition: (row: Record<string, unknown>) => row.status === 'active',
    },
    {
      label: 'Baixar documento',
      icon: <Download size={14} />,
      onClick: (row: Record<string, unknown>) => {
        const url = documentDownloadUrl(row as unknown as Contract);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      },
      showCondition: (row: Record<string, unknown>) => Boolean((row as unknown as Contract).documentId),
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      variant: 'danger' as const,
      onClick: async (row: Record<string, unknown>) => {
        if (window.confirm('Confirmar exclusao deste contrato?')) {
          await deleteContract(String(row.id));
          await refresh();
        }
      },
      showCondition: (row: Record<string, unknown>) => row.status === 'draft' || row.status === 'cancelled',
    },
  ];

  const statCards = [
    { label: 'Total', value: metrics.total, Icon: FileText, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Ativos', value: metrics.active, Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Rascunhos', value: metrics.draft, Icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Vencidos', value: metrics.expired, Icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Vencendo', value: metrics.expiringSoon, Icon: AlertTriangle, color: '#F97316', bg: '#FFF7ED' },
  ];

  const selectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '13px', color: '#0F172A', background: '#F8FAFC', outline: 'none' };

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScrollText size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Contratos</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>Gestao de contratos e vigencias da rede</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/contracts/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            <Settings size={14} /> Configuracoes
          </Link>
          <button onClick={() => navigate('/contracts/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Novo Contrato
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

      {expiringContracts.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={18} color="#D97706" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>{expiringContracts.length} contrato(s) vencem em breve.</span>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por titulo, numero, cliente..." style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={selectStyle}>
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="expired">Vencido</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select value={clientFilter} onChange={event => setClientFilter(event.target.value)} style={selectStyle}>
          <option value="">Todos os clientes</option>
          {clientOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
        <select value={unitFilter} onChange={event => setUnitFilter(event.target.value)} style={selectStyle}>
          <option value="">Todas as unidades</option>
          {unitOptions.map(option => <option key={option.id} value={option.id}>{option.code ? `${option.code} - ` : ''}{option.name}</option>)}
        </select>
        <input type="date" value={startFrom} onChange={event => setStartFrom(event.target.value)} style={selectStyle} />
        <input type="date" value={endUntil} onChange={event => setEndUntil(event.target.value)} style={selectStyle} />
        {filtersActive && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setClientFilter(''); setUnitFilter(''); setStartFrom(''); setEndUntil(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>
            <X size={12} /> Limpar
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8' }}>{filtered.length} contrato(s)</span>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Carregando contratos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', padding: '64px 24px', textAlign: 'center' }}>
          <ScrollText size={32} color="#6366F1" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Nenhum contrato encontrado</h3>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Crie o primeiro contrato ou ajuste os filtros.</p>
        </div>
      ) : (
        <DynamicTableRenderer columns={columns} data={filtered as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="Nenhum contrato encontrado." onRowClick={row => navigate(`/contracts/${row.id}`)} actions={actions} />
      )}
    </div>
  );
}
