import { useEffect, useMemo, useState } from 'react';
import {
  Camera, Link2, Mail, Paperclip, PenLine, Phone,
} from 'lucide-react';
import type { ChecklistFieldSchema } from '../../types/checklist';
import type { DynamicFieldOption, DynamicFieldSchema, TenantUserPayload } from '../../types/userManagement';
import { apiClient } from '../../services/apiClient';

type FormValues = Record<string, unknown>;
type UserFormValue = Partial<TenantUserPayload>;
type SupportedField = ChecklistFieldSchema | DynamicFieldSchema;

interface DynamicFormRendererProps {
  schema: SupportedField[];
  values?: FormValues;
  value?: UserFormValue;
  onChange: ((key: string, value: unknown) => void) | ((patch: UserFormValue) => void);
  readOnly?: boolean;
  disabled?: boolean;
  compact?: boolean;
  showProgress?: boolean;
  highlightRequired?: boolean;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}

function fieldOrder(field: SupportedField): number {
  return 'order' in field && typeof field.order === 'number' ? field.order : 0;
}

function sectionLabel(field: SupportedField): string | null {
  if ('sectionLabel' in field && field.sectionLabel) return field.sectionLabel;
  return 'section' in field ? field.section ?? null : null;
}

function optionValue(option: { value: unknown }): string {
  return String(option.value);
}

function normalizeSelected(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function fieldType(field: SupportedField): string {
  return String(field.type ?? ('field_type' in field ? field.field_type : 'text'));
}

function isSelectLike(type: string): boolean {
  return ['select', 'product', 'supplier', 'unit', 'customer', 'employee'].includes(type);
}

function inputStyle(readOnly: boolean, hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#EF4444' : 'rgba(0,0,0,0.12)'}`,
    fontSize: '14px',
    color: readOnly ? '#64748B' : '#0F172A',
    background: readOnly ? '#F8FAFC' : '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

function ReadOnlyValue({ field, value }: { field: SupportedField; value: unknown }) {
  if (isEmpty(value)) return <span style={{ color: '#94A3B8', fontSize: '14px' }}>-</span>;

  if (field.type === 'boolean') {
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        background: value ? '#DCFCE7' : '#FEE2E2',
        color: value ? '#16A34A' : '#DC2626',
      }}>
        {value ? 'SIM' : 'NAO'}
      </span>
    );
  }

  if (field.type === 'multiselect') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {normalizeSelected(value).map(item => {
          const option = field.options?.find(opt => optionValue(opt) === item);
          return (
            <span key={item} style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#EEF2FF',
              color: '#6366F1',
              border: '1px solid #C7D2FE',
            }}>
              {option?.label ?? item}
            </span>
          );
        })}
      </div>
    );
  }

  return <span style={{ fontSize: '14px', color: '#0F172A' }}>{String(value)}</span>;
}

function ProgressBar({ schema, values }: { schema: SupportedField[]; values: FormValues }) {
  const total = schema.length;
  const filled = schema.filter(field => !isEmpty(values[String(field.key)])).length;
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{filled} de {total} campos preenchidos</span>
        <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
          borderRadius: '999px',
        }} />
      </div>
    </div>
  );
}

