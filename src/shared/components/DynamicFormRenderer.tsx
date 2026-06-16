import React, { useMemo } from 'react';
import {
  Mail, Phone, Link2, Camera, PenLine, Paperclip,
} from 'lucide-react';
import type { ChecklistFieldSchema } from '../../types/checklist';
import { FIELD_TYPE_DEFINITIONS } from '../../types/formBuilder';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface DynamicFormRendererProps {
  schema: ChecklistFieldSchema[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  compact?: boolean;
  showProgress?: boolean;
  highlightRequired?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function isFilled(value: unknown): boolean {
  return !isEmpty(value);
}

// Base input style
const baseInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  fontSize: '14px',
  color: '#0F172A',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const disabledInput: React.CSSProperties = {
  ...baseInput,
  background: '#F8FAFC',
  color: '#64748B',
  cursor: 'not-allowed',
};

function inputStyle(readOnly?: boolean, hasError?: boolean): React.CSSProperties {
  const base = readOnly ? disabledInput : baseInput;
  if (hasError) {
    return { ...base, borderColor: '#EF4444' };
  }
  return base;
}

// ─── Individual Field Renderers ───────────────────────────────────────────────

function ReadOnlyValue({ value, field }: { value: unknown; field: ChecklistFieldSchema }) {
  const empty = isEmpty(value);

  if (empty) {
    return <span style={{ color: '#94A3B8', fontSize: '14px' }}>—</span>;
  }

  if (field.type === 'boolean') {
    const yes = value === true || value === 'true' || value === 'yes';
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          background: yes ? '#DCFCE7' : '#FEE2E2',
          color: yes ? '#16A34A' : '#DC2626',
        }}
      >
        {yes ? 'SIM' : 'NÃO'}
      </span>
    );
  }

  if (field.type === 'select' && field.options) {
    const opt = field.options.find(o => o.value === value);
    const label = opt?.label ?? String(value);
    const color = opt?.color;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 500,
          background: color ? `${color}22` : '#F1F5F9',
          color: color ?? '#334155',
          border: `1px solid ${color ? `${color}55` : 'transparent'}`,
        }}
      >
        {label}
      </span>
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [value];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {selected.map((v, i) => {
          const opt = field.options?.find(o => o.value === v);
          const label = opt?.label ?? String(v);
          const color = opt?.color;
          return (
            <span
              key={i}
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 500,
                background: color ? `${color}22` : '#EEF2FF',
                color: color ?? '#6366F1',
                border: `1px solid ${color ? `${color}55` : '#C7D2FE'}`,
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    const checked = value === true || value === 'true';
    return (
      <span style={{ fontSize: '14px', color: '#0F172A' }}>
        {checked ? '✓ Marcado' : '✗ Não marcado'}
      </span>
    );
  }

  return <span style={{ fontSize: '14px', color: '#0F172A' }}>{String(value)}</span>;
}

interface FieldInputProps {
  field: ChecklistFieldSchema;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  hasError?: boolean;
}

function FieldInput({ field, value, onChange, readOnly, hasError }: FieldInputProps) {
  const style = inputStyle(readOnly, hasError);
  const strVal = value !== null && value !== undefined ? String(value) : '';

  if (readOnly) {
    return <ReadOnlyValue value={value} field={field} />;
  }

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={strVal}
          placeholder={field.placeholder ?? ''}
          style={style}
          onChange={e => onChange(field.key, e.target.value)}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={strVal}
          placeholder={field.placeholder ?? ''}
          rows={3}
          style={{ ...style, resize: 'vertical', lineHeight: 1.5 }}
          onChange={e => onChange(field.key, e.target.value)}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={strVal}
          placeholder={field.placeholder ?? '0'}
          style={style}
          onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
        />
      );

    case 'currency':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <span
            style={{
              padding: '8px 10px',
              background: '#F8FAFC',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              fontSize: '13px',
              color: '#64748B',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            R$
          </span>
          <input
            type="number"
            value={strVal}
            placeholder="0,00"
            step="0.01"
            style={{
              ...style,
              borderRadius: '0 8px 8px 0',
              textAlign: 'right',
            }}
            onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={strVal}
          style={style}
          onChange={e => onChange(field.key, e.target.value)}
        />
      );

    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={strVal}
          style={style}
          onChange={e => onChange(field.key, e.target.value)}
        />
      );

    case 'email':
      return (
        <div style={{ position: 'relative' }}>
          <Mail
            size={15}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="email"
            value={strVal}
            placeholder={field.placeholder ?? 'email@exemplo.com'}
            style={{ ...style, paddingLeft: '32px' }}
            onChange={e => onChange(field.key, e.target.value)}
          />
        </div>
      );

    case 'phone':
      return (
        <div style={{ position: 'relative' }}>
          <Phone
            size={15}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="tel"
            value={strVal}
            placeholder={field.placeholder ?? '(00) 00000-0000'}
            style={{ ...style, paddingLeft: '32px' }}
            onChange={e => onChange(field.key, e.target.value)}
          />
        </div>
      );

    case 'url':
      return (
        <div style={{ position: 'relative' }}>
          <Link2
            size={15}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="url"
            value={strVal}
            placeholder={field.placeholder ?? 'https://'}
            style={{ ...style, paddingLeft: '32px' }}
            onChange={e => onChange(field.key, e.target.value)}
          />
        </div>
      );

    case 'boolean': {
      const yes = value === true || value === 'true' || value === 'yes';
      const no = value === false || value === 'false' || value === 'no';

      const btnBase: React.CSSProperties = {
        flex: 1,
        padding: '9px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        border: '2px solid transparent',
        transition: 'all 0.15s',
        letterSpacing: '0.03em',
      };

      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onChange(field.key, true)}
            style={{
              ...btnBase,
              background: yes ? '#DCFCE7' : '#F8FAFC',
              color: yes ? '#16A34A' : '#64748B',
              borderColor: yes ? '#86EFAC' : 'rgba(0,0,0,0.08)',
            }}
          >
            SIM
          </button>
          <button
            type="button"
            onClick={() => onChange(field.key, false)}
            style={{
              ...btnBase,
              background: no ? '#FEE2E2' : '#F8FAFC',
              color: no ? '#DC2626' : '#64748B',
              borderColor: no ? '#FCA5A5' : 'rgba(0,0,0,0.08)',
            }}
          >
            NÃO
          </button>
        </div>
      );
    }

    case 'checkbox': {
      const checked = value === true || value === 'true';
      return (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#0F172A',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(field.key, e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#6366F1', cursor: 'pointer' }}
          />
          {field.label}
        </label>
      );
    }

    case 'select':
      return (
        <select
          value={strVal}
          style={{ ...style, cursor: 'pointer' }}
          onChange={e => onChange(field.key, e.target.value)}
        >
          <option value="">{field.placeholder ?? 'Selecione...'}</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'multiselect': {
      const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) => {
        const next = selected.includes(v)
          ? selected.filter(x => x !== v)
          : [...selected, v];
        onChange(field.key, next);
      };

      return (
        <div>
          {/* Selected pills */}
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {selected.map(v => {
                const opt = field.options?.find(o => o.value === v);
                const label = opt?.label ?? v;
                const color = opt?.color;
                return (
                  <span
                    key={v}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: color ? `${color}22` : '#EEF2FF',
                      color: color ?? '#6366F1',
                      border: `1px solid ${color ? `${color}55` : '#C7D2FE'}`,
                    }}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => toggle(v)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 2px',
                        color: 'inherit',
                        fontSize: '12px',
                        lineHeight: 1,
                        opacity: 0.7,
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {/* Checkbox list */}
          <div
            style={{
              border: hasError ? '1px solid #EF4444' : '1px solid rgba(0,0,0,0.12)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {field.options?.map((opt, i) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#0F172A',
                    background: checked ? '#F5F3FF' : '#fff',
                    borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.value)}
                    style={{ width: '15px', height: '15px', accentColor: '#6366F1' }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    case 'document':
      return (
        <input
          type="text"
          value={strVal}
          placeholder={field.placeholder ?? 'CPF / CNPJ'}
          style={{ ...style, fontFamily: 'monospace', letterSpacing: '0.05em' }}
          onChange={e => onChange(field.key, e.target.value)}
        />
      );

    case 'photo':
    case 'image':
      return (
        <div
          style={{
            border: hasError ? '2px dashed #EF4444' : '2px dashed rgba(0,0,0,0.15)',
            borderRadius: '10px',
            padding: '28px 16px',
            textAlign: 'center',
            background: '#F8FAFC',
            cursor: 'pointer',
          }}
        >
          <Camera size={24} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Tirar foto ou selecionar arquivo
          </p>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }}>
            PNG, JPG até 10 MB
          </p>
        </div>
      );

    case 'signature':
      return (
        <div
          style={{
            border: hasError ? '2px dashed #EF4444' : '2px dashed rgba(0,0,0,0.15)',
            borderRadius: '10px',
            padding: '28px 16px',
            textAlign: 'center',
            background: '#F8FAFC',
            cursor: 'pointer',
          }}
        >
          <PenLine size={24} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Clique para assinar
          </p>
        </div>
      );

    case 'file':
      return (
        <div
          style={{
            border: hasError ? '2px dashed #EF4444' : '2px dashed rgba(0,0,0,0.15)',
            borderRadius: '10px',
            padding: '24px 16px',
            textAlign: 'center',
            background: '#F8FAFC',
            cursor: 'pointer',
          }}
        >
          <Paperclip size={22} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Selecionar arquivo
          </p>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }}>
            Qualquer formato até 25 MB
          </p>
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={strVal}
          placeholder={field.placeholder ?? ''}
          style={style}
          onChange={e => onChange(field.key, e.target.value)}
        />
      );
  }
}

