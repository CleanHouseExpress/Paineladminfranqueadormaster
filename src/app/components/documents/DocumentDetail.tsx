import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ChevronRight, Edit, Download, Archive, Trash2, FileText, FileSpreadsheet, Image, File, Building2, User, Tag } from 'lucide-react';
import { VISIBILITY_CONFIG, STATUS_CONFIG, FILE_TYPE_CONFIG } from '../../../types/document';
import type { Document } from '../../../types/document';
import { archiveDocument, deleteDocument, downloadDocument, getDocument } from '../../../services/documentService';
import { getApiErrorMessage } from '../../../services/apiClient';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Preview({ doc }: { doc: Document }) {
  const cfg = FILE_TYPE_CONFIG[doc.fileType] ?? FILE_TYPE_CONFIG.other;
  const Icon = doc.fileType === 'xlsx' ? FileSpreadsheet : doc.fileType === 'png' || doc.fileType === 'jpg' ? Image : doc.fileType === 'other' ? File : FileText;
  return (
    <div style={{ flex: 1, background: cfg.bg, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 48 }}>
      <div style={{ width: 86, height: 86, background: 'white', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}><Icon size={38} color={cfg.color} /></div>
      <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{doc.fileName}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>{cfg.label} - {doc.fileSizeFormatted}</p></div>
    </div>
  );
}

function ActivityTimeline({ doc }: { doc: Document }) {
  const events = [
    { label: 'Documento criado', actor: doc.createdBy, date: doc.createdAt },
    { label: 'Metadados sincronizados com a API', actor: 'Sistema', date: doc.updatedAt },
  ];
  return <div style={{ display: 'flex', flexDirection: 'column' }}>{events.map((ev, i) => <div key={i} style={{ display: 'flex', gap: 14 }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', border: '2px solid white', outline: '1.5px solid #6366F1', marginTop: 4 }} />{i < events.length - 1 && <div style={{ width: 1, flex: 1, background: '#E2E8F0', minHeight: 20, marginTop: 2 }} />}</div><div style={{ paddingBottom: i < events.length - 1 ? 16 : 0 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{ev.label}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>{ev.actor} - {formatDate(ev.date)}</p></div></div>)}</div>;
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError('');
    try { setDoc(await getDocument(id)); }
    catch (err) { setError(getApiErrorMessage(err, 'Nao foi possivel carregar o documento.')); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [id]);

  async function withAction(action: () => Promise<void>) {
    setSaving(true);
    setError('');
    try { await action(); await load(); }
    catch (err) { setError(getApiErrorMessage(err, 'Nao foi possivel concluir a acao.')); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}><ModuleStateView state="loading" moduleName="Documento" /></div>;
  if (!doc) return <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}><ModuleStateView state="error" moduleName="Documento" errorMessage={error || `Documento com ID "${id}" nao encontrado.`} /></div>;

  const statusCfg = STATUS_CONFIG[doc.status];
  const visibilityCfg = VISIBILITY_CONFIG[doc.visibility];
  const fileTypeCfg = FILE_TYPE_CONFIG[doc.fileType];
  const metaRowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.05)' };

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }} data-testid="document-detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}><Link to="/documents" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Documentos</Link><ChevronRight size={13} color="#94A3B8" /><span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span></div>
      {error && <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}><h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>{doc.title}</h1><span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: statusCfg.color, background: statusCfg.bg }}>{statusCfg.label}</span><span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: visibilityCfg.color, background: visibilityCfg.bg }}>{visibilityCfg.label}</span></div>{doc.description && <p style={{ margin: 0, fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>{doc.description}</p>}</div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}><button disabled={saving} onClick={() => navigate(`/documents/${doc.id}?edit=true`)} style={actionButton()}><Edit size={14} />Editar</button><button disabled={saving} onClick={() => void withAction(() => downloadDocument(doc.id, doc.fileName))} style={actionButton()}><Download size={14} />Download</button>{doc.status === 'ativo' && <button disabled={saving} onClick={() => void withAction(async () => { await archiveDocument(doc.id); })} style={actionButton()}><Archive size={14} />Arquivar</button>}<button disabled={saving} onClick={() => { if (window.confirm('Confirmar exclusao deste documento?')) void withAction(async () => { await deleteDocument(doc.id); navigate('/documents'); }); }} style={dangerButton()}><Trash2 size={14} />Excluir</button></div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 65%', maxWidth: '65%' }}><div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20, minHeight: 480, display: 'flex', padding: 32 }}><Preview doc={doc} /></div><div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}><h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>Historico de Atividades</h3><ActivityTimeline doc={doc} /></div></div>
        <div style={{ flex: '0 0 35%', maxWidth: '35%', position: 'sticky', top: 24 }}><div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}><h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>Informacoes</h3><MetaRow style={metaRowStyle} label="Categoria"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: doc.categoryColor, background: `${doc.categoryColor}18`, alignSelf: 'flex-start' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: doc.categoryColor }} />{doc.categoryName}</span></MetaRow><MetaRow style={metaRowStyle} label="Visibilidade"><Badge cfg={visibilityCfg} /></MetaRow><MetaRow style={metaRowStyle} label="Tipo de arquivo"><Badge cfg={fileTypeCfg} /></MetaRow><MetaRow style={metaRowStyle} label="Tamanho"><b style={{ fontSize: 13 }}>{doc.fileSizeFormatted}</b></MetaRow><MetaRow style={metaRowStyle} label="Criado por"><span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>{doc.createdByAvatar}</span>{doc.createdBy}</span></MetaRow><MetaRow style={metaRowStyle} label="Criado em"><span style={{ fontSize: 13 }}>{formatDate(doc.createdAt)}</span></MetaRow><MetaRow style={metaRowStyle} label="Atualizado em"><span style={{ fontSize: 13 }}>{formatDate(doc.updatedAt)}</span></MetaRow>{(doc.unitName || doc.clientName || doc.userName) && <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16, marginBottom: 16 }}><h4 style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 12px 0' }}>Vinculos</h4>{doc.unitName && <Linked icon={<Building2 size={13} color="#94A3B8" />} label={doc.unitName} />}{doc.clientName && <Linked icon={<User size={13} color="#94A3B8" />} label={doc.clientName} />}{doc.userName && <Linked icon={<User size={13} color="#94A3B8" />} label={doc.userName} />}</div>}{doc.tags?.length ? <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>{doc.tags.map(tag => <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EEF2FF', color: '#6366F1', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 500, marginRight: 6 }}><Tag size={9} />{tag}</span>)}</div> : null}</div></div>
      </div>
    </div>
  );
}

function actionButton(): React.CSSProperties { return { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer' }; }
function dangerButton(): React.CSSProperties { return { ...actionButton(), border: '1.5px solid rgba(239,68,68,0.2)', background: '#FEF2F2', color: '#EF4444' }; }
function Badge({ cfg }: { cfg: { label: string; color: string; bg: string } }) { return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, alignSelf: 'flex-start' }}>{cfg.label}</span>; }
function MetaRow({ label, children, style }: { label: string; children: React.ReactNode; style: React.CSSProperties }) { return <div style={style}><span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>{children}</div>; }
function Linked({ icon, label }: { icon: React.ReactNode; label: string }) { return <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><span>{icon}</span><span style={{ fontSize: 13, color: '#0F172A' }}>{label}</span></div>; }