export function DynamicFormRenderer({
  schema,
  values,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  compact = false,
  showProgress = false,
  highlightRequired = false,
}: DynamicFormRendererProps) {
  const formValues = (values ?? value ?? {}) as FormValues;
  const blocked = readOnly || disabled;
  const [remoteOptions, setRemoteOptions] = useState<Record<string, DynamicFieldOption[]>>({});

  const optionSources = useMemo(
    () => schema.filter((field): field is DynamicFieldSchema => (
      'options_source' in field
      && Boolean(field.options_source)
      && ['select', 'multiselect', 'product', 'supplier', 'unit', 'customer', 'employee'].includes(fieldType(field))
    )),
    [schema],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all(optionSources.map(async field => {
      try {
        const payload = await apiClient.get<DynamicFieldOption[] | { data?: DynamicFieldOption[] }>(field.options_source as string);
        return [field.key, Array.isArray(payload) ? payload : payload.data ?? []] as const;
      } catch {
        return [field.key, field.options ?? []] as const;
      }
    })).then(entries => {
      if (!cancelled) setRemoteOptions(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [optionSources]);

  const optionsFor = (field: SupportedField) => remoteOptions[String(field.key)] ?? field.options ?? [];

  const emitChange = (key: string, nextValue: unknown) => {
    if (values !== undefined) {
      (onChange as (key: string, value: unknown) => void)(key, nextValue);
      return;
    }

    (onChange as (patch: UserFormValue) => void)({ [key]: nextValue } as UserFormValue);
  };

  const sections = useMemo(() => {
    const map = new Map<string | null, SupportedField[]>();
    const sorted = [...schema].sort((a, b) => fieldOrder(a) - fieldOrder(b));
    for (const field of sorted) {
      const key = sectionLabel(field);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(field);
    }
    return map;
  }, [schema]);

  const renderInput = (field: SupportedField) => {
    const key = String(field.key);
    const current = formValues[key];
    const stringValue = current === null || current === undefined ? '' : String(current);
    const hasError = Boolean(highlightRequired && field.required && isEmpty(current));
    const style = inputStyle(blocked, hasError);

    if (readOnly) return <ReadOnlyValue field={field} value={current} />;

    if (field.type === 'boolean') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'SIM', value: true },
            { label: 'NAO', value: false },
          ].map(option => {
            const active = current === option.value;
            return (
              <button
                key={option.label}
                type="button"
                disabled={blocked}
                onClick={() => emitChange(key, option.value)}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${active ? '#6366F1' : 'rgba(0,0,0,0.08)'}`,
                  background: active ? '#EEF2FF' : '#F8FAFC',
                  color: active ? '#4F46E5' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: blocked ? 'not-allowed' : 'pointer',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }

    if (field.type === 'multiselect') {
      const selected = normalizeSelected(current);
      return (
        <div style={{ border: style.border, borderRadius: '8px', overflow: 'hidden' }}>
          {optionsFor(field).map((option, index) => {
            const optionKey = optionValue(option);
            const checked = selected.includes(optionKey);
            return (
              <label key={optionKey} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#0F172A',
                background: checked ? '#F5F3FF' : '#fff',
                borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
              }}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={blocked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter(item => item !== optionKey)
                      : [...selected, optionKey];
                    emitChange(key, next);
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      );
    }

    if (isSelectLike(fieldType(field))) {
      return (
        <select value={stringValue} disabled={blocked} style={style} onChange={event => emitChange(key, event.target.value)}>
          <option value="">{field.placeholder ?? 'Selecione...'}</option>
          {optionsFor(field).map(option => (
            <option key={optionValue(option)} value={optionValue(option)}>{option.label}</option>
          ))}
        </select>
      );
    }

    if (['photo', 'image', 'signature', 'file'].includes(fieldType(field))) {
      const Icon = field.type === 'signature' ? PenLine : field.type === 'file' ? Paperclip : Camera;
      return (
        <div style={{
          border: `2px dashed ${hasError ? '#EF4444' : 'rgba(0,0,0,0.15)'}`,
          borderRadius: '10px',
          padding: '24px 16px',
          textAlign: 'center',
          background: '#F8FAFC',
          color: '#64748B',
          fontSize: '13px',
        }}>
          <Icon size={22} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
          {field.type === 'signature' ? 'Clique para assinar' : 'Selecionar arquivo'}
        </div>
      );
    }

    if (fieldType(field) === 'repeater') {
      const jsonValue = Array.isArray(current) ? JSON.stringify(current, null, 2) : stringValue;
      return (
        <textarea
          value={jsonValue}
          placeholder={field.placeholder ?? '[]'}
          rows={5}
          disabled={blocked}
          style={{ ...style, resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace' }}
          onChange={event => {
            try {
              emitChange(key, JSON.parse(event.target.value || '[]'));
            } catch {
              emitChange(key, event.target.value);
            }
          }}
        />
      );
    }

    if (['title', 'divider'].includes(fieldType(field))) {
      return <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px' }} />;
    }

    const InlineIcon = field.type === 'email' ? Mail : field.type === 'phone' ? Phone : field.type === 'url' ? Link2 : null;
    const inputType = field.type === 'textarea' ? 'textarea' : ['currency', 'number', 'quantity', 'percentage', 'temperature'].includes(fieldType(field)) ? 'number' : fieldType(field) === 'expiration_date' ? 'date' : String(field.type);

    if (field.type === 'textarea') {
      return (
        <textarea
          value={stringValue}
          placeholder={field.placeholder ?? ''}
          rows={3}
          disabled={blocked}
          style={{ ...style, resize: 'vertical', lineHeight: 1.5 }}
          onChange={event => emitChange(key, event.target.value)}
        />
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        {InlineIcon ? (
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
            <InlineIcon size={15} />
          </span>
        ) : null}
        <input
          type={inputType}
          value={stringValue}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          disabled={blocked}
          style={InlineIcon ? { ...style, paddingLeft: '32px' } : style}
          onChange={event => {
            const next = ['number', 'currency', 'quantity', 'percentage', 'temperature'].includes(fieldType(field))
              ? event.target.value === '' ? '' : Number(event.target.value)
              : event.target.value;
            emitChange(key, next);
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '10px' : '14px' }}>
      {showProgress ? <ProgressBar schema={schema} values={formValues} /> : null}

      {Array.from(sections.entries()).map(([label, fields]) => (
        <div
          key={label ?? '__default__'}
          style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.07)',
            padding: compact ? '12px' : '16px',
            display: 'grid',
            gap: compact ? '10px' : '14px',
          }}
        >
          {label ? (
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', margin: 0 }}>
              {label}
            </p>
          ) : null}

          {fields.map(field => {
            const key = String(field.key);
            const current = formValues[key];
            const hasError = Boolean(highlightRequired && field.required && isEmpty(current));
            const isCheckboxLike = field.type === 'boolean';

            return (
              <div key={key}>
                {!isCheckboxLike ? (
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                    {field.label}
                    {field.required ? <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span> : null}
                  </label>
                ) : null}
                {isCheckboxLike ? (
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                    {field.label}
                    {field.required ? <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span> : null}
                  </label>
                ) : null}
                {renderInput(field)}
                {'helpText' in field && field.helpText ? (
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', margin: '4px 0 0' }}>{field.helpText}</p>
                ) : null}
                {hasError ? <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0' }}>Campo obrigatorio</p> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
