import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  MoreVertical,
  AlertTriangle,
  X,
  CheckCircle,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  Mail,
  Phone,
  Link2,
  ToggleLeft,
  ListChecks,
  Paperclip,
  Image,
  ArrowLeft,
  Columns,
  Eye,
} from 'lucide-react';
import {
  mockClientFields,
  mockClientSections,
  mockClientGroups,
  mockClientImpact,
} from '../../data/formBuilderMockData';
import type { FormField, FormSection, FormGroup } from '../../../types/formBuilder';
import { FIELD_TYPE_DEFINITIONS } from '../../../types/formBuilder';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Type, AlignLeft, Hash, DollarSign, Calendar, Clock, Mail, Phone,
  Link2, ToggleLeft, ChevronDown, ListChecks, Paperclip, Image,
};

function FieldTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === type);
  const iconName = def?.icon ?? 'Type';
  const Icon = ICON_MAP[iconName] ?? Type;

  const colorMap: Record<string, string> = {
    text: '#6366f1', textarea: '#8b5cf6', number: '#0ea5e9', currency: '#10b981',
    date: '#f59e0b', datetime: '#f97316', email: '#6366f1', phone: '#0ea5e9',
    url: '#8b5cf6', checkbox: '#10b981', select: '#f59e0b', multiselect: '#ec4899',
    file: '#6b7280', image: '#ec4899',
  };

  return <Icon size={size} color={colorMap[type] ?? '#6366f1'} />;
}

function fieldTypeLabel(type: string): string {
  return FIELD_TYPE_DEFINITIONS.find((d) => d.type === type)?.label ?? type;
}

// ---------------------------------------------------------------------------
// Impact Modal (Tela 10)
// ---------------------------------------------------------------------------

interface ImpactModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

