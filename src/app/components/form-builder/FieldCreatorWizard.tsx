import React, { useState, useEffect, useRef } from 'react';
import {
  X, Check, ChevronLeft, ChevronRight, Plus, Trash2, GripVertical,
  Type, AlignLeft, Hash, DollarSign, Calendar, Clock, Mail, Phone,
  Link2, ToggleLeft, ChevronDown, ListChecks, Paperclip, Image,
  Eye, Monitor, Smartphone, AlertCircle, Info, Star
} from 'lucide-react';
import { FIELD_TYPE_DEFINITIONS, FormField, FieldType, FieldOption } from '../../../types/formBuilder';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FieldCreatorWizardProps {
  entityId: string;
  entityName: string;
  open: boolean;
  onClose: () => void;
  onSave: (field: Partial<FormField>) => void;
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  Type, AlignLeft, Hash, DollarSign, Calendar, Clock,
  Mail, Phone, Link2, ToggleLeft, ChevronDown, ListChecks,
  Paperclip, Image,
};

// ─── Category Labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  text: 'Texto',
  number: 'Numérico',
  date: 'Data',
  choice: 'Seleção',
  media: 'Mídia',
  contact: 'Contato',
};

const CATEGORY_ORDER = ['text', 'number', 'date', 'choice', 'media', 'contact'];

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  text:    { bg: '#EEF2FF', icon: '#6366F1' },
  number:  { bg: '#FFF7ED', icon: '#EA580C' },
  date:    { bg: '#F0FDF4', icon: '#16A34A' },
  choice:  { bg: '#FDF4FF', icon: '#A21CAF' },
  media:   { bg: '#FFF1F2', icon: '#BE123C' },
  contact: { bg: '#F0F9FF', icon: '#0284C7' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, position: 'relative', flexShrink: 0,
          background: checked ? '#6366F1' : '#CBD5E1',
          transition: 'background 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
          borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{label}</span>
    </label>
  );
}

function InputField({ label, value, onChange, placeholder, disabled, type = 'text' }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          height: 40, padding: '0 12px', borderRadius: 8,
          border: '1.5px solid #E2E8F0',
          background: disabled ? '#F8FAFC' : 'white',
          color: disabled ? '#94A3B8' : '#0F172A',
          fontSize: 14, outline: 'none',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = '#6366F1'; }}
        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          padding: '10px 12px', borderRadius: 8,
          border: '1.5px solid #E2E8F0',
          background: 'white', color: '#0F172A',
          fontSize: 14, outline: 'none', resize: 'vertical',
          fontFamily: 'inherit', lineHeight: 1.5,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
      />
    </div>
  );
}

// ─── Field Type Selector ──────────────────────────────────────────────────────

