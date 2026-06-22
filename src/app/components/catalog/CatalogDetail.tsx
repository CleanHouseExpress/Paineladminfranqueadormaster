import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  Edit, Archive, RefreshCw, Trash2,
  Package, Briefcase, RefreshCw as RefreshCwIcon, GraduationCap, Star, Boxes,
  Calendar, Clock, Award, Sparkles, Lock,
} from 'lucide-react';
import { CATALOG_TYPE_CONFIG, CATALOG_STATUS_CONFIG, DEFAULT_CATALOG_LABELS } from '../../../types/catalog';
import type { CatalogItem, CatalogItemType } from '../../../types/catalog';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import {
  archiveItem, deleteItem, getItem, getLabels, reactivateItem,
} from '../../../services/catalogService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `${days} dias atrás`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 mês atrás';
  if (months < 12) return `${months} meses atrás`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 ano atrás' : `${years} anos atrás`;
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ─── Type icon map ────────────────────────────────────────────────────────────

const TYPE_ICON_MAP: Record<CatalogItemType, React.ReactNode> = {
  product:      <Package size={16} />,
  service:      <Briefcase size={16} />,
  subscription: <RefreshCwIcon size={16} />,
  course:       <GraduationCap size={16} />,
  procedure:    <Star size={16} />,
  plan:         <Star size={16} />,
  custom:       <Boxes size={16} />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'white',
      flexShrink: 0, letterSpacing: '0.5px',
    }}>
      {initials}
    </div>
  );
}

function YesNoBadge({ value, trueLabel = 'Sim', falseLabel = 'Não' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600,
      color: value ? '#10B981' : '#64748B',
      background: value ? '#ECFDF5' : '#F1F5F9',
    }}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0F172A', flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Type-specific details ────────────────────────────────────────────────────

