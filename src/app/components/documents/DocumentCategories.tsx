import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  Tag, Plus, Edit, Trash2, ChevronLeft, X, Check,
  Settings, Users, DollarSign, Scale, GraduationCap, Megaphone,
  FolderOpen,
} from 'lucide-react';
import { mockDocumentCategories } from '../../data/documentMockData';
import type { DocumentCategory } from '../../../types/document';
import { DynamicTableRenderer } from '../../../shared/components/DynamicTableRenderer';
import type { ColumnDef } from '../../../shared/components/DynamicTableRenderer';

// ─── Icon map (subset of Lucide icons used in categories) ────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  Settings:      <Settings size={18} />,
  Megaphone:     <Megaphone size={18} />,
  DollarSign:    <DollarSign size={18} />,
  Users:         <Users size={18} />,
  Scale:         <Scale size={18} />,
  GraduationCap: <GraduationCap size={18} />,
  FolderOpen:    <FolderOpen size={18} />,
  Tag:           <Tag size={18} />,
};

// ─── Preset colors ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#8B5CF6', '#3B82F6', '#EF4444', '#64748B',
];

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface CategoryModalProps {
  open: boolean;
  editing: DocumentCategory | null;
  categories: DocumentCategory[];
  onClose: () => void;
  onSave: (data: Partial<DocumentCategory>) => void;
}

