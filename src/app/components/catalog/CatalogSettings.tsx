import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Settings, ArrowLeft, Type, Eye, Star, GripVertical,
  LayoutGrid, ChevronLeft, ChevronRight, Boxes,
  Package, Briefcase, RefreshCw, GraduationCap, Stethoscope,
} from 'lucide-react';
import { CATALOG_TYPE_CONFIG, DEFAULT_CATALOG_LABELS } from '../../../types/catalog';
import type { CatalogItemType, CatalogLabels, CatalogMetadataConfig } from '../../../types/catalog';
import { getCatalogConfig, saveCatalogConfig } from '../../../services/catalogService';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavSection =
  | 'labels'
  | 'campos-visiveis'
  | 'campos-obrigatorios'
  | 'ordem'
  | 'colunas'
  | 'tipos';

interface FieldConfig {
  key: string;
  label: string;
  description: string;
  alwaysRequired: boolean;
}

interface LabelEntry {
  key: string;
  default: string;
  custom: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELDS: FieldConfig[] = [
  { key: 'nome',               label: 'Nome',                description: 'Nome principal do item no catálogo',              alwaysRequired: true  },
  { key: 'descricao',          label: 'Descrição',            description: 'Texto descritivo sobre o item',                  alwaysRequired: false },
  { key: 'tipo',               label: 'Tipo',                 description: 'Tipo do item (Produto, Serviço, Curso, etc.)',    alwaysRequired: false },
  { key: 'status',             label: 'Status',               description: 'Estado atual do item no catálogo',               alwaysRequired: false },
  { key: 'preco',              label: 'Preço Base',           description: 'Valor base de venda do item',                    alwaysRequired: false },
  { key: 'sku',                label: 'SKU',                  description: 'Código interno ou SKU do item',                  alwaysRequired: false },
  { key: 'unidade',            label: 'Unidade de Medida',    description: 'Unidade de cobrança ou venda (un, h, mês…)',      alwaysRequired: false },
  { key: 'campos-custom',      label: 'Campos Personalizados', description: 'Campos extras do Metadata Engine',              alwaysRequired: false },
];

const DEFAULT_LABEL_ENTRIES: LabelEntry[] = [
  { key: 'nome',         default: 'Nome',                custom: '' },
  { key: 'descricao',    default: 'Descrição',            custom: '' },
  { key: 'tipo',         default: 'Tipo',                 custom: '' },
  { key: 'status',       default: 'Status',               custom: '' },
  { key: 'preco',        default: 'Preço',                custom: '' },
  { key: 'sku',          default: 'SKU',                  custom: '' },
  { key: 'unidade',      default: 'Unidade',              custom: '' },
];

const TABLE_COLUMNS = [
  { key: 'nome',      label: 'Nome',       alwaysOn: true  },
  { key: 'tipo',      label: 'Tipo',       alwaysOn: false },
  { key: 'status',    label: 'Status',     alwaysOn: false },
  { key: 'preco',     label: 'Preço',      alwaysOn: false },
  { key: 'unidade',   label: 'Unidade',    alwaysOn: false },
  { key: 'sku',       label: 'SKU',        alwaysOn: false },
  { key: 'criadoEm',  label: 'Criado em',  alwaysOn: false },
  { key: 'acoes',     label: 'Ações',      alwaysOn: false },
];

const ALL_TYPES: CatalogItemType[] = [
  'product', 'service', 'subscription', 'course', 'procedure', 'plan', 'custom',
];

const TYPE_ICON_NODES: Record<CatalogItemType, React.ReactNode> = {
  product:      <Package size={16} />,
  service:      <Briefcase size={16} />,
  subscription: <RefreshCw size={16} />,
  course:       <GraduationCap size={16} />,
  procedure:    <Stethoscope size={16} />,
  plan:         <Star size={16} />,
  custom:       <Boxes size={16} />,
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      style={{
        width: '40px', height: '22px',
        borderRadius: '999px',
        background: checked ? '#6366F1' : '#E2E8F0',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '16px', height: '16px',
        borderRadius: '50%',
        background: 'white',
        position: 'absolute',
        top: '3px',
        left: checked ? '21px' : '3px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// ─── CatalogSettings ──────────────────────────────────────────────────────────

export function CatalogSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavSection>('labels');

  // Module labels state
  const [labels, setLabels] = useState<CatalogLabels>({ ...DEFAULT_CATALOG_LABELS });
  const [config, setConfig] = useState<CatalogMetadataConfig | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Field label entries
  const [labelEntries, setLabelEntries] = useState<LabelEntry[]>(DEFAULT_LABEL_ENTRIES);

  // Visible fields
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    Object.fromEntries(FIELDS.map(f => [f.key, true]))
  );

  // Required fields
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>(
    Object.fromEntries(FIELDS.map(f => [f.key, f.alwaysRequired]))
  );

  // Field order
  const [fieldOrder, setFieldOrder] = useState<string[]>(FIELDS.map(f => f.key));
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOverRef = useRef<string | null>(null);

  // Table columns
  const [tableColumns, setTableColumns] = useState<Record<string, boolean>>(
    Object.fromEntries(TABLE_COLUMNS.map(c => [c.key, true]))
  );

  // Enabled types (product and service always on)
  const [enabledTypes, setEnabledTypes] = useState<Record<CatalogItemType, boolean>>({
    product:      true,
    service:      true,
    subscription: true,
    course:       true,
    procedure:    true,
    plan:         true,
    custom:       true,
  });

  useEffect(() => {
    void getCatalogConfig().then(next => {
      setConfig(next);
      setLabels(next.labels);
      setEnabledTypes(Object.fromEntries(ALL_TYPES.map(type => [type, next.enabledTypes.includes(type)])) as Record<CatalogItemType, boolean>);
      setTableColumns(current => ({
        ...current,
        ...Object.fromEntries(next.tableSchema.map(column => [column.key, column.visible])),
      }));
    });
  }, []);

  async function persistSettings() {
    if (!config) return;
    setSaveMessage('Salvando...');
    const saved = await saveCatalogConfig({
      ...config,
      labels,
      enabledTypes: ALL_TYPES.filter(type => enabledTypes[type]),
      tableSchema: config.tableSchema.map(column => ({
        ...column,
        visible: tableColumns[column.key] ?? column.visible,
      })),
    });
    setConfig(saved);
    setSaveMessage('Configuracoes salvas.');
  }

  // Drag handlers
  const handleDragStart = (key: string) => setDragging(key);
  const handleDragOver = (e: React.DragEvent, key: string) => { e.preventDefault(); dragOverRef.current = key; };
  const handleDrop = (targetKey: string) => {
    if (!dragging || dragging === targetKey) { setDragging(null); return; }
    const from = fieldOrder.indexOf(dragging);
    const to = fieldOrder.indexOf(targetKey);
    const next = [...fieldOrder];
    next.splice(from, 1);
    next.splice(to, 0, dragging);
    setFieldOrder(next);
    setDragging(null);
    dragOverRef.current = null;
  };
  const moveField = (key: string, dir: -1 | 1) => {
    const idx = fieldOrder.indexOf(key);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= fieldOrder.length) return;
    const next = [...fieldOrder];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setFieldOrder(next);
  };

  // Shared styles
  const sectionCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0',
  };

