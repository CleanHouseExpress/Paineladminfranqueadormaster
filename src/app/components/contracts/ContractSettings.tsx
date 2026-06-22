import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Eye, GripVertical, LayoutGrid, Settings, Star, Type } from 'lucide-react';

import { apiClient } from '../../../services/apiClient';

interface FieldConfig {
  key: string;
  label: string;
  required?: boolean;
  visible?: boolean;
  order?: number;
  section?: string;
  [key: string]: unknown;
}

interface TableColumn {
  key: string;
  label: string;
  visible?: boolean;
  sortable?: boolean;
  order?: number;
}

interface MetadataResponse {
  data?: MetadataPayload;
  entity_key?: string;
}

interface MetadataPayload {
  entity_key: string;
  singular_label: string;
  plural_label: string;
  description?: string;
  form_schema: FieldConfig[];
  table_schema: TableColumn[];
  active?: boolean;
}

type NavSection = 'labels' | 'campos-visiveis' | 'campos-obrigatorios' | 'ordem' | 'colunas';

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={disabled ? undefined : onChange} style={{ width: '40px', height: '22px', borderRadius: '999px', background: checked ? '#6366F1' : '#E2E8F0', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative', opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: checked ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

export function ContractSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavSection>('labels');
  const [metadata, setMetadata] = useState<MetadataPayload | null>(null);
  const [singularLabel, setSingularLabel] = useState('Contrato');
  const [pluralLabel, setPluralLabel] = useState('Contratos');
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await apiClient.get<MetadataResponse>('/api/metadata/contracts');
      const payload = response.data ?? response as MetadataPayload;
      setMetadata(payload);
      setSingularLabel(payload.singular_label);
      setPluralLabel(payload.plural_label);
      setFields(payload.form_schema ?? []);
      setColumns(payload.table_schema ?? []);
    }

    void load();
  }, []);

  async function save() {
    if (!metadata) return;
    setSaving(true);
    try {
      const response = await apiClient.put<MetadataResponse>('/api/metadata/contracts', {
        singular_label: singularLabel,
        plural_label: pluralLabel,
        description: metadata.description,
        form_schema: fields,
        table_schema: columns,
        active: true,
      });
      const payload = response.data ?? response as MetadataPayload;
      setMetadata(payload);
      setFields(payload.form_schema ?? []);
      setColumns(payload.table_schema ?? []);
    } finally {
      setSaving(false);
    }
  }

  const navItems: Array<{ key: NavSection; label: string; icon: React.ReactNode }> = [
    { key: 'labels', label: 'Labels', icon: <Type size={16} /> },
    { key: 'campos-visiveis', label: 'Campos Visiveis', icon: <Eye size={16} /> },
    { key: 'campos-obrigatorios', label: 'Campos Obrigatorios', icon: <Star size={16} /> },
    { key: 'ordem', label: 'Ordem dos Campos', icon: <GripVertical size={16} /> },
    { key: 'colunas', label: 'Colunas da Tabela', icon: <LayoutGrid size={16} /> },
  ];

  const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px' };
  const titleStyle: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' };
  const subtitleStyle: React.CSSProperties = { fontSize: '13px', color: '#94A3B8', margin: '0 0 24px', lineHeight: 1.5 };

  function updateField(key: string, patch: Partial<FieldConfig>) {
    setFields(items => items.map(item => item.key === key ? { ...item, ...patch } : item));
  }

  function updateColumn(key: string, patch: Partial<TableColumn>) {
    setColumns(items => items.map(item => item.key === key ? { ...item, ...patch } : item));
  }

  function moveField(key: string, direction: -1 | 1) {
    setFields(items => {
      const ordered = [...items].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
      const index = ordered.findIndex(item => item.key === key);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return items;
      [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
      return ordered.map((item, idx) => ({ ...item, order: (idx + 1) * 10 }));
    });
  }

  const orderedFields = [...fields].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/contracts" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>Contratos</Link>
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Configuracoes</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Configuracoes de Contratos</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Personalize labels, campos e exibicao do modulo</p>
          </div>
        </div>
        <button onClick={() => navigate('/contracts')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 260px', background: '#fff', borderRadius: '16px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: '24px' }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '2px', background: activeSection === item.key ? '#EEF2FF' : 'transparent', color: activeSection === item.key ? '#6366F1' : '#64748B', fontSize: '13px', fontWeight: activeSection === item.key ? 600 : 500, textAlign: 'left' }}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === 'labels' && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>Labels</h2>
              <p style={subtitleStyle}>Personalize os rotulos principais exibidos na interface.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Singular
                  <input value={singularLabel} onChange={event => setSingularLabel(event.target.value)} style={inputStyle()} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Plural
                  <input value={pluralLabel} onChange={event => setPluralLabel(event.target.value)} style={inputStyle()} />
                </label>
              </div>
            </div>
          )}

          {activeSection === 'campos-visiveis' && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>Campos Visiveis</h2>
              <p style={subtitleStyle}>Defina quais campos aparecem no formulario de contrato.</p>
              {fields.map(field => (
                <Row key={field.key} title={field.label} subtitle={field.key}>
                  <Toggle checked={field.visible !== false} onChange={() => updateField(field.key, { visible: field.visible === false })} disabled={field.key === 'title' || field.key === 'customer_id'} />
                </Row>
              ))}
            </div>
          )}

          {activeSection === 'campos-obrigatorios' && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>Campos Obrigatorios</h2>
              <p style={subtitleStyle}>Defina quais campos devem ser preenchidos.</p>
              {fields.map(field => {
                const locked = field.key === 'title' || field.key === 'customer_id' || field.key === 'start_date';
                return (
                  <Row key={field.key} title={field.label} subtitle={field.key}>
                    <Toggle checked={locked || field.required === true} onChange={() => updateField(field.key, { required: !field.required })} disabled={locked} />
                  </Row>
                );
              })}
            </div>
          )}

          {activeSection === 'ordem' && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>Ordem dos Campos</h2>
              <p style={subtitleStyle}>Reordene os campos com os botoes laterais.</p>
              {orderedFields.map((field, index) => (
                <Row key={field.key} title={field.label} subtitle={field.key}>
                  <button onClick={() => moveField(field.key, -1)} disabled={index === 0} style={smallButton()}>↑</button>
                  <button onClick={() => moveField(field.key, 1)} disabled={index === orderedFields.length - 1} style={smallButton()}>↓</button>
                </Row>
              ))}
            </div>
          )}

          {activeSection === 'colunas' && (
            <div style={cardStyle}>
              <h2 style={titleStyle}>Colunas da Tabela</h2>
              <p style={subtitleStyle}>Escolha quais colunas aparecem na listagem.</p>
              {columns.map(column => (
                <Row key={column.key} title={column.label} subtitle={column.key}>
                  <Toggle checked={column.visible !== false} onChange={() => updateColumn(column.key, { visible: column.visible === false })} disabled={column.key === 'title'} />
                </Row>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button disabled={saving || !metadata} onClick={() => void save()} style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar configuracao'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '6px' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: '12px', color: '#94A3B8' }}>{subtitle}</div> : null}
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    marginTop: '6px',
    border: '1.5px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  };
}

function smallButton(): React.CSSProperties {
  return {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: '#fff',
    color: '#64748B',
    cursor: 'pointer',
  };
}