function FieldTypeSelector({ selected, onSelect }: { selected: FieldType; onSelect: (t: FieldType) => void }) {
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof FIELD_TYPE_DEFINITIONS>>((acc, cat) => {
    acc[cat] = FIELD_TYPE_DEFINITIONS.filter(d => d.category === cat);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {CATEGORY_ORDER.map(cat => {
        const defs = grouped[cat];
        if (!defs?.length) return null;
        const colors = CATEGORY_COLORS[cat];
        return (
          <div key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: colors.icon,
              }}>
                {CATEGORY_LABELS[cat]}
              </span>
              <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {defs.map(def => {
                const IconComp = ICON_MAP[def.icon];
                const isSelected = selected === def.type;
                return (
                  <button
                    key={def.type}
                    onClick={() => onSelect(def.type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      border: isSelected ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
                      background: isSelected ? '#EEF2FF' : 'white',
                      textAlign: 'left', transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC';
                        (e.currentTarget as HTMLButtonElement).style.background = '#FAFAFA';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
                        (e.currentTarget as HTMLButtonElement).style.background = 'white';
                      }
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: isSelected ? '#C7D2FE' : colors.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}>
                      {IconComp && (
                        <IconComp size={16} color={isSelected ? '#4338CA' : colors.icon} strokeWidth={2} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: isSelected ? '#4338CA' : '#1E293B',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {def.label}
                      </div>
                      <div style={{
                        fontSize: 11, color: isSelected ? '#6366F1' : '#94A3B8',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginTop: 1,
                      }}>
                        {def.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Check size={10} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Options Manager ──────────────────────────────────────────────────────────

function OptionsManager({ options, onChange }: { options: FieldOption[]; onChange: (opts: FieldOption[]) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addOption() {
    const label = newLabel.trim();
    if (!label) return;
    const opt: FieldOption = {
      id: generateId(),
      label,
      value: toSnakeCase(label),
      order: options.length,
    };
    onChange([...options, opt]);
    setNewLabel('');
    inputRef.current?.focus();
  }

  function removeOption(id: string) {
    onChange(options.filter(o => o.id !== id).map((o, i) => ({ ...o, order: i })));
  }

  function updateLabel(id: string, label: string) {
    onChange(options.map(o => o.id === id ? { ...o, label, value: toSnakeCase(label) } : o));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Opções</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map((opt, idx) => (
          <div key={opt.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 8, background: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}>
            <GripVertical size={14} color="#CBD5E1" style={{ cursor: 'grab', flexShrink: 0 }} />
            <span style={{
              width: 20, height: 20, borderRadius: '50%', background: '#E0E7FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#6366F1', flexShrink: 0,
            }}>
              {idx + 1}
            </span>
            <input
              value={opt.label}
              onChange={e => updateLabel(opt.id, e.target.value)}
              style={{
                flex: 1, padding: '4px 8px', border: '1px solid transparent',
                borderRadius: 6, background: 'transparent', fontSize: 13, color: '#0F172A',
                fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#A5B4FC'; }}
              onBlur={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'transparent'; }}
            />
            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', flexShrink: 0 }}>
              {opt.value}
            </span>
            <button
              onClick={() => removeOption(opt.id)}
              style={{
                width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: '#94A3B8', flexShrink: 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addOption(); }}
          placeholder="Nova opção..."
          style={{
            flex: 1, height: 36, padding: '0 12px', borderRadius: 8,
            border: '1.5px solid #E2E8F0', background: 'white', fontSize: 13,
            color: '#0F172A', outline: 'none', fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
        />
        <button
          onClick={addOption}
          style={{
            height: 36, padding: '0 14px', borderRadius: 8,
            border: '1.5px solid #6366F1', background: '#EEF2FF',
            color: '#4338CA', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>
    </div>
  );
}

// ─── Field Preview Renderer ───────────────────────────────────────────────────

function FieldPreviewRenderer({ field, compact = false }: { field: Partial<FormField>; compact?: boolean }) {
  const def = FIELD_TYPE_DEFINITIONS.find(d => d.type === field.type);
  const IconComp = def ? ICON_MAP[def.icon] : null;
  const colors = field.type ? CATEGORY_COLORS[def?.category ?? 'text'] : CATEGORY_COLORS.text;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#1E293B' }}>
          {field.label || 'Novo Campo'}
        </label>
        {field.required && (
          <span style={{ color: '#EF4444', fontSize: 14, lineHeight: 1 }}>*</span>
        )}
      </div>

      {/* The actual input simulation */}
      {field.type === 'textarea' ? (
        <div style={{
          minHeight: compact ? 60 : 80, padding: '8px 12px', borderRadius: 8,
          border: '1.5px solid #E2E8F0', background: '#F8FAFC',
          fontSize: compact ? 12 : 13, color: '#94A3B8',
        }}>
          {field.placeholder || 'Digite aqui...'}
        </div>
      ) : field.type === 'checkbox' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4, border: '1.5px solid #E2E8F0',
            background: 'white',
          }} />
          <span style={{ fontSize: compact ? 12 : 13, color: '#94A3B8' }}>
            {field.placeholder || field.label || 'Marcar opção'}
          </span>
        </div>
      ) : field.type === 'select' || field.type === 'multiselect' ? (
        <div style={{
          height: compact ? 36 : 40, padding: '0 12px', borderRadius: 8,
          border: '1.5px solid #E2E8F0', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: compact ? 12 : 13, color: '#94A3B8',
        }}>
          <span>{field.placeholder || 'Selecionar...'}</span>
          <ChevronDown size={compact ? 13 : 15} color="#94A3B8" />
        </div>
      ) : field.type === 'file' || field.type === 'image' ? (
        <div style={{
          height: compact ? 60 : 80, borderRadius: 8,
          border: '2px dashed #E2E8F0', background: '#F8FAFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: compact ? 12 : 13, color: '#94A3B8',
        }}>
          {IconComp && <IconComp size={compact ? 14 : 18} color="#CBD5E1" />}
          <span>{field.type === 'image' ? 'Clique para enviar imagem' : 'Clique para enviar arquivo'}</span>
        </div>
      ) : (
        <div style={{
          height: compact ? 36 : 40, padding: '0 12px', borderRadius: 8,
          border: '1.5px solid #E2E8F0', background: 'white',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: compact ? 12 : 13, color: '#94A3B8',
        }}>
          {IconComp && (
            <span style={{ flexShrink: 0 }}>
              <IconComp size={compact ? 13 : 15} color="#CBD5E1" />
            </span>
          )}
          {field.placeholder || (def ? `Insira ${def.label.toLowerCase()}...` : 'Digite aqui...')}
        </div>
      )}

      {field.helpText && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 2 }}>
          <Info size={compact ? 12 : 13} color="#6366F1" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: compact ? 11 : 12, color: '#6B7280' }}>{field.helpText}</span>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({ data, entityName, onChange }: {
  data: Partial<FormField>;
  entityName: string;
  onChange: (patch: Partial<FormField>) => void;
}) {
  const [labelEdited, setLabelEdited] = useState(false);

  function handleLabelChange(val: string) {
    onChange({ label: val, name: toSnakeCase(val) });
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%' }}>
      {/* Left: Form inputs */}
      <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
        <InputField
          label="Label"
          value={data.label ?? ''}
          onChange={handleLabelChange}
          placeholder="Ex: Nome completo"
        />
        <InputField
          label="Nome interno"
          value={data.name ?? ''}
          onChange={v => onChange({ name: v })}
          placeholder="nome_do_campo"
        />
        <TextareaField
          label="Descrição"
          value={data.description ?? ''}
          onChange={v => onChange({ description: v })}
          placeholder="Descreva o propósito deste campo..."
        />
        <InputField
          label="Entidade"
          value={entityName}
          disabled
        />

        {/* Selected type summary */}
        {data.type && (() => {
          const def = FIELD_TYPE_DEFINITIONS.find(d => d.type === data.type);
          const colors = CATEGORY_COLORS[def?.category ?? 'text'];
          const IconComp = def ? ICON_MAP[def.icon] : null;
          return (
            <div style={{
              padding: 12, borderRadius: 10, background: '#F8FAFC',
              border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              {IconComp && (
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: colors.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <IconComp size={16} color={colors.icon} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Tipo selecionado</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{def?.label}</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Right: Field type selector */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, letterSpacing: '0.01em' }}>
          Tipo do Campo
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <FieldTypeSelector
            selected={data.type ?? 'text'}
            onSelect={type => onChange({ type })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Configuration ────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: Partial<FormField>; onChange: (patch: Partial<FormField>) => void }) {
  const def = FIELD_TYPE_DEFINITIONS.find(d => d.type === data.type);
  const isNumber = data.type === 'number' || data.type === 'currency';
  const isText = data.type === 'text' || data.type === 'textarea';
  const hasOptions = def?.supportsOptions;

  function setValidation(patch: Partial<FormField['validation']>) {
    onChange({ validation: { ...data.validation, ...patch } });
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Left column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InputField
          label="Placeholder"
          value={data.placeholder ?? ''}
          onChange={v => onChange({ placeholder: v })}
          placeholder="Texto de exemplo dentro do campo..."
        />
        <InputField
          label="Texto de ajuda"
          value={data.helpText ?? ''}
          onChange={v => onChange({ helpText: v })}
          placeholder="Instrução exibida abaixo do campo..."
        />
        <InputField
          label="Mensagem de erro"
          value={data.errorMessage ?? ''}
          onChange={v => onChange({ errorMessage: v })}
          placeholder="Mensagem ao falhar validação..."
        />

        {hasOptions && (
          <OptionsManager
            options={data.options ?? []}
            onChange={opts => onChange({ options: opts })}
          />
        )}

        {isNumber && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Intervalo de valores</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <InputField
                  label="Mínimo"
                  value={data.validation?.min?.toString() ?? ''}
                  onChange={v => setValidation({ min: v ? Number(v) : undefined })}
                  placeholder="0"
                  type="number"
                />
              </div>
              <div style={{ padding: '0 4px', color: '#94A3B8', marginTop: 20 }}>—</div>
              <div style={{ flex: 1 }}>
                <InputField
                  label="Máximo"
                  value={data.validation?.max?.toString() ?? ''}
                  onChange={v => setValidation({ max: v ? Number(v) : undefined })}
                  placeholder="∞"
                  type="number"
                />
              </div>
            </div>
          </div>
        )}

        {isText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Comprimento do texto</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <InputField
                  label="Mínimo"
                  value={data.validation?.minLength?.toString() ?? ''}
                  onChange={v => setValidation({ minLength: v ? Number(v) : undefined })}
                  placeholder="0"
                  type="number"
                />
              </div>
              <div style={{ padding: '0 4px', color: '#94A3B8', marginTop: 20 }}>—</div>
              <div style={{ flex: 1 }}>
                <InputField
                  label="Máximo"
                  value={data.validation?.maxLength?.toString() ?? ''}
                  onChange={v => setValidation({ maxLength: v ? Number(v) : undefined })}
                  placeholder="∞"
                  type="number"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right column: toggles */}
      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{
          background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
        }}>
          {[
            { key: 'required' as const, label: 'Obrigatório', desc: 'Campo deve ser preenchido' },
            { key: 'unique' as const, label: 'Único', desc: 'Valores não podem repetir' },
            { key: 'visible' as const, label: 'Visível', desc: 'Exibir nos formulários' },
          ].map((item, idx) => (
            <div key={item.key} style={{
              padding: '14px 16px',
              borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle
                  checked={!!data[item.key]}
                  onChange={v => onChange({ [item.key]: v })}
                  label=""
                />
              </div>
            </div>
          ))}
        </div>

        {/* Type reminder */}
        {def && (() => {
          const colors = CATEGORY_COLORS[def.category];
          const IconComp = ICON_MAP[def.icon];
          return (
            <div style={{
              marginTop: 16, padding: 14, borderRadius: 12,
              background: colors.bg, border: `1px solid ${colors.icon}22`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {IconComp && <IconComp size={15} color={colors.icon} />}
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.icon }}>{def.label}</span>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                {def.description}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────────

function Step3({ data }: { data: Partial<FormField> }) {
  const def = FIELD_TYPE_DEFINITIONS.find(d => d.type === data.type);

  const summaryRows: { label: string; value: string }[] = [
    { label: 'Label', value: data.label || '—' },
    { label: 'Nome interno', value: data.name || '—' },
    { label: 'Tipo', value: def?.label || '—' },
    { label: 'Obrigatório', value: data.required ? 'Sim' : 'Não' },
    { label: 'Único', value: data.unique ? 'Sim' : 'Não' },
    { label: 'Visível', value: data.visible !== false ? 'Sim' : 'Não' },
    ...(data.placeholder ? [{ label: 'Placeholder', value: data.placeholder }] : []),
    ...(data.helpText ? [{ label: 'Texto de ajuda', value: data.helpText }] : []),
    ...(data.options?.length ? [{ label: 'Opções', value: `${data.options.length} opções` }] : []),
  ];

  // Fake form context fields
  const fakePrevFields = [
    { label: 'Nome', placeholder: 'Seu nome completo', type: 'text' as const },
    { label: 'E-mail', placeholder: 'email@exemplo.com', type: 'email' as const },
  ];

  function DeviceFrame({ device }: { device: 'desktop' | 'mobile' }) {
    const isMobile = device === 'mobile';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: isMobile ? '0 0 200px' : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 12, fontWeight: 600 }}>
          {isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
          {isMobile ? 'Mobile' : 'Desktop'}
        </div>
        <div style={{
          width: '100%',
          borderRadius: isMobile ? 24 : 12,
          border: isMobile ? '6px solid #0F172A' : '2px solid #E2E8F0',
          background: '#F8FAFC',
          overflow: 'hidden',
          boxShadow: isMobile
            ? '0 20px 40px rgba(15,23,42,0.2)'
            : '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {isMobile && (
            <div style={{
              height: 28, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 60, height: 6, borderRadius: 3, background: '#334155' }} />
            </div>
          )}
          {!isMobile && (
            <div style={{
              height: 36, background: 'white', borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
            }}>
              {['#EF4444', '#F59E0B', '#22C55E'].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
            </div>
          )}
          <div style={{ padding: isMobile ? '12px 12px' : '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Fake form header */}
            <div style={{
              fontSize: isMobile ? 12 : 14, fontWeight: 700, color: '#1E293B',
              paddingBottom: 10, borderBottom: '1px solid #E2E8F0',
            }}>
              Formulário de Cadastro
            </div>

            {/* Fake prev fields */}
            {fakePrevFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#374151' }}>{f.label}</label>
                <div style={{
                  height: isMobile ? 30 : 34, padding: '0 10px', borderRadius: 6,
                  border: '1.5px solid #E2E8F0', background: 'white',
                  fontSize: isMobile ? 10 : 12, color: '#CBD5E1',
                  display: 'flex', alignItems: 'center',
                }}>
                  {f.placeholder}
                </div>
              </div>
            ))}

            {/* The new field - highlighted */}
            <div style={{
              padding: '10px', borderRadius: 10,
              border: '2px solid #6366F1',
              background: '#FAFAFE',
              boxShadow: '0 0 0 4px rgba(99,102,241,0.08)',
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: '#6366F1',
                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
              }}>
                Novo Campo
              </div>
              <FieldPreviewRenderer field={data} compact={isMobile} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A',
          fontSize: 13, fontWeight: 600,
        }}>
          <Eye size={14} />
          Visualização do Campo
        </div>
      </div>

      {/* Device frames */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <DeviceFrame device="desktop" />
        <DeviceFrame device="mobile" />
      </div>

      {/* Summary card */}
      <div style={{
        background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
          fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Resumo da Configuracao
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {summaryRows.map((row, idx) => (
            <div key={idx} style={{
              padding: '10px 16px',
              borderBottom: idx < summaryRows.length - 2 ? '1px solid #F1F5F9' : 'none',
              borderRight: idx % 2 === 0 ? '1px solid #F1F5F9' : 'none',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {row.label}
              </span>
              <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation message */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '14px 20px', borderRadius: 12,
        background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)',
        border: '1px solid #C7D2FE',
      }}>
        <Star size={16} color="#6366F1" />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#4338CA' }}>
          Parece bom? Clique em "Criar Campo" para finalizar.
        </span>
      </div>
    </div>
  );
}

// ─── Step List ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Informações Básicas', desc: 'Label, tipo e nome interno' },
  { label: 'Configuração', desc: 'Validações e comportamento' },
  { label: 'Preview', desc: 'Visualização final' },
];

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function FieldCreatorWizard({ entityId, entityName, open, onClose, onSave }: FieldCreatorWizardProps) {
  const [step, setStep] = useState(0);
  const [field, setField] = useState<Partial<FormField>>({
    entityId,
    type: 'text',
    label: '',
    name: '',
    required: false,
    unique: false,
    visible: true,
    origin: 'custom',
    status: 'active',
    options: [],
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setField({
        entityId,
        type: 'text',
        label: '',
        name: '',
        required: false,
        unique: false,
        visible: true,
        origin: 'custom',
        status: 'active',
        options: [],
      });
    }
  }, [open, entityId]);

  function patch(p: Partial<FormField>) {
    setField(prev => ({ ...prev, ...p }));
  }

  function canGoNext(): boolean {
    if (step === 0) return !!(field.label?.trim() && field.type);
    return true;
  }

  function handleNext() {
    if (step < 2) setStep(s => s + 1);
    else handleSave();
  }

  function handleSave() {
    onSave(field);
    onClose();
  }

  if (!open) return null;

  const progress = ((step + 1) / 3) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(4px)',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 860,
        maxHeight: '92vh',
        background: 'white', borderRadius: 20,
        boxShadow: '0 32px 64px rgba(15,23,42,0.24)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Plus size={18} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Novo Campo</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                    Entidade: <strong>{entityName}</strong>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: '#F1F5F9', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748B',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Step tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {STEPS.map((s, idx) => {
              const isActive = step === idx;
              const isDone = step > idx;
              return (
                <button
                  key={idx}
                  onClick={() => idx < step && setStep(idx)}
                  style={{
                    padding: '10px 16px', border: 'none', background: 'transparent',
                    cursor: idx < step ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: isActive ? '2px solid #6366F1' : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? '#6366F1' : isActive ? '#EEF2FF' : '#F1F5F9',
                    border: isActive ? '2px solid #6366F1' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                    color: isDone ? 'white' : isActive ? '#6366F1' : '#94A3B8',
                  }}>
                    {isDone ? <Check size={11} strokeWidth={3} /> : idx + 1}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#4338CA' : isDone ? '#6366F1' : '#94A3B8' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.2 }}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#F1F5F9', flexShrink: 0 }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}>
          {step === 0 && <Step1 data={field} entityName={entityName} onChange={patch} />}
          {step === 1 && <Step2 data={field} onChange={patch} />}
          {step === 2 && <Step3 data={field} />}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {STEPS.map((_, idx) => (
              <div key={idx} style={{
                width: idx === step ? 20 : 6, height: 6, borderRadius: 3,
                background: idx === step ? '#6366F1' : step > idx ? '#A5B4FC' : '#E2E8F0',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  height: 38, padding: '0 16px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', background: 'white',
                  fontSize: 13, fontWeight: 600, color: '#64748B',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <ChevronLeft size={15} />
                Voltar
              </button>
            )}
            {step === 0 && (
              <button
                onClick={onClose}
                style={{
                  height: 38, padding: '0 16px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', background: 'white',
                  fontSize: 13, fontWeight: 600, color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              style={{
                height: 38, padding: '0 20px', borderRadius: 10,
                border: 'none',
                background: canGoNext()
                  ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                  : '#E2E8F0',
                fontSize: 13, fontWeight: 700,
                color: canGoNext() ? 'white' : '#94A3B8',
                cursor: canGoNext() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: canGoNext() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {step === 2 ? (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  Criar Campo
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
