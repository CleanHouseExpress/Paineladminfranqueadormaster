import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router';
import { FilePlus, ChevronRight, Upload, X, FileText, FileSpreadsheet, Image, ChevronDown, ChevronUp, Lock, User, Building2, Globe } from 'lucide-react';
import { VISIBILITY_CONFIG, FILE_TYPE_CONFIG } from '../../../types/document';
import type { Document, DocumentCategory, DocumentFileType, DocumentVisibility } from '../../../types/document';
import { createDocument, getCategories, getDocument, updateDocument } from '../../../services/documentService';
import { getApiErrorMessage } from '../../../services/apiClient';
import { unitManagementService } from '../../../services/unitManagementService';
import type { UnitOption } from '../../../types/unitManagement';

function fileTypeFromFile(file: File): DocumentFileType {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'docx';
  if (ext === 'xls' || ext === 'xlsx') return 'xlsx';
  if (ext === 'png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const VISIBILITY_OPTIONS: Array<{ value: DocumentVisibility; icon: React.ReactNode; description: string }> = [
  { value: 'interno', icon: <Lock size={15} />, description: 'Visivel apenas para usuarios internos' },
  { value: 'portal_cliente', icon: <User size={15} />, description: 'Visivel para clientes no portal' },
  { value: 'portal_franqueado', icon: <Building2 size={15} />, description: 'Visivel para franqueados no portal' },
  { value: 'publico', icon: <Globe size={15} />, description: 'Visivel para qualquer pessoa' },
];

function FilePreviewCard({ file, onRemove }: { file: File; onRemove: () => void }) {
  const type = fileTypeFromFile(file);
  const config = FILE_TYPE_CONFIG[type];
  const Icon = type === 'xlsx' ? FileSpreadsheet : type === 'png' || type === 'jpg' ? Image : FileText;

  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: config.bg, border: `1px solid ${config.color}33`, borderRadius: 12, padding: 24, minHeight: 116, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Icon size={30} color={config.color} />
        <span style={{ fontSize: 11, fontWeight: 800, color: config.color }}>{config.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{file.name}</p>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{formatFileSize(file.size)}</span>
        </div>
        <button onClick={onRemove} type="button" style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={13} color="#EF4444" /></button>
      </div>
    </div>
  );
}

export function DocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id || searchParams.get('edit') === 'true';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('interno');
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [unitId, setUnitId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [userId, setUserId] = useState('');
  const [vinculosOpen, setVinculosOpen] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [categoryItems, unitItems, document] = await Promise.all([
          getCategories(),
          unitManagementService.getUnitOptions().catch(() => [] as UnitOption[]),
          id ? getDocument(id) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setCategories(categoryItems);
        setUnits(unitItems);
        if (document) {
          setCurrentDocument(document);
          setTitle(document.title);
          setDescription(document.description ?? '');
          setCategoryId(document.categoryId ?? '');
          setVisibility(document.visibility);
          setUnitId(document.unitId ?? '');
          setCustomerId(document.clientId ?? '');
          setUserId(document.userId ?? '');
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, 'Nao foi possivel carregar o documento.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [id]);

  const selectedVisibility = VISIBILITY_OPTIONS.find(o => o.value === visibility)!;
  const selectedCategory = useMemo(() => categories.find(cat => cat.id === categoryId), [categories, categoryId]);

  const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#0F172A', outline: 'none', background: 'white', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6, display: 'block' };
  const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', marginBottom: 16 };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError('Informe o titulo do documento.'); return; }
    if (!isEdit && !file) { setError('Selecione um arquivo para enviar.'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = { title: title.trim(), description: description.trim(), categoryId, visibility, unitId, customerId, userId, file };
      const document = isEdit && id ? await updateDocument(id, payload) : await createDocument(payload);
      navigate(`/documents/${document.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel salvar o documento.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }} data-testid="document-form">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}><Link to="/documents" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>Documentos</Link><ChevronRight size={13} color="#94A3B8" /><span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{isEdit ? 'Editar Documento' : 'Novo Documento'}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FilePlus size={20} color="white" /></div><h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>{isEdit ? 'Editar Documento' : 'Novo Documento'}</h1></div>
        <div style={{ display: 'flex', gap: 10 }}><button type="button" onClick={() => navigate(-1)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button><button disabled={saving || loading} type="submit" data-testid="document-submit" style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: saving ? '#CBD5E1' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Publicar'}</button></div>
      </div>

      {error && <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {loading ? <div style={cardStyle}>Carregando documento...</div> : <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 60%', maxWidth: '60%' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 20px 0' }}>Informacoes Basicas</h2>
            <div style={{ marginBottom: 18 }}><label style={labelStyle}>Titulo <span style={{ color: '#EF4444' }}>*</span></label><input data-testid="document-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do documento..." style={{ ...inputStyle, fontSize: 16, fontWeight: 500 }} /></div>
            <div style={{ marginBottom: 18 }}><label style={labelStyle}>Descricao</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o conteudo do documento..." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} /></div>
            <div style={{ marginBottom: 18 }}><label style={labelStyle}>Categoria</label><select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Selecionar categoria...</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>{selectedCategory && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedCategory.color }} /><span style={{ fontSize: 12, color: '#64748B' }}>{selectedCategory.name}</span></div>}</div>
            <div><label style={labelStyle}>Visibilidade</label><div style={{ position: 'relative' }}><button type="button" onClick={() => setVisibilityOpen(o => !o)} style={{ width: '100%', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: VISIBILITY_CONFIG[visibility].color }}>{selectedVisibility.icon}</span><div><p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{VISIBILITY_CONFIG[visibility].label}</p><p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{selectedVisibility.description}</p></div></div><ChevronDown size={15} color="#94A3B8" /></button>{visibilityOpen && <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>{VISIBILITY_OPTIONS.map(opt => <button key={opt.value} type="button" onClick={() => { setVisibility(opt.value); setVisibilityOpen(false); }} style={{ width: '100%', padding: '10px 14px', background: visibility === opt.value ? VISIBILITY_CONFIG[opt.value].bg : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}><span style={{ color: VISIBILITY_CONFIG[opt.value].color }}>{opt.icon}</span><div><p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{VISIBILITY_CONFIG[opt.value].label}</p><p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{opt.description}</p></div></button>)}</div>}</div></div>
          </div>

          <div style={cardStyle}>
            <button type="button" onClick={() => setVinculosOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, marginBottom: vinculosOpen ? 20 : 0 }}><h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Vinculos</h2>{vinculosOpen ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}</button>
            {vinculosOpen && <div><div style={{ marginBottom: 16 }}><label style={labelStyle}>Unidade</label><select value={unitId} onChange={e => setUnitId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Todas as unidades</option>{units.map(unit => <option key={String(unit.id ?? unit.value)} value={String(unit.id ?? unit.value)}>{unit.code ? `${unit.code} - ` : ''}{unit.name ?? unit.label}</option>)}</select></div><div style={{ marginBottom: 16 }}><label style={labelStyle}>Cliente ID</label><input type="number" value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="ID do cliente quando aplicavel" style={inputStyle} /></div><div><label style={labelStyle}>Usuario ID</label><input type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="ID do usuario quando aplicavel" style={inputStyle} /></div></div>}
          </div>
        </div>

        <div style={{ flex: '0 0 40%', maxWidth: '40%' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0' }}>Arquivo</h2>
            {file ? <FilePreviewCard file={file} onRemove={() => setFile(null)} /> : currentDocument ? <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 18, background: '#F8FAFC' }}><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{currentDocument.fileName}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>{currentDocument.fileSizeFormatted}</p><p style={{ margin: '12px 0 0', fontSize: 11, color: '#94A3B8' }}>A API atual permite editar metadados. Para substituir o arquivo, envie um novo documento.</p></div> : <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] ?? null); }} style={{ border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 16, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: 'rgba(99,102,241,0.02)', textAlign: 'center' }}><Upload size={24} color="#6366F1" /><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Arraste o arquivo aqui</p><p style={{ margin: 0, fontSize: 13, color: '#6366F1', textDecoration: 'underline' }}>ou clique para selecionar</p><p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>PDF, DOCX, XLSX, PNG, JPG, WEBP ou TXT</p></div>}
            <input data-testid="document-file" ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p style={{ margin: '14px 0 0 0', fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>Tamanho maximo aceito pelo backend: 20MB. O storage e o tenant sao resolvidos pelo backend.</p>
          </div>
        </div>
      </div>}
    </form>
  );
}

