import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ChevronRight, Edit, Download, Archive, Trash2,
  FileText, FileSpreadsheet, Image, File,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Building2, User, Tag,
} from 'lucide-react';
import { mockDocuments } from '../../data/documentMockData';
import {
  VISIBILITY_CONFIG,
  STATUS_CONFIG,
  FILE_TYPE_CONFIG,
} from '../../../types/document';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── PDF Mockup ───────────────────────────────────────────────────────────────

function PdfMockup({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div style={{
        background: '#F1F5F9',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
      }}>
        <button style={{ background: 'none', border: 'none', cursor: 'not-allowed', opacity: 0.4, padding: '4px' }}>
          <ChevronLeft size={16} color="#64748B" />
        </button>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Página 1 de 12</span>
        <button style={{ background: 'none', border: 'none', cursor: 'not-allowed', opacity: 0.4, padding: '4px' }}>
          <ChevronRightIcon size={16} color="#64748B" />
        </button>
      </div>

      {/* Page body */}
      <div style={{
        flex: 1,
        background: 'white',
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        {/* Title block */}
        <div style={{ background: '#6366F1', borderRadius: '6px', height: '28px', width: '60%', marginBottom: '8px' }} />

        {/* Paragraph lines */}
        {[90, 80, 75, 85, 70, 78, 65, 82, 76, 60].map((w, i) => (
          <div key={i} style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', width: `${w}%` }} />
        ))}

        {/* Sub-heading */}
        <div style={{ height: '14px', background: '#CBD5E1', borderRadius: '4px', width: '40%', marginTop: '8px' }} />

        {/* More lines */}
        {[72, 88, 65, 80, 55, 75].map((w, i) => (
          <div key={i} style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', width: `${w}%` }} />
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        background: '#F8FAFC',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '10px 16px',
        borderRadius: '0 0 12px 12px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
          Visualização simulada • Clique em Download para baixar o arquivo
        </span>
      </div>
    </div>
  );
}

// ─── Image Mockup ─────────────────────────────────────────────────────────────

function ImageMockup({ fileName }: { fileName: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '48px',
    }}>
      <div style={{
        width: '80px', height: '80px',
        background: 'white',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
      }}>
        <Image size={36} color="#8B5CF6" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
          {fileName}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>Arquivo de imagem</p>
      </div>
    </div>
  );
}

// ─── DOCX / XLSX Mockup ───────────────────────────────────────────────────────

function OfficeMockup({ fileType, fileName }: { fileType: 'docx' | 'xlsx' | 'other'; fileName: string }) {
  const isXlsx = fileType === 'xlsx';
  const color = isXlsx ? '#10B981' : '#3B82F6';
  const bg = isXlsx ? '#ECFDF5' : '#EFF6FF';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        background: color,
        borderRadius: '12px 12px 0 0',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {isXlsx
          ? <FileSpreadsheet size={20} color="white" />
          : <FileText size={20} color="white" />}
        <span style={{ color: 'white', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
          {fileName}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, background: 'white', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isXlsx ? (
          // Spreadsheet grid
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'flex', background: bg }}>
              {[60, 100, 80, 80, 70].map((w, i) => (
                <div key={i} style={{
                  flex: `0 0 ${w}px`,
                  height: '24px',
                  background: isXlsx ? '#D1FAE5' : '#DBEAFE',
                  borderRight: '1px solid #E2E8F0',
                }}/>
              ))}
            </div>
            {/* Data rows */}
            {[1,2,3,4,5,6].map(row => (
              <div key={row} style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
                {[60, 100, 80, 80, 70].map((w, i) => (
                  <div key={i} style={{
                    flex: `0 0 ${w}px`,
                    height: '20px',
                    borderRight: '1px solid #F1F5F9',
                    background: row % 2 === 0 ? '#F8FAFC' : 'white',
                  }}/>
                ))}
              </div>
            ))}
          </div>
        ) : (
          // Document lines
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '16px', background: '#CBD5E1', borderRadius: '4px', width: '50%' }} />
            {[85, 70, 80, 75, 65, 78, 60, 72].map((w, i) => (
              <div key={i} style={{ height: '8px', background: '#E2E8F0', borderRadius: '3px', width: `${w}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity timeline ────────────────────────────────────────────────────────

function ActivityTimeline({ doc }: { doc: ReturnType<typeof mockDocuments[number]['id'] extends string ? () => (typeof mockDocuments)[number] : never> }) {
  const events = [
    { label: 'Documento criado',            actor: doc.createdBy,           date: doc.createdAt  },
    { label: 'Enviado para Portal Cliente', actor: doc.createdBy,           date: doc.createdAt  },
    { label: 'Download realizado',          actor: 'Usuário externo',        date: doc.updatedAt  },
    { label: 'Metadados atualizados',       actor: doc.createdBy,           date: doc.updatedAt  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
          {/* Dot + line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#6366F1',
              border: '2px solid white',
              outline: '1.5px solid #6366F1',
              marginTop: '4px',
              flexShrink: 0,
            }}/>
            {i < events.length - 1 && (
              <div style={{ width: '1px', flex: 1, background: '#E2E8F0', minHeight: '20px', marginTop: '2px' }} />
            )}
          </div>
          {/* Content */}
          <div style={{ paddingBottom: i < events.length - 1 ? '16px' : 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{ev.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94A3B8' }}>
              {ev.actor} · {formatDate(ev.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DocumentDetail ───────────────────────────────────────────────────────────

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const doc = mockDocuments.find(d => d.id === id);

  if (!doc) {
    return (
      <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
        <ModuleStateView
          state="error"
          moduleName="Documento"
          errorMessage={`Documento com ID "${id}" não encontrado.`}
        />
      </div>
    );
  }

  const statusCfg     = STATUS_CONFIG[doc.status];
  const visibilityCfg = VISIBILITY_CONFIG[doc.visibility];
  const fileTypeCfg   = FILE_TYPE_CONFIG[doc.fileType];

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/documents" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
          Documentos
        </Link>
        <ChevronRight size={13} color="#94A3B8" />
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.title}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{doc.title}</h1>
            <span style={{
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              color: statusCfg.color,
              background: statusCfg.bg,
            }}>{statusCfg.label}</span>
            <span style={{
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              color: visibilityCfg.color,
              background: visibilityCfg.bg,
            }}>{visibilityCfg.label}</span>
          </div>
          {doc.description && (
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B', lineHeight: '1.5' }}>{doc.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => navigate(`/documents/${doc.id}?edit=true`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1.5px solid rgba(0,0,0,0.1)', background: 'white',
              color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Edit size={14} /> Editar
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            border: '1.5px solid rgba(0,0,0,0.1)', background: 'white',
            color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            <Download size={14} /> Download
          </button>
          {doc.status === 'ativo' && (
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1.5px solid rgba(0,0,0,0.1)', background: 'white',
              color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
              <Archive size={14} /> Arquivar
            </button>
          )}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            border: '1.5px solid rgba(239,68,68,0.2)', background: '#FEF2F2',
            color: '#EF4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* LEFT 65% */}
        <div style={{ flex: '0 0 65%', maxWidth: '65%' }}>
          {/* Preview card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            marginBottom: '20px',
            minHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {doc.fileType === 'pdf' && <PdfMockup title={doc.title} />}
            {(doc.fileType === 'png' || doc.fileType === 'jpg') && (
              <div style={{ flex: 1, display: 'flex', padding: '32px' }}>
                <ImageMockup fileName={doc.fileName} />
              </div>
            )}
            {(doc.fileType === 'docx' || doc.fileType === 'xlsx' || doc.fileType === 'other') && (
              <OfficeMockup fileType={doc.fileType as 'docx' | 'xlsx' | 'other'} fileName={doc.fileName} />
            )}
          </div>

          {/* Histórico de Atividades */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              Histórico de Atividades
            </h3>
            <ActivityTimeline doc={doc as any} />
          </div>
        </div>

        {/* RIGHT 35% — sticky metadata panel */}
        <div style={{ flex: '0 0 35%', maxWidth: '35%', position: 'sticky', top: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>
              Informações
            </h3>

            {/* Metadata rows */}
            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Categoria
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '2px 10px', borderRadius: '999px',
                fontSize: '12px', fontWeight: 600,
                color: doc.categoryColor,
                background: `${doc.categoryColor}18`,
                alignSelf: 'flex-start',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: doc.categoryColor }} />
                {doc.categoryName}
              </span>
            </div>

            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Visibilidade
              </span>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px', borderRadius: '999px',
                fontSize: '12px', fontWeight: 600,
                color: visibilityCfg.color,
                background: visibilityCfg.bg,
                alignSelf: 'flex-start',
              }}>{visibilityCfg.label}</span>
            </div>

            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Tipo de arquivo
              </span>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px', borderRadius: '999px',
                fontSize: '12px', fontWeight: 600,
                color: fileTypeCfg.color,
                background: fileTypeCfg.bg,
                alignSelf: 'flex-start',
              }}>{fileTypeCfg.label}</span>
            </div>

            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Tamanho
              </span>
              <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                {doc.fileSizeFormatted}
              </span>
            </div>

            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Downloads
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                <Download size={13} color="#94A3B8" />
                {doc.downloadCount}
              </span>
            </div>

            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Criado por
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, color: 'white',
                }}>{doc.createdByAvatar}</div>
                {doc.createdBy}
              </span>
            </div>

            <div style={metaRowStyle}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Criado em
              </span>
              <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                {formatDate(doc.createdAt)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Atualizado em
              </span>
              <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                {formatDate(doc.updatedAt)}
              </span>
            </div>

            {/* Vínculos */}
            {(doc.unitName || doc.clientName || doc.userName) && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 12px 0' }}>
                  Vínculos
                </h4>
                {doc.unitName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                    <Building2 size={13} color="#94A3B8" />
                    <span style={{ fontSize: '13px', color: '#0F172A' }}>{doc.unitName}</span>
                  </div>
                )}
                {doc.clientName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                    <User size={13} color="#94A3B8" />
                    <span style={{ fontSize: '13px', color: '#0F172A' }}>{doc.clientName}</span>
                  </div>
                )}
                {doc.userName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <User size={13} color="#94A3B8" />
                    <span style={{ fontSize: '13px', color: '#0F172A' }}>{doc.userName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 10px 0' }}>
                  Tags
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {doc.tags.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: '#EEF2FF', color: '#6366F1',
                      borderRadius: '999px', padding: '3px 9px',
                      fontSize: '11px', fontWeight: 500,
                    }}>
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ações Rápidas */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 4px 0' }}>
                Ações Rápidas
              </h4>
              <button style={{
                width: '100%', padding: '10px 0',
                borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Download size={14} /> Download
              </button>
              <button style={{
                width: '100%', padding: '10px 0',
                borderRadius: '10px',
                border: '1.5px solid rgba(0,0,0,0.1)', background: 'white',
                color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}>
                Compartilhar link
              </button>
              {doc.status === 'ativo' && (
                <button style={{
                  width: '100%', padding: '10px 0',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(245,158,11,0.3)', background: '#FFFBEB',
                  color: '#F59E0B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Archive size={14} /> Arquivar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