function ImpactModal({ onCancel, onConfirm }: ImpactModalProps) {
  const impact = mockClientImpact;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '600px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={24} color="#d97706" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              Impacto das Alterações
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
              Antes de publicar, revise o impacto que estas alterações terão no sistema.
              Esta ação não pode ser desfeita automaticamente.
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              borderRadius: '6px', color: '#94a3b8', flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats cards */}
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
          {[
            { label: 'Entidades afetadas', value: impact.affectedEntities, color: '#6366f1' },
            { label: 'Formulários afetados', value: impact.affectedForms, color: '#0ea5e9' },
            { label: 'Usuários impactados', value: impact.impactedUsers, color: '#f59e0b' },
            { label: 'Registros impactados', value: impact.impactedRecords.toLocaleString('pt-BR'), color: '#ef4444' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#f8fafc', borderRadius: '10px', padding: '12px',
              border: '1px solid #e2e8f0', textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Breaking changes */}
        {impact.breakingChanges.length > 0 && (
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Alterações Incompatíveis (Breaking Changes)
              </div>
              {impact.breakingChanges.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < impact.breakingChanges.length - 1 ? '8px' : 0 }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>❌</span>
                  <span style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {impact.warnings.length > 0 && (
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Avisos
              </div>
              {impact.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < impact.warnings.length - 1 ? '8px' : 0 }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px',
          borderTop: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#ffffff', fontSize: '14px', fontWeight: '600', color: '#374151', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#6366f1', fontSize: '14px', fontWeight: '600', color: '#ffffff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <CheckCircle size={16} />
            Confirmar e Publicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview input renderers (Tela 05)
// ---------------------------------------------------------------------------

function PreviewField({ field }: { field: FormField }) {
  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #cbd5e1', fontSize: '13px', color: '#374151',
    background: '#ffffff', outline: 'none',
    fontFamily: 'inherit',
  };

  function renderInput() {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            readOnly
            placeholder={field.placeholder ?? ''}
            rows={3}
            style={{ ...inputBase, resize: 'none' }}
          />
        );
      case 'select':
      case 'multiselect':
        return (
          <div style={{ position: 'relative' }}>
            <select disabled style={{ ...inputBase, appearance: 'none', paddingRight: '28px', cursor: 'not-allowed', color: '#94a3b8' }}>
              <option>{field.placeholder ?? 'Selecione...'}</option>
              {(field.options ?? []).map((o) => <option key={o.id}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        );
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed' }}>
            <input type="checkbox" disabled style={{ width: '16px', height: '16px', accentColor: '#6366f1' }} />
            <span style={{ fontSize: '13px', color: '#374151' }}>{field.label}</span>
          </label>
        );
      case 'image':
        return (
          <div style={{
            border: '2px dashed #cbd5e1', borderRadius: '6px', padding: '20px',
            textAlign: 'center', background: '#f8fafc',
          }}>
            <Image size={24} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Clique ou arraste uma imagem</div>
          </div>
        );
      case 'file':
        return (
          <div style={{
            border: '2px dashed #cbd5e1', borderRadius: '6px', padding: '16px',
            textAlign: 'center', background: '#f8fafc',
          }}>
            <Paperclip size={20} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Clique ou arraste um arquivo</div>
          </div>
        );
      case 'date':
        return <input type="date" readOnly style={inputBase} />;
      case 'datetime':
        return <input type="datetime-local" readOnly style={inputBase} />;
      default:
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
            readOnly
            placeholder={field.placeholder ?? ''}
            style={inputBase}
          />
        );
    }
  }

  if (field.type === 'checkbox') {
    return (
      <div style={{ marginBottom: '14px' }}>
        {renderInput()}
        {field.helpText && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>{field.helpText}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'flex', gap: '4px', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
        {field.label}
        {field.required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {renderInput()}
      {field.helpText && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>{field.helpText}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field chip (drag source)
// ---------------------------------------------------------------------------

interface FieldChipProps {
  field: FormField;
  onDragStart: (e: React.DragEvent, fieldId: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetFieldId: string) => void;
}

function FieldChip({ field, onDragStart, isDragging, isDropTarget, onDragOver, onDrop }: FieldChipProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, field.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => onDrop(e, field.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: isDragging ? '#eef2ff' : '#ffffff',
        border: isDropTarget ? '2px solid #6366f1' : '1px solid #e2e8f0',
        borderRadius: '8px', padding: '8px 10px',
        marginBottom: '6px', cursor: 'grab', position: 'relative',
        boxShadow: hovered ? '0 2px 8px rgba(99,102,241,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      {/* Drag handle */}
      <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', color: '#94a3b8', flexShrink: 0 }}>
        <GripVertical size={14} />
      </div>

      {/* Icon */}
      <div style={{ flexShrink: 0 }}>
        <FieldTypeIcon type={field.type} size={14} />
      </div>

      {/* Labels */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {field.label}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {field.name}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {field.required && (
          <span style={{
            fontSize: '10px', fontWeight: '700', color: '#ef4444',
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '4px', padding: '1px 5px',
          }}>
            Obrigatório
          </span>
        )}
        {field.origin === 'system' && (
          <span style={{
            fontSize: '10px', fontWeight: '700', color: '#6366f1',
            background: '#eef2ff', border: '1px solid #c7d2fe',
            borderRadius: '4px', padding: '1px 5px',
          }}>
            Sistema
          </span>
        )}
      </div>

      {/* Menu */}
      {hovered && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', borderRadius: '4px', color: '#94a3b8',
              display: 'flex', alignItems: 'center',
            }}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 100,
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px', minWidth: '140px',
            }}>
              {['Editar campo', 'Mover para grupo', 'Remover do grupo', 'Excluir campo'].map((item) => (
                <button
                  key={item}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: item.startsWith('Excluir') ? '#ef4444' : '#374151',
                    borderRadius: '5px',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group block
// ---------------------------------------------------------------------------

interface GroupBlockProps {
  group: FormGroup;
  fields: FormField[];
  dragFieldId: string | null;
  dropTargetFieldId: string | null;
  dropTargetGroupId: string | null;
  onDragStart: (e: React.DragEvent, fieldId: string) => void;
  onFieldDragOver: (e: React.DragEvent, fieldId: string) => void;
  onGroupDragOver: (e: React.DragEvent, groupId: string) => void;
  onFieldDrop: (e: React.DragEvent, targetFieldId: string) => void;
  onGroupDrop: (e: React.DragEvent, targetGroupId: string) => void;
  onColumnChange: (groupId: string, cols: 1 | 2 | 3) => void;
}

function GroupBlock({
  group, fields, dragFieldId, dropTargetFieldId, dropTargetGroupId,
  onDragStart, onFieldDragOver, onGroupDragOver, onFieldDrop, onGroupDrop,
  onColumnChange,
}: GroupBlockProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cells: FormField[][] = Array.from({ length: group.columns }, () => []);
  fields.forEach((f, i) => {
    cells[i % group.columns].push(f);
  });

  return (
    <div
      style={{
        border: dropTargetGroupId === group.id ? '2px dashed #6366f1' : '2px dashed #cbd5e1',
        borderRadius: '10px', padding: '12px', marginBottom: '12px',
        background: dropTargetGroupId === group.id ? '#eef2ff' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onDragOver={(e) => { e.preventDefault(); onGroupDragOver(e, group.id); }}
      onDrop={(e) => onGroupDrop(e, group.id)}
    >
      {/* Group toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
          {group.label}
        </span>

        {/* Column switcher */}
        <div style={{
          display: 'flex', borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              onClick={() => onColumnChange(group.id, n)}
              style={{
                padding: '4px 8px', border: 'none', cursor: 'pointer', fontSize: '12px',
                fontWeight: '600', background: group.columns === n ? '#6366f1' : '#ffffff',
                color: group.columns === n ? '#ffffff' : '#64748b',
                transition: 'background 0.1s',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#94a3b8', borderRadius: '4px' }}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 100,
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px', minWidth: '130px',
            }}>
              {['Renomear grupo', 'Duplicar grupo', 'Excluir grupo'].map((item) => (
                <button
                  key={item}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: item.startsWith('Excluir') ? '#ef4444' : '#374151',
                    borderRadius: '5px',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.columns}, 1fr)`, gap: '8px' }}>
        {cells.map((cellFields, colIdx) => (
          <div
            key={colIdx}
            style={{
              minHeight: '60px',
              background: cellFields.length === 0 ? '#f8fafc' : 'transparent',
              borderRadius: '6px',
            }}
          >
            {cellFields.map((f) => (
              <FieldChip
                key={f.id}
                field={f}
                onDragStart={onDragStart}
                isDragging={dragFieldId === f.id}
                isDropTarget={dropTargetFieldId === f.id}
                onDragOver={(e) => onFieldDragOver(e, f.id)}
                onDrop={onFieldDrop}
              />
            ))}
            {cellFields.length === 0 && (
              <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Arraste um campo aqui</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add field button */}
      <button
        style={{
          marginTop: '8px', width: '100%', padding: '7px', border: '1px dashed #c7d2fe',
          borderRadius: '6px', background: 'none', cursor: 'pointer',
          fontSize: '12px', fontWeight: '600', color: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
      >
        <Plus size={13} /> Adicionar Campo
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section block
// ---------------------------------------------------------------------------

interface SectionBlockProps {
  section: FormSection;
  groups: FormGroup[];
  fields: FormField[];
  dragFieldId: string | null;
  dropTargetFieldId: string | null;
  dropTargetGroupId: string | null;
  onDragStart: (e: React.DragEvent, fieldId: string) => void;
  onFieldDragOver: (e: React.DragEvent, fieldId: string) => void;
  onGroupDragOver: (e: React.DragEvent, groupId: string) => void;
  onFieldDrop: (e: React.DragEvent, targetFieldId: string) => void;
  onGroupDrop: (e: React.DragEvent, targetGroupId: string) => void;
  onColumnChange: (groupId: string, cols: 1 | 2 | 3) => void;
  onAddGroup: (sectionId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
}

function SectionBlock({
  section, groups, fields, dragFieldId, dropTargetFieldId, dropTargetGroupId,
  onDragStart, onFieldDragOver, onGroupDragOver, onFieldDrop, onGroupDrop,
  onColumnChange, onAddGroup, onToggleCollapse,
}: SectionBlockProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(section.label);

  const sectionGroups = groups
    .filter((g) => g.sectionId === section.id)
    .sort((a, b) => a.order - b.order);

  const ungroupedFields = fields.filter(
    (f) => f.sectionId === section.id && !f.groupId,
  );

  return (
    <div style={{
      background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '16px', overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', background: '#f8fafc', borderBottom: section.collapsed ? 'none' : '1px solid #e2e8f0',
      }}>
        <GripVertical size={16} color="#cbd5e1" style={{ cursor: 'grab', flexShrink: 0 }} />

        <button
          onClick={() => onToggleCollapse(section.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b', flexShrink: 0 }}
        >
          {section.collapsed
            ? <ChevronRight size={16} />
            : <ChevronDown size={16} />
          }
        </button>

        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false); }}
            style={{
              flex: 1, fontSize: '15px', fontWeight: '700', color: '#0f172a',
              border: '1px solid #6366f1', borderRadius: '6px', padding: '3px 8px',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            style={{
              flex: 1, fontSize: '15px', fontWeight: '700', color: '#0f172a',
              cursor: 'text',
            }}
            title="Clique para editar"
          >
            {name}
          </span>
        )}

        {section.description && !editingName && (
          <span style={{ fontSize: '12px', color: '#94a3b8', flex: 1 }}>{section.description}</span>
        )}

        <button
          onClick={() => onAddGroup(section.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 10px', border: '1px solid #c7d2fe', borderRadius: '6px',
            background: '#eef2ff', color: '#6366f1', fontSize: '12px', fontWeight: '600',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus size={12} /> Novo Grupo
        </button>

        {/* Section menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 200,
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px', minWidth: '150px',
            }}>
              {['Renomear seção', 'Duplicar seção', 'Excluir seção'].map((item) => (
                <button
                  key={item}
                  onClick={() => { setMenuOpen(false); if (item === 'Renomear seção') setEditingName(true); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: item.startsWith('Excluir') ? '#ef4444' : '#374151',
                    borderRadius: '5px',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section body */}
      {!section.collapsed && (
        <div style={{ padding: '16px' }}>
          {sectionGroups.map((group) => (
            <GroupBlock
              key={group.id}
              group={group}
              fields={fields.filter((f) => f.groupId === group.id).sort((a, b) => a.order - b.order)}
              dragFieldId={dragFieldId}
              dropTargetFieldId={dropTargetFieldId}
              dropTargetGroupId={dropTargetGroupId}
              onDragStart={onDragStart}
              onFieldDragOver={onFieldDragOver}
              onGroupDragOver={onGroupDragOver}
              onFieldDrop={onFieldDrop}
              onGroupDrop={onGroupDrop}
              onColumnChange={onColumnChange}
            />
          ))}

          {/* Ungrouped fields */}
          {ungroupedFields.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Campos sem grupo
              </div>
              {ungroupedFields.map((f) => (
                <FieldChip
                  key={f.id}
                  field={f}
                  onDragStart={onDragStart}
                  isDragging={dragFieldId === f.id}
                  isDropTarget={dropTargetFieldId === f.id}
                  onDragOver={(e) => onFieldDragOver(e, f.id)}
                  onDrop={onFieldDrop}
                />
              ))}
            </div>
          )}

          {sectionGroups.length === 0 && ungroupedFields.length === 0 && (
            <div style={{
              padding: '24px', textAlign: 'center',
              border: '2px dashed #e2e8f0', borderRadius: '10px', color: '#94a3b8', fontSize: '13px',
            }}>
              Seção vazia. Adicione um grupo ou arraste campos aqui.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Preview panel (Tela 05)
// ---------------------------------------------------------------------------

interface LivePreviewProps {
  sections: FormSection[];
  groups: FormGroup[];
  fields: FormField[];
}

function LivePreview({ sections, groups, fields }: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');

  const deviceWidths: Record<DeviceMode, string> = {
    desktop: '100%',
    tablet: '600px',
    mobile: '375px',
  };

  const deviceIcons: { mode: DeviceMode; Icon: typeof Monitor; label: string }[] = [
    { mode: 'desktop', Icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', Icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', Icon: Smartphone, label: 'Mobile' },
  ];

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9',
    }}>
      {/* Device switcher */}
      <div style={{
        padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <Eye size={14} color="#6366f1" />
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pré-visualização ao vivo
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden',
        }}>
          {deviceIcons.map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDevice(mode)}
              title={label}
              style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer',
                background: device === mode ? '#6366f1' : '#ffffff',
                color: device === mode ? '#ffffff' : '#64748b',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', transition: 'background 0.1s',
              }}
            >
              <Icon size={14} />
              <span style={{ display: device === 'desktop' ? 'inline' : 'none' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview scroll area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: deviceWidths[device], maxWidth: '100%',
          background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden',
          transition: 'width 0.3s',
        }}>
          {/* Form header */}
          <div style={{
            padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>Formulário de Clientes</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Preencha todas as informações necessárias</div>
          </div>

          {/* Form body */}
          <div style={{ padding: '20px 24px' }}>
            {sortedSections.map((section) => {
              const sectionGroups = groups
                .filter((g) => g.sectionId === section.id)
                .sort((a, b) => a.order - b.order);
              const sectionFields = fields.filter((f) => f.sectionId === section.id);

              return (
                <div key={section.id} style={{ marginBottom: '28px' }}>
                  {/* Section heading */}
                  <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f1f5f9' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{section.label}</div>
                    {section.description && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{section.description}</div>
                    )}
                  </div>

                  {/* Groups */}
                  {sectionGroups.map((group) => {
                    const groupFields = sectionFields
                      .filter((f) => f.groupId === group.id)
                      .sort((a, b) => a.order - b.order);
                    return (
                      <div
                        key={group.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${device === 'mobile' ? 1 : group.columns}, 1fr)`,
                          gap: '12px', marginBottom: '12px',
                        }}
                      >
                        {groupFields.map((f) => <PreviewField key={f.id} field={f} />)}
                      </div>
                    );
                  })}

                  {/* Ungrouped fields */}
                  {sectionFields
                    .filter((f) => !f.groupId)
                    .sort((a, b) => a.order - b.order)
                    .map((f) => <PreviewField key={f.id} field={f} />)
                  }
                </div>
              );
            })}

            {/* Submit button */}
            <div style={{ marginTop: '8px' }}>
              <button style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                background: '#6366f1', color: '#ffffff', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer',
              }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FormOrganizer() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  // State
  const [sections, setSections] = useState<FormSection[]>(mockClientSections);
  const [groups, setGroups] = useState<FormGroup[]>(mockClientGroups);
  const [fields, setFields] = useState<FormField[]>(mockClientFields);
  const [dragFieldId, setDragFieldId] = useState<string | null>(null);
  const [dropTargetFieldId, setDropTargetFieldId] = useState<string | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const entityName = 'Clientes';

  // Unassigned fields (no groupId and no sectionId, or explicitly unassigned)
  const unassignedFields = fields.filter((f) => !f.sectionId);

  // ---------------------------------------------------------------------------
  // DnD handlers
  // ---------------------------------------------------------------------------

  const handleDragStart = useCallback((e: React.DragEvent, fieldId: string) => {
    setDragFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('fieldId', fieldId);
  }, []);

  const handleFieldDragOver = useCallback((e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    setDropTargetFieldId(fieldId);
    setDropTargetGroupId(null);
  }, []);

  const handleGroupDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    setDropTargetGroupId(groupId);
    setDropTargetFieldId(null);
  }, []);

  const handleFieldDrop = useCallback((e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('fieldId') || dragFieldId;
    if (!sourceId || sourceId === targetFieldId) {
      setDragFieldId(null); setDropTargetFieldId(null); setDropTargetGroupId(null);
      return;
    }
    setFields((prev) => {
      const sourceField = prev.find((f) => f.id === sourceId);
      const targetField = prev.find((f) => f.id === targetFieldId);
      if (!sourceField || !targetField) return prev;
      return prev.map((f) => {
        if (f.id === sourceId) {
          return { ...f, sectionId: targetField.sectionId, groupId: targetField.groupId, order: targetField.order - 0.5 };
        }
        return f;
      });
    });
    setDragFieldId(null); setDropTargetFieldId(null); setDropTargetGroupId(null);
  }, [dragFieldId]);

  const handleGroupDrop = useCallback((e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('fieldId') || dragFieldId;
    if (!sourceId) {
      setDragFieldId(null); setDropTargetFieldId(null); setDropTargetGroupId(null);
      return;
    }
    const targetGroup = groups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;
    setFields((prev) => prev.map((f) => {
      if (f.id === sourceId) {
        const groupFields = prev.filter((gf) => gf.groupId === targetGroupId);
        return { ...f, sectionId: targetGroup.sectionId, groupId: targetGroupId, order: groupFields.length + 1 };
      }
      return f;
    }));
    setDragFieldId(null); setDropTargetFieldId(null); setDropTargetGroupId(null);
  }, [dragFieldId, groups]);

  const handlePaletteDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('fieldId') || dragFieldId;
    if (!sourceId) return;
    setFields((prev) => prev.map((f) => {
      if (f.id === sourceId) return { ...f, sectionId: undefined, groupId: undefined };
      return f;
    }));
    setDragFieldId(null); setDropTargetFieldId(null); setDropTargetGroupId(null);
  }, [dragFieldId]);

  const handleDragEnd = useCallback(() => {
    setDragFieldId(null); setDropTargetFieldId(null); setDropTargetGroupId(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Other handlers
  // ---------------------------------------------------------------------------

  const handleColumnChange = useCallback((groupId: string, cols: 1 | 2 | 3) => {
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, columns: cols } : g));
  }, []);

  const handleAddGroup = useCallback((sectionId: string) => {
    const newGroup: FormGroup = {
      id: `group-${Date.now()}`,
      entityId: 'entity-clients',
      sectionId,
      label: 'Novo Grupo',
      columns: 1,
      order: groups.filter((g) => g.sectionId === sectionId).length + 1,
    };
    setGroups((prev) => [...prev, newGroup]);
  }, [groups]);

  const handleToggleCollapse = useCallback((sectionId: string) => {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s));
  }, []);

  const handleAddSection = useCallback(() => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      entityId: 'entity-clients',
      label: 'Nova Seção',
      description: '',
      order: sections.length + 1,
      collapsed: false,
    };
    setSections((prev) => [...prev, newSection]);
  }, [sections]);

  const handleSaveDraft = useCallback(() => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }, []);

  const handlePublishConfirm = useCallback(() => {
    setImpactModalOpen(false);
    // In a real app: trigger publish API
  }, []);

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      onDragEnd={handleDragEnd}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* ---- HEADER ---- */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexShrink: 0,
      }}>
        {/* Breadcrumb */}
        <div style={{ paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
          <Link to="/configuracoes" style={{ color: '#94a3b8', textDecoration: 'none' }}>Configurações</Link>
          <span>/</span>
          <Link to="/configuracoes/form-builder" style={{ color: '#94a3b8', textDecoration: 'none' }}>Form Builder</Link>
          <span>/</span>
          <Link to={`/configuracoes/form-builder/${entityId}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{entityName}</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: '600' }}>Organizar</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '10px', paddingBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                Organizar Formulário
              </h1>
              <span style={{
                padding: '3px 10px', borderRadius: '20px',
                background: '#eef2ff', color: '#6366f1',
                fontSize: '12px', fontWeight: '700',
                border: '1px solid #c7d2fe',
              }}>
                {entityName}
              </span>
            </div>
            <Link
              to={`/configuracoes/form-builder/${entityId}`}
              style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
            >
              <ArrowLeft size={13} /> Voltar para Campos
            </Link>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {savedSuccess && (
              <span style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Rascunho salvo
              </span>
            )}
            <button
              onClick={handleSaveDraft}
              style={{
                padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: '#ffffff', fontSize: '14px', fontWeight: '600', color: '#374151', cursor: 'pointer',
              }}
            >
              Salvar rascunho
            </button>
            <button
              onClick={() => setImpactModalOpen(true)}
              style={{
                padding: '9px 18px', borderRadius: '8px', border: 'none',
                background: '#6366f1', fontSize: '14px', fontWeight: '600', color: '#ffffff', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              }}
            >
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* ---- BODY: two panels ---- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ---- LEFT: Available fields palette (collapsible sidebar) ---- */}
        <div style={{
          width: paletteOpen ? '220px' : '40px',
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s',
          overflow: 'hidden',
        }}>
          {/* Palette header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
          }}>
            <button
              onClick={() => setPaletteOpen(!paletteOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b', flexShrink: 0 }}
              title={paletteOpen ? 'Recolher paleta' : 'Expandir paleta'}
            >
              <Columns size={16} />
            </button>
            {paletteOpen && (
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                Campos disponíveis
              </span>
            )}
          </div>

          {paletteOpen && (
            <div
              style={{ flex: 1, overflowY: 'auto', padding: '10px' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handlePaletteDrop}
            >
              {unassignedFields.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px 8px', lineHeight: 1.5 }}>
                  Todos os campos estão alocados no formulário
                </div>
              ) : (
                unassignedFields.map((f) => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, f.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '7px 8px', borderRadius: '7px', marginBottom: '4px',
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      cursor: 'grab', fontSize: '12px', color: '#374151',
                      opacity: dragFieldId === f.id ? 0.4 : 1,
                    }}
                  >
                    <FieldTypeIcon type={f.type} size={12} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{fieldTypeLabel(f.type)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ---- CENTER: Canvas (60% of remaining space) ---- */}
        <div style={{
          flex: '0 0 60%',
          overflowY: 'auto',
          padding: '24px',
          // Dot grid background
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#f8fafc',
        }}>
          {/* New section button */}
          <button
            onClick={handleAddSection}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              border: '1px dashed #6366f1', background: '#ffffff',
              color: '#6366f1', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <Plus size={14} /> Nova Seção +
          </button>

          {/* Sections */}
          {sortedSections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              groups={groups.filter((g) => g.sectionId === section.id)}
              fields={fields}
              dragFieldId={dragFieldId}
              dropTargetFieldId={dropTargetFieldId}
              dropTargetGroupId={dropTargetGroupId}
              onDragStart={handleDragStart}
              onFieldDragOver={handleFieldDragOver}
              onGroupDragOver={handleGroupDragOver}
              onFieldDrop={handleFieldDrop}
              onGroupDrop={handleGroupDrop}
              onColumnChange={handleColumnChange}
              onAddGroup={handleAddGroup}
              onToggleCollapse={handleToggleCollapse}
            />
          ))}
        </div>

        {/* ---- RIGHT: Live preview (40%) ---- */}
        <div style={{ flex: '0 0 40%', borderLeft: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <LivePreview sections={sections} groups={groups} fields={fields} />
        </div>
      </div>

      {/* ---- IMPACT MODAL ---- */}
      {impactModalOpen && (
        <ImpactModal
          onCancel={() => setImpactModalOpen(false)}
          onConfirm={handlePublishConfirm}
        />
      )}
    </div>
  );
}

export default FormOrganizer;