// ─── Section Component ────────────────────────────────────────────────────────

interface SectionProps {
  label: string | null;
  fields: ChecklistFieldSchema[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  compact?: boolean;
  highlightRequired?: boolean;
}

function FormSection({
  label,
  fields,
  values,
  onChange,
  readOnly,
  compact,
  highlightRequired,
}: SectionProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.07)',
        padding: compact ? '12px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '10px' : '14px',
      }}
    >
      {label && (
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#6366F1',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 10px',
            }}
          >
            {label}
          </p>
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '2px' }} />
        </div>
      )}

      {fields.map(field => {
        const value = values[field.key];
        const hasError = !!(
          highlightRequired &&
          field.required &&
          isEmpty(value)
        );

        // checkbox: label is rendered inside the input component, skip outer label
        const isCheckbox = field.type === 'checkbox';

        return (
          <div key={field.key}>
            {!isCheckbox && (
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '5px',
                }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span>
                )}
              </label>
            )}

            <FieldInput
              field={field}
              value={value}
              onChange={onChange}
              readOnly={readOnly}
              hasError={hasError}
            />

            {field.helpText && (
              <p
                style={{
                  fontSize: '11px',
                  color: '#94A3B8',
                  fontStyle: 'italic',
                  margin: '4px 0 0',
                }}
              >
                {field.helpText}
              </p>
            )}

            {hasError && (
              <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0' }}>
                Campo obrigatório
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ schema, values }: { schema: ChecklistFieldSchema[]; values: Record<string, unknown> }) {
  const total = schema.length;
  const filled = schema.filter(f => isFilled(values[f.key])).length;
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
          {filled} de {total} campos preenchidos
        </span>
        <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700 }}>
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          background: 'rgba(99,102,241,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

// Suppress unused-import warning — FIELD_TYPE_DEFINITIONS available for consumers
void FIELD_TYPE_DEFINITIONS;

export function DynamicFormRenderer({
  schema,
  values,
  onChange,
  readOnly,
  compact,
  showProgress,
  highlightRequired,
}: DynamicFormRendererProps) {
  // Group fields by sectionLabel (null = no section)
  const sections = useMemo(() => {
    const map = new Map<string | null, ChecklistFieldSchema[]>();
    const sorted = [...schema].sort((a, b) => a.order - b.order);
    for (const field of sorted) {
      const key = field.sectionLabel ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(field);
    }
    return map;
  }, [schema]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '10px' : '14px',
      }}
    >
      {showProgress && (
        <ProgressBar schema={schema} values={values} />
      )}

      {Array.from(sections.entries()).map(([sectionLabel, fields]) => (
        <FormSection
          key={sectionLabel ?? '__default__'}
          label={sectionLabel}
          fields={fields}
          values={values}
          onChange={onChange}
          readOnly={readOnly}
          compact={compact}
          highlightRequired={highlightRequired}
        />
      ))}
    </div>
  );
}
