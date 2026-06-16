import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  CheckCircle, PlayCircle, Clock, ChevronRight, ChevronDown,
  ClipboardList, User, MapPin, Calendar, XCircle, Eye,
} from 'lucide-react';
import { DynamicFormRenderer } from '../../../shared/components/DynamicFormRenderer';
import {
  mockChecklistTemplates,
  mockChecklistExecutions,
  mockChecklistAnswers,
} from '../../data/checklistMockData';
import type { ChecklistTemplate, ChecklistExecution as IExecution, ExecutionStatus } from '../../../types/checklist';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Rascunho',     color: '#64748B', bg: '#F1F5F9' },
  in_progress: { label: 'Em andamento', color: '#2563EB', bg: '#DBEAFE' },
  completed:   { label: 'Concluída',    color: '#059669', bg: '#D1FAE5' },
  approved:    { label: 'Aprovada',     color: '#7C3AED', bg: '#EDE9FE' },
  cancelled:   { label: 'Cancelada',    color: '#DC2626', bg: '#FEE2E2' },
};

const MOCK_UNITS = [
  'Unidade Centro', 'Unidade Norte', 'Unidade Sul',
  'Unidade Leste', 'Unidade Oeste', 'Unidade Shopping',
  'Unidade Aeroporto', 'Unidade Jardins',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return iso; }
}

