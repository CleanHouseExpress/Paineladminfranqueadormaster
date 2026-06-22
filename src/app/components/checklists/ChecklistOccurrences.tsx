import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CalendarClock, CheckCircle, Play, RotateCcw } from 'lucide-react';
import * as checklistService from '../../../services/checklistService';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import type { ChecklistOccurrence, ChecklistOccurrenceStatus, ChecklistTemplate } from '../../../types/checklist';
import type { UnitOption } from '../../../services/checklistService';

const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#D97706', bg: '#FFFBEB' },
  in_progress: { label: 'Em andamento', color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Concluido', color: '#16A34A', bg: '#ECFDF5' },
  overdue: { label: 'Atrasado', color: '#DC2626', bg: '#FEF2F2' },
  cancelled: { label: 'Cancelado', color: '#64748B', bg: '#F1F5F9' },
};

export function ChecklistOccurrences() {
  const navigate = useNavigate();
  const [occurrences, setOccurrences] = useState<ChecklistOccurrence[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [status, setStatus] = useState<ChecklistOccurrenceStatus | ''>('');
  const [templateId, setTemplateId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [occurrencePayload, templatePayload, unitPayload] = await Promise.all([
        checklistService.getOccurrences({ status, templateId, unitId, dateFrom, dateTo }),
        checklistService.getTemplates(),
        checklistService.getUnitOptions(),
      ]);
      setOccurrences(occurrencePayload);
      setTemplates(templatePayload);
      setUnits(unitPayload);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnDef[] = useMemo(() => [
    { key: 'templateName', label: 'Checklist', type: 'text', sortable: true, width: '220px' },
    { key: 'unitName', label: 'Unidade', type: 'text', sortable: true, width: '160px' },
    { key: 'scheduledDate', label: 'Data programada', type: 'date', sortable: true, width: '140px' },
    { key: 'dueAt', label: 'Prazo', type: 'date', sortable: true, width: '120px' },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, width: '130px', badgeConfig: statusBadgeConfig },
  ], []);

  const actions = [
    {
      label: 'Iniciar',
      icon: <Play size={14} />,
      showCondition: (row: Record<string, unknown>) => row.status === 'pending' || row.status === 'overdue',
      onClick: (row: Record<string, unknown>) => {
        checklistService.startOccurrence(String(row.id)).then(occurrence => {
          if (occurrence.executionId) navigate(`/checklists/executions/${occurrence.executionId}`);
        });
      },
    },
    {
      label: 'Continuar',
      icon: <RotateCcw size={14} />,
      showCondition: (row: Record<string, unknown>) => row.status === 'in_progress' && Boolean(row.executionId),
      onClick: (row: Record<string, unknown>) => navigate(`/checklists/executions/${row.executionId}`),
    },
    {
      label: 'Concluir',
      icon: <CheckCircle size={14} />,
      showCondition: (row: Record<string, unknown>) => row.status === 'in_progress',
      onClick: (row: Record<string, unknown>) => {
        checklistService.completeOccurrence(String(row.id)).then(() => void load());
      },
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Checklists</Link>
          <span>/</span>
          <span style={{ color: '#6366F1', fontWeight: 600 }}>Ocorrencias</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarClock size={22} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Ocorrencias de Checklists</h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>Rotinas obrigatorias pendentes, atrasadas e concluidas por unidade</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '14px 16px',
        border: '1px solid rgba(0,0,0,0.06)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <select value={status} onChange={event => setStatus(event.target.value as ChecklistOccurrenceStatus | '')} style={selectStyle}>
          <option value="">Todos os status</option>
          {Object.entries(statusBadgeConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
        <select value={templateId} onChange={event => setTemplateId(event.target.value)} style={selectStyle}>
          <option value="">Todos os checklists</option>
          {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
        <select value={unitId} onChange={event => setUnitId(event.target.value)} style={selectStyle}>
          <option value="">Todas as unidades</option>
          {units.map(unit => <option key={String(unit.value)} value={String(unit.value)}>{unit.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} style={selectStyle} />
        <input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} style={selectStyle} />
        <button type="button" onClick={() => void load()} style={buttonStyle}>Filtrar</button>
      </div>

      <DynamicTableRenderer
        columns={columns}
        data={occurrences as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        emptyMessage="Nenhuma ocorrencia encontrada."
        actions={actions}
        onRowClick={row => {
          if (row.executionId) navigate(`/checklists/executions/${row.executionId}`);
        }}
      />
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.1)',
  fontSize: '13px',
  color: '#0F172A',
  background: '#F8FAFC',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  background: '#6366F1',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};
