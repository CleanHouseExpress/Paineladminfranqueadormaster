import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Settings, ArrowLeft, Type, Eye, AlertCircle, GripVertical,
  LayoutGrid, List, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavSection = 'labels' | 'campos-visiveis' | 'campos-obrigatorios' | 'ordem' | 'colunas';

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
  { key: 'titulo',       label: 'Título',       description: 'Nome principal do documento',                       alwaysRequired: true  },
  { key: 'descricao',    label: 'Descrição',    description: 'Texto descritivo do conteúdo',                      alwaysRequired: false },
  { key: 'categoria',    label: 'Categoria',    description: 'Classificação por categoria',                       alwaysRequired: false },
  { key: 'visibilidade', label: 'Visibilidade', description: 'Controle de acesso ao documento',                   alwaysRequired: false },
  { key: 'unidade',      label: 'Unidade',      description: 'Unidade franqueada relacionada',                    alwaysRequired: false },
  { key: 'cliente',      label: 'Cliente',      description: 'Cliente vinculado ao documento',                    alwaysRequired: false },
  { key: 'usuario',      label: 'Usuário',      description: 'Usuário responsável ou destinatário',               alwaysRequired: false },
  { key: 'tags',         label: 'Tags',         description: 'Palavras-chave para organização e busca',           alwaysRequired: false },
];

const DEFAULT_LABELS: LabelEntry[] = [
  { key: 'documento',    default: 'Documento',    custom: '' },
  { key: 'documentos',   default: 'Documentos',   custom: '' },
  { key: 'titulo',       default: 'Título',       custom: '' },
  { key: 'categoria',    default: 'Categoria',    custom: '' },
  { key: 'visibilidade', default: 'Visibilidade', custom: '' },
  { key: 'upload',       default: 'Upload',       custom: '' },
];

const TABLE_COLUMNS = [
  { key: 'titulo',      label: 'Título',      alwaysOn: true  },
  { key: 'categoria',   label: 'Categoria',   alwaysOn: false },
  { key: 'visibilidade',label: 'Visibilidade',alwaysOn: false },
  { key: 'status',      label: 'Status',      alwaysOn: false },
  { key: 'tipo',        label: 'Tipo',        alwaysOn: false },
  { key: 'tamanho',     label: 'Tamanho',     alwaysOn: false },
  { key: 'criadoEm',    label: 'Criado em',   alwaysOn: false },
  { key: 'acoes',       label: 'Ações',       alwaysOn: false },
];

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

// ─── DocumentSettings ─────────────────────────────────────────────────────────

