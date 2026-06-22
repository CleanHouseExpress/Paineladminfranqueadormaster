import React, { useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router';
import {
  FilePlus, ChevronRight, Upload, X, FileText, FileSpreadsheet,
  Image, ChevronDown, ChevronUp, Tag, Lock, User, Building2, Globe,
} from 'lucide-react';
import { mockDocumentCategories } from '../../data/documentMockData';
import { VISIBILITY_CONFIG, FILE_TYPE_CONFIG } from '../../../types/document';
import type { DocumentVisibility, DocumentFileType } from '../../../types/document';

// ─── Mock file objects ────────────────────────────────────────────────────────

interface MockFile {
  name: string;
  size: number;
  type: DocumentFileType;
}

const MOCK_FILES: MockFile[] = [
  { name: 'manual-operacoes-v3.pdf',    size: 4200000, type: 'pdf'  },
  { name: 'relatorio-financeiro.xlsx',  size: 890000,  type: 'xlsx' },
  { name: 'logo-bella-vita.png',        size: 340000,  type: 'png'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Visibility options ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: Array<{
  value: DocumentVisibility;
  icon: React.ReactNode;
  description: string;
}> = [
  { value: 'interno',           icon: <Lock size={15} />,     description: 'Visível apenas para usuários internos' },
  { value: 'portal_cliente',    icon: <User size={15} />,     description: 'Visível para clientes no portal' },
  { value: 'portal_franqueado', icon: <Building2 size={15} />, description: 'Visível para franqueados no portal' },
  { value: 'publico',           icon: <Globe size={15} />,    description: 'Visível para qualquer pessoa' },
];

// ─── Mock unit list ───────────────────────────────────────────────────────────

const MOCK_UNITS = [
  { id: 'all',    name: 'Todas as unidades' },
  { id: 'bv-001', name: 'BV-001 — Unidade Centro'        },
  { id: 'bv-002', name: 'BV-002 — Unidade Norte'         },
  { id: 'bv-003', name: 'BV-003 — Unidade Sul'           },
  { id: 'bv-004', name: 'BV-004 — Unidade Leste'         },
  { id: 'bv-005', name: 'BV-005 — Unidade Oeste'         },
  { id: 'bv-006', name: 'BV-006 — Unidade Shopping'      },
  { id: 'bv-007', name: 'BV-007 — Unidade Aeroporto'     },
  { id: 'bv-008', name: 'BV-008 — Unidade Universitária' },
];

// ─── FilePreviewCard ──────────────────────────────────────────────────────────

function FilePreviewCard({ file, onRemove }: { file: MockFile; onRemove: () => void }) {
  const config = FILE_TYPE_CONFIG[file.type];

  const preview = () => {
    if (file.type === 'pdf') {
      return (
        <div style={{
          background: '#F8FAFC',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          height: '140px',
          position: 'relative',
        }}>
          <div style={{
            background: '#EF4444',
            color: 'white',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            position: 'absolute',
            top: '12px',
            right: '12px',
          }}>PDF</div>
          <div style={{
            width: '56px',
            height: '72px',
            background: 'white',
            borderRadius: '4px',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <FileText size={24} color="#EF4444" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            {[65, 50, 60, 45].map((w, i) => (
              <div key={i} style={{ height: '2px', background: '#E2E8F0', width: `${w}px`, borderRadius: '1px' }} />
            ))}
          </div>
        </div>
      );
    }

    if (file.type === 'png' || file.type === 'jpg') {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
          borderRadius: '12px',
          height: '140px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          border: '1px solid rgba(99,102,241,0.12)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
          }}>
            <Image size={22} color="#8B5CF6" />
          </div>
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Arquivo de imagem</span>
        </div>
      );
    }

    // DOCX / XLSX
    const isXlsx = file.type === 'xlsx';
    return (
      <div style={{
        background: isXlsx ? '#ECFDF5' : '#EFF6FF',
        borderRadius: '12px',
        height: '140px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: `1px solid ${isXlsx ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'white',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {isXlsx ? <FileSpreadsheet size={22} color="#10B981" /> : <FileText size={22} color="#3B82F6" />}
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: isXlsx ? '#10B981' : '#3B82F6',
          letterSpacing: '0.5px',
        }}>{file.type.toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {preview()}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0F172A',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{file.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatFileSize(file.size)}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: config.color,
              background: config.bg,
              padding: '1px 6px',
              borderRadius: '999px',
              letterSpacing: '0.5px',
            }}>{config.label}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          style={{
            background: '#FEF2F2',
            border: 'none',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={13} color="#EF4444" />
        </button>
      </div>
    </div>
  );
}

// ─── DocumentForm ─────────────────────────────────────────────────────────────

export function DocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id || searchParams.get('edit') === 'true';

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('interno');
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [unit, setUnit] = useState('all');
  const [client, setClient] = useState('');
  const [user, setUser] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [vinculosOpen, setVinculosOpen] = useState(true);

  // Mock file cycling state
  const [mockFile, setMockFile] = useState<MockFile | null>(null);
  const [mockFileIdx, setMockFileIdx] = useState(0);

  const handleUploadClick = () => {
    setMockFile(MOCK_FILES[mockFileIdx]);
    setMockFileIdx((mockFileIdx + 1) % MOCK_FILES.length);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const selectedVisibility = VISIBILITY_OPTIONS.find(o => o.value === visibility)!;

  // Input style shared
  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    background: 'white',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    marginBottom: '6px',
    display: 'block',
  };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    marginBottom: '16px',
  };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/documents" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
          Documentos
        </Link>
        <ChevronRight size={13} color="#94A3B8" />
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
          {isEdit ? 'Editar Documento' : 'Novo Documento'}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FilePlus size={20} color="white" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {isEdit ? 'Editar Documento' : 'Novo Documento'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1.5px solid rgba(0,0,0,0.1)',
              background: 'white',
              color: '#64748B',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: '1.5px solid rgba(0,0,0,0.1)',
            background: 'white',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Salvar como Rascunho
          </button>
          <button style={{
            padding: '9px 20px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            Publicar
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* LEFT 60% */}
        <div style={{ flex: '0 0 60%', maxWidth: '60%' }}>
          {/* Informações Básicas */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              Informações Básicas
            </h2>

            {/* Título */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Título <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nome do documento..."
                style={{ ...inputStyle, fontSize: '16px', fontWeight: 500 }}
              />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Descrição</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva o conteúdo do documento..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </div>

            {/* Categoria */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">Selecionar categoria...</option>
                {mockDocumentCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {/* Color dot overlay is best-effort in pure inline — show selected indicator */}
              {categoryId && (() => {
                const cat = mockDocumentCategories.find(c => c.id === categoryId);
                return cat ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{cat.name}</span>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Visibilidade */}
            <div style={{ marginBottom: '4px' }}>
              <label style={labelStyle}>Visibilidade</label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setVisibilityOpen(o => !o)}
                  style={{
                    width: '100%',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: VISIBILITY_CONFIG[visibility].color }}>
                      {selectedVisibility.icon}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>
                        {VISIBILITY_CONFIG[visibility].label}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>
                        {selectedVisibility.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={15} color="#94A3B8" />
                </button>
                {visibilityOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1.5px solid rgba(0,0,0,0.08)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}>
                    {VISIBILITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setVisibility(opt.value); setVisibilityOpen(false); }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: visibility === opt.value ? VISIBILITY_CONFIG[opt.value].bg : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                        }}
                      >
                        <span style={{ color: VISIBILITY_CONFIG[opt.value].color }}>{opt.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>
                            {VISIBILITY_CONFIG[opt.value].label}
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vínculos (collapsible) */}
          <div style={cardStyle}>
            <button
              type="button"
              onClick={() => setVinculosOpen(o => !o)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 0,
                marginBottom: vinculosOpen ? '20px' : 0,
              }}
            >
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Vínculos</h2>
              {vinculosOpen ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
            </button>

            {vinculosOpen && (
              <div>
                {/* Unidade */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Unidade</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                  >
                    {MOCK_UNITS.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Cliente */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Cliente</label>
                  <input
                    type="text"
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    placeholder="Nome ou ID do cliente..."
                    style={inputStyle}
                  />
                </div>

                {/* Usuário */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Usuário</label>
                  <input
                    type="text"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    placeholder="Nome ou e-mail do usuário..."
                    style={inputStyle}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label style={labelStyle}>Tags</label>
                  <div style={{
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    background: 'white',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    alignItems: 'center',
                    minHeight: '42px',
                  }}>
                    {tags.map(tag => (
                      <span key={tag} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#EEF2FF',
                        color: '#6366F1',
                        borderRadius: '999px',
                        padding: '3px 10px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        <Tag size={10} />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#A5B4FC' }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tags.length === 0 ? 'Adicionar tag e pressionar Enter...' : ''}
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '13px',
                        color: '#0F172A',
                        flex: 1,
                        minWidth: '120px',
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 40% */}
        <div style={{ flex: '0 0 40%', maxWidth: '40%' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0' }}>
              Arquivo
            </h2>

            {mockFile ? (
              <FilePreviewCard file={mockFile} onRemove={() => setMockFile(null)} />
            ) : (
              <div
                onClick={handleUploadClick}
                style={{
                  border: '2px dashed rgba(99,102,241,0.3)',
                  borderRadius: '16px',
                  padding: '40px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: 'rgba(99,102,241,0.02)',
                  textAlign: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.02)')}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '4px',
                }}>
                  <Upload size={24} color="#6366F1" />
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                  Arraste o arquivo aqui
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6366F1', textDecoration: 'underline', cursor: 'pointer' }}>
                  ou clique para selecionar
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>
                  PDF, DOCX, XLSX, PNG, JPG
                </p>
              </div>
            )}

            <p style={{
              margin: '14px 0 0 0',
              fontSize: '11px',
              color: '#94A3B8',
              textAlign: 'center',
              lineHeight: '1.5',
            }}>
              Tamanho máximo: 50MB. Formatos suportados: PDF, DOCX, XLSX, PNG, JPG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
