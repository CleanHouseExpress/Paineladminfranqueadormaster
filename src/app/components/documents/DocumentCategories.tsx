import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Tag, Plus, Edit, Trash2, ChevronLeft, X, Check, Settings, Users, DollarSign, Scale, GraduationCap, Megaphone, FolderOpen } from 'lucide-react';
import type { DocumentCategory } from '../../../types/document';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../../services/documentService';
import { getApiErrorMessage } from '../../../services/apiClient';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';

const ICON_MAP: Record<string, React.ReactNode> = {
  Settings: <Settings size={18} />,
  Megaphone: <Megaphone size={18} />,
  DollarSign: <DollarSign size={18} />,
  Users: <Users size={18} />,
  Scale: <Scale size={18} />,
  GraduationCap: <GraduationCap size={18} />,
  FolderOpen: <FolderOpen size={18} />,
  Tag: <Tag size={18} />,
};

const PRESET_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#EF4444', '#64748B'];

interface CategoryModalProps {
  open: boolean;
  editing: DocumentCategory | null;
  categories: DocumentCategory[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<DocumentCategory>) => void;
}

function CategoryModal({ open, editing, categories, saving, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [parentId, setParentId] = useState(editing?.parentId ?? '');
  const [color, setColor] = useState(editing?.color ?? PRESET_COLORS[0]);
  const [active, setActive] = useState(editing?.active ?? true);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setDescription(editing?.description ?? '');
      setParentId(editing?.parentId ?? '');
      setColor(editing?.color ?? PRESET_COLORS[0]);
      setActive(editing?.active ?? true);
    }
  }, [open, editing]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description, parentId: parentId || undefined, color, active });
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={16} color="#6366F1" /></div><h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2></div><button type="button" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}><X size={16} /></button></div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={label()}>Nome <span style={{ color: '#EF4444' }}>*</span></label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da categoria" required style={inputStyle} /></div>
            <div><label style={label()}>Descricao</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o proposito desta categoria..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></div>
            <div><label style={label()}>Categoria Pai</label><select value={parentId} onChange={e => setParentId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Sem categoria pai</option>{categories.filter(c => !editing || c.id !== editing.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label style={label()}>Cor local da UI</label><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{PRESET_COLORS.map(c => <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #0F172A' : '2px solid transparent', cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />)}<input type="color" value={color} onChange={e => setColor(e.target.value)} title="Cor personalizada" style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.12)', padding: 0, cursor: 'pointer', background: 'transparent' }} /></div></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Categoria Ativa</div><div style={{ fontSize: 11, color: '#94A3B8' }}>Categorias inativas nao aparecem nas selecoes</div></div><button type="button" onClick={() => setActive(v => !v)} style={{ width: 44, height: 24, borderRadius: 999, border: 'none', background: active ? '#6366F1' : '#E2E8F0', cursor: 'pointer', position: 'relative', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></button></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#F8FAFC' }}><button type="button" disabled={saving} onClick={onClose} style={secondaryButton()}>Cancelar</button><button disabled={saving} type="submit" style={primaryButton()}><Check size={14} />{saving ? 'Salvando...' : 'Salvar Categoria'}</button></div>
        </form>
      </div>
    </div>
  );
}

export function DocumentCategories() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { setCategories(await getCategories()); }
    catch (err) { setError(getApiErrorMessage(err, 'Nao foi possivel carregar categorias.')); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() { setEditingCategory(null); setModalOpen(true); }
  function openEdit(cat: DocumentCategory) { setEditingCategory(cat); setModalOpen(true); }
  function handleClose() { setModalOpen(false); setEditingCategory(null); }

  async function handleSave(data: Partial<DocumentCategory>) {
    setSaving(true);
    setError('');
    try {
      if (editingCategory) await updateCategory(editingCategory.id, { name: data.name ?? '', description: data.description, parentId: data.parentId, active: data.active });
      else await createCategory({ name: data.name ?? '', description: data.description, parentId: data.parentId, active: data.active });
      handleClose();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel salvar a categoria.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(category: DocumentCategory) {
    await handleSave({ ...category, active: !category.active });
  }

  async function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id);
    if (!cat || !window.confirm(`Confirmar exclusao da categoria "${cat.name}"?`)) return;
    setSaving(true);
    setError('');
    try { await deleteCategory(id); await load(); }
    catch (err) { setError(getApiErrorMessage(err, 'Nao foi possivel excluir a categoria.')); }
    finally { setSaving(false); }
  }

  const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = { true: { label: 'Ativo', color: '#10B981', bg: '#ECFDF5' }, false: { label: 'Inativo', color: '#94A3B8', bg: '#F1F5F9' } };
  const columns: ColumnDef[] = [
    { key: 'name', label: 'Nome', type: 'text', sortable: true, width: '160px', render: (_value, row) => { const cat = row as unknown as DocumentCategory; return <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: `${cat.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cat.color }}>{ICON_MAP[cat.icon] ?? <Tag size={14} />}</div><span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{cat.name}</span></div>; } },
    { key: 'description', label: 'Descricao', type: 'text', width: '220px' },
    { key: 'active', label: 'Status', type: 'badge', width: '90px', render: value => { const cfg = statusBadgeConfig[String(value)] ?? statusBadgeConfig.false; return <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>; } },
    { key: 'documentCount', label: 'Qtd Documentos', type: 'number', sortable: true, width: '130px' },
    { key: 'createdAt', label: 'Criado em', type: 'date', sortable: true, width: '110px' },
  ];
  const tableActions = [
    { label: 'Editar', icon: <Edit size={14} />, onClick: (row: Record<string, unknown>) => openEdit(row as unknown as DocumentCategory) },
    { label: 'Ativar', icon: <Check size={14} />, onClick: (row: Record<string, unknown>) => void handleToggleActive(row as unknown as DocumentCategory), showCondition: (row: Record<string, unknown>) => !row.active },
    { label: 'Desativar', icon: <X size={14} />, onClick: (row: Record<string, unknown>) => void handleToggleActive(row as unknown as DocumentCategory), showCondition: (row: Record<string, unknown>) => Boolean(row.active) },
    { label: 'Excluir', icon: <Trash2 size={14} />, onClick: (row: Record<string, unknown>) => void handleDelete(String(row.id)), variant: 'danger' as const },
  ];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100vh' }} data-testid="document-categories-page">
      <div style={{ marginBottom: 24 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8', marginBottom: 8 }}><Link to="/documents" style={{ color: '#94A3B8', textDecoration: 'none' }}>Documentos</Link><span>/</span><span style={{ color: '#6366F1', fontWeight: 600 }}>Categorias</span></div><div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={22} color="#6366F1" /></div><div><h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Categorias de Documentos</h1><p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>Organize e classifique os documentos da rede</p></div></div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Link to="/documents" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600, color: '#64748B', background: 'transparent', textDecoration: 'none' }}><ChevronLeft size={14} />Voltar</Link><button onClick={openCreate} disabled={saving} style={primaryButton()}><Plus size={14} />Nova Categoria</button></div></div></div>
      {error && <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {loading ? <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>Carregando categorias...</div> : <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>{categories.map(cat => <div key={cat.id} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${cat.active ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: cat.active ? 1 : 0.65 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: `${cat.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cat.color }}>{ICON_MAP[cat.icon] ?? <Tag size={20} />}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span><button onClick={() => openEdit(cat)} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}><Edit size={12} /></button></div>{cat.description && <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.description}</p>}<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${cat.color}1A`, color: cat.color }}>{cat.documentCount} doc{cat.documentCount !== 1 ? 's' : ''}</span><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cat.active ? '#ECFDF5' : '#F1F5F9', color: cat.active ? '#10B981' : '#94A3B8' }}>{cat.active ? 'Ativo' : 'Inativo'}</span></div></div></div>)}</div><div style={{ marginBottom: 12 }}><h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>Todas as Categorias</h2><DynamicTableRenderer columns={columns} data={categories as unknown as Record<string, unknown>[]} keyField="id" emptyMessage="Nenhuma categoria cadastrada." actions={tableActions} /></div><div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8', textAlign: 'right' }}>{categories.length} categoria{categories.length !== 1 ? 's' : ''} no total</div></>}
      <CategoryModal open={modalOpen} editing={editingCategory} categories={categories} saving={saving} onClose={handleClose} onSave={handleSave} />
    </div>
  );
}

function label(): React.CSSProperties { return { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }; }
function primaryButton(): React.CSSProperties { return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }; }
function secondaryButton(): React.CSSProperties { return { padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer' }; }