function elapsedMinutes(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

interface StepIndicatorProps { current: 1 | 2 | 3; }

function StepIndicator({ current }: StepIndicatorProps) {
  const steps = [
    { n: 1, label: 'Seleção' },
    { n: 2, label: 'Execução' },
    { n: 3, label: 'Conclusão' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
      {steps.map((step, i) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <React.Fragment key={step.n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done
                    ? '#6366F1'
                    : active
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : '#F1F5F9',
                  color: done || active ? '#fff' : '#94A3B8',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: active ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {done ? <CheckCircle size={16} /> : step.n}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#6366F1' : done ? '#0F172A' : '#94A3B8',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: done ? '#6366F1' : 'rgba(0,0,0,0.08)',
                  marginBottom: '22px',
                  transition: 'background 0.3s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Seleção ──────────────────────────────────────────────────────────

interface Step1Props {
  selectedTemplate: ChecklistTemplate | null;
  onSelectTemplate: (t: ChecklistTemplate) => void;
  selectedUnit: string;
  onSelectUnit: (u: string) => void;
  responsible: string;
  onChangeResponsible: (r: string) => void;
  onStart: () => void;
}

function Step1({
  selectedTemplate, onSelectTemplate, selectedUnit, onSelectUnit,
  responsible, onChangeResponsible, onStart,
}: Step1Props) {
  const [search, setSearch] = useState('');

  const activeTemplates = mockChecklistTemplates.filter(t => t.active);
  const filtered = search
    ? activeTemplates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      )
    : activeTemplates;

  const canStart = selectedTemplate !== null && selectedUnit !== '' && responsible.trim() !== '';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '9px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '14px',
    color: '#0F172A',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const CATEGORY_COLORS: Record<string, string> = {
    abertura: '#6366F1', fechamento: '#8B5CF6', limpeza: '#14B8A6',
    estoque: '#F59E0B', manutencao: '#F97316', auditoria: '#EC4899', operacional: '#0EA5E9',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Select template */}
      <div>
        <label style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '12px' }}>
          Selecionar Template <span style={{ color: '#EF4444' }}>*</span>
        </label>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar template..."
            style={{ ...inputStyle, paddingLeft: '36px' }}
          />
          <svg
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Template cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {filtered.map(t => {
            const selected = selectedTemplate?.id === t.id;
            const color = CATEGORY_COLORS[t.category] ?? '#6366F1';
            return (
              <div
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: selected ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.08)',
                  background: selected ? `${color}08` : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: selected ? `0 0 0 3px ${color}22` : 'none',
                }}
                onMouseEnter={e => {
                  if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = color;
                }}
                onMouseLeave={e => {
                  if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{t.name}</span>
                  {selected && <CheckCircle size={16} style={{ color, flexShrink: 0 }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: `${color}18`,
                      color,
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{t.schema.length} campos</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>~{t.estimatedMinutes}min</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unit + Responsible */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
            Selecionar Unidade <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedUnit}
              onChange={e => onSelectUnit(e.target.value)}
              style={{ ...inputStyle, paddingRight: '32px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Selecione uma unidade...</option>
              {MOCK_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
            Responsável
          </label>
          <input
            value={responsible}
            onChange={e => onChangeResponsible(e.target.value)}
            placeholder="Seu nome"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Start button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          style={{
            padding: '12px 28px',
            background: canStart ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#E2E8F0',
            color: canStart ? '#fff' : '#94A3B8',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: canStart ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: canStart ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Iniciar Checklist
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Execução ─────────────────────────────────────────────────────────

interface Step2Props {
  template: ChecklistTemplate;
  unitName: string;
  responsible: string;
  answers: Record<string, unknown>;
  onAnswerChange: (key: string, value: unknown) => void;
  highlightRequired: boolean;
  startedAt: string;
  onSaveDraft: () => void;
  onComplete: () => void;
}

function Step2({
  template, unitName, responsible, answers, onAnswerChange,
  highlightRequired, startedAt, onSaveDraft, onComplete,
}: Step2Props) {
  const [elapsed, setElapsed] = useState(elapsedMinutes(startedAt));

  useEffect(() => {
    const interval = setInterval(() => setElapsed(elapsedMinutes(startedAt)), 30000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const requiredFields = template.schema.filter(f => f.required);
  const answeredRequired = requiredFields.filter(f => !isEmpty(answers[f.key])).length;
  const allRequiredDone = answeredRequired === requiredFields.length;
  const totalFilled = template.schema.filter(f => !isEmpty(answers[f.key])).length;

  const score = requiredFields.length > 0
    ? Math.round((answeredRequired / requiredFields.length) * 100)
    : 100;

  const scoreColor = score >= 90 ? '#16A34A' : score >= 70 ? '#D97706' : '#DC2626';

  const CATEGORY_COLORS: Record<string, string> = {
    abertura: '#6366F1', fechamento: '#8B5CF6', limpeza: '#14B8A6',
    estoque: '#F59E0B', manutencao: '#F97316', auditoria: '#EC4899', operacional: '#0EA5E9',
  };
  const catColor = CATEGORY_COLORS[template.category] ?? '#6366F1';

  const pct = requiredFields.length > 0
    ? Math.round((answeredRequired / requiredFields.length) * 100)
    : Math.round((totalFilled / Math.max(template.schema.length, 1)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          padding: '16px 20px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{template.name}</h2>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: `${catColor}18`,
                  color: catColor,
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {template.category}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} />
                {unitName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} />
                {responsible}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                Iniciado há {formatElapsed(elapsed)}
              </span>
            </div>
          </div>
          {/* Score */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>Conformidade</div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {answeredRequired} de {requiredFields.length} campos obrigatórios preenchidos
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1' }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <DynamicFormRenderer
        schema={template.schema}
        values={answers}
        onChange={onAnswerChange}
        showProgress={false}
        highlightRequired={highlightRequired}
      />

      {/* Sticky bottom bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '16px',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          <strong style={{ color: '#0F172A' }}>{totalFilled}</strong> / {template.schema.length} campos preenchidos
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onSaveDraft}
            style={{
              padding: '9px 18px',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={!allRequiredDone}
            style={{
              padding: '9px 22px',
              background: allRequiredDone
                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                : '#E2E8F0',
              color: allRequiredDone ? '#fff' : '#94A3B8',
              border: 'none',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: allRequiredDone ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: allRequiredDone ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Concluir
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Conclusão ────────────────────────────────────────────────────────

interface Step3Props {
  template: ChecklistTemplate;
  unitName: string;
  responsible: string;
  answers: Record<string, unknown>;
  score: number;
  startedAt: string;
  completedAt: string;
  onViewDetails: () => void;
  onNewExecution: () => void;
}

function Step3({ template, unitName, responsible, answers, score, startedAt, completedAt, onViewDetails, onNewExecution }: Step3Props) {
  const totalFilled = template.schema.filter(f => !isEmpty(answers[f.key])).length;
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const durationMin = Math.round(durationMs / 60000);

  const scoreColor = score >= 90 ? '#16A34A' : score >= 70 ? '#D97706' : '#DC2626';
  const scoreBg = score >= 90 ? '#DCFCE7' : score >= 70 ? '#FEF3C7' : '#FEE2E2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '16px 0' }}>
      {/* Big checkmark */}
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: '#DCFCE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 12px rgba(34,197,94,0.1)',
          animation: 'checklist-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}
      >
        <style>{`
          @keyframes checklist-pop {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
        <CheckCircle size={52} style={{ color: '#16A34A' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
          Checklist concluído com sucesso!
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          {template.name} — {unitName}
        </p>
      </div>

      {/* Score card */}
      <div
        style={{
          background: scoreBg,
          borderRadius: '16px',
          padding: '24px 48px',
          textAlign: 'center',
          border: `2px solid ${scoreColor}33`,
        }}
      >
        <div style={{ fontSize: '56px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: '13px', color: scoreColor, fontWeight: 600, marginTop: '4px' }}>
          Taxa de conformidade
        </div>
      </div>

      {/* Summary card */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.07)',
          padding: '20px',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
          Resumo
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: <ClipboardList size={14} />, label: 'Template', value: template.name },
            { icon: <MapPin size={14} />,        label: 'Unidade',   value: unitName },
            { icon: <User size={14} />,          label: 'Responsável', value: responsible },
            { icon: <Calendar size={14} />,      label: 'Iniciado',  value: formatDate(startedAt) },
            { icon: <Calendar size={14} />,      label: 'Concluído', value: formatDate(completedAt) },
            { icon: <Clock size={14} />,         label: 'Duração',   value: formatElapsed(durationMin) },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#94A3B8', flexShrink: 0 }}>{row.icon}</span>
              <span style={{ fontSize: '12px', color: '#64748B', width: '90px', flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#94A3B8', flexShrink: 0 }}><ClipboardList size={14} /></span>
            <span style={{ fontSize: '12px', color: '#64748B', width: '90px', flexShrink: 0 }}>Campos</span>
            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 600 }}>
              {totalFilled} de {template.schema.length} respondidos
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onViewDetails}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            border: '2px solid #6366F1',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#6366F1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Eye size={15} />
          Ver Detalhes
        </button>
        <button
          type="button"
          onClick={onNewExecution}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}
        >
          <PlayCircle size={15} />
          Nova Execução
        </button>
      </div>
    </div>
  );
}

// ─── View Mode (existing execution) ──────────────────────────────────────────

interface ViewModeProps { execution: IExecution; }

function ViewMode({ execution }: ViewModeProps) {
  const navigate = useNavigate();
  const template = mockChecklistTemplates.find(t => t.id === execution.templateId);
  const savedAnswers = mockChecklistAnswers[execution.id] ?? [];

  const values: Record<string, unknown> = {};
  savedAnswers.forEach(a => { values[a.fieldKey] = a.value; });

  const status = STATUS_CONFIG[execution.status];
  const score = execution.score;
  const scoreColor = score !== undefined
    ? score >= 90 ? '#16A34A' : score >= 70 ? '#D97706' : '#DC2626'
    : '#94A3B8';
  const scoreBg = score !== undefined
    ? score >= 90 ? '#DCFCE7' : score >= 70 ? '#FEF3C7' : '#FEE2E2'
    : '#F1F5F9';

  const CATEGORY_COLORS: Record<string, string> = {
    abertura: '#6366F1', fechamento: '#8B5CF6', limpeza: '#14B8A6',
    estoque: '#F59E0B', manutencao: '#F97316', auditoria: '#EC4899', operacional: '#0EA5E9',
  };
  const catColor = CATEGORY_COLORS[execution.category] ?? '#6366F1';

  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8' }}>
        <Link to="/operacao" style={{ color: '#94A3B8', textDecoration: 'none' }}>Operação</Link>
        <span>/</span>
        <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Checklists</Link>
        <span>/</span>
        <Link to="/checklists/executions" style={{ color: '#94A3B8', textDecoration: 'none' }}>Execuções</Link>
        <span>/</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{execution.id.slice(-6).toUpperCase()}</span>
      </div>

      {/* Header card */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.07)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {execution.templateName}
              </h1>
              {/* Status badge */}
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: status.bg,
                  color: status.color,
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {status.label}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: `${catColor}18`,
                  color: catColor,
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {execution.category}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} />{execution.unitName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} />{execution.userName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />Iniciado: {formatDate(execution.startedAt)}
              </span>
              {execution.completedAt && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} />Concluído: {formatDate(execution.completedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          {score !== undefined && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: scoreBg,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}%</div>
              <div style={{ fontSize: '10px', color: scoreColor, fontWeight: 600, marginTop: '2px' }}>Conformidade</div>
            </div>
          )}
        </div>

        {/* Fields summary */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#64748B',
            display: 'flex',
            gap: '20px',
          }}
        >
          <span><strong style={{ color: '#0F172A' }}>{execution.answeredItems}</strong> / {execution.totalItems} campos respondidos</span>
          {template && (
            <span><strong style={{ color: '#0F172A' }}>{template.estimatedMinutes}</strong> min estimados</span>
          )}
        </div>

        {/* Approve / Reject buttons if completed */}
        {execution.status === 'completed' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              style={{
                padding: '9px 22px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#fff',
                border: 'none',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              }}
            >
              <CheckCircle size={15} />
              Aprovar
            </button>
            <button
              type="button"
              style={{
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <XCircle size={15} />
              Rejeitar
            </button>
          </div>
        )}
      </div>

      {/* Answers (read-only form) */}
      {template ? (
        <DynamicFormRenderer
          schema={template.schema}
          values={values}
          onChange={() => {}}
          readOnly
        />
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
          Template não encontrado
        </div>
      )}

      {/* Back button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={() => navigate('/checklists/executions')}
          style={{
            padding: '9px 18px',
            background: 'transparent',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          ← Voltar para Execuções
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChecklistExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = !id || id === 'new';
  const existingExecution = isNew ? null : mockChecklistExecutions.find(e => e.id === id) ?? null;

  // New execution state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [responsible, setResponsible] = useState('Ana Souza');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [highlightRequired, setHighlightRequired] = useState(false);
  const [startedAt, setStartedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');

  function handleStart() {
    if (!selectedTemplate || !selectedUnit) return;
    setStartedAt(new Date().toISOString());
    setStep(2);
  }

  function handleAnswerChange(key: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function handleSaveDraft() {
    // In a real app: save to backend
    navigate('/checklists/executions');
  }

  function handleComplete() {
    if (!selectedTemplate) return;
    const requiredFields = selectedTemplate.schema.filter(f => f.required);
    const allDone = requiredFields.every(f => !isEmpty(answers[f.key]));
    if (!allDone) {
      setHighlightRequired(true);
      return;
    }
    setCompletedAt(new Date().toISOString());
    setStep(3);
  }

  const score = selectedTemplate
    ? (() => {
        const req = selectedTemplate.schema.filter(f => f.required);
        if (req.length === 0) return 100;
        const answered = req.filter(f => !isEmpty(answers[f.key])).length;
        return Math.round((answered / req.length) * 100);
      })()
    : 0;

  // ── View mode (existing execution) ────────────────────────────────────────
  if (!isNew && existingExecution) {
    return <ViewMode execution={existingExecution} />;
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!isNew && !existingExecution) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
        <ClipboardList size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#64748B' }}>Execução não encontrada</p>
        <button
          type="button"
          onClick={() => navigate('/checklists/executions')}
          style={{
            marginTop: '16px',
            padding: '9px 20px',
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Voltar para Execuções
        </button>
      </div>
    );
  }

  // ── New execution flow ────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
        <Link to="/operacao" style={{ color: '#94A3B8', textDecoration: 'none' }}>Operação</Link>
        <span>/</span>
        <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Checklists</Link>
        <span>/</span>
        <Link to="/checklists/executions" style={{ color: '#94A3B8', textDecoration: 'none' }}>Execuções</Link>
        <span>/</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>Nova Execução</span>
      </div>

      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <PlayCircle size={22} style={{ color: '#6366F1' }} />
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Nova Execução</h1>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      {step === 1 && (
        <Step1
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          selectedUnit={selectedUnit}
          onSelectUnit={setSelectedUnit}
          responsible={responsible}
          onChangeResponsible={setResponsible}
          onStart={handleStart}
        />
      )}

      {step === 2 && selectedTemplate && (
        <Step2
          template={selectedTemplate}
          unitName={selectedUnit}
          responsible={responsible}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          highlightRequired={highlightRequired}
          startedAt={startedAt}
          onSaveDraft={handleSaveDraft}
          onComplete={handleComplete}
        />
      )}

      {step === 3 && selectedTemplate && (
        <Step3
          template={selectedTemplate}
          unitName={selectedUnit}
          responsible={responsible}
          answers={answers}
          score={score}
          startedAt={startedAt}
          completedAt={completedAt}
          onViewDetails={() => navigate('/checklists/executions')}
          onNewExecution={() => {
            setStep(1);
            setSelectedTemplate(null);
            setSelectedUnit('');
            setAnswers({});
            setHighlightRequired(false);
            setStartedAt('');
            setCompletedAt('');
          }}
        />
      )}
    </div>
  );
}
