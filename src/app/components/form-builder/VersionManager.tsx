import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Layers,
  Star,
  Eye,
  RefreshCw,
  GitFork,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Clock,
  Archive,
  AlertTriangle,
  X,
  ArrowRight,
  LayoutList,
  Columns,
} from 'lucide-react';
import { mockClientVersions } from '../../data/formBuilderMockData';
import { FormVersion, VersionStatus } from '../../../types/formBuilder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'detail' | 'compare';

interface VersionChange {
  field: string;
  attribute: string;
  oldValue: string;
  newValue: string;
}

// ---------------------------------------------------------------------------
// Mock version changes
// ---------------------------------------------------------------------------

const VERSION_CHANGES: Record<string, VersionChange[]> = {
  'ver-clients-v33-draft': [
    {
      field: 'Canal de Aquisição',
      attribute: 'label',
      oldValue: '—',
      newValue: 'Canal de Aquisição',
    },
    {
      field: 'CNPJ',
      attribute: 'placeholder',
      oldValue: '00.000.000/0000-00',
      newValue: 'Digite o CNPJ da empresa',
    },
  ],
  'ver-clients-v32': [
    {
      field: 'Aceita Newsletter',
      attribute: 'type',
      oldValue: '—',
      newValue: 'checkbox',
    },
    {
      field: 'Limite de Crédito',
      attribute: 'validation.max',
      oldValue: '5000000',
      newValue: '10000000',
    },
    {
      field: 'Observações Internas',
      attribute: 'validation.maxLength',
      oldValue: '1000',
      newValue: '2000',
    },
  ],
  'ver-clients-v3': [
    {
      field: 'Logotipo',
      attribute: 'type',
      oldValue: '—',
      newValue: 'image',
    },
    {
      field: 'Tipo de Cliente',
      attribute: 'options',
      oldValue: '3 opções',
      newValue: '4 opções',
    },
    {
      field: 'Observações Internas',
      attribute: 'sectionId',
      oldValue: 'sec-main',
      newValue: 'sec-internal',
    },
    {
      field: 'Endereço',
      attribute: 'order',
      oldValue: '5',
      newValue: '3',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  VersionStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  published: {
    label: 'Publicado',
    color: '#065F46',
    bg: '#D1FAE5',
    icon: <CheckCircle size={12} />,
  },
  draft: {
    label: 'Rascunho',
    color: '#92400E',
    bg: '#FEF3C7',
    icon: <Clock size={12} />,
  },
  archived: {
    label: 'Arquivado',
    color: '#374151',
    bg: '#F3F4F6',
    icon: <Archive size={12} />,
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: VersionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function VersionBadge({ version }: { version: string }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 6,
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'monospace',
      }}
    >
      v{version}
    </span>
  );
}

function ChangeRow({ change, changeType }: { change: VersionChange; changeType?: 'added' | 'removed' | 'changed' | 'unchanged' }) {
  const bgMap = {
    added: '#D1FAE5',
    removed: '#FEE2E2',
    changed: '#FEF3C7',
    unchanged: 'transparent',
  };
  const bg = changeType ? bgMap[changeType] : 'transparent';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 140px 1fr auto 1fr',
        gap: 8,
        padding: '8px 12px',
        backgroundColor: bg,
        borderRadius: 6,
        alignItems: 'center',
        fontSize: 13,
      }}
    >
      <span style={{ fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {change.field}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
          padding: '1px 6px',
          borderRadius: 4,
        }}
      >
        {change.attribute}
      </span>
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 6,
          backgroundColor: '#FEE2E2',
          color: '#B91C1C',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {change.oldValue}
      </span>
      <ArrowRight size={14} color="#9CA3AF" />
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 6,
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {change.newValue}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Restore modal
// ---------------------------------------------------------------------------

function RestoreModal({
  version,
  onClose,
  onConfirm,
}: {
  version: FormVersion;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 28,
          maxWidth: 440,
          width: '100%',
          margin: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                Restaurar versão
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
                Esta ação criará um novo rascunho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6B7280' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#374151' }}>
            Tem certeza que deseja restaurar{' '}
            <strong style={{ fontFamily: 'monospace' }}>v{version.version}</strong>?
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
            <li>Um novo rascunho será criado com base nessa versão</li>
            <li>O rascunho atual <strong>não será afetado</strong></li>
            <li>A versão em produção permanece inalterada</li>
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              border: 'none',
              borderRadius: 8,
              backgroundColor: '#6366F1',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Restaurar versão
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right panel: detail view
// ---------------------------------------------------------------------------