export function DocumentSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavSection>('labels');

  // Labels state
  const [labels, setLabels] = useState<LabelEntry[]>(DEFAULT_LABELS);

  // Visible fields state
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    Object.fromEntries(FIELDS.map(f => [f.key, true]))
  );

  // Required fields state
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>(
    Object.fromEntries(FIELDS.map(f => [f.key, f.alwaysRequired]))
  );

  // Field order state
  const [fieldOrder, setFieldOrder] = useState<string[]>(FIELDS.map(f => f.key));
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOverRef = useRef<string | null>(null);

  // Table columns state
  const [tableColumns, setTableColumns] = useState<Record<string, boolean>>(
    Object.fromEntries(TABLE_COLUMNS.map(c => [c.key, true]))
  );

  // ─── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragStart = (key: string) => setDragging(key);

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    dragOverRef.current = key;
  };

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

  // ─── Shared styles ─────────────────────────────────────────────────────────

  const sectionCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  };

  const sectionSubtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#94A3B8',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  };

  // ─── Nav items ─────────────────────────────────────────────────────────────

  const navItems: Array<{ key: NavSection; label: string; icon: React.ReactNode }> = [
    { key: 'labels',             label: 'Labels',             icon: <Type size={16} />         },
    { key: 'campos-visiveis',    label: 'Campos Visíveis',    icon: <Eye size={16} />          },
    { key: 'campos-obrigatorios',label: 'Campos Obrigatórios',icon: <AlertCircle size={16} />  },
    { key: 'ordem',              label: 'Ordem de Exibição',  icon: <List size={16} />         },
    { key: 'colunas',            label: 'Colunas da Tabela',  icon: <LayoutGrid size={16} />   },
  ];

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/documents" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
          Documentos
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
              Configurações de Documentos
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
              Personalize labels, campos e exibição do módulo
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/documents')}
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
          {/* ── Labels ── */}
          {activeSection === 'labels' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Labels</h2>
              <p style={sectionSubtitleStyle}>Personalize os rótulos exibidos na interface</p>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '12px',
                padding: '8px 12px',
                background: '#F8FAFC',
                borderRadius: '8px',
                marginBottom: '4px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Padrão
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Personalizado
                </span>
                <span />
              </div>

              {labels.map((entry, idx) => (
                <div key={entry.key} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: idx < labels.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#64748B',
                    fontWeight: 500,
                    background: '#F8FAFC',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    {entry.default}
                  </span>
                  <input
                    type="text"
                    value={entry.custom}
                    onChange={e => {
                      const updated = labels.map((l, i) => i === idx ? { ...l, custom: e.target.value } : l);
                      setLabels(updated);
                    }}
                    placeholder={entry.default}
                    style={{
                      border: '1.5px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#0F172A',
                      outline: 'none',
                      background: 'white',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => {
                      const updated = labels.map((l, i) => i === idx ? { ...l, custom: '' } : l);
                      setLabels(updated);
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'white',
                      color: '#94A3B8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Limpar
                  </button>
                </div>
              ))}

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                }}>
                  Salvar labels
                </button>
              </div>
            </div>
          )}

          {/* ── Campos Visíveis ── */}
          {activeSection === 'campos-visiveis' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Campos Visíveis</h2>
              <p style={sectionSubtitleStyle}>
                Defina quais campos aparecem no formulário de documento
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {FIELDS.map(field => (
                  <div key={field.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid rgba(0,0,0,0.04)',
                    marginBottom: '4px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{field.label}</span>
                        {field.alwaysRequired && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            color: '#EF4444', background: '#FEF2F2',
                            padding: '1px 7px', borderRadius: '999px',
                            letterSpacing: '0.3px',
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
              <p style={sectionSubtitleStyle}>
                Defina quais campos o usuário deve preencher obrigatoriamente
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {FIELDS.map(field => (
                  <div key={field.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{field.label}</span>
                        {field.alwaysRequired && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            color: '#94A3B8', background: '#F1F5F9',
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

          {/* ── Ordem de Exibição ── */}
          {activeSection === 'ordem' && (
            <div style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>Ordem de Exibição</h2>
              <p style={sectionSubtitleStyle}>
                Arraste os campos para definir a ordem no formulário
              </p>
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
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
                            marginLeft: '8px',
                            fontSize: '10px', fontWeight: 700,
                            color: '#EF4444', background: '#FEF2F2',
                            padding: '1px 6px', borderRadius: '999px',
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
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
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
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
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
              <p style={sectionSubtitleStyle}>
                Escolha quais colunas aparecem na listagem de documentos
              </p>

              {/* Tip */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: '#EEF2FF',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
              }}>
                <LayoutGrid size={15} color="#6366F1" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#6366F1', lineHeight: '1.5' }}>
                  A coluna <strong>"Título"</strong> não pode ser removida — ela é obrigatória na listagem.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TABLE_COLUMNS.map(col => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      border: '1px solid rgba(0,0,0,0.04)',
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
                          marginLeft: '8px',
                          fontSize: '10px', fontWeight: 700,
                          color: '#94A3B8', background: '#F1F5F9',
                          padding: '1px 7px', borderRadius: '999px',
                        }}>Fixo</span>
                      )}
                    </div>
                    {/* Active indicator */}
                    <div style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: (col.alwaysOn || tableColumns[col.key]) ? '#10B981' : '#E2E8F0',
                      flexShrink: 0,
                    }} />
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                }}>
                  Salvar configuração
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
