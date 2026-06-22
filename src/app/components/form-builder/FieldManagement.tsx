import React, { useState, useCallback, lazy, Suspense } from 'react';
const FieldCreatorWizard = lazy(() =>
  import('./FieldCreatorWizard').then(m => ({ default: m.FieldCreatorWizard }))
);
import { useParams, useNavigate, Link } from 'react-router';
import {
  Plus,
  X,
  ChevronRight,
  GripVertical,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit,
  Copy,
  PowerOff,
  Trash2,
  CheckCircle,
  Circle,
  MinusCircle,
  LayoutGrid,
  History,
  GitBranch,
  Upload,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  Mail,
  Phone,
  Link2,
  ToggleLeft,
  ListChecks,
  Paperclip,
  Image,
  Users,
  Building2,
  Shield,
  Truck,
  ClipboardCheck,
  MessageCircle,
  Target,
  Receipt,
  Package,
} from 'lucide-react';

import {
  mockClientFields,
  mockClientSections,
  mockClientGroups,
  mockEntities,
} from '../../data/formBuilderMockData';
import type { FormField, FormSection, FieldOption } from '../../../types/formBuilder';
import { FIELD_TYPE_DEFINITIONS } from '../../../types/formBuilder';

// ---------------------------------------------------------------------------
// Icon mappings
// ---------------------------------------------------------------------------

const LUCIDE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>> = {
  Type, AlignLeft, Hash, DollarSign, Calendar, Clock, Mail, Phone, Link2,
  ToggleLeft, ChevronDown, ListChecks, Paperclip, Image,
  Users, Building2, Shield, Truck, ClipboardCheck, MessageCircle, Target,
  Receipt, Package,
};

const ENTITY_ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Users, Building2, Shield, Truck, ClipboardCheck, MessageCircle, Target, DollarSign, Receipt, Package,
};

function FieldTypeIcon({ iconName, size = 14 }: { iconName: string; size?: number }) {
  const Icon = LUCIDE_ICON_MAP[iconName];
  if (!Icon) return null;
  return <Icon size={size} />;
}

// ---------------------------------------------------------------------------
// Type badge colors
// ---------------------------------------------------------------------------

function getTypeBadgeColor(type: string): string {
  if (['text', 'textarea'].includes(type)) return '#6366F1';
  if (['number', 'currency'].includes(type)) return '#10B981';
  if (['date', 'datetime'].includes(type)) return '#F59E0B';
  if (['email', 'phone', 'url'].includes(type)) return '#3B82F6';
  if (['checkbox', 'select', 'multiselect'].includes(type)) return '#8B5CF6';
  if (['file', 'image'].includes(type)) return '#EC4899';
  return '#6B7280';
}

