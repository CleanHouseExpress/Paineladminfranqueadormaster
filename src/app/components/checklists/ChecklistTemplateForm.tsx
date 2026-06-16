import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  GripVertical, Eye, Code2, Plus, Trash2, Copy, ChevronDown,
  Type, AlignLeft, Hash, DollarSign, Calendar, Clock, Mail, Phone,
  Link2, ToggleLeft, ListChecks, Paperclip, Image, MoreVertical,
  SeparatorHorizontal, Save, X, ToggleRight,
} from 'lucide-react';
import { DynamicFormRenderer } from '../../../shared/components/DynamicFormRenderer';
import { FIELD_TYPE_DEFINITIONS } from '../../../types/formBuilder';
import type { ChecklistTemplate, ChecklistFieldSchema, ChecklistCategory } from '../../../types/checklist';
import { mockChecklistTemplates } from '../../data/checklistMockData';

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type size={13} />,
  AlignLeft: <AlignLeft size={13} />,
  Hash: <Hash size={13} />,
  DollarSign: <DollarSign size={13} />,
  Calendar: <Calendar size={13} />,
  Clock: <Clock size={13} />,
  Mail: <Mail size={13} />,
  Phone: <Phone size={13} />,
  Link2: <Link2 size={13} />,
  ToggleLeft: <ToggleLeft size={13} />,
  ChevronDown: <ChevronDown size={13} />,
  ListChecks: <ListChecks size={13} />,
  Paperclip: <Paperclip size={13} />,
  Image: <Image size={13} />,
};

const TYPE_COLORS: Record<string, string> = {
  text: '#6366F1', textarea: '#8B5CF6', number: '#0EA5E9', currency: '#10B981',
  date: '#F59E0B', datetime: '#F97316', email: '#EC4899', phone: '#14B8A6',
  url: '#6366F1', checkbox: '#22C55E', boolean: '#22C55E', select: '#8B5CF6',
  multiselect: '#6366F1', file: '#64748B', image: '#F43F5E',
  document: '#94A3B8', photo: '#F43F5E', signature: '#0F172A',
};

// All field types for the checklist (superset of FIELD_TYPE_DEFINITIONS)
const CHECKLIST_FIELD_TYPES = [
  ...FIELD_TYPE_DEFINITIONS,
  { type: 'boolean' as const, label: 'Sim / Não', icon: 'ToggleLeft', description: 'Resposta binária Sim/Não', category: 'choice' as const },
  { type: 'photo' as const, label: 'Foto', icon: 'Image', description: 'Captura de foto', category: 'media' as const },
  { type: 'signature' as const, label: 'Assinatura', icon: 'Image', description: 'Assinatura digital', category: 'media' as const },
];

const CATEGORIES: { value: ChecklistCategory; label: string }[] = [
  { value: 'abertura', label: 'Abertura' },
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'auditoria', label: 'Auditoria' },
  { value: 'operacional', label: 'Operacional' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldRowProps {
  field: ChecklistFieldSchema;
  index: number;
  onEdit: (field: ChecklistFieldSchema) => void;
  onDuplicate: (field: ChecklistFieldSchema) => void;
  onDelete: (key: string) => void;
  onToggleRequired: (key: string) => void;
  onLabelChange: (key: string, label: string) => void;
  dragHandlers: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent, idx: number) => void;
    onDragOver: (e: React.DragEvent, idx: number) => void;
    onDrop: (e: React.DragEvent, idx: number) => void;
  };
  isDragOver: boolean;
}

