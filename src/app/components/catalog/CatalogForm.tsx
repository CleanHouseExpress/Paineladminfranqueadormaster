import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  Package, Briefcase, RefreshCw, GraduationCap, Stethoscope, Star, Boxes,
  Check, Sparkles, Lock, Search,
} from 'lucide-react';
import {
  CATALOG_TYPE_CONFIG, CATALOG_STATUS_CONFIG, DEFAULT_CATALOG_LABELS, DEFAULT_CATALOG_METADATA_SCHEMA,
} from '../../../types/catalog';
import type { CatalogItemType, CatalogItemStatus, CatalogItem } from '../../../types/catalog';
import { DynamicFormRenderer } from '../../../shared/components/DynamicFormRenderer';
import type { ChecklistFieldSchema } from '../../../types/checklist';
import { createItem, getCatalogConfig, getItem, updateItem } from '../../../services/catalogService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const TYPE_ICONS: Record<CatalogItemType, React.ReactNode> = {
  product:      <Package size={16} />,
  service:      <Briefcase size={16} />,
  subscription: <RefreshCw size={16} />,
  course:       <GraduationCap size={16} />,
  procedure:    <Stethoscope size={16} />,
  plan:         <Star size={16} />,
  custom:       <Boxes size={16} />,
};

const TYPE_DESCRIPTIONS: Record<CatalogItemType, string> = {
  product:      'Tem estoque e código de barras',
  service:      'Agenda e profissional',
  subscription: 'Cobrança recorrente',
  course:       'Carga horária e certificado',
  procedure:    'Duração e equipamento',
  plan:         'Pacote de benefícios',
  custom:       'Campos livres',
};

const UNIT_OPTIONS = ['un', 'h', 'min', 'sessão', 'mês', 'ano', 'kit', 'vaga', 'curso', 'Outro'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: '16px',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {icon && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: iconBg ?? '#EEF2FF',
              color: iconColor ?? '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{subtitle}</p>
          )}
        </div>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 14,
  color: '#0F172A',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto' as React.CSSProperties['appearance'],
};