function TypeDetails({ item }: { item: CatalogItem }) {
  const cfg = CATALOG_TYPE_CONFIG[item.type];
  const f = item.typeFields as Record<string, unknown>;

  const sectionHeader = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: cfg.color,
      }}>
        {TYPE_ICON_MAP[item.type]}
      </div>
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
        Detalhes de {cfg.label}
      </span>
    </div>
  );

  if (item.type === 'product') {
    const cost = typeof f.custo === 'number' ? f.custo : 0;
    const margin = cost > 0 && item.price > 0
      ? Math.round(((item.price - cost) / item.price) * 100)
      : null;
    return (
      <div>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <PropRow label="Controla Estoque">
            <YesNoBadge value={!!f.controlaEstoque} />
          </PropRow>
          {typeof f.estoqueMinimo === 'number' && (
            <PropRow label="Estoque Mínimo">
              {f.estoqueMinimo} <span style={{ color: '#94A3B8' }}>unidades</span>
            </PropRow>
          )}
          {typeof f.custo === 'number' && (
            <PropRow label="Custo">
              <span style={{ fontWeight: 600, color: '#0F172A' }}>R$ {formatPrice(f.custo)}</span>
            </PropRow>
          )}
          {margin !== null && (
            <PropRow label="Margem Estimada">
              <span style={{ fontWeight: 700, color: margin >= 40 ? '#10B981' : '#F59E0B', fontSize: '14px' }}>
                {margin}%
              </span>
            </PropRow>
          )}
          {f.codigoBarras && (
            <PropRow label="Código de Barras">
              <span style={{
                fontFamily: 'monospace', fontSize: '12px',
                background: '#EEF2FF', color: '#6366F1',
                padding: '2px 8px', borderRadius: '6px', fontWeight: 600,
              }}>
                {String(f.codigoBarras)}
              </span>
            </PropRow>
          )}
          {typeof f.pesoGramas === 'number' && (
            <PropRow label="Peso">
              {f.pesoGramas} <span style={{ color: '#94A3B8' }}>g</span>
            </PropRow>
          )}
          {f.dimensoes && (
            <PropRow label="Dimensões">{String(f.dimensoes)}</PropRow>
          )}
        </div>
      </div>
    );
  }

  if (item.type === 'service') {
    return (
      <div>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {typeof f.duracaoMinutos === 'number' && (
            <PropRow label="Duração">
              <span style={{ fontWeight: 600 }}>{formatDuration(f.duracaoMinutos)}</span>
            </PropRow>
          )}
          <PropRow label="Exige Profissional">
            <YesNoBadge value={!!f.exigeProfissional} />
          </PropRow>
          <PropRow label="Exige Agendamento">
            <YesNoBadge value={!!f.exigeAgenda} />
          </PropRow>
          <PropRow label="Profissional">
            {f.profissionalNecessario
              ? <span>{String(f.profissionalNecessario)}</span>
              : <span style={{ color: '#94A3B8' }}>—</span>}
          </PropRow>
        </div>
      </div>
    );
  }

  if (item.type === 'subscription') {
    const cicloLabels: Record<string, string> = {
      mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
    };
    return (
      <div>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <PropRow label="Ciclo de Cobrança">
            <span style={{ fontWeight: 600 }}>
              {f.cicloCobranca ? cicloLabels[String(f.cicloCobranca)] ?? String(f.cicloCobranca) : '—'}
            </span>
          </PropRow>
          {typeof f.intervaloRecorrencia === 'number' && (
            <PropRow label="Intervalo">
              {f.intervaloRecorrencia} <span style={{ color: '#94A3B8' }}>
                {f.intervaloRecorrencia === 1 ? 'mês' : 'meses'}
              </span>
            </PropRow>
          )}
          <PropRow label="Período de Teste">
            {typeof f.periodoTeste === 'number' && f.periodoTeste > 0
              ? <><span style={{ fontWeight: 600 }}>{f.periodoTeste}</span> <span style={{ color: '#94A3B8' }}>dias</span></>
              : <span style={{ color: '#94A3B8' }}>Sem período de teste</span>}
          </PropRow>
        </div>
      </div>
    );
  }

  if (item.type === 'course') {
    return (
      <div>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {typeof f.cargaHoraria === 'number' && (
            <PropRow label="Carga Horária">
              <span style={{ fontWeight: 600 }}>{f.cargaHoraria}</span>
              <span style={{ color: '#94A3B8' }}>horas</span>
            </PropRow>
          )}
          <PropRow label="Certificado">
            {f.certificadoDisponivel
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
                  <Award size={13} /> Sim
                </span>
              : <span style={{ color: '#94A3B8' }}>Não</span>}
          </PropRow>
          <PropRow label="Treinamento">
            {f.treinamentoRelacionadoNome
              ? <Link to={`/trainings/${String(f.treinamentoRelacionadoId)}`} style={{ color: '#6366F1', fontWeight: 500, textDecoration: 'none' }}>
                  {String(f.treinamentoRelacionadoNome)}
                </Link>
              : <span style={{ color: '#94A3B8' }}>—</span>}
          </PropRow>
        </div>
      </div>
    );
  }

  if (item.type === 'procedure') {
    return (
      <div>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {typeof f.duracaoMinutos === 'number' && (
            <PropRow label="Duração">
              <span style={{ fontWeight: 600 }}>{formatDuration(f.duracaoMinutos)}</span>
            </PropRow>
          )}
          <PropRow label="Exige Profissional">
            <YesNoBadge value={!!f.exigeProfissional} />
          </PropRow>
          <PropRow label="Equipamento">
            {f.equipamentoNecessario
              ? <span>{String(f.equipamentoNecessario)}</span>
              : <span style={{ color: '#94A3B8' }}>—</span>}
          </PropRow>
        </div>
      </div>
    );
  }

  if (item.type === 'plan') {
    const cicloLabels: Record<string, string> = {
      mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
    };
    const itens = Array.isArray(f.itensIncluidos) ? (f.itensIncluidos as string[]) : [];
    return (
      <div>
        {sectionHeader}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <PropRow label="Ciclo">
            <span style={{ fontWeight: 600 }}>
              {f.cicloCobranca ? cicloLabels[String(f.cicloCobranca)] ?? String(f.cicloCobranca) : '—'}
            </span>
          </PropRow>
          {typeof f.validade === 'number' && (
            <PropRow label="Validade">
              {f.validade} <span style={{ color: '#94A3B8' }}>
                {f.validade === 1 ? 'mês' : 'meses'}
              </span>
            </PropRow>
          )}
        </div>
        {itens.length > 0 && (
          <PropRow label="Itens Incluídos">
            <ul style={{ margin: '4px 0 0 0', padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {itens.map((item, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{item}</li>
              ))}
            </ul>
          </PropRow>
        )}
      </div>
    );
  }

  // custom
  return (
    <div>
      {sectionHeader}
      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Sem configurações específicas.</p>
    </div>
  );
}

// ─── CatalogDetail ────────────────────────────────────────────────────────────

export function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [labels, setLabels] = useState(DEFAULT_CATALOG_LABELS);
  const [loading, setLoading] = useState(true);
  const [localStatus, setLocalStatus] = useState<CatalogItem['status']>('active');

  useEffect(() => {
    void Promise.all([id ? getItem(id) : Promise.resolve(null), getLabels()])
      .then(([nextItem, nextLabels]) => {
        setItem(nextItem);
        setLabels(nextLabels);
        if (nextItem) setLocalStatus(nextItem.status);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40 }}><ModuleStateView state="loading" /></div>;
  }

  if (!item) {
    return (
      <div style={{ padding: '40px', minHeight: '100vh', background: '#F8FAFC' }}>
        <ModuleStateView
          state="error"
          errorMessage="Item não encontrado. Verifique o ID e tente novamente."
          onRetry={() => navigate('/catalog')}
        />
      </div>
    );
  }

  const typeCfg = CATALOG_TYPE_CONFIG[item.type];
  const statusCfg = CATALOG_STATUS_CONFIG[localStatus];

  // Shared card style
  const card: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '16px',
  };

  const cardTitle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 700, color: '#0F172A',
    margin: '0 0 18px 0',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', gap: '8px',
  };

  // Action button component
  function ActionBtn({
    label, icon, variant = 'ghost', onClick, color,
  }: {
    label: string;
    icon: React.ReactNode;
    variant?: 'ghost' | 'solid' | 'danger';
    onClick?: () => void;
    color?: string;
  }) {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '8px 14px', borderRadius: '10px',
      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
      border: '1.5px solid', transition: 'opacity 0.15s',
    };
    const variants: Record<string, React.CSSProperties> = {
      ghost: { background: 'white', borderColor: color ? `${color}40` : 'rgba(0,0,0,0.1)', color: color ?? '#64748B' },
      solid: { background: color ?? '#10B981', borderColor: color ?? '#10B981', color: 'white' },
      danger: { background: 'white', borderColor: '#FECACA', color: '#EF4444' },
    };
    return (
      <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
        {icon}
        {label}
      </button>
    );
  }

  // Mock timeline events
  const timelineEvents = [
    {
      label: 'Item criado',
      user: item.createdBy,
      avatar: item.createdByAvatar,
      date: item.createdAt,
      dotColor: '#6366F1',
    },
    {
      label: 'Preço atualizado',
      user: 'Alexandre Rios',
      avatar: 'AR',
      date: new Date(new Date(item.createdAt).getTime() + 5 * 86400000).toISOString(),
      dotColor: '#64748B',
    },
    {
      label: 'Status alterado para Ativo',
      user: 'Alexandre Rios',
      avatar: 'AR',
      date: new Date(new Date(item.createdAt).getTime() + 7 * 86400000).toISOString(),
      dotColor: '#10B981',
    },
    {
      label: 'Campos atualizados',
      user: 'Alexandre Rios',
      avatar: 'AR',
      date: item.updatedAt,
      dotColor: '#64748B',
    },
  ];

  const f = item.typeFields as Record<string, unknown>;

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        <Link to="/catalog" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
          {labels.plural}
        </Link>
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>›</span>
        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{item.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px 0', lineHeight: 1.2 }}>
            {item.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Type badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '999px',
              fontSize: '12px', fontWeight: 600,
              color: typeCfg.color, background: typeCfg.bg,
              border: `1px solid ${typeCfg.color}30`,
            }}>
              {TYPE_ICON_MAP[item.type]}
              {typeCfg.label}
            </span>
            {/* Status badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '5px 14px', borderRadius: '999px',
              fontSize: '13px', fontWeight: 700,
              color: statusCfg.color, background: statusCfg.bg,
              border: `1px solid ${statusCfg.color}30`,
            }}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
          {localStatus !== 'archived' && (
            <ActionBtn
              label="Editar"
              icon={<Edit size={14} />}
              onClick={() => navigate(`/catalog/${item.id}/edit`)}
            />
          )}
          {localStatus === 'active' && (
            <ActionBtn
              label="Arquivar"
              icon={<Archive size={14} />}
              color="#F59E0B"
              onClick={() => void archiveItem(item.id).then(updated => {
                setItem(updated);
                setLocalStatus(updated.status);
              })}
            />
          )}
          {(localStatus === 'archived' || localStatus === 'inactive') && (
            <ActionBtn
              label="Reativar"
              icon={<RefreshCw size={14} />}
              variant="solid"
              color="#10B981"
              onClick={() => void reactivateItem(item.id).then(updated => {
                setItem(updated);
                setLocalStatus(updated.status);
              })}
            />
          )}
          {(localStatus === 'inactive' || localStatus === 'archived') && (
            <ActionBtn
              label="Excluir"
              icon={<Trash2 size={14} />}
              variant="danger"
              onClick={() => {
                if (!window.confirm(`Excluir ${item.name}?`)) return;
                void deleteItem(item.id).then(() => navigate('/catalog'));
              }}
            />
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* LEFT COLUMN — 65% */}
        <div style={{ flex: '0 0 65%', minWidth: 0 }}>

          {/* ── Card 1: Dados Gerais ── */}
          <div style={card}>
            <h2 style={cardTitle}>Dados Gerais</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <PropRow label="Nome">
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.name}</span>
              </PropRow>

              <PropRow label="Tipo">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '2px 10px', borderRadius: '999px',
                  fontSize: '12px', fontWeight: 600,
                  color: typeCfg.color, background: typeCfg.bg,
                }}>
                  {TYPE_ICON_MAP[item.type]}
                  {typeCfg.label}
                </span>
              </PropRow>

              <PropRow label="Status">
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 10px', borderRadius: '999px',
                  fontSize: '12px', fontWeight: 600,
                  color: statusCfg.color, background: statusCfg.bg,
                }}>
                  {statusCfg.label}
                </span>
              </PropRow>

              <PropRow label="Preço">
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>
                  R$ {formatPrice(item.price)}
                </span>
              </PropRow>

              {item.sku && (
                <PropRow label="SKU">
                  <span style={{
                    fontFamily: 'monospace', fontSize: '12px', fontWeight: 600,
                    color: '#6366F1', background: '#EEF2FF',
                    padding: '2px 8px', borderRadius: '6px',
                  }}>
                    {item.sku}
                  </span>
                </PropRow>
              )}

              {item.unit && (
                <PropRow label="Unidade">
                  {item.unit}
                </PropRow>
              )}

              <PropRow label="Criado por">
                <Avatar initials={item.createdByAvatar} size={22} />
                <span>{item.createdBy}</span>
              </PropRow>

              <PropRow label="Criado em">
                <Calendar size={14} color="#64748B" />
                <span>{formatDate(item.createdAt)}</span>
              </PropRow>

              <PropRow label="Atualizado em">
                <Clock size={14} color="#64748B" />
                <span style={{ color: '#64748B' }}>{formatRelative(item.updatedAt)}</span>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>· {formatDate(item.updatedAt)}</span>
              </PropRow>

            </div>

            {item.description && (
              <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                  Descrição
                </span>
                <p style={{
                  margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.7',
                  background: '#F8FAFC', borderRadius: '10px', padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  {item.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Card 2: Detalhes Específicos ── */}
          <div style={card}>
            <TypeDetails item={item} />
          </div>

          {/* ── Card 3: Campos Personalizados ── */}
          {item.metadata.length > 0 && (
            <div style={card}>
              <h2 style={cardTitle}>
                <Sparkles size={15} color="#6366F1" />
                Campos Personalizados
                <span style={{
                  marginLeft: '6px', fontSize: '10px', fontWeight: 700,
                  color: '#3B82F6', background: '#EFF6FF',
                  padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.3px',
                }}>
                  Metadata Engine
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {item.metadata.map(field => (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {field.label}
                    </span>
                    {field.value !== null && field.value !== undefined && String(field.value).trim() !== '' ? (
                      field.type === 'textarea' ? (
                        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                          {String(field.value)}
                        </p>
                      ) : (
                        <span style={{
                          display: 'inline-flex', fontSize: '13px', fontWeight: 500,
                          color: '#0F172A', background: '#F8FAFC',
                          padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.06)',
                          alignSelf: 'flex-start',
                        }}>
                          {String(field.value)}
                        </span>
                      )
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94A3B8' }}>—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Card 4: Histórico ── */}
          <div style={card}>
            <h2 style={cardTitle}>
              <Clock size={15} color="#64748B" />
              Histórico
            </h2>
            <div style={{ position: 'relative', paddingLeft: '28px' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute', left: '9px', top: '6px',
                bottom: '6px', width: '2px', background: '#F1F5F9',
              }} />

              {timelineEvents.map((ev, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  marginBottom: idx < timelineEvents.length - 1 ? '20px' : 0,
                  position: 'relative',
                }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: '-28px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: ev.dotColor, border: '2px solid white',
                    boxShadow: `0 0 0 2px ${ev.dotColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, top: '4px',
                  }} />

                  {/* Avatar */}
                  <Avatar initials={ev.avatar} size={28} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {ev.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>por {ev.user}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {formatRelative(ev.date)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                      {formatDate(ev.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — 35%, sticky */}
        <div style={{ flex: '0 0 35%', minWidth: 0, position: 'sticky', top: '24px' }}>

          {/* ── Preço ── */}
          <div style={card}>
            <h2 style={{ ...cardTitle, marginBottom: '16px' }}>Preço</h2>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', marginTop: '8px' }}>R$</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
                  {formatPrice(item.price)}
                </span>
              </div>
              {item.unit && (
                <span style={{
                  display: 'inline-flex', marginTop: '8px',
                  fontSize: '12px', fontWeight: 500, color: '#64748B',
                  background: '#F1F5F9', padding: '3px 10px', borderRadius: '999px',
                }}>
                  por {item.unit}
                </span>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {item.type === 'product' && typeof f.custo === 'number' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Custo</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>R$ {formatPrice(f.custo)}</span>
                  </div>
                  {item.price > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>Margem</span>
                      <span style={{
                        fontWeight: 700,
                        color: Math.round(((item.price - f.custo) / item.price) * 100) >= 40 ? '#10B981' : '#F59E0B',
                      }}>
                        {Math.round(((item.price - f.custo) / item.price) * 100)}%
                      </span>
                    </div>
                  )}
                </>
              )}
              {item.type === 'subscription' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Ciclo</span>
                    <span style={{ fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                      {String(f.cicloCobranca ?? '—')}
                    </span>
                  </div>
                  {typeof f.periodoTeste === 'number' && f.periodoTeste > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>Período de teste</span>
                      <span style={{ fontWeight: 600, color: '#8B5CF6' }}>{f.periodoTeste} dias</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Ações Rápidas ── */}
          <div style={card}>
            <h2 style={{ ...cardTitle, marginBottom: '14px' }}>Ações Rápidas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {localStatus !== 'archived' && (
                <button
                  onClick={() => navigate(`/catalog/${item.id}/edit`)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    background: 'white', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <Edit size={14} /> Editar {labels.singular}
                </button>
              )}
              {localStatus === 'active' && (
                <button
                  onClick={() => void archiveItem(item.id).then(updated => {
                    setItem(updated);
                    setLocalStatus(updated.status);
                  })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: '1.5px solid #FCD34D',
                    background: '#FFFBEB', color: '#92400E', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <Archive size={14} /> Arquivar
                </button>
              )}
              {(localStatus === 'inactive' || localStatus === 'archived') && (
                <button
                  onClick={() => void reactivateItem(item.id).then(updated => {
                    setItem(updated);
                    setLocalStatus(updated.status);
                  })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: 'none',
                    background: '#10B981', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                  }}
                >
                  <RefreshCw size={14} /> Reativar
                </button>
              )}
            </div>
          </div>

          {/* ── Integração Futura ── */}
          <div style={{ ...card, background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 style={{ ...cardTitle, color: '#94A3B8', borderBottomColor: 'rgba(0,0,0,0.04)', marginBottom: '14px' }}>
              Integração Futura
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { emoji: '📦', name: 'Estoque' },
                { emoji: '📅', name: 'Agenda' },
                { emoji: '💳', name: 'PDV' },
                { emoji: '🔄', name: 'Pedidos' },
                { emoji: '🏪', name: 'Marketplace' },
                { emoji: '📊', name: 'Financeiro' },
              ].map(feat => (
                <div key={feat.name} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 10px', borderRadius: '10px',
                  background: 'white', border: '1px solid rgba(0,0,0,0.06)',
                  opacity: 0.85,
                }}>
                  <Lock size={10} color="#94A3B8" />
                  <span style={{ fontSize: '11px' }}>{feat.emoji}</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{feat.name}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>Em breve</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
