import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  FolderOpen, FileText, CheckCircle, Download, Search, Settings, Plus,
  Eye, Edit, Archive, Trash2, X,
} from 'lucide-react';
import {
  mockDocuments,
  mockDocumentCategories,
  mockDocumentStats,
} from '../../data/documentMockData';
import {
  VISIBILITY_CONFIG,
  STATUS_CONFIG,
  FILE_TYPE_CONFIG,
} from '../../../types/document';
import type { Document } from '../../../types/document';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileTypeIcon({ fileType }: { fileType: string }) {
  const cfg = FILE_TYPE_CONFIG[fileType as keyof typeof FILE_TYPE_CONFIG] ?? FILE_TYPE_CONFIG.other;
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: cfg.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '8px', fontWeight: 800, color: cfg.color, letterSpacing: '-0.02em' }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentList() {
  const navigate = useNavigate();

  const [documents] = useState<Document[]>(() => [...mockDocuments]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');

  // ── Category badge config (built from mockDocumentCategories) ──────────────
  const categoryBadgeConfig = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string }> = {};
    mockDocumentCategories.forEach(cat => {
      map[cat.id] = { label: cat.name, color: cat.color, bg: `${cat.color}1A` };
    });
    return map;
  }, []);

  // ── VISIBILITY_CONFIG adapted to DynamicTableRenderer badgeConfig format ───
  const visibilityBadgeConfig = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string }> = {};
    (Object.keys(VISIBILITY_CONFIG) as Array<keyof typeof VISIBILITY_CONFIG>).forEach(k => {
      map[k] = VISIBILITY_CONFIG[k];
    });
    return map;
  }, []);

  const statusBadgeConfig = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string }> = {};
    (Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).forEach(k => {
      map[k] = STATUS_CONFIG[k];
    });
    return map;
  }, []);

  const fileTypeBadgeConfig = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string }> = {};
    (Object.keys(FILE_TYPE_CONFIG) as Array<keyof typeof FILE_TYPE_CONFIG>).forEach(k => {
      map[k] = { label: FILE_TYPE_CONFIG[k].label, color: FILE_TYPE_CONFIG[k].color, bg: FILE_TYPE_CONFIG[k].bg };
    });
    return map;
  }, []);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtersActive = !!(search || categoryFilter || visibilityFilter || statusFilter || fileTypeFilter);

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch =
        !search.trim() ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || doc.categoryId === categoryFilter;
      const matchVisibility = !visibilityFilter || doc.visibility === visibilityFilter;
      const matchStatus = !statusFilter || doc.status === statusFilter;
      const matchFileType = !fileTypeFilter || doc.fileType === fileTypeFilter;
      return matchSearch && matchCategory && matchVisibility && matchStatus && matchFileType;
    });
  }, [documents, search, categoryFilter, visibilityFilter, statusFilter, fileTypeFilter]);

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: ColumnDef[] = [
    {
      key: 'title',
      label: 'Título',
      type: 'text',
      sortable: true,
      width: '260px',
      render: (_value, row) => {
        const doc = row as unknown as Document;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileTypeIcon fileType={String(doc.fileType)} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                }}
              >
                {doc.title}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94A3B8',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                }}
              >
                {doc.fileName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'categoryId',
      label: 'Categoria',
      type: 'badge',
      width: '130px',
      badgeConfig: categoryBadgeConfig,
    },
    {
      key: 'visibility',
      label: 'Visibilidade',
      type: 'badge',
      width: '140px',
      badgeConfig: visibilityBadgeConfig,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '100px',
      badgeConfig: statusBadgeConfig,
    },
    {
      key: 'fileType',
      label: 'Tipo',
      type: 'badge',
      width: '80px',
      badgeConfig: fileTypeBadgeConfig,
    },
    {
      key: 'fileSizeFormatted',
      label: 'Tamanho',
      type: 'text',
      width: '90px',
      render: (value) => (
        <span
          style={{
            fontSize: '12px',
            color: '#64748B',
            fontFamily: 'monospace',
            display: 'block',
            textAlign: 'right',
          }}
        >
          {String(value ?? '—')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Criado em',
      type: 'date',
      sortable: true,
      width: '110px',
    },
  ];

  // ── Row actions ────────────────────────────────────────────────────────────
  const tableActions = [
    {
      label: 'Visualizar',
      icon: <Eye size={14} />,
      onClick: (row: Record<string, unknown>) => navigate(`/documents/${row.id}`),
    },
    {
      label: 'Download',
      icon: <Download size={14} />,
      onClick: (row: Record<string, unknown>) => {
        console.log('Download document:', row.id);
        alert(`Iniciando download: ${row.fileName}`);
      },
    },
    {
      label: 'Editar',
      icon: <Edit size={14} />,
      onClick: (row: Record<string, unknown>) => navigate(`/documents/${row.id}`),
    },
    {
      label: 'Arquivar',
      icon: <Archive size={14} />,
      onClick: (row: Record<string, unknown>) => {
        console.log('Archive document:', row.id);
      },
      showCondition: (row: Record<string, unknown>) => row.status !== 'arquivado',
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      onClick: (row: Record<string, unknown>) => {
        if (window.confirm('Confirmar exclusão deste documento?')) {
          console.log('Delete document:', row.id);
        }
      },
      variant: 'danger' as const,
    },
  ];

  const tableData = filtered as unknown as Record<string, unknown>[];
  const stats = mockDocumentStats;

  const statCards = [
    {
      label: 'Total de Documentos',
      value: String(stats.total),
      Icon: FileText,
      color: '#6366F1',
      bg: '#EEF2FF',
    },
    {
      label: 'Documentos Ativos',
      value: String(stats.active),
      Icon: CheckCircle,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      label: 'Categorias',
      value: String(stats.categories),
      Icon: FolderOpen,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      label: 'Downloads (30 dias)',
      value: String(stats.downloadsLast30Days),
      Icon: Download,
      color: '#3B82F6',
      bg: '#EFF6FF',
    },
  ];

  function clearFilters() {
    setSearch('');
    setCategoryFilter('');
    setVisibilityFilter('');
    setStatusFilter('');
    setFileTypeFilter('');
  }

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '13px',
    color: '#0F172A',
    background: '#F8FAFC',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#94A3B8',
            marginBottom: '8px',
          }}
        >
          <span style={{ color: '#6366F1', fontWeight: 600 }}>Documentos</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpen size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Documentos
              </h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Biblioteca central de documentos da rede
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/documents/settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(99,102,241,0.3)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#6366F1',
                background: 'transparent',
                textDecoration: 'none',
              }}
            >
              <Settings size={14} />
              Configurações
            </Link>
            <button
              onClick={() => navigate('/documents/new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Novo Documento
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {statCards.map(card => {
          const Icon = card.Icon;
          return (
            <div
              key={card.label}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} style={{ color: card.color }} />
                </div>
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748B',
                  marginTop: '4px',
                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid rgba(0,0,0,0.06)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div
          style={{
            position: 'relative',
            flex: '1',
            minWidth: '200px',
            maxWidth: '300px',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título ou arquivo..."
            style={{
              width: '100%',
              padding: '8px 10px 8px 30px',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#0F172A',
              background: '#F8FAFC',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Categoria */}
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
          <option value="">Categoria</option>
          {mockDocumentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Visibilidade */}
        <select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)} style={selectStyle}>
          <option value="">Visibilidade</option>
          <option value="interno">Interno</option>
          <option value="portal_cliente">Portal Cliente</option>
          <option value="portal_franqueado">Portal Franqueado</option>
          <option value="publico">Público</option>
        </select>

        {/* Status */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">Status</option>
          <option value="ativo">Ativo</option>
          <option value="rascunho">Rascunho</option>
          <option value="arquivado">Arquivado</option>
        </select>

        {/* Tipo de Arquivo */}
        <select value={fileTypeFilter} onChange={e => setFileTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">Tipo de Arquivo</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="xlsx">XLSX</option>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
        </select>

        {/* Clear filters */}
        {filtersActive && (
          <button
            onClick={clearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'transparent',
              fontSize: '13px',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={12} />
            Limpar filtros
          </button>
        )}

        {/* Result count */}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#94A3B8',
            whiteSpace: 'nowrap',
          }}
        >
          {filtered.length} documento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        /* Empty state */
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '64px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}
          >
            <FolderOpen size={28} style={{ color: '#6366F1' }} />
          </div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
            }}
          >
            Nenhum documento encontrado
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '360px' }}>
            {filtersActive
              ? 'Nenhum documento corresponde aos filtros aplicados. Tente ajustar ou limpar os filtros.'
              : 'Ainda não há documentos cadastrados. Comece adicionando o primeiro documento da biblioteca.'}
          </p>
          {!filtersActive && (
            <button
              onClick={() => navigate('/documents/new')}
              style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Novo Documento
            </button>
          )}
        </div>
      ) : (
        <DynamicTableRenderer
          columns={columns}
          data={tableData}
          keyField="id"
          emptyMessage="Nenhum documento encontrado."
          onRowClick={(row) => navigate(`/documents/${row.id}`)}
          actions={tableActions}
        />
      )}

      {/* Pagination info */}
      {filtered.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#94A3B8',
            textAlign: 'right',
          }}
        >
          Mostrando {filtered.length} de {documents.length} documento{documents.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