function getTypeDef(type: string) {
  return FIELD_TYPE_DEFINITIONS.find((d) => d.type === type);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function FieldStatusBadge({ status }: { status: FormField['status'] }) {
  const configs = {
    active: { label: 'Ativo', color: '#10B981', bg: '#D1FAE5' },
    inactive: { label: 'Inativo', color: '#6B7280', bg: '#F3F4F6' },
    draft: { label: 'Rascunho', color: '#F59E0B', bg: '#FEF3C7' },
  };
  const cfg = configs[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {status === 'active' && <CheckCircle size={10} />}
      {status === 'inactive' && <MinusCircle size={10} />}
      {status === 'draft' && <Circle size={10} />}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Kebab Menu
// ---------------------------------------------------------------------------

function KebabMenu({
  field,
  onEdit,
  onDuplicate,
  onDeactivate,
  onDelete,
}: {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: 6,
          color: '#94A3B8',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              zIndex: 50,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              minWidth: 160,
              overflow: 'hidden',
            }}
          >
            {[
              { icon: <Edit size={13} />, label: 'Editar', action: onEdit, color: '#374151' },
              { icon: <Copy size={13} />, label: 'Duplicar', action: onDuplicate, color: '#374151' },
              { icon: <PowerOff size={13} />, label: field.status === 'inactive' ? 'Ativar' : 'Desativar', action: onDeactivate, color: '#F59E0B' },
              { icon: <Trash2 size={13} />, label: 'Excluir', action: onDelete, color: '#EF4444', disabled: field.origin === 'system' },
            ].map((item) => (
              <button
                key={`${field.id}-${item.label}`}
                disabled={item.disabled}
                onClick={(e) => { e.stopPropagation(); item.action(); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  color: item.disabled ? '#CBD5E1' : item.color,
                  fontSize: 13,
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!item.disabled) (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Option Manager (Tela 07)
// ---------------------------------------------------------------------------

function OptionManager({
  options,
  onChange,
}: {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}) {
  const [newLabel, setNewLabel] = useState('');

  const addOption = () => {
    if (!newLabel.trim()) return;
    const newOpt: FieldOption = {
      id: `opt-${Date.now()}`,
      label: newLabel.trim(),
      value: newLabel.trim().toLowerCase().replace(/\s+/g, '_'),
      color: '#6366F1',
      order: options.length + 1,
    };
    onChange([...options, newOpt]);
    setNewLabel('');
  };

  const removeOption = (id: string) => {
    onChange(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, label: string) => {
    onChange(options.map((o) => (o.id === id ? { ...o, label, value: label.toLowerCase().replace(/\s+/g, '_') } : o)));
  };

  const updateColor = (id: string, color: string) => {
    onChange(options.map((o) => (o.id === id ? { ...o, color } : o)));
  };

  const moveOption = (id: string, dir: -1 | 1) => {
    const idx = options.findIndex((o) => o.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= options.length) return;
    const arr = [...options];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr.map((o, i) => ({ ...o, order: i + 1 })));
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Opções
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              background: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
            }}
          >
            <GripVertical size={12} color="#CBD5E1" style={{ cursor: 'grab', flexShrink: 0 }} />
            <input
              type="color"
              value={opt.color || '#6366F1'}
              onChange={(e) => updateColor(opt.id, e.target.value)}
              style={{ width: 20, height: 20, border: 'none', cursor: 'pointer', borderRadius: '50%', padding: 0, flexShrink: 0 }}
            />
            <input
              value={opt.label}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
              }}
            />
            <button
              onClick={() => moveOption(opt.id, -1)}
              disabled={idx === 0}
              style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: '#94A3B8', padding: '0 2px', display: 'flex' }}
            >
              <ArrowUp size={12} />
            </button>
            <button
              onClick={() => moveOption(opt.id, 1)}
              disabled={idx === options.length - 1}
              style={{ background: 'none', border: 'none', cursor: idx === options.length - 1 ? 'not-allowed' : 'pointer', color: '#94A3B8', padding: '0 2px', display: 'flex' }}
            >
              <ArrowDown size={12} />
            </button>
            <button
              onClick={() => removeOption(opt.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0 2px', display: 'flex' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addOption(); }}
          placeholder="Nova opção..."
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            fontSize: 13,
            color: '#0F172A',
            outline: 'none',
            background: '#FFFFFF',
          }}
        />
        <button
          onClick={addOption}
          style={{
            padding: '6px 12px',
            background: '#6366F1',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Config Panel (Tela 06)
// ---------------------------------------------------------------------------

type PanelTab = 'config' | 'validation' | 'appearance';

function FieldConfigPanel({
  field,
  sections,
  onClose,
  onChange,
}: {
  field: FormField;
  sections: FormSection[];
  onClose: () => void;
  onChange: (updated: FormField) => void;
}) {
  const [tab, setTab] = useState<PanelTab>('config');
  const typeDef = getTypeDef(field.type);
  const badgeColor = getTypeBadgeColor(field.type);
  const isSystem = field.origin === 'system';
  const supportsOptions = typeDef?.supportsOptions && field.options;
  const supportsValidation = typeDef?.supportsValidation;

  const update = (patch: Partial<FormField>) => onChange({ ...field, ...patch });
  const updateValidation = (patch: Partial<NonNullable<FormField['validation']>>) =>
    onChange({ ...field, validation: { ...(field.validation ?? {}), ...patch } });

  const panelTabs: { id: PanelTab; label: string }[] = [
    { id: 'config', label: 'Configuração' },
    { id: 'validation', label: 'Validação' },
    { id: 'appearance', label: 'Aparência' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 360,
        height: '100vh',
        background: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: badgeColor + '18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: badgeColor,
            flexShrink: 0,
          }}
        >
          {typeDef && <FieldTypeIcon iconName={typeDef.icon} size={15} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {field.label}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{field.name}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            padding: 4,
            display: 'flex',
            borderRadius: 6,
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Panel Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
          padding: '0 20px',
        }}
      >
        {panelTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#6366F1' : '#64748B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {tab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Nome interno */}
            <FormField_
              label="Nome interno"
              hint="Identificador único em snake_case"
            >
              <input
                value={field.name}
                readOnly={isSystem}
                onChange={(e) => !isSystem && update({ name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: isSystem ? '#94A3B8' : '#0F172A',
                  background: isSystem ? '#F8FAFC' : '#FFFFFF',
                  cursor: isSystem ? 'not-allowed' : 'text',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </FormField_>

            {/* Label */}
            <FormField_ label="Label">
              <input
                value={field.label}
                onChange={(e) => update({ label: e.target.value })}
                style={inputStyle}
              />
            </FormField_>

            {/* Descrição */}
            <FormField_ label="Descrição">
              <textarea
                value={field.description ?? ''}
                onChange={(e) => update({ description: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </FormField_>

            {/* Placeholder */}
            <FormField_ label="Placeholder">
              <input
                value={field.placeholder ?? ''}
                onChange={(e) => update({ placeholder: e.target.value })}
                style={inputStyle}
              />
            </FormField_>

            {/* Texto de ajuda */}
            <FormField_ label="Texto de ajuda">
              <input
                value={field.helpText ?? ''}
                onChange={(e) => update({ helpText: e.target.value })}
                style={inputStyle}
              />
            </FormField_>

            {/* Mensagem de erro */}
            <FormField_ label="Mensagem de erro customizada">
              <input
                value={field.errorMessage ?? ''}
                onChange={(e) => update({ errorMessage: e.target.value })}
                style={inputStyle}
              />
            </FormField_>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'required' as const, label: 'Obrigatório' },
                { key: 'unique' as const, label: 'Único' },
                { key: 'visible' as const, label: 'Visível' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
                  <ToggleSwitch
                    value={field[key]}
                    onChange={(v) => update({ [key]: v })}
                  />
                </div>
              ))}
            </div>

            {/* Seção */}
            <FormField_ label="Seção">
              <select
                value={field.sectionId ?? ''}
                onChange={(e) => update({ sectionId: e.target.value || undefined })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">— Sem seção —</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </FormField_>

            {/* Posição */}
            <FormField_ label="Posição">
              <input
                type="number"
                value={field.order}
                onChange={(e) => update({ order: Number(e.target.value) })}
                min={1}
                style={inputStyle}
              />
            </FormField_>

            {/* Options Manager */}
            {supportsOptions && field.options && (
              <div
                style={{
                  padding: 14,
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                }}
              >
                <OptionManager
                  options={field.options}
                  onChange={(opts) => update({ options: opts })}
                />
              </div>
            )}
          </div>
        )}

        {tab === 'validation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!supportsValidation && (
              <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingTop: 24 }}>
                Este tipo de campo não suporta validações configuráveis.
              </div>
            )}
            {supportsValidation && (
              <>
                {['text', 'textarea'].includes(field.type) && (
                  <>
                    <FormField_ label="Comprimento mínimo">
                      <input
                        type="number"
                        value={field.validation?.minLength ?? ''}
                        onChange={(e) => updateValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                        min={0}
                        style={inputStyle}
                      />
                    </FormField_>
                    <FormField_ label="Comprimento máximo">
                      <input
                        type="number"
                        value={field.validation?.maxLength ?? ''}
                        onChange={(e) => updateValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                        min={0}
                        style={inputStyle}
                      />
                    </FormField_>
                    <FormField_ label="Padrão (regex)">
                      <input
                        value={field.validation?.pattern ?? ''}
                        onChange={(e) => updateValidation({ pattern: e.target.value || undefined })}
                        placeholder="Ex: ^\d{5}-\d{3}$"
                        style={{ ...inputStyle, fontFamily: 'monospace' }}
                      />
                    </FormField_>
                    <FormField_ label="Mensagem do padrão">
                      <input
                        value={field.validation?.patternMessage ?? ''}
                        onChange={(e) => updateValidation({ patternMessage: e.target.value || undefined })}
                        style={inputStyle}
                      />
                    </FormField_>
                  </>
                )}
                {['number', 'currency'].includes(field.type) && (
                  <>
                    <FormField_ label="Valor mínimo">
                      <input
                        type="number"
                        value={field.validation?.min ?? ''}
                        onChange={(e) => updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                      />
                    </FormField_>
                    <FormField_ label="Valor máximo">
                      <input
                        type="number"
                        value={field.validation?.max ?? ''}
                        onChange={(e) => updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                      />
                    </FormField_>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingTop: 24 }}>
              Configurações de aparência em breve.
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '9px 0',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Cancelar
        </button>
        <button
          style={{
            flex: 2,
            padding: '9px 0',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#FFFFFF',
          }}
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #E2E8F0',
  borderRadius: 6,
  fontSize: 13,
  color: '#0F172A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  outline: 'none',
};

function FormField_({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{hint}</div>}
      {children}
    </div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 99,
        border: 'none',
        cursor: 'pointer',
        background: value ? '#6366F1' : '#CBD5E1',
        position: 'relative',
        transition: 'background 0.15s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FieldManagement() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  // Resolve entity (fall back to first entity for mock)
  const entity = mockEntities.find((e) => e.id === entityId) ?? mockEntities[0];
  const EntityIcon = ENTITY_ICON_MAP[entity.icon] ?? Users;

  const [fields, setFields] = useState<FormField[]>(mockClientFields);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState<'campos' | 'secoes' | 'regras'>('campos');
  const [openKebab, setOpenKebab] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleFieldClick = useCallback((field: FormField) => {
    setSelectedField((prev) => (prev?.id === field.id ? null : field));
  }, []);

  const handleFieldChange = useCallback((updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setSelectedField(updated);
  }, []);

  const handleDuplicate = useCallback((field: FormField) => {
    const dup: FormField = {
      ...field,
      id: `field-copy-${Date.now()}`,
      name: `${field.name}_copy`,
      label: `${field.label} (cópia)`,
      origin: 'custom',
      status: 'draft',
      order: fields.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFields((prev) => [...prev, dup]);
  }, [fields.length]);

  const handleDeactivate = useCallback((field: FormField) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === field.id
          ? { ...f, status: f.status === 'inactive' ? 'active' : 'inactive' }
          : f,
      ),
    );
  }, []);

  const handleDelete = useCallback((field: FormField) => {
    if (field.origin === 'system') return;
    setFields((prev) => prev.filter((f) => f.id !== field.id));
    if (selectedField?.id === field.id) setSelectedField(null);
  }, [selectedField]);

  const versionStatus = entity.status === 'active' ? 'Publicado' : 'Rascunho';
  const customCount = fields.filter((f) => f.origin === 'custom').length;
  const systemCount = fields.filter((f) => f.origin === 'system').length;

  const mainTabs = [
    { id: 'campos', label: 'Campos' },
    { id: 'secoes', label: 'Seções' },
    { id: 'regras', label: 'Regras' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Overlay when panel is open */}
      {selectedField && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(15,23,42,0.08)' }}
          onClick={() => setSelectedField(null)}
        />
      )}

      {/* Main content shifts left when panel open */}
      <div
        style={{
          marginRight: selectedField ? 360 : 0,
          transition: 'margin-right 0.25s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '0 32px',
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingTop: 16,
              paddingBottom: 8,
              fontSize: 12,
              color: '#94A3B8',
            }}
          >
            <Link to="/settings" style={{ color: '#94A3B8', textDecoration: 'none' }}>Configurações</Link>
            <ChevronRight size={12} />
            <Link to="/settings/form-builder" style={{ color: '#94A3B8', textDecoration: 'none' }}>Form Builder</Link>
            <ChevronRight size={12} />
            <span style={{ color: '#374151', fontWeight: 500 }}>{entity.name}</span>
          </div>

          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              paddingBottom: 16,
              flexWrap: 'wrap',
              rowGap: 10,
            }}
          >
            {/* Entity icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <EntityIcon size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{entity.name}</h1>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: entity.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                      color: entity.status === 'active' ? '#059669' : '#D97706',
                    }}
                  >
                    v{entity.currentVersion} · {versionStatus}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  {fields.length} campos · {systemCount} sistema · {customCount} personalizados
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <Link
                to={`/settings/form-builder/${entity.id}/organize`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
              >
                <LayoutGrid size={14} /> Organizar Formulário
              </Link>
              <Link
                to={`/settings/form-builder/${entity.id}/history`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <History size={14} /> Histórico
              </Link>
              <Link
                to={`/settings/form-builder/${entity.id}/versions`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <GitBranch size={14} /> Versões
              </Link>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }}
              >
                <Upload size={14} /> Publicar alterações
              </button>
            </div>
          </div>

          {/* Main tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {mainTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: activeTab === t.id ? 600 : 400,
                  color: activeTab === t.id ? '#6366F1' : '#64748B',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === t.id ? '2px solid #6366F1' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div style={{ flex: 1, padding: '24px 32px' }}>
          {activeTab === 'campos' && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 160px 1fr 140px 90px 70px 120px 100px 50px',
                  gap: 0,
                  padding: '10px 16px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  alignItems: 'center',
                }}
              >
                <div />
                <div>Campo</div>
                <div>Label</div>
                <div>Tipo</div>
                <div>Obrigatório</div>
                <div>Visível</div>
                <div>Origem</div>
                <div>Status</div>
                <div>Ações</div>
              </div>

              {/* Table Rows */}
              {fields.map((field) => {
                const typeDef = getTypeDef(field.type);
                const badgeColor = getTypeBadgeColor(field.type);
                const isSelected = selectedField?.id === field.id;

                return (
                  <div
                    key={field.id}
                    onClick={() => handleFieldClick(field)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 160px 1fr 140px 90px 70px 120px 100px 50px',
                      gap: 0,
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: isSelected ? '#EEF2FF' : 'transparent',
                      alignItems: 'center',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = isSelected ? '#EEF2FF' : 'transparent';
                    }}
                  >
                    {/* Drag handle */}
                    <div style={{ color: '#CBD5E1', display: 'flex' }}>
                      <GripVertical size={15} />
                    </div>

                    {/* Campo (internal name) */}
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingRight: 8,
                      }}
                    >
                      {field.name}
                    </div>

                    {/* Label */}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingRight: 8,
                      }}
                    >
                      {field.label}
                    </div>

                    {/* Tipo */}
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 9px',
                          borderRadius: 99,
                          background: badgeColor + '18',
                          color: badgeColor,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {typeDef && <FieldTypeIcon iconName={typeDef.icon} size={11} />}
                        {typeDef?.label ?? field.type}
                      </span>
                    </div>

                    {/* Obrigatório */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                      {field.required ? (
                        <CheckCircle size={16} color="#10B981" />
                      ) : (
                        <Circle size={16} color="#CBD5E1" />
                      )}
                    </div>

                    {/* Visível */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                      {field.visible ? (
                        <Eye size={15} color="#6366F1" />
                      ) : (
                        <EyeOff size={15} color="#CBD5E1" />
                      )}
                    </div>

                    {/* Origem */}
                    <div>
                      {field.origin === 'system' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: '#F1F5F9',
                            color: '#64748B',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <Lock size={11} /> Sistema
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: '#EEF2FF',
                            color: '#6366F1',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <Sparkles size={11} /> Personalizado
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <FieldStatusBadge status={field.status} />
                    </div>

                    {/* Ações */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <KebabMenu
                        field={field}
                        onEdit={() => handleFieldClick(field)}
                        onDuplicate={() => handleDuplicate(field)}
                        onDeactivate={() => handleDeactivate(field)}
                        onDelete={() => handleDelete(field)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'secoes' && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: 32,
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: 14,
              }}
            >
              Gerenciamento de seções em breve.
            </div>
          )}

          {activeTab === 'regras' && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: 32,
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: 14,
              }}
            >
              Configuração de regras de exibição em breve.
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Floating "Novo Campo" button                                       */}
      {/* ---------------------------------------------------------------- */}
      <button
        style={{
          position: 'fixed',
          bottom: 28,
          right: selectedField ? 388 : 28,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          border: 'none',
          borderRadius: 99,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          color: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          transition: 'right 0.25s ease, transform 0.15s',
          zIndex: 50,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        onClick={() => setWizardOpen(true)}
      >
        <Plus size={18} />
        Novo Campo
      </button>

      {/* ---------------------------------------------------------------- */}
      {/* Field Creator Wizard                                               */}
      {/* ---------------------------------------------------------------- */}
      {wizardOpen && (
        <Suspense fallback={null}>
          <FieldCreatorWizard
            entityId={entityId ?? 'clients'}
            entityName={entity?.name ?? 'Entidade'}
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
            onSave={(newField) => {
              const field: FormField = {
                id: `custom_${Date.now()}`,
                entityId: entityId ?? 'clients',
                name: (newField as any).name ?? 'novo_campo',
                label: (newField as any).label ?? 'Novo Campo',
                type: (newField as any).type ?? 'text',
                required: (newField as any).required ?? false,
                unique: false,
                visible: true,
                origin: 'custom',
                status: 'draft',
                order: fields.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...newField,
              };
              setFields(prev => [...prev, field]);
              setWizardOpen(false);
            }}
          />
        </Suspense>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Right panel                                                        */}
      {/* ---------------------------------------------------------------- */}
      {selectedField && (
        <FieldConfigPanel
          field={selectedField}
          sections={mockClientSections}
          onClose={() => setSelectedField(null)}
          onChange={handleFieldChange}
        />
      )}
    </div>
  );
}

export default FieldManagement;