function CategoryModal({ open, editing, categories, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [parentId, setParentId] = useState(editing?.parentId ?? '');
  const [color, setColor] = useState(editing?.color ?? PRESET_COLORS[0]);
  const [active, setActive] = useState(editing?.active ?? true);

  React.useEffect(() => {
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    background: '#F8FAFC',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={16} style={{ color: '#6366F1' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {editing ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Nome */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Nome <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome da categoria"
                required
                style={inputStyle}
              />
            </div>

            {/* Descrição */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Descrição
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva o propósito desta categoria..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Categoria Pai */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Categoria Pai
              </label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Sem categoria pai</option>
                {categories
                  .filter(c => !editing || c.id !== editing.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            {/* Cor */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Cor
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c,
                      border: color === c ? '3px solid #0F172A' : '2px solid transparent',
                      cursor: 'pointer',
                      outline: color === c ? `2px solid ${c}` : 'none',
                      outlineOffset: '2px',
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  title="Cor personalizada"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid rgba(0,0,0,0.12)',
                    padding: '0',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
              </div>
            </div>

            {/* Ativa toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Categoria Ativa</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Categorias inativas não aparecem nas seleções</div>
              </div>
              <button
                type="button"
                onClick={() => setActive(v => !v)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '999px',
                  border: 'none',
                  background: active ? '#6366F1' : '#E2E8F0',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: active ? '23px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Modal footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '16px 24px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              background: '#F8FAFC',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.12)',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <Check size={14} />
              Salvar Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentCategories() {
  const [categories, setCategories] = useState<DocumentCategory[]>(() => [...mockDocumentCategories]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(cat: DocumentCategory) {
    setEditingCategory(cat);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditingCategory(null);
  }

  function handleSave(data: Partial<DocumentCategory>) {
    const now = new Date().toISOString();
    if (editingCategory) {
      setCategories(prev =>
        prev.map(c =>
          c.id === editingCategory.id ? { ...c, ...data, updatedAt: now } : c
        )
      );
    } else {
      const newCat: DocumentCategory = {
        id: `cat-${Date.now()}`,
        name: data.name ?? '',
        description: data.description,
        parentId: data.parentId,
        color: data.color ?? PRESET_COLORS[0],
        icon: 'FolderOpen',
        active: data.active ?? true,
        documentCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      setCategories(prev => [newCat, ...prev]);
    }
    handleClose();
  }

  function handleToggleActive(id: string) {
    setCategories(prev =>
      prev.map(c =>
        c.id === id ? { ...c, active: !c.active, updatedAt: new Date().toISOString() } : c
      )
    );
  }

  function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    if (!window.confirm(`Confirmar exclusão da categoria "${cat.name}"?`)) return;
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  // ── Table setup ────────────────────────────────────────────────────────────

  const statusBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
    true:  { label: 'Ativo',   color: '#10B981', bg: '#ECFDF5' },
    false: { label: 'Inativo', color: '#94A3B8', bg: '#F1F5F9' },
  };

  const columns: ColumnDef[] = [
    {
      key: 'name',
      label: 'Nome',
      type: 'text',
      sortable: true,
      width: '160px',
      render: (_value, row) => {
        const cat = row as unknown as DocumentCategory;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `${cat.color}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: cat.color,
              }}
            >
              {ICON_MAP[cat.icon] ?? <Tag size={14} />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{cat.name}</span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: 'Descrição',
      type: 'text',
      width: '220px',
    },
    {
      key: 'active',
      label: 'Status',
      type: 'badge',
      width: '90px',
      render: (value) => {
        const key = String(value);
        const cfg = statusBadgeConfig[key] ?? statusBadgeConfig.false;
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              background: cfg.bg,
              color: cfg.color,
              whiteSpace: 'nowrap',
            }}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'documentCount',
      label: 'Qtd Documentos',
      type: 'number',
      sortable: true,
      width: '130px',
    },
    {
      key: 'createdAt',
      label: 'Criado em',
      type: 'date',
      sortable: true,
      width: '110px',
    },
  ];

  const tableActions = [
    {
      label: 'Editar',
      icon: <Edit size={14} />,
      onClick: (row: Record<string, unknown>) => openEdit(row as unknown as DocumentCategory),
    },
    {
      label: 'Ativar',
      icon: <Check size={14} />,
      onClick: (row: Record<string, unknown>) => handleToggleActive(String(row.id)),
      showCondition: (row: Record<string, unknown>) => !row.active,
    },
    {
      label: 'Desativar',
      icon: <X size={14} />,
      onClick: (row: Record<string, unknown>) => handleToggleActive(String(row.id)),
      showCondition: (row: Record<string, unknown>) => Boolean(row.active),
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={14} />,
      onClick: (row: Record<string, unknown>) => handleDelete(String(row.id)),
      variant: 'danger' as const,
    },
  ];

  const tableData = categories as unknown as Record<string, unknown>[];

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
          <Link to="/documents" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            Documentos
          </Link>
          <span>/</span>
          <span style={{ color: '#6366F1', fontWeight: 600 }}>Categorias</span>
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
                background: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={22} style={{ color: '#6366F1' }} />
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
                Categorias de Documentos
              </h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                Organize e classifique os documentos da rede
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/documents"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748B',
                background: 'transparent',
                textDecoration: 'none',
              }}
            >
              <ChevronLeft size={14} />
              Voltar
            </Link>
            <button
              onClick={openCreate}
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
              Nova Categoria
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Grid (visual cards) ───────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {categories.map(cat => (
          <div
            key={cat.id}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '18px 20px',
              border: `1px solid ${cat.active ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              opacity: cat.active ? 1 : 0.65,
            }}
          >
            {/* Category icon circle */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `${cat.color}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: cat.color,
              }}
            >
              {ICON_MAP[cat.icon] ?? <Tag size={20} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0F172A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name}
                </span>
                {/* Edit button */}
                <button
                  onClick={() => openEdit(cat)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '7px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    flexShrink: 0,
                  }}
                >
                  <Edit size={12} />
                </button>
              </div>

              {cat.description && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#64748B',
                    margin: '0 0 8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {cat.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: `${cat.color}1A`,
                    color: cat.color,
                  }}
                >
                  {cat.documentCount} doc{cat.documentCount !== 1 ? 's' : ''}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: cat.active ? '#ECFDF5' : '#F1F5F9',
                    color: cat.active ? '#10B981' : '#94A3B8',
                  }}
                >
                  {cat.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Table ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '12px' }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#0F172A',
            margin: '0 0 12px',
            letterSpacing: '-0.01em',
          }}
        >
          Todas as Categorias
        </h2>
        <DynamicTableRenderer
          columns={columns}
          data={tableData}
          keyField="id"
          emptyMessage="Nenhuma categoria cadastrada."
          actions={tableActions}
        />
      </div>

      <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8', textAlign: 'right' }}>
        {categories.length} categoria{categories.length !== 1 ? 's' : ''} no total
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <CategoryModal
        open={modalOpen}
        editing={editingCategory}
        categories={categories}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
