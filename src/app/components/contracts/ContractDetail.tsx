import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FilePlus,
  FileText,
  Trash2,
  XCircle,
} from 'lucide-react';

import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { CONTRACT_STATUS_CONFIG } from '../../../types/contract';
import type { Contract, ContractHistoryEntry } from '../../../types/contract';
import {
  activateContract,
  cancelContract,
  deleteContract,
  documentDownloadUrl,
  getContract,
  getHistory,
} from '../../../services/contractService';

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value.includes('T') ? value : `${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `${days} dias atras`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 mes atras' : `${months} meses atras`;
}

function progress(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (!start || !end || end <= start) return 0;
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function barColor(days?: number) {
  if ((days ?? 0) > 60) return '#10B981';
  if ((days ?? 0) > 30) return '#F59E0B';
  return '#EF4444';
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 18px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{title}</h2>
      {children}
    </div>
  );
}

function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0F172A' }}>{icon}{children}</div>
    </div>
  );
}

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<ContractHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!id) return;
    setLoading(true);
    try {
      const [item, itemHistory] = await Promise.all([getContract(id), getHistory(id)]);
      setContract(item);
      setHistory(itemHistory);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  const progressValue = useMemo(() => contract ? progress(contract.startDate, contract.endDate) : 0, [contract]);

  if (loading) {
    return <div style={{ padding: '40px', minHeight: '100vh', background: '#F8FAFC', color: '#64748B' }}>Carregando contrato...</div>;
  }

  if (!contract) {
    return (
      <div style={{ padding: '40px', minHeight: '100vh', background: '#F8FAFC' }}>
        <ModuleStateView state="error" errorMessage="Contrato nao encontrado. Verifique o ID e tente novamente." onRetry={() => navigate('/contracts')} />
      </div>
    );
  }

  const statusCfg = CONTRACT_STATUS_CONFIG[contract.status];
  const downloadUrl = documentDownloadUrl(contract);
  const currentBarColor = barColor(contract.daysRemaining);

  async function handleActivate() {
    if (!contract) return;
    await activateContract(contract.id);
    await refresh();
  }

  async function handleCancel() {
    if (!contract || !window.confirm('Confirmar cancelamento deste contrato?')) return;
    await cancelContract(contract.id);
    await refresh();
  }

  async function handleDelete() {
    if (!contract || !window.confirm('Confirmar exclusao deste contrato?')) return;
    await deleteContract(contract.id);
    navigate('/contracts');
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/contracts" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>Contratos</Link>
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>›</span>
        <span style={{ fontSize: '13px', color: '#64748B' }}>{contract.number}</span>
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{contract.title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>{contract.title}</h1>
          <span style={{ display: 'inline-flex', padding: '5px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.color}30` }}>
            {statusCfg.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(`/contracts/${contract.id}/edit`)} style={actionButton()}>
            <Edit size={14} /> Editar
          </button>
          {contract.status === 'draft' ? <button onClick={() => void handleActivate()} style={actionButton('#10B981', true)}><CheckCircle size={14} /> Ativar</button> : null}
          {contract.status === 'active' ? <button onClick={() => void handleCancel()} style={actionButton('#F59E0B')}><XCircle size={14} /> Cancelar</button> : null}
          {downloadUrl ? <button onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')} style={actionButton()}><Download size={14} /> Baixar Documento</button> : null}
          {contract.status === 'draft' || contract.status === 'cancelled' ? <button onClick={() => void handleDelete()} style={actionButton('#EF4444')}><Trash2 size={14} /> Excluir</button> : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 65%', minWidth: 0 }}>
          <Card title="Dados Gerais">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <PropRow icon={<span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>{contract.number}</span>} label="Numero"><span /></PropRow>
              <PropRow icon={<span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{contract.clientAvatar}</span>} label="Cliente">{contract.clientName}</PropRow>
              <PropRow icon={<Building2 size={14} color="#64748B" />} label="Unidade">{contract.unitName ?? <span style={{ color: '#94A3B8' }}>-</span>}</PropRow>
              <PropRow icon={<Calendar size={14} color="#64748B" />} label="Data Inicial">{formatDate(contract.startDate)}</PropRow>
              <PropRow icon={<Calendar size={14} color="#64748B" />} label="Data Final">{formatDate(contract.endDate)}</PropRow>
              <PropRow icon={<Clock size={14} color="#64748B" />} label="Ultima atualizacao">{formatRelative(contract.updatedAt)}</PropRow>
            </div>

            {contract.status === 'active' && contract.endDate ? (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: currentBarColor }}>
                  {(contract.daysRemaining ?? 0) >= 0 ? `${contract.daysRemaining} dias restantes` : `Vencido ha ${Math.abs(contract.daysRemaining ?? 0)} dias`}
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressValue}%`, height: '100%', background: currentBarColor, borderRadius: '999px' }} />
                </div>
              </div>
            ) : null}
          </Card>

          {contract.notes ? <Card title="Observacoes"><div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>{contract.notes}</div></Card> : null}

          <Card title="Historico de Atividades">
            {history.length === 0 ? <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Nenhuma atividade registrada.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {history.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{entry.userAvatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{entry.description}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>{formatRelative(entry.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div style={{ flex: '0 0 35%', minWidth: 0, position: 'sticky', top: '24px' }}>
          <Card title="Documento Vinculado">
            {contract.document ? (
              <div>
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <FileText size={32} color="#EF4444" />
                  <div style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: '#0F172A', background: '#EEF2FF', padding: '4px 8px', borderRadius: '6px' }}>{contract.document.name}</div>
                </div>
                {downloadUrl ? <button onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')} style={primaryButton()}><Download size={14} /> Baixar documento</button> : null}
              </div>
            ) : (
              <div style={{ border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '12px', padding: '28px 16px', textAlign: 'center' }}>
                <FileText size={32} color="#94A3B8" />
                <p style={{ fontSize: '13px', color: '#94A3B8' }}>Nenhum documento vinculado</p>
                <button onClick={() => navigate(`/contracts/${contract.id}/edit`)} style={actionButton()}><FilePlus size={14} /> Vincular documento</button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function actionButton(color = '#64748B', solid = false): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: `1.5px solid ${solid ? color : 'rgba(0,0,0,0.1)'}`,
    background: solid ? color : '#fff',
    color: solid ? '#fff' : color,
  };
}

function primaryButton(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };
}