function VersionDetail({
  version,
  diffMode,
  onToggleDiff,
}: {
  version: FormVersion;
  diffMode: boolean;
  onToggleDiff: () => void;
}) {
  const changes = VERSION_CHANGES[version.id] ?? [];

  return (
    <div>
      {/* Version header */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <VersionBadge version={version.version} />
            <StatusBadge status={version.status} />
          </div>
          <button
            onClick={onToggleDiff}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              border: `1px solid ${diffMode ? '#6366F1' : '#E5E7EB'}`,
              borderRadius: 8,
              backgroundColor: diffMode ? '#EDE9FE' : '#fff',
              color: diffMode ? '#6366F1' : '#374151',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Columns size={14} />
            Diff view
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#6B7280' }}>
          <span>
            Criado por{' '}
            <strong style={{ color: '#0F172A' }}>{version.createdBy}</strong>
          </span>
          <span>{formatDate(version.createdAt)}</span>
          {version.publishedAt && (
            <span>
              Publicado em{' '}
              <strong style={{ color: '#0F172A' }}>{formatDate(version.publishedAt)}</strong>
            </span>
          )}
        </div>

        {version.notes && (
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            {version.notes}
          </p>
        )}
      </div>

      {/* Changes list */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <LayoutList size={16} color="#6366F1" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            Alterações nesta versão
          </h3>
          <span
            style={{
              marginLeft: 'auto',
              padding: '1px 8px',
              borderRadius: 999,
              backgroundColor: '#EDE9FE',
              color: '#6366F1',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {version.changesCount} alterações
          </span>
        </div>

        {changes.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, textAlign: 'center', padding: '20px 0' }}>
            Detalhes das alterações não disponíveis para esta versão
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Column headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 140px 1fr auto 1fr',
                gap: 8,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Campo</span>
              <span>Atributo</span>
              <span>Antes</span>
              <span />
              <span>Depois</span>
            </div>
            {changes.map((change, idx) => (
              <ChangeRow key={idx} change={change} changeType="changed" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right panel: compare view
// ---------------------------------------------------------------------------

function VersionCompare({
  versionA,
  versionB,
}: {
  versionA: FormVersion;
  versionB: FormVersion;
}) {
  const changesA = VERSION_CHANGES[versionA.id] ?? [];
  const changesB = VERSION_CHANGES[versionB.id] ?? [];

  const allFields = Array.from(
    new Set([...changesA.map((c) => c.field), ...changesB.map((c) => c.field)])
  );

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      {/* Compare header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          padding: '12px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
        }}
      >
        <VersionBadge version={versionA.version} />
        <StatusBadge status={versionA.status} />
        <ChevronRight size={16} color="#9CA3AF" />
        <VersionBadge version={versionB.version} />
        <StatusBadge status={versionB.status} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { color: '#D1FAE5', textColor: '#065F46', label: 'Adicionado' },
          { color: '#FEE2E2', textColor: '#B91C1C', label: 'Removido' },
          { color: '#FEF3C7', textColor: '#92400E', label: 'Alterado' },
          { color: '#F3F4F6', textColor: '#374151', label: 'Sem mudança' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: item.textColor }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: item.color,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto' }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 1fr',
            gap: 8,
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #E5E7EB',
            marginBottom: 8,
          }}
        >
          <span>Campo</span>
          <span style={{ fontFamily: 'monospace' }}>v{versionA.version}</span>
          <span style={{ fontFamily: 'monospace' }}>v{versionB.version}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {allFields.map((field) => {
            const inA = changesA.find((c) => c.field === field);
            const inB = changesB.find((c) => c.field === field);

            let changeType: 'added' | 'removed' | 'changed' | 'unchanged' = 'unchanged';
            if (inA && !inB) changeType = 'removed';
            else if (!inA && inB) changeType = 'added';
            else if (inA && inB && inA.newValue !== inB.newValue) changeType = 'changed';

            const bgMap = {
              added: '#D1FAE5',
              removed: '#FEE2E2',
              changed: '#FEF3C7',
              unchanged: 'transparent',
            };

            return (
              <div
                key={field}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 1fr',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: bgMap[changeType],
                  borderRadius: 6,
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{field}</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#374151',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {inA?.newValue ?? '—'}
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#374151',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {inB?.newValue ?? '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VersionManager() {
  const { entityId } = useParams<{ entityId: string }>();
  const entityName = 'Clientes';

  // Sort newest first
  const versions = [...mockClientVersions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const published = versions.find((v) => v.status === 'published');
  const draft = versions.find((v) => v.status === 'draft');

  const [selectedId, setSelectedId] = useState<string>(versions[0]?.id ?? '');
  const [compareId, setCompareId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<FormVersion | null>(null);
  const [diffMode, setDiffMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  const selectedVersion = versions.find((v) => v.id === selectedId);
  const compareVersion = compareId ? versions.find((v) => v.id === compareId) : null;

  function handleCompare(version: FormVersion) {
    if (compareId === version.id) {
      setCompareId(null);
      setViewMode('detail');
    } else {
      setCompareId(version.id);
      setViewMode('compare');
    }
  }

  function handleRestore(version: FormVersion) {
    setRestoreTarget(version);
  }

  function handleRestoreConfirm() {
    setRestoreTarget(null);
    // In production, trigger restore action
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 32px',
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#6B7280',
            marginBottom: 12,
          }}
        >
          <Link to="/settings" style={{ color: '#6B7280', textDecoration: 'none' }}>
            Configurações
          </Link>
          <span>/</span>
          <Link to="/settings/form-builder" style={{ color: '#6B7280', textDecoration: 'none' }}>
            Form Builder
          </Link>
          <span>/</span>
          <Link
            to={`/settings/form-builder/${entityId}`}
            style={{ color: '#6B7280', textDecoration: 'none' }}
          >
            {entityName}
          </Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>Versões</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={22} color="#6366F1" />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
              Controle de Versões
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>{entityName}</span>
              {published && <VersionBadge version={published.version} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 120px)',
          overflow: 'hidden',
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: '40%',
            minWidth: 320,
            maxWidth: 440,
            borderRight: '1px solid #E5E7EB',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Status banner */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {published && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: '#D1FAE5',
                  fontSize: 13,
                }}
              >
                <CheckCircle size={14} color="#10B981" />
                <span style={{ color: '#065F46' }}>
                  Em produção:{' '}
                  <strong style={{ fontFamily: 'monospace' }}>v{published.version}</strong>
                </span>
              </div>
            )}
            {draft && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: '#FEF3C7',
                  fontSize: 13,
                }}
              >
                <Clock size={14} color="#F59E0B" />
                <span style={{ color: '#92400E' }}>
                  Rascunho:{' '}
                  <strong style={{ fontFamily: 'monospace' }}>v{draft.version}</strong>{' '}
                  com {draft.changesCount} alterações
                </span>
              </div>
            )}
          </div>

          {/* Version list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {versions.map((version) => {
              const isSelected = version.id === selectedId;
              const isComparing = version.id === compareId;
              const isCurrent = version.status === 'published';

              return (
                <div
                  key={version.id}
                  onClick={() => {
                    setSelectedId(version.id);
                    setViewMode('detail');
                    setCompareId(null);
                  }}
                  style={{
                    marginBottom: 8,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `2px solid ${isSelected ? '#6366F1' : isComparing ? '#06B6D4' : '#E5E7EB'}`,
                    backgroundColor: isSelected ? '#EDE9FE' : isCurrent ? '#FAFFF8' : '#fff',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <VersionBadge version={version.version} />
                    <StatusBadge status={version.status} />
                    {isCurrent && (
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    )}
                    <span
                      style={{
                        marginLeft: 'auto',
                        padding: '1px 7px',
                        borderRadius: 999,
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {version.changesCount} alt.
                    </span>
                  </div>

                  {/* Meta */}
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: version.notes ? 6 : 0 }}>
                    <span>{version.createdBy}</span>
                    {' · '}
                    <span>{formatDate(version.createdAt)}</span>
                  </div>

                  {version.notes && (
                    <p
                      style={{
                        margin: '6px 0 8px',
                        fontSize: 12,
                        color: '#374151',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {version.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div
                    style={{ display: 'flex', gap: 6, marginTop: 8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setSelectedId(version.id);
                        setViewMode('detail');
                        setCompareId(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        border: '1px solid #E5E7EB',
                        borderRadius: 6,
                        backgroundColor: '#fff',
                        color: '#374151',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={12} />
                      Visualizar
                    </button>

                    {(version.status === 'archived' ||
                      (version.status === 'published' && draft)) && (
                      <button
                        onClick={() => handleRestore(version)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          border: '1px solid #6366F1',
                          borderRadius: 6,
                          backgroundColor: '#EDE9FE',
                          color: '#6366F1',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={12} />
                        Restaurar
                      </button>
                    )}

                    <button
                      onClick={() => handleCompare(version)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        border: `1px solid ${isComparing ? '#06B6D4' : '#E5E7EB'}`,
                        borderRadius: 6,
                        backgroundColor: isComparing ? '#CFFAFE' : '#fff',
                        color: isComparing ? '#0E7490' : '#374151',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <GitFork size={12} />
                      Comparar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {viewMode === 'compare' && selectedVersion && compareVersion ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <Columns size={16} color="#6366F1" />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  Comparação de versões
                </h2>
                <button
                  onClick={() => {
                    setViewMode('detail');
                    setCompareId(null);
                  }}
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                  Fechar comparação
                </button>
              </div>
              <VersionCompare versionA={selectedVersion} versionB={compareVersion} />
            </div>
          ) : selectedVersion ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <LayoutList size={16} color="#6366F1" />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  Detalhes da versão
                </h2>
              </div>
              <VersionDetail
                version={selectedVersion}
                diffMode={diffMode}
                onToggleDiff={() => setDiffMode((d) => !d)}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9CA3AF',
              }}
            >
              <Layers size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Selecione uma versão para visualizar</p>
            </div>
          )}
        </div>
      </div>

      {/* Restore modal */}
      {restoreTarget && (
        <RestoreModal
          version={restoreTarget}
          onClose={() => setRestoreTarget(null)}
          onConfirm={handleRestoreConfirm}
        />
      )}
    </div>
  );
}