// Toggle switch
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          width: 40,
          height: 22,
          borderRadius: '99px',
          background: checked ? '#10B981' : '#CBD5E1',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CatalogForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const isEdit  = !!id && id !== 'new';
  const [labels, setLabels] = useState(DEFAULT_CATALOG_LABELS);
  const [existingItem, setExistingItem] = useState<CatalogItem | null>(null);
  const [enabledTypes, setEnabledTypes] = useState<CatalogItemType[]>(Object.keys(CATALOG_TYPE_CONFIG) as CatalogItemType[]);
  const [customSchema, setCustomSchema] = useState(DEFAULT_CATALOG_METADATA_SCHEMA);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name,        setName]        = useState(existingItem?.name ?? '');
  const [description, setDescription] = useState(existingItem?.description ?? '');
  const [sku,         setSku]         = useState(existingItem?.sku ?? '');
  const [unit,        setUnit]        = useState(existingItem?.unit ?? 'un');
  const [selectedType, setSelectedType] = useState<CatalogItemType>(existingItem?.type ?? 'service');
  const [status,      setStatus]      = useState<CatalogItemStatus>(existingItem?.status ?? 'active');
  const [price,       setPrice]       = useState(existingItem?.price?.toString() ?? '');
  const [typeFields,  setTypeFields]  = useState<Record<string, unknown>>(existingItem?.typeFields ?? {});
  const [metadataValues, setMetadataValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    (existingItem?.metadata ?? []).forEach(m => { init[m.key] = m.value; });
    return init;
  });

  useEffect(() => {
    void (async () => {
      const [config, item] = await Promise.all([
        getCatalogConfig(),
        isEdit && id ? getItem(id) : Promise.resolve(null),
      ]);
      setLabels(config.labels);
      setEnabledTypes(config.enabledTypes);
      setCustomSchema(config.formSchema);
      if (!item) return;
      setExistingItem(item);
      setName(item.name);
      setDescription(item.description ?? '');
      setSku(item.sku ?? '');
      setUnit(item.unit ?? 'un');
      setSelectedType(item.type);
      setStatus(item.status);
      setPrice(String(item.price));
      setTypeFields(item.typeFields);
      setMetadataValues(Object.fromEntries(item.metadata.map(field => [field.key, field.value])));
    })().catch(() => setFormError('Nao foi possivel carregar os dados do catalogo.'));
  }, [id, isEdit]);

  // ── Type field helpers ─────────────────────────────────────────────────────
  function setField(key: string, value: unknown) {
    setTypeFields(prev => ({ ...prev, [key]: value }));
  }

  // ── Metadata schema → ChecklistFieldSchema ─────────────────────────────────
  const metadataSchema: ChecklistFieldSchema[] = customSchema.filter(field => field.visible !== false).map((field, index) => ({
    key: field.key,
    label: field.label,
    type: field.type as ChecklistFieldSchema['type'],
    required: field.required ?? false,
    options: field.options,
    order: field.order ?? index + 1,
  }));

  async function save(nextStatus = status) {
    if (!name.trim()) {
      setFormError('Informe o nome do item.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload: Partial<CatalogItem> = {
      name: name.trim(),
      description,
      sku,
      unit,
      type: selectedType,
      status: nextStatus,
      price: Number(price || 0),
      typeFields,
      metadata: customSchema.map(field => ({
        key: field.key,
        label: field.label,
        type: field.type,
        options: field.options,
        value: metadataValues[field.key],
      })),
    };
    try {
      const saved = isEdit && id ? await updateItem(id, payload) : await createItem(payload);
      navigate(`/catalog/${saved.id}`);
    } catch {
      setFormError('Nao foi possivel salvar o item. Revise os campos e tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  // ── Live preview ───────────────────────────────────────────────────────────
  const previewPrice = parseFloat(price) || 0;
  const typeCfg = CATALOG_TYPE_CONFIG[selectedType];
  const statusCfg = CATALOG_STATUS_CONFIG[status];

  // ── Dynamic type section opacity/height ───────────────────────────────────
  function typeSectionStyle(type: CatalogItemType): React.CSSProperties {
    const visible = selectedType === type;
    return {
      overflow: 'hidden',
      maxHeight: visible ? '600px' : '0px',
      opacity: visible ? 1 : 0,
      transition: 'max-height 0.3s ease, opacity 0.25s ease',
    };
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '24px' }}>
      {formError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>
          {formError}
        </div>
      )}

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: 13, color: '#64748B' }}>
        <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Início</Link>
        <span>›</span>
        <Link to="/catalog" style={{ color: '#64748B', textDecoration: 'none' }}>{labels.plural}</Link>
        <span>›</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>
          {isEdit ? (existingItem?.name ?? 'Editar') : labels.newItem}
        </span>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {isEdit ? `Editar ${labels.singular}` : labels.newItem}
              </h1>
              {isEdit && existingItem && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: typeCfg.color,
                    background: typeCfg.bg,
                    padding: '3px 9px',
                    borderRadius: '99px',
                    border: `1px solid ${typeCfg.color}33`,
                  }}
                >
                  {typeCfg.label}
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              {isEdit ? `Editando "${existingItem?.name ?? ''}"` : `Preencha as informações do novo ${labels.singular.toLowerCase()}.`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 600,
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => void save('inactive')}
            disabled={saving}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 600,
              color: '#6366F1',
              cursor: 'pointer',
            }}
          >
            Salvar Rascunho
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            }}
          >
            Salvar {labels.singular}
          </button>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN (65%) ──────────────────────────────────────────────── */}
        <div style={{ flex: '0 0 65%', minWidth: 0 }}>

          {/* Card: Informações Básicas */}
          <SectionCard title="Informações Básicas">
            <FormField label="Nome" required>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`Nome do ${labels.singular.toLowerCase()}...`}
                style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
              />
            </FormField>
            <FormField label="Descrição">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="SKU" hint="Deixe em branco para gerar automaticamente.">
                <input
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="AUTO-GERADO"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </FormField>
              <FormField label="Unidade de Medida">
                <select value={unit} onChange={e => setUnit(e.target.value)} style={selectStyle}>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>
            </div>
          </SectionCard>

          {/* Card: Tipo e Status */}
          <SectionCard title="Tipo e Status">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Type selector */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Tipo</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(Object.entries(CATALOG_TYPE_CONFIG) as [CatalogItemType, typeof CATALOG_TYPE_CONFIG[CatalogItemType]][]).filter(([type]) => enabledTypes.includes(type)).map(([type, cfg]) => {
                    const selected = selectedType === type;
                    return (
                      <div
                        key={type}
                        onClick={() => setSelectedType(type)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: selected ? `2px solid ${cfg.color}` : '2px solid rgba(0,0,0,0.07)',
                          background: selected ? cfg.bg : '#FAFAFA',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 4 }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '6px',
                              background: cfg.bg,
                              color: cfg.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {TYPE_ICONS[type]}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{cfg.label}</span>
                          {selected && (
                            <Check size={11} style={{ color: cfg.color, marginLeft: 'auto' }} />
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.3 }}>
                          {TYPE_DESCRIPTIONS[type]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status + price */}
              <div>
                <FormField label="Status">
                  <select value={status} onChange={e => setStatus(e.target.value as CatalogItemStatus)} style={selectStyle}>
                    {(Object.entries(CATALOG_STATUS_CONFIG) as [CatalogItemStatus, typeof CATALOG_STATUS_CONFIG[CatalogItemStatus]][]).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Preço Base"
                  hint='Este campo pode ser renomeado no módulo de Configurações'
                >
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#64748B',
                      }}
                    >
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0,00"
                      style={{ ...inputStyle, paddingLeft: 36 }}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </SectionCard>

          {/* Card: Configurações Específicas (dynamic) */}
          <SectionCard
            title={`Configurações de ${typeCfg.label}`}
            icon={TYPE_ICONS[selectedType]}
            iconColor={typeCfg.color}
            iconBg={typeCfg.bg}
          >

            {/* PRODUCT */}
            <div style={typeSectionStyle('product')}>
              <Toggle
                checked={!!typeFields.controlaEstoque}
                onChange={v => setField('controlaEstoque', v)}
                label="Controla Estoque"
              />
              {typeFields.controlaEstoque && (
                <div style={{ marginTop: 12 }}>
                  <FormField label="Estoque Mínimo">
                    <input
                      type="number"
                      min="0"
                      value={String(typeFields.estoqueMinimo ?? '')}
                      onChange={e => setField('estoqueMinimo', e.target.value)}
                      style={inputStyle}
                    />
                  </FormField>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 12 }}>
                <FormField label="Custo (R$)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(typeFields.custo ?? '')}
                    onChange={e => setField('custo', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Código de Barras">
                  <input
                    value={String(typeFields.codigoBarras ?? '')}
                    onChange={e => setField('codigoBarras', e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </FormField>
                <FormField label="Peso (gramas)">
                  <input
                    type="number"
                    min="0"
                    value={String(typeFields.pesoGramas ?? '')}
                    onChange={e => setField('pesoGramas', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Dimensões">
                  <input
                    value={String(typeFields.dimensoes ?? '')}
                    onChange={e => setField('dimensoes', e.target.value)}
                    placeholder="LxAxP cm"
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>

            {/* SERVICE */}
            <div style={typeSectionStyle('service')}>
              <FormField label="Duração">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={String(typeFields.duracaoMinutos ?? '')}
                    onChange={e => setField('duracaoMinutos', e.target.value)}
                    style={{ ...inputStyle, width: 100 }}
                  />
                  <span style={{ fontSize: 13, color: '#64748B' }}>minutos</span>
                  {typeFields.duracaoMinutos && (
                    <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                      = {Math.floor(Number(typeFields.duracaoMinutos) / 60)}h {Number(typeFields.duracaoMinutos) % 60}min
                    </span>
                  )}
                </div>
              </FormField>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 4 }}>
                <Toggle
                  checked={!!typeFields.exigeProfissional}
                  onChange={v => setField('exigeProfissional', v)}
                  label="Exige Profissional"
                />
                <Toggle
                  checked={!!typeFields.exigeAgenda}
                  onChange={v => setField('exigeAgenda', v)}
                  label="Exige Agendamento"
                />
              </div>
              {typeFields.exigeProfissional && (
                <div style={{ marginTop: 12 }}>
                  <FormField label="Profissional Necessário">
                    <input
                      value={String(typeFields.profissionalNecessario ?? '')}
                      onChange={e => setField('profissionalNecessario', e.target.value)}
                      style={inputStyle}
                    />
                  </FormField>
                </div>
              )}
            </div>

            {/* SUBSCRIPTION */}
            <div style={typeSectionStyle('subscription')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Ciclo de Cobrança">
                  <select
                    value={String(typeFields.cicloCobranca ?? 'mensal')}
                    onChange={e => setField('cicloCobranca', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </FormField>
                <FormField label="Intervalo de Recorrência">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      value={String(typeFields.intervaloRecorrencia ?? '')}
                      onChange={e => setField('intervaloRecorrencia', e.target.value)}
                      style={{ ...inputStyle, width: 80 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748B' }}>meses</span>
                  </div>
                </FormField>
                <FormField label="Período de Teste">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      value={String(typeFields.periodoTeste ?? '')}
                      onChange={e => setField('periodoTeste', e.target.value)}
                      style={{ ...inputStyle, width: 80 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748B' }}>dias</span>
                  </div>
                </FormField>
              </div>
            </div>

            {/* COURSE */}
            <div style={typeSectionStyle('course')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Carga Horária">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      value={String(typeFields.cargaHoraria ?? '')}
                      onChange={e => setField('cargaHoraria', e.target.value)}
                      style={{ ...inputStyle, width: 80 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748B' }}>horas</span>
                  </div>
                </FormField>
                <div style={{ paddingTop: 20 }}>
                  <Toggle
                    checked={!!typeFields.certificadoDisponivel}
                    onChange={v => setField('certificadoDisponivel', v)}
                    label="Certificado Disponível"
                  />
                </div>
              </div>
              <FormField label="Treinamento Relacionado">
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    value={String(typeFields.treinamentoRelacionadoNome ?? '')}
                    onChange={e => setField('treinamentoRelacionadoNome', e.target.value)}
                    placeholder="Buscar treinamento..."
                    style={{ ...inputStyle, paddingLeft: 32 }}
                  />
                </div>
              </FormField>
            </div>

            {/* PROCEDURE */}
            <div style={typeSectionStyle('procedure')}>
              <FormField label="Duração">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={String(typeFields.duracaoMinutos ?? '')}
                    onChange={e => setField('duracaoMinutos', e.target.value)}
                    style={{ ...inputStyle, width: 100 }}
                  />
                  <span style={{ fontSize: 13, color: '#64748B' }}>minutos</span>
                </div>
              </FormField>
              <Toggle
                checked={!!typeFields.exigeProfissional}
                onChange={v => setField('exigeProfissional', v)}
                label="Exige Profissional"
              />
              <div style={{ marginTop: 12 }}>
                <FormField label="Equipamento Necessário">
                  <input
                    value={String(typeFields.equipamentoNecessario ?? '')}
                    onChange={e => setField('equipamentoNecessario', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>

            {/* PLAN */}
            <div style={typeSectionStyle('plan')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Ciclo">
                  <select
                    value={String(typeFields.cicloCobranca ?? 'mensal')}
                    onChange={e => setField('cicloCobranca', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </FormField>
                <FormField label="Validade">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      value={String(typeFields.validade ?? '')}
                      onChange={e => setField('validade', e.target.value)}
                      style={{ ...inputStyle, width: 80 }}
                    />
                    <span style={{ fontSize: 13, color: '#64748B' }}>meses</span>
                  </div>
                </FormField>
              </div>
              <FormField label="Itens Incluídos" hint="Um item por linha.">
                <textarea
                  rows={4}
                  value={Array.isArray(typeFields.itensIncluidos) ? (typeFields.itensIncluidos as string[]).join('\n') : String(typeFields.itensIncluidos ?? '')}
                  onChange={e => setField('itensIncluidos', e.target.value.split('\n').filter(Boolean))}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </FormField>
            </div>

            {/* CUSTOM — only basic fields, show placeholder */}
            <div style={typeSectionStyle('custom')}>
              <div
                style={{
                  padding: '20px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px dashed rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <Boxes size={24} style={{ color: '#CBD5E1', marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
                  Tipo personalizado — use os Campos Personalizados abaixo para configurar campos livres.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Card: Campos Personalizados (Metadata Engine) */}
          <SectionCard
            title="Campos Personalizados"
            subtitle='Configurados pelo administrador em Configurações > Form Builder'
            icon={<Sparkles size={14} />}
            iconColor="#3B82F6"
            iconBg="#EFF6FF"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#3B82F6',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '3px 10px',
                  borderRadius: '99px',
                }}
              >
                Metadata Engine
              </span>
            </div>
            <DynamicFormRenderer
              schema={metadataSchema}
              values={metadataValues}
              onChange={(key, value) => setMetadataValues(prev => ({ ...prev, [key]: value }))}
            />
            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#CBD5E1', textAlign: 'center', fontStyle: 'italic' }}>
              Estes campos são configurados pelo administrador em Configurações &gt; Form Builder
            </p>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN (35%) ─────────────────────────────────────────────── */}
        <div style={{ flex: '0 0 35%', minWidth: 0 }}>

          {/* Card: Preview do Item */}
          <SectionCard title="Preview do Item" subtitle="Atualiza em tempo real">
            <div
              style={{
                border: `1px solid ${typeCfg.color}33`,
                borderRadius: '12px',
                padding: '16px',
                background: typeCfg.bg,
                position: 'relative',
              }}
            >
              {/* Type badge */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: typeCfg.color,
                    background: '#fff',
                    border: `1px solid ${typeCfg.color}55`,
                    padding: '3px 9px',
                    borderRadius: '99px',
                  }}
                >
                  {typeCfg.label}
                </span>
              </div>

              {/* Name */}
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, minHeight: 24 }}>
                {name || <span style={{ color: '#CBD5E1' }}>Nome do {labels.singular.toLowerCase()}...</span>}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  marginBottom: 10,
                  minHeight: 16,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description || <span style={{ color: '#CBD5E1' }}>Descrição...</span>}
              </div>

              {/* Price */}
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginBottom: 8 }}>
                {previewPrice > 0 ? formatCurrency(previewPrice) : <span style={{ color: '#CBD5E1', fontSize: 16 }}>R$ —</span>}
              </div>

              {/* Footer row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94A3B8' }}>
                  {sku || 'AUTO-GERADO'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {unit && (
                    <span style={{ fontSize: 11, color: '#64748B', background: '#fff', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}>
                      {unit}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: statusCfg.color,
                      background: statusCfg.bg,
                      padding: '2px 8px',
                      borderRadius: '99px',
                    }}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Card: Futuras Funcionalidades */}
          <SectionCard title="Futuras Funcionalidades" style={{ opacity: 0.85 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Gestão de Estoque',        emoji: '📦' },
                { label: 'Integração com Agenda',     emoji: '📅' },
                { label: 'Pedidos e PDV',             emoji: '💳' },
                { label: 'Assinaturas Automáticas',   emoji: '🔄' },
                { label: 'Marketplace',               emoji: '🏪' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={12} style={{ color: '#CBD5E1' }} />
                    <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#CBD5E1',
                      background: '#F1F5F9',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Em breve
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#CBD5E1', fontStyle: 'italic', textAlign: 'center' }}>
              Funcionalidades planejadas para versões futuras
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