  const sectionSubtitleStyle: React.CSSProperties = {
    fontSize: '13px', color: '#94A3B8', margin: '0 0 24px 0', lineHeight: '1.5',
  };

  const inputStyle: React.CSSProperties = {
    border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '8px',
    padding: '8px 12px', fontSize: '13px', color: '#0F172A',
    outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box',
  };

  const navItems: Array<{ key: NavSection; label: string; icon: React.ReactNode }> = [
    { key: 'labels',              label: 'Labels e Nomenclatura', icon: <Type size={16} />         },
    { key: 'campos-visiveis',     label: 'Campos Visíveis',        icon: <Eye size={16} />          },
    { key: 'campos-obrigatorios', label: 'Campos Obrigatórios',    icon: <Star size={16} />         },
    { key: 'ordem',               label: 'Ordem dos Campos',       icon: <GripVertical size={16} /> },
    { key: 'colunas',             label: 'Colunas da Tabela',      icon: <LayoutGrid size={16} />   },
    { key: 'tipos',               label: 'Tipos de Item',          icon: <Boxes size={16} />        },
  ];

  const isTypeAlwaysOn = (type: CatalogItemType) => type === 'product' || type === 'service';

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      {saveMessage && (
        <div style={{ marginBottom: 14, padding: '9px 12px', borderRadius: 9, background: '#ECFDF5', color: '#047857', fontSize: 12 }}>
          {saveMessage}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/catalog" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
          {labels.plural}
        </Link>
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>Configurações</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '2px',
          }}>
            <Settings size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
              Configurações do Catálogo
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
              Personalize labels, campos e exibição do módulo
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/catalog')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            border: '1.5px solid rgba(0,0,0,0.1)', background: 'white',
            color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Sidebar nav */}
        <div style={{
          flex: '0 0 260px',
          background: 'white',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: '24px',
        }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '2px',
                background: activeSection === item.key ? '#EEF2FF' : 'transparent',
                color: activeSection === item.key ? '#6366F1' : '#64748B',
                fontSize: '13px',
                fontWeight: activeSection === item.key ? 600 : 500,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ opacity: activeSection === item.key ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Labels e Nomenclatura ── */}
          {activeSection === 'labels' && (
            <div>
              {/* Part A: Nome do Módulo */}
              <div style={sectionCardStyle}>
                <h2 style={sectionTitleStyle}>Labels e Nomenclatura</h2>
                <p style={sectionSubtitleStyle}>Personalize os rótulos e o nome do módulo exibidos em todo o sistema</p>

                {/* Highlighted module naming box */}
                <div style={{
                  border: '1.5px solid #6366F1',
                  background: '#EEF2FF',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '28px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Type size={15} color="#6366F1" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#4338CA' }}>Nome do Módulo</span>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6366F1', lineHeight: '1.6' }}>
                    Renomeie o módulo para se adequar ao seu negócio. Este nome aparecerá em todo o sistema.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                        Nome singular
                      </label>
                      <input
                        type="text"
                        value={labels.singular}
                        onChange={e => setLabels(prev => ({ ...prev, singular: e.target.value }))}
                        placeholder="Ex: Produto, Serviço, Procedimento"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                        Nome plural
                      </label>
                      <input
                        type="text"
                        value={labels.plural}
                        onChange={e => setLabels(prev => ({ ...prev, plural: e.target.value }))}
                        placeholder="Ex: Produtos, Serviços, Procedimentos"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                        Título do módulo
                      </label>
                      <input
                        type="text"
                        value={labels.moduleTitle}
                        onChange={e => setLabels(prev => ({ ...prev, moduleTitle: e.target.value }))}
                        placeholder="Ex: Catálogo de Produtos"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '6px' }}>
                        Botão "Novo"
                      </label>
                      <input
                        type="text"
                        value={labels.newItem}
                        onChange={e => setLabels(prev => ({ ...prev, newItem: e.target.value }))}
                        placeholder="Ex: Novo Produto"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{
                    background: 'white', borderRadius: '8px', padding: '10px 14px',
                    fontSize: '12px', color: '#64748B', border: '1px solid rgba(99,102,241,0.2)',
                  }}>
                    Resultado: <strong style={{ color: '#4338CA' }}>+ {labels.newItem || DEFAULT_CATALOG_LABELS.newItem}</strong>
                    {' '}·{' '}
                    Título: <strong style={{ color: '#4338CA' }}>{labels.moduleTitle || DEFAULT_CATALOG_LABELS.moduleTitle}</strong>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => void persistSettings()} style={{
                      padding: '9px 20px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                      color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                    }}>
                      Salvar Nomenclatura
                    </button>
                  </div>
                </div>

                {/* Part B: Field labels table */}
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                  Labels dos Campos
                </h3>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 16px 0' }}>
                  Personalize os rótulos exibidos nos campos do formulário
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: '12px',
                  padding: '8px 12px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Padrão</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Personalizado</span>
                  <span />
                </div>

                {labelEntries.map((entry, idx) => (
                  <div key={entry.key} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx < labelEntries.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}>
                    <span style={{
                      fontSize: '13px', color: '#64748B', fontWeight: 500,
                      background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {entry.default}
                    </span>
                    <input
                      type="text"
                      value={entry.custom}
                      onChange={e => {
                        const updated = labelEntries.map((l, i) => i === idx ? { ...l, custom: e.target.value } : l);
                        setLabelEntries(updated);
                      }}
                      placeholder={entry.default}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => {
                        const updated = labelEntries.map((l, i) => i === idx ? { ...l, custom: '' } : l);
                        setLabelEntries(updated);
                      }}
                      style={{
                        padding: '7px 12px', borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)', background: 'white',
                        color: '#94A3B8', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Limpar
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => void persistSettings()} style={{
                    padding: '9px 20px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                  }}>
                    Salvar labels
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Campos Visíveis ── */}
          {activeSection === 'campos-visiveis' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Campos Visíveis</h2>
              <p style={sectionSubtitleStyle}>Defina quais campos aparecem no formulário do catálogo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {FIELDS.map(field => (
                  <div key={field.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px',
                    background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '4px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{field.label}</span>
                        {field.alwaysRequired && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700, color: '#EF4444', background: '#FEF2F2',
                            padding: '1px 7px', borderRadius: '999px', letterSpacing: '0.3px',
                          }}>Obrigatório</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{field.description}</p>
                    </div>
                    <Toggle
                      checked={visibleFields[field.key]}
                      onChange={() => setVisibleFields(p => ({ ...p, [field.key]: !p[field.key] }))}
                      disabled={field.alwaysRequired}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Campos Obrigatórios ── */}
          {activeSection === 'campos-obrigatorios' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Campos Obrigatórios</h2>
              <p style={sectionSubtitleStyle}>Defina quais campos o usuário deve preencher obrigatoriamente</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {FIELDS.map(field => (
                  <div key={field.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px',
                    background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{field.label}</span>
                        {field.alwaysRequired && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700, color: '#94A3B8', background: '#F1F5F9',
                            padding: '1px 7px', borderRadius: '999px',
                          }}>Sempre obrigatório</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{field.description}</p>
                    </div>
                    <Toggle
                      checked={requiredFields[field.key]}
                      onChange={() => setRequiredFields(p => ({ ...p, [field.key]: !p[field.key] }))}
                      disabled={field.alwaysRequired}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Ordem dos Campos ── */}
          {activeSection === 'ordem' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Ordem dos Campos</h2>
              <p style={sectionSubtitleStyle}>Arraste os campos para definir a ordem no formulário do catálogo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {fieldOrder.map((key, idx) => {
                  const field = FIELDS.find(f => f.key === key)!;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleDragStart(key)}
                      onDragOver={e => handleDragOver(e, key)}
                      onDrop={() => handleDrop(key)}
                      onDragEnd={() => setDragging(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '12px',
                        background: dragging === key ? '#EEF2FF' : 'white',
                        border: `1.5px solid ${dragging === key ? '#6366F1' : 'rgba(0,0,0,0.08)'}`,
                        cursor: 'grab',
                        boxShadow: dragging === key ? '0 4px 12px rgba(99,102,241,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                    >
                      <GripVertical size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{field.label}</span>
                        {field.alwaysRequired && (
                          <span style={{
                            marginLeft: '8px', fontSize: '10px', fontWeight: 700,
                            color: '#EF4444', background: '#FEF2F2', padding: '1px 6px', borderRadius: '999px',
                          }}>Obrigatório</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => moveField(key, -1)}
                          disabled={idx === 0}
                          style={{
                            background: 'none', border: 'none',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.3 : 0.7,
                            padding: '4px', borderRadius: '6px', display: 'flex',
                          }}
                        >
                          <ChevronLeft size={15} color="#64748B" />
                        </button>
                        <button
                          onClick={() => moveField(key, 1)}
                          disabled={idx === fieldOrder.length - 1}
                          style={{
                            background: 'none', border: 'none',
                            cursor: idx === fieldOrder.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === fieldOrder.length - 1 ? 0.3 : 0.7,
                            padding: '4px', borderRadius: '6px', display: 'flex',
                          }}
                        >
                          <ChevronRight size={15} color="#64748B" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Colunas da Tabela ── */}
          {activeSection === 'colunas' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Colunas da Tabela</h2>
              <p style={sectionSubtitleStyle}>Escolha quais colunas aparecem na listagem do catálogo</p>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
              }}>
                <LayoutGrid size={15} color="#6366F1" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#6366F1', lineHeight: '1.5' }}>
                  A coluna <strong>"Nome"</strong> não pode ser removida — ela é obrigatória na listagem.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TABLE_COLUMNS.map(col => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '12px',
                      background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.04)',
                      cursor: col.alwaysOn ? 'not-allowed' : 'pointer',
                      opacity: col.alwaysOn ? 0.7 : 1,
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={col.alwaysOn ? true : tableColumns[col.key]}
                        onChange={() => {
                          if (!col.alwaysOn) {
                            setTableColumns(p => ({ ...p, [col.key]: !p[col.key] }));
                          }
                        }}
                        disabled={col.alwaysOn}
                        style={{ width: '16px', height: '16px', cursor: col.alwaysOn ? 'not-allowed' : 'pointer', accentColor: '#6366F1' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{col.label}</span>
                      {col.alwaysOn && (
                        <span style={{
                          marginLeft: '8px', fontSize: '10px', fontWeight: 700,
                          color: '#94A3B8', background: '#F1F5F9', padding: '1px 7px', borderRadius: '999px',
                        }}>Fixo</span>
                      )}
                    </div>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: (col.alwaysOn || tableColumns[col.key]) ? '#10B981' : '#E2E8F0',
                      flexShrink: 0,
                    }} />
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => void persistSettings()} style={{
                  padding: '9px 20px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                }}>
                  Salvar configuração
                </button>
              </div>
            </div>
          )}

          {/* ── Tipos de Item ── */}
          {activeSection === 'tipos' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Tipos de Item</h2>
              <p style={sectionSubtitleStyle}>Habilite ou desabilite os tipos de item disponíveis no seletor do formulário e nos filtros</p>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: '#FFFBEB', border: '1px solid #FCD34D',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
              }}>
                <Boxes size={15} color="#92400E" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#92400E', lineHeight: '1.5' }}>
                  <strong>Produto</strong> e <strong>Serviço</strong> são tipos padrão e não podem ser desabilitados.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {ALL_TYPES.map(type => {
                  const cfg = CATALOG_TYPE_CONFIG[type];
                  const locked = isTypeAlwaysOn(type);
                  return (
                    <div
                      key={type}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', borderRadius: '12px',
                        background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.04)',
                        opacity: locked ? 0.75 : 1,
                      }}
                    >
                      {/* Icon circle */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: cfg.color, flexShrink: 0,
                      }}>
                        {TYPE_ICON_NODES[type]}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{cfg.label}</span>
                          {locked && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, color: '#64748B', background: '#F1F5F9',
                              padding: '1px 7px', borderRadius: '999px',
                            }}>Padrão</span>
                          )}
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                          {locked
                            ? 'Tipo padrão — sempre habilitado'
                            : enabledTypes[type]
                              ? 'Habilitado — aparece no seletor e filtros'
                              : 'Desabilitado — oculto no formulário e filtros'}
                        </p>
                      </div>

                      <Toggle
                        checked={enabledTypes[type]}
                        onChange={() => setEnabledTypes(prev => ({ ...prev, [type]: !prev[type] }))}
                        disabled={locked}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => void persistSettings()} style={{
                  padding: '9px 20px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                }}>
                  Salvar tipos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
