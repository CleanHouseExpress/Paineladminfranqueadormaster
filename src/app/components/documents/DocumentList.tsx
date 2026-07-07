import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { FolderOpen, FileText, CheckCircle, Download, Search, Settings, Plus, Eye, Edit, Archive, Trash2, X } from 'lucide-react';
import { VISIBILITY_CONFIG, STATUS_CONFIG, FILE_TYPE_CONFIG } from '../../../types/document';
import type { Document, DocumentCategory, DocumentFileType, DocumentStatus, DocumentStats, DocumentVisibility } from '../../../types/document';
import { archiveDocument, deleteDocument, downloadDocument, getCategories, getDocuments, getStats } from '../../../services/documentService';
import { getApiErrorMessage } from '../../../services/apiClient';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';

function FileTypeIcon({ fileType }: { fileType: string }) {
  const cfg = FILE_TYPE_CONFIG[fileType as keyof typeof FILE_TYPE_CONFIG] ?? FILE_TYPE_CONFIG.other;
  return (
    <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 8, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

const emptyStats: DocumentStats = {
  total: 0,
  active: 0,
  categories: 0,
  downloadsLast30Days: 0,
  recentDocuments: [],
  topCategories: [],
};

export function DocumentList() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [stats, setStats] = useState<DocumentStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<DocumentVisibility | ''>('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<DocumentFileType | ''>('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextDocuments, nextCategories, nextStats] = await Promise.all([
        getDocuments({ search, categoryId: categoryFilter, visibility: visibilityFilter, status: statusFilter, fileType: fileTypeFilter, perPage: 100 }),
        getCategories(),
        getStats(),
      ]);
      setDocuments(nextDocuments);
      setCategories(nextCategories);
      setStats(nextStats);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel carregar os documentos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, categoryFilter, visibilityFilter, statusFilter, fileTypeFilter]);

  const categoryBadgeConfig = useMemo(() => {
    const map: Record<string, { label: string; color: string; bg: string }> = {};
    categories.forEach(cat => { map[cat.id] = { label: cat.name, color: cat.color, bg: `${cat.color}1A` }; });
    map[''] = { label: 'Sem categoria', color: '#64748B', bg: '#F8FAFC' };
    return map;
  }, [categories]);

  const visibilityBadgeConfig = useMemo(() => Object.fromEntries(Object.entries(VISIBILITY_CONFIG)), []);
  const statusBadgeConfig = useMemo(() => Object.fromEntries(Object.entries(STATUS_CONFIG)), []);
  const fileTypeBadgeConfig = useMemo(() => Object.fromEntries(Object.entries(FILE_TYPE_CONFIG).map(([key, cfg]) => [key, { label: cfg.label, color: cfg.color, bg: cfg.bg }])), []);
  const filtersActive = !!(search || categoryFilter || visibilityFilter || statusFilter || fileTypeFilter);

  const columns: ColumnDef[] = [
    {
      key: 'title', label: 'Titulo', type: 'text', sortable: true, width: '260px',
      render: (_value, row) => {
        const doc = row as unknown as Document;
        return <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FileTypeIcon fileType={doc.fileType} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{doc.title}</div><div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{doc.fileName}</div></div></div>;
      },
    },
    { key: 'categoryId', label: 'Categoria', type: 'badge', width: '140px', badgeConfig: categoryBadgeConfig },
    { key: 'visibility', label: 'Visibilidade', type: 'badge', width: '150px', badgeConfig: visibilityBadgeConfig },
    { key: 'status', label: 'Status', type: 'badge', width: '110px', badgeConfig: statusBadgeConfig },
    { key: 'fileType', label: 'Tipo', type: 'badge', width: '80px', badgeConfig: fileTypeBadgeConfig },
    { key: 'fileSizeFormatted', label: 'Tamanho', type: 'text', width: '90px', render: value => <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', display: 'block', textAlign: 'right' }}>{String(value ?? '-')}</span> },
    { key: 'createdAt', label: 'Criado em', type: 'date', sortable: true, width: '110px' },
  ];

  async function withAction(id: string, action: () => Promise<void>) {
    setActionId(id);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel concluir a acao.'));
    } finally {
      setActionId(null);
    }
  }

  const tableActions = [
    { label: 'Visualizar', icon: <Eye size={14} />, onClick: (row: Record<string, unknown>) => navigate(`/documents/${row.id}`) },
    { label: 'Download', icon: <Download size={14} />, onClick: (row: Record<string, unknown>) => void withAction(String(row.id), () => downloadDocument(String(row.id), String(row.fileName ?? 'documento'))) },
    { label: 'Editar', icon: <Edit size={14} />, onClick: (row: Record<string, unknown>) => navigate(`/documents/${row.id}?edit=true`) },
    { label: 'Arquivar', icon: <Archive size={14} />, onClick: (row: Record<string, unknown>) => void withAction(String(row.id), async () => { await archiveDocument(String(row.id)); }), showCondition: (row: Record<string, unknown>) => row.status !== 'arquivado' },
    { label: 'Excluir', icon: <Trash2 size={14} />, onClick: (row: Record<string, unknown>) => { if (window.confirm('Confirmar exclusao deste documento?')) void withAction(String(row.id), () => deleteDocument(String(row.id))); }, variant: 'danger' as const },
  ];

  const statCards = [
    { label: 'Total de Documentos', value: String(stats.total), Icon: FileText, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Documentos Ativos', value: String(stats.active), Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Categorias', value: String(stats.categories), Icon: FolderOpen, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Downloads (30 dias)', value: String(stats.downloadsLast30Days), Icon: Download, color: '#3B82F6', bg: '#EFF6FF' },
  ];

  function clearFilters() {
    setSearch(''); setCategoryFilter(''); setVisibilityFilter(''); setStatusFilter(''); setFileTypeFilter('');
  }

  const selectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#0F172A', background: '#F8FAFC', cursor: 'pointer', outline: 'none' };

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100vh' }} data-testid="documents-page">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8', marginBottom: 8 }}><span style={{ color: '#6366F1', fontWeight: 600 }}>Documentos</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FolderOpen size={22} color="#fff" /></div><div><h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Documentos</h1><p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>Biblioteca central de documentos da rede</p></div></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/documents/categories" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)', fontSize: 13, fontWeight: 600, color: '#6366F1', background: 'transparent', textDecoration: 'none' }}><Settings size={14} />Categorias</Link>
            <button data-testid="documents-new" onClick={() => navigate('/documents/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}><Plus size={14} />Novo Documento</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {statCards.map(card => { const Icon = card.Icon; return <div key={card.label} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}><div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Icon size={18} color={card.color} /></div><div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{card.value}</div><div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{card.label}</div></div>; })}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}><Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} /><input data-testid="documents-search" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por titulo ou arquivo..." style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} /></div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}><option value="">Categoria</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>
        <select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value as DocumentVisibility | '')} style={selectStyle}><option value="">Visibilidade</option><option value="interno">Interno</option><option value="portal_cliente">Portal Cliente</option><option value="portal_franqueado">Portal Franqueado</option><option value="publico">Publico</option></select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DocumentStatus | '')} style={selectStyle}><option value="">Status</option><option value="ativo">Ativo</option><option value="arquivado">Arquivado</option></select>
        <select value={fileTypeFilter} onChange={e => setFileTypeFilter(e.target.value as DocumentFileType | '')} style={selectStyle}><option value="">Tipo de Arquivo</option><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="xlsx">XLSX</option><option value="png">PNG</option><option value="jpg">JPG</option></select>
        {filtersActive && <button onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: 13, color: '#64748B', cursor: 'pointer' }}><X size={12} />Limpar filtros</button>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>{loading ? 'Carregando...' : `${documents.length} documento${documents.length !== 1 ? 's' : ''}`}</span>
      </div>

      {error && <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {loading ? <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>Carregando documentos...</div> : documents.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }} data-testid="documents-empty"><div style={{ width: 56, height: 56, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}><FolderOpen size={28} color="#6366F1" /></div><h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Nenhum documento encontrado</h3><p style={{ fontSize: 13, color: '#64748B', margin: 0, maxWidth: 380 }}>{filtersActive ? 'Nenhum documento corresponde aos filtros aplicados.' : 'Ainda nao ha documentos cadastrados. Comece adicionando o primeiro documento da biblioteca.'}</p>{!filtersActive && <button onClick={() => navigate('/documents/new')} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}><Plus size={14} />Novo Documento</button>}</div>
      ) : <DynamicTableRenderer columns={columns} data={documents as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="Nenhum documento encontrado." onRowClick={row => navigate(`/documents/${row.id}`)} actions={tableActions} />}

      {actionId && <div style={{ marginTop: 12, fontSize: 12, color: '#64748B' }}>Processando documento {actionId}...</div>}
      {!loading && documents.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8', textAlign: 'right' }}>Mostrando {documents.length} documento{documents.length !== 1 ? 's' : ''}</div>}
    </div>
  );
}