function FieldRow({
  field, index, onEdit, onDuplicate, onDelete, onToggleRequired, onLabelChange, dragHandlers, isDragOver,
}: FieldRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(field.label);
  const typeDef = CHECKLIST_FIELD_TYPES.find(t => t.type === field.type);
  const color = TYPE_COLORS[field.type] ?? '#6366F1';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '8px',
        border: isDragOver ? '2px dashed #6366F1' : '1px solid rgba(0,0,0,0.07)',
        background: isDragOver ? '#EEF2FF' : '#fff',
        transition: 'all 0.15s',
        cursor: 'default',
        position: 'relative',
      }}
      draggable={dragHandlers.draggable}
      onDragStart={e => dragHandlers.onDragStart(e, index)}
      onDragOver={e => dragHandlers.onDragOver(e, index)}
      onDrop={e => dragHandlers.onDrop(e, index)}
    >
      {/* Drag handle */}
      <span style={{ color: '#CBD5E1', cursor: 'grab', flexShrink: 0 }}>
        <GripVertical size={14} />
      </span>

      {/* Type icon */}
      <span style={{ color, flexShrink: 0 }}>
        {ICON_MAP[typeDef?.icon ?? 'Type'] ?? <Type size={13} />}
      </span>

      {/* Label (inline editable) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingLabel ? (
          <input
            autoFocus
            value={labelVal}
            onChange={e => setLabelVal(e.target.value)}
            onBlur={() => {
              onLabelChange(field.key, labelVal || field.label);
              setEditingLabel(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                onLabelChange(field.key, labelVal || field.label);
                setEditingLabel(false);
              }
            }}
            style={{
              width: '100%',
              border: '1px solid #6366F1',
              borderRadius: '5px',
              padding: '2px 6px',
              fontSize: '13px',
              color: '#0F172A',
              outline: 'none',
              background: '#fff',
            }}
          />
        ) : (
          <span
            style={{ fontSize: '13px', color: '#0F172A', cursor: 'text', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onClick={() => { setLabelVal(field.label); setEditingLabel(true); }}
            title="Clique para editar"
          >
            {field.label}
          </span>
        )}
      </div>

      {/* Type badge */}
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: '999px',
          background: `${color}18`,
          color,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {typeDef?.label ?? field.type}
      </span>

      {/* Required toggle */}
      <button
        type="button"
        onClick={() => onToggleRequired(field.key)}
        title={field.required ? 'Obrigatório (clique para tornar opcional)' : 'Opcional (clique para tornar obrigatório)'}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: field.required ? '2px solid #EF4444' : '2px solid #CBD5E1',
          background: field.required ? '#FEE2E2' : 'transparent',
          color: field.required ? '#EF4444' : '#94A3B8',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
          padding: 0,
        }}
      >
        *
      </button>

      {/* ⋮ Menu */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: 'none',
            background: menuOpen ? '#EEF2FF' : 'transparent',
            color: menuOpen ? '#6366F1' : '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoreVertical size={13} />
        </button>
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '28px',
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: '150px',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Editar', icon: <Type size={13} />, action: () => { onEdit(field); setMenuOpen(false); } },
              { label: 'Duplicar', icon: <Copy size={13} />, action: () => { onDuplicate(field); setMenuOpen(false); } },
              { label: 'Excluir', icon: <Trash2 size={13} />, action: () => { onDelete(field.key); setMenuOpen(false); }, danger: true },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: item.danger ? '#EF4444' : '#0F172A',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = item.danger ? '#FEF2F2' : '#F8FAFC'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{ opacity: 0.7 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline field adder ───────────────────────────────────────────────────────

interface InlineAdderProps {
  onAdd: (field: Omit<ChecklistFieldSchema, 'order'>) => void;
  onCancel: () => void;
}

function InlineFieldAdder({ onAdd, onCancel }: InlineAdderProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<string>('boolean');
  const [required, setRequired] = useState(true);
  const [helpText, setHelpText] = useState('');
  const [options, setOptions] = useState<{ label: string; value: string }[]>([
    { label: 'Sim', value: 'sim' },
    { label: 'Não', value: 'nao' },
  ]);
  const [newOptLabel, setNewOptLabel] = useState('');

  const selectedDef = CHECKLIST_FIELD_TYPES.find(t => t.type === type);
  const supportsOptions = selectedDef?.supportsOptions;

  function handleAdd() {
    if (!label.trim()) return;
    const key = slugify(label) || `campo_${generateId()}`;
    onAdd({
      key,
      label: label.trim(),
      type: type as ChecklistFieldSchema['type'],
      required,
      helpText: helpText.trim() || undefined,
      options: supportsOptions ? options : undefined,
    });
  }

  function addOption() {
    if (!newOptLabel.trim()) return;
    setOptions(prev => [...prev, { label: newOptLabel.trim(), value: slugify(newOptLabel.trim()) }]);
    setNewOptLabel('');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '7px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '13px',
    color: '#0F172A',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1px dashed #6366F1',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '12px', color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Novo Campo
      </div>

      {/* Label */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
          Rótulo do campo <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Ex: Equipamentos em ordem?"
          style={inputStyle}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel(); }}
        />
      </div>

      {/* Type */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
          Tipo
        </label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {CHECKLIST_FIELD_TYPES.map(t => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Required toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
        <div
          onClick={() => setRequired(v => !v)}
          style={{
            width: '36px',
            height: '20px',
            borderRadius: '999px',
            background: required ? '#6366F1' : '#CBD5E1',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: required ? '18px' : '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }}
          />
        </div>
        Obrigatório
      </label>

      {/* Help text */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
          Texto de ajuda <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>(opcional)</span>
        </label>
        <input
          value={helpText}
          onChange={e => setHelpText(e.target.value)}
          placeholder="Instruções adicionais para o usuário"
          style={inputStyle}
        />
      </div>

      {/* Options (if select/multiselect) */}
      {supportsOptions && (
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
            Opções
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#0F172A', flex: 1 }}>{opt.label}</span>
                <button
                  type="button"
                  onClick={() => setOptions(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={newOptLabel}
              onChange={e => setNewOptLabel(e.target.value)}
              placeholder="Nova opção..."
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => { if (e.key === 'Enter') addOption(); }}
            />
            <button
              type="button"
              onClick={addOption}
              style={{
                padding: '7px 12px',
                background: '#EEF2FF',
                color: '#6366F1',
                border: '1px solid #C7D2FE',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '7px 16px',
            background: 'transparent',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!label.trim()}
          style={{
            padding: '7px 16px',
            background: label.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#E2E8F0',
            color: label.trim() ? '#fff' : '#94A3B8',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: label.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChecklistTemplateForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');

  const existing = isEdit
    ? mockChecklistTemplates.find(t => t.id === id) ?? null
    : null;

  // Form state
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<ChecklistCategory>(existing?.category ?? 'operacional');
  const [estimatedMinutes, setEstimatedMinutes] = useState(existing?.estimatedMinutes ?? 15);
  const [active, setActive] = useState(existing?.active ?? true);
  const [schema, setSchema] = useState<ChecklistFieldSchema[]>(existing?.schema ?? []);
  const [previewTab, setPreviewTab] = useState<'form' | 'json'>('form');
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  const [showAdder, setShowAdder] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Keep preview values in sync with schema keys
  useEffect(() => {
    setPreviewValues(prev => {
      const next: Record<string, unknown> = {};
      schema.forEach(f => { next[f.key] = prev[f.key] ?? ''; });
      return next;
    });
  }, [schema]);

  // ─── Schema mutations ───────────────────────────────────────────────────────

  function addField(fieldData: Omit<ChecklistFieldSchema, 'order'>) {
    setSchema(prev => [
      ...prev,
      { ...fieldData, order: prev.length + 1 },
    ]);
    setShowAdder(false);
  }

  function updateLabel(key: string, label: string) {
    setSchema(prev => prev.map(f => f.key === key ? { ...f, label } : f));
  }

  function toggleRequired(key: string) {
    setSchema(prev => prev.map(f => f.key === key ? { ...f, required: !f.required } : f));
  }

  function duplicateField(field: ChecklistFieldSchema) {
    const newField: ChecklistFieldSchema = {
      ...field,
      key: `${field.key}_copy_${generateId()}`,
      label: `${field.label} (cópia)`,
      order: schema.length + 1,
    };
    setSchema(prev => [...prev, newField]);
  }

  function deleteField(key: string) {
    setSchema(prev => prev.filter(f => f.key !== key).map((f, i) => ({ ...f, order: i + 1 })));
  }

  function addSection() {
    const sectionLabel = `Seção ${Math.ceil(schema.length / 3) + 1}`;
    // Add a "ghost" field that acts as a section divider via sectionLabel
    // We use a placeholder field that won't show in the form but marks a new section
    const divider: ChecklistFieldSchema = {
      key: `__section_${generateId()}`,
      label: sectionLabel,
      type: 'text' as ChecklistFieldSchema['type'],
      required: false,
      order: schema.length + 1,
      sectionLabel,
    };
    // Actually, we'll inject a section header by setting sectionLabel on a placeholder
    // For simplicity: prompt user for name and add a separator note
    const name = window.prompt('Nome da seção:', 'Nova Seção');
    if (!name) return;
    const sDiv: ChecklistFieldSchema = {
      key: `__section_${generateId()}`,
      label: `--- ${name} ---`,
      type: 'text' as ChecklistFieldSchema['type'],
      required: false,
      order: schema.length + 1,
      sectionLabel: name,
    };
    // Set sectionLabel for all subsequent fields - just add a "separator marker" field
    // We use a boolean field with a special key as a visual separator
    setSchema(prev => [
      ...prev,
      { ...sDiv },
    ]);
  }

  // ─── Drag and drop ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setSchema(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next.map((f, i) => ({ ...f, order: i + 1 }));
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  // ─── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!name.trim()) {
      alert('Por favor, informe o nome do template.');
      return;
    }
    // In a real app: POST/PUT to API
    navigate('/checklists/templates');
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '14px',
    color: '#0F172A',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 12px',
  };

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.07)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  };

  const requiredCount = schema.filter(f => f.required).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '0' }}>
      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
            <Link to="/operacao" style={{ color: '#94A3B8', textDecoration: 'none' }}>Operação</Link>
            <span>/</span>
            <Link to="/checklists" style={{ color: '#94A3B8', textDecoration: 'none' }}>Checklists</Link>
            <span>/</span>
            <Link to="/checklists/templates" style={{ color: '#94A3B8', textDecoration: 'none' }}>Templates</Link>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>{name || 'Novo Template'}</span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {isEdit ? (name || 'Editar Template') : 'Novo Template'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/checklists/templates')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <X size={14} />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            <Save size={14} />
            Salvar Template
          </button>
        </div>
      </div>

      {/* Two-panel body */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          height: 'calc(100vh - 72px)',
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT PANEL (55%) ── */}
        <div
          style={{
            width: '55%',
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderRight: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          {/* Section 1: Informações Básicas */}
          <div style={card}>
            <p style={sectionTitle}>Informações Básicas</p>

            {/* Nome */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                Nome do template <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Checklist de Abertura"
                style={inputStyle}
              />
            </div>

            {/* Descrição */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                Descrição
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva o objetivo e contexto de uso deste template..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Categoria + Tempo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ChecklistCategory)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' }}>
                  Estimativa de tempo
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    min={1}
                    onChange={e => setEstimatedMinutes(Number(e.target.value))}
                    style={{ ...inputStyle, borderRadius: '8px 0 0 8px', textAlign: 'right', width: '80px' }}
                  />
                  <span
                    style={{
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderLeft: 'none',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '13px',
                      color: '#64748B',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    minutos
                  </span>
                </div>
              </div>
            </div>

            {/* Status toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>Status</p>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  {active ? 'Template ativo e disponível para execução' : 'Template inativo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: `2px solid ${active ? '#6366F1' : '#CBD5E1'}`,
                  background: active ? '#EEF2FF' : '#F8FAFC',
                  color: active ? '#6366F1' : '#64748B',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          </div>

          {/* Section 2: Schema de Campos */}
          <div style={card}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ ...sectionTitle, margin: 0 }}>Campos do Checklist</p>
                {schema.length > 0 && (
                  <span
                    style={{
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: '#EEF2FF',
                      color: '#6366F1',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {schema.length}
                  </span>
                )}
                {requiredCount > 0 && (
                  <span
                    style={{
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: '#FEE2E2',
                      color: '#EF4444',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {requiredCount} obrig.
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={addSection}
                  style={{
                    padding: '5px 10px',
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <SeparatorHorizontal size={12} />
                  Seção
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdder(true)}
                  style={{
                    padding: '5px 12px',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={13} />
                  Adicionar Campo
                </button>
              </div>
            </div>

            {/* Field list */}
            {schema.length === 0 && !showAdder && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  border: '2px dashed rgba(0,0,0,0.1)',
                  borderRadius: '10px',
                  color: '#94A3B8',
                }}
              >
                <ListChecks size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '13px', margin: '0 0 4px', fontWeight: 500 }}>Nenhum campo adicionado</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Clique em "+ Adicionar Campo" para começar</p>
              </div>
            )}

            {schema.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {schema.map((field, idx) => (
                  <FieldRow
                    key={field.key}
                    field={field}
                    index={idx}
                    onEdit={() => {}}
                    onDuplicate={duplicateField}
                    onDelete={deleteField}
                    onToggleRequired={toggleRequired}
                    onLabelChange={updateLabel}
                    dragHandlers={{
                      draggable: true,
                      onDragStart: handleDragStart,
                      onDragOver: handleDragOver,
                      onDrop: handleDrop,
                    }}
                    isDragOver={dragOverIdx === idx}
                  />
                ))}
              </div>
            )}

            {/* Inline adder */}
            {showAdder && (
              <InlineFieldAdder onAdd={addField} onCancel={() => setShowAdder(false)} />
            )}

            {!showAdder && schema.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAdder(true)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: '1px dashed rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366F1';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6366F1';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
                }}
              >
                <Plus size={14} />
                Adicionar campo
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (45%) ── */}
        <div
          style={{
            width: '45%',
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} style={{ color: '#6366F1' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Pré-visualização</span>
            </div>
            {/* Sub-tabs */}
            <div
              style={{
                display: 'flex',
                background: '#F1F5F9',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px',
              }}
            >
              {(['form', 'json'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPreviewTab(tab)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: previewTab === tab ? '#fff' : 'transparent',
                    color: previewTab === tab ? '#0F172A' : '#64748B',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: previewTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'form' ? <Eye size={12} /> : <Code2 size={12} />}
                  {tab === 'form' ? 'Formulário' : 'JSON Schema'}
                </button>
              ))}
            </div>
          </div>

          {/* Preview content */}
          {previewTab === 'form' ? (
            schema.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.07)',
                  color: '#94A3B8',
                }}
              >
                <Eye size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '14px', margin: '0 0 4px', fontWeight: 500 }}>Nenhum campo para visualizar</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Adicione campos no painel esquerdo para ver a pré-visualização</p>
              </div>
            ) : (
              <div>
                {name && (
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{name}</h2>
                    {description && <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{description}</p>}
                  </div>
                )}
                <DynamicFormRenderer
                  schema={schema.filter(f => !f.key.startsWith('__section_'))}
                  values={previewValues}
                  onChange={(key, val) => setPreviewValues(prev => ({ ...prev, [key]: val }))}
                  showProgress
                />
              </div>
            )
          ) : (
            <div
              style={{
                background: '#0F172A',
                borderRadius: '12px',
                padding: '16px',
                overflow: 'auto',
                flex: 1,
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: 1.6,
                  fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {renderJsonWithColors({
                  name,
                  description,
                  category,
                  estimatedMinutes,
                  active,
                  schema: schema.filter(f => !f.key.startsWith('__section_')),
                })}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── JSON color renderer ──────────────────────────────────────────────────────

function renderJsonWithColors(obj: unknown): React.ReactNode {
  const json = JSON.stringify(obj, null, 2);
  const lines = json.split('\n');

  return lines.map((line, i) => {
    // Colorize keys, strings, numbers, booleans
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partIdx = 0;

    // Simple regex-based highlighting
    const keyRe = /"([^"]+)":/g;
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    while ((m = keyRe.exec(remaining)) !== null) {
      if (m.index > lastIdx) {
        parts.push(<span key={partIdx++} style={{ color: '#94A3B8' }}>{remaining.slice(lastIdx, m.index)}</span>);
      }
      parts.push(<span key={partIdx++} style={{ color: '#7DD3FC' }}>"{m[1]}":</span>);
      lastIdx = m.index + m[0].length;
    }

    const tail = remaining.slice(lastIdx);
    if (tail) {
      // Color values
      const coloredTail = tail
        .replace(/"([^"]*)"/g, '<str>$1</str>')
        .replace(/\b(true|false)\b/g, '<bool>$1</bool>')
        .replace(/\b(\d+\.?\d*)\b/g, '<num>$1</num>');

      // Just render as colored spans
      if (coloredTail.includes('<str>') || coloredTail.includes('<bool>') || coloredTail.includes('<num>')) {
        // Simplified: just render different color for the whole value segment
        const isString = tail.trim().startsWith('"');
        const isBool = /^\s*(true|false)/.test(tail);
        const isNum = /^\s*\d/.test(tail);
        parts.push(
          <span
            key={partIdx++}
            style={{ color: isString ? '#86EFAC' : isBool ? '#FCA5A5' : isNum ? '#FDE68A' : '#94A3B8' }}
          >
            {tail}
          </span>
        );
      } else {
        parts.push(<span key={partIdx++} style={{ color: '#94A3B8' }}>{tail}</span>);
      }
    }

    return <div key={i}>{parts.length ? parts : line}</div>;
  });
}
