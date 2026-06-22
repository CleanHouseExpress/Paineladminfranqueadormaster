import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CheckCircle, Circle, MoreHorizontal, ChevronUp, ChevronDown, Search,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'boolean' | 'date' | 'number' | 'currency' | 'avatar' | 'actions';
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  badgeConfig?: Record<string, { label: string; color: string; bg: string }>;
}

export interface DynamicTableRendererProps {
  columns?: ColumnDef[];
  data?: Record<string, unknown>[];
  schema?: ColumnDef[];
  rows?: Record<string, unknown>[];
  keyField?: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyLabel?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: Record<string, unknown>) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (row: Record<string, unknown>) => void;
    variant?: 'default' | 'danger';
    showCondition?: (row: Record<string, unknown>) => boolean;
  }> | ((row: Record<string, unknown>) => React.ReactNode);
  toolbar?: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value) return '—';
  try {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(value);
  }
}

function formatRelative(value: unknown): string {
  if (!value) return '';
  try {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  } catch {
    return '';
  }
}

function formatCurrency(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function formatNumber(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('pt-BR').format(n);
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 42%)`;
}

function getInitials(value: unknown): string {
  if (!value) return '?';
  const parts = String(value).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Cell Renderers ───────────────────────────────────────────────────────────

function CellContent({ col, value, row }: { col: ColumnDef; value: unknown; row: Record<string, unknown> }) {
  if (col.render) {
    return <>{col.render(value, row)}</>;
  }

  switch (col.type) {
    case 'badge': {
      if (!value) return <span style={{ color: '#94A3B8' }}>—</span>;
      const cfg = col.badgeConfig?.[String(value)];
      if (cfg) {
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
      }
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#F1F5F9',
            color: '#64748B',
          }}
        >
          {String(value)}
        </span>
      );
    }

    case 'boolean': {
      const yes = value === true || value === 'true' || value === 1;
      return yes
        ? <CheckCircle size={16} style={{ color: '#16A34A' }} />
        : <Circle size={16} style={{ color: '#CBD5E1' }} />;
    }

    case 'date': {
      const [hovered, setHovered] = useState(false);
      const relative = formatRelative(value);
      return (
        <span
          title={relative}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ fontSize: '13px', color: '#374151', cursor: relative ? 'help' : 'default' }}
        >
          {hovered && relative ? relative : formatDate(value)}
        </span>
      );
    }

    case 'number':
      return (
        <span style={{ fontSize: '13px', color: '#0F172A', textAlign: 'right', display: 'block' }}>
          {formatNumber(value)}
        </span>
      );

    case 'currency':
      return (
        <span style={{ fontSize: '13px', color: '#0F172A', textAlign: 'right', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(value)}
        </span>
      );

    case 'avatar': {
      const str = String(value ?? '');
      const initials = getInitials(value);
      const bg = stringToColor(str);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: bg,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: '13px', color: '#0F172A' }}>{str}</span>
        </div>
      );
    }

    case 'text':
    default:
      return (
        <span
          style={{
            fontSize: '13px',
            color: value !== null && value !== undefined && value !== '' ? '#0F172A' : '#94A3B8',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: col.width ?? '200px',
          }}
        >
          {value !== null && value !== undefined && value !== '' ? String(value) : '—'}
        </span>
      );
  }
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

interface ActionsDropdownProps {
  row: Record<string, unknown>;
  actions: NonNullable<DynamicTableRendererProps['actions']>;
}

function ActionsDropdown({ row, actions }: ActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visible = actions.filter(a => !a.showCondition || a.showCondition(row));
  if (visible.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: 'none',
          background: open ? '#EEF2FF' : 'transparent',
          color: open ? '#6366F1' : '#94A3B8',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '34px',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '160px',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {visible.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={e => {
                e.stopPropagation();
                setOpen(false);
                action.onClick(row);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                color: action.variant === 'danger' ? '#EF4444' : '#0F172A',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  action.variant === 'danger' ? '#FEF2F2' : '#F8FAFC';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {action.icon && (
                <span style={{ flexShrink: 0, opacity: 0.7 }}>{action.icon}</span>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonRows({ cols, selectable }: { cols: number; selectable?: boolean }) {
  return (
    <>
      {[0, 1, 2].map(r => (
        <tr key={r}>
          {selectable && (
            <td style={{ padding: '10px 12px', width: '36px' }}>
              <div style={{ width: '15px', height: '15px', borderRadius: '4px', background: '#E2E8F0', animation: 'pulse 1.5s infinite' }} />
            </td>
          )}
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} style={{ padding: '10px 16px' }}>
              <div
                style={{
                  height: '13px',
                  borderRadius: '6px',
                  background: '#E2E8F0',
                  width: c === 0 ? '60%' : `${40 + Math.random() * 40}%`,
                  animation: 'dfr-pulse 1.5s ease-in-out infinite',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DynamicTableRenderer({
  columns,
  data,
  schema,
  rows,
  keyField = 'id',
  loading,
  emptyMessage,
  emptyLabel,
  emptyIcon,
  onRowClick,
  selectable,
  selectedIds = [],
  onSelectionChange,
  searchable,
  searchPlaceholder = 'Buscar...',
  actions,
  toolbar,
}: DynamicTableRendererProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const resolvedColumns = columns ?? schema ?? [];
  const resolvedData = data ?? rows ?? [];
  const resolvedEmptyMessage = emptyMessage ?? emptyLabel ?? 'Nenhum registro encontrado.';

  // Build display columns (inject actions column at end if needed)
  const displayColumns: ColumnDef[] = useMemo(() => {
    const cols = resolvedColumns.filter(c => c.type !== 'actions');
    const hasCustomActions = typeof actions === 'function' || (Array.isArray(actions) && actions.length > 0);
    if (hasCustomActions) {
      cols.push({ key: '__actions__', label: '', type: 'actions', width: '48px' });
    }
    return cols;
  }, [resolvedColumns, actions]);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return resolvedData;
    const q = search.toLowerCase();
    return resolvedData.filter(row =>
      Object.values(row).some(v =>
        v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    );
  }, [resolvedData, search]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  // Selection helpers
  const allIds = sorted.map(r => String(r[keyField] ?? ''));
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  const someSelected = allIds.some(id => selectedIds.includes(id)) && !allSelected;

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allIds])]);
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  const hasToolbar = searchable || toolbar;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.07)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Pulse keyframe injected once */}
      <style>{`
        @keyframes dfr-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      {/* Toolbar */}
      {hasToolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            background: '#F8FAFC',
          }}
        >
          {searchable && (
            <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
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
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#0F172A',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}
          {toolbar && <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {selectable && (
                <th
                  style={{
                    width: '36px',
                    padding: '10px 12px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    style={{ width: '15px', height: '15px', accentColor: '#6366F1', cursor: 'pointer' }}
                  />
                </th>
              )}
              {displayColumns.map(col => (
                <th
                  key={col.key}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    textAlign: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
                    width: col.width,
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    cursor: col.sortable ? 'pointer' : 'default',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.key === '__actions__' ? null : (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: sortKey === col.key ? '#6366F1' : '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {col.label}
                      {col.sortable && (
                        <span style={{ opacity: sortKey === col.key ? 1 : 0.35 }}>
                          {sortKey === col.key && sortDir === 'desc'
                            ? <ChevronDown size={12} />
                            : <ChevronUp size={12} />}
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows cols={displayColumns.length} selectable={selectable} />
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length + (selectable ? 1 : 0)}
                  style={{ padding: '48px 16px', textAlign: 'center' }}
                >
                  {emptyIcon && (
                    <div style={{ marginBottom: '12px', color: '#CBD5E1', display: 'flex', justifyContent: 'center' }}>
                      {emptyIcon}
                    </div>
                  )}
                  <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>{resolvedEmptyMessage}</p>
                </td>
              </tr>
            ) : (
              sorted.map((row, rowIdx) => {
                const id = String(row[keyField] ?? rowIdx);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      borderBottom: rowIdx < sorted.length - 1
                        ? '1px solid rgba(0,0,0,0.05)'
                        : undefined,
                      background: isSelected ? '#F5F3FF' : undefined,
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? '#F5F3FF' : '';
                    }}
                  >
                    {selectable && (
                      <td
                        style={{ padding: '10px 12px', width: '36px', textAlign: 'center' }}
                        onClick={e => { e.stopPropagation(); toggleRow(id); }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          style={{ width: '15px', height: '15px', accentColor: '#6366F1', cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {displayColumns.map(col => (
                      <td
                        key={col.key}
                        style={{
                          padding: '10px 16px',
                          verticalAlign: 'middle',
                          width: col.width,
                          maxWidth: col.width ?? '240px',
                          overflow: 'hidden',
                        }}
                      >
                        {col.key === '__actions__' && actions ? (
                          typeof actions === 'function'
                            ? actions(row)
                            : <ActionsDropdown row={row} actions={actions} />
                        ) : (
                          <CellContent col={col} value={row[col.key]} row={row} />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
