import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, DollarSign, Edit, Eye, Plus, RefreshCw, Save, Search, Tags, X } from 'lucide-react';
import { toast } from 'sonner';

import { getItems } from '../../../services/catalogService';
import { pricingService } from '../../../services/pricingService';
import { unitManagementService } from '../../../services/unitManagementService';
import { getApiErrorMessage } from '../../../services/apiClient';
import { usePermission } from '../../../shared/hooks/usePermission';
import type { CatalogItem } from '../../../types/catalog';
import type { EffectivePrice, ProductPrice, ProductUnitPrice } from '../../../types/pricing';
import { PRICING_PERMISSIONS } from '../../../types/pricing';
import type { Unit } from '../../../types/unitManagement';

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%', overflow: 'auto' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid rgba(15,23,42,.08)', borderRadius: 12, boxShadow: '0 1px 4px rgba(15,23,42,.04)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid rgba(15,23,42,.14)', borderRadius: 8, fontSize: 13, color: '#0F172A', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const smallMuted: React.CSSProperties = { color: '#64748B', fontSize: 12, lineHeight: 1.45 };

type PriceRow = {
  item: CatalogItem;
  price: ProductPrice | null;
};

type UnitPriceRow = {
  unit: Unit;
  override: ProductUnitPrice | null;
  effective: EffectivePrice | null;
};

function money(value: number | null | undefined, currency = 'BRL') {
  if (value === null || value === undefined) return 'Sem preco';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function dateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

function parseMoneyInput(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function moneyInput(value: number | null | undefined) {
  return value === null || value === undefined ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Badge({ tone, children }: { tone: 'success' | 'warning' | 'info' | 'muted'; children: React.ReactNode }) {
  const colors = {
    success: { color: '#047857', bg: '#ECFDF5' },
    warning: { color: '#B45309', bg: '#FFFBEB' },
    info: { color: '#4338CA', bg: '#EEF2FF' },
    muted: { color: '#475569', bg: '#F1F5F9' },
  }[tone];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, ...colors }}>{children}</span>;
}

function Button({ children, onClick, disabled, secondary = false, danger = false, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '9px 13px', borderRadius: 9, border: secondary ? '1px solid rgba(15,23,42,.12)' : 0,
      background: disabled ? '#CBD5E1' : secondary ? '#fff' : danger ? '#DC2626' : '#4F46E5',
      color: secondary ? '#334155' : '#fff', fontSize: 13, fontWeight: 750,
      cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <section role="dialog" aria-modal="true" aria-label={title} style={{ ...cardStyle, width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid rgba(15,23,42,.08)' }}>
          <h2 style={{ margin: 0, color: '#0F172A', fontSize: 17, fontWeight: 800 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ border: 0, background: '#F1F5F9', borderRadius: 8, width: 32, height: 32, display: 'grid', placeItems: 'center', color: '#475569', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </section>
    </div>
  );
}

function PriceForm({ row, itemsWithoutPrice, onClose, onSaved }: {
  row: PriceRow | null;
  itemsWithoutPrice: CatalogItem[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const creating = !row?.price;
  const [catalogItemId, setCatalogItemId] = useState(row?.item.id ?? itemsWithoutPrice[0]?.id ?? '');
  const [salePrice, setSalePrice] = useState(moneyInput(row?.price?.salePrice));
  const [costPrice, setCostPrice] = useState(moneyInput(row?.price?.costPrice));
  const [active, setActive] = useState(row?.price?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedItem = row?.item ?? itemsWithoutPrice.find(item => String(item.id) === String(catalogItemId));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    const parsedSale = parseMoneyInput(salePrice);
    const parsedCost = parseMoneyInput(costPrice);
    if (!catalogItemId) { setError('Selecione um item do Catalogo.'); return; }
    if (parsedSale === null || parsedSale < 0) { setError('Informe um preco de venda valido e maior ou igual a zero.'); return; }
    if (parsedCost !== null && parsedCost < 0) { setError('Informe um preco de custo valido e maior ou igual a zero.'); return; }

    setSaving(true);
    try {
      if (row?.price) {
        await pricingService.updatePrice(row.price.id, { salePrice: parsedSale, costPrice: parsedCost, active, currency: row.price.currency });
        toast.success('Preco padrao atualizado.');
      } else {
        await pricingService.createPrice({ catalogItemId, salePrice: parsedSale, costPrice: parsedCost, active, currency: 'BRL' });
        toast.success('Preco padrao criado.');
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel salvar o preco.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      {creating ? (
        <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
          Item do Catalogo
          <select value={String(catalogItemId)} onChange={event => setCatalogItemId(event.target.value)} style={inputStyle} disabled={saving}>
            {itemsWithoutPrice.length === 0 && <option value="">Todos os itens ja possuem preco</option>}
            {itemsWithoutPrice.map(item => <option key={item.id} value={item.id}>{item.name}{item.sku ? ` - ${item.sku}` : ''}</option>)}
          </select>
        </label>
      ) : (
        <div style={{ ...cardStyle, padding: 12 }}>
          <strong style={{ color: '#0F172A', fontSize: 14 }}>{selectedItem?.name}</strong>
          <div style={smallMuted}>{selectedItem?.sku ?? 'Sem SKU'} - dados cadastrais definidos no Catalogo</div>
        </div>
      )}
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
        Preco de venda padrao
        <input aria-label="Preco de venda padrao" value={salePrice} onChange={event => setSalePrice(event.target.value)} placeholder="0,00" inputMode="decimal" style={inputStyle} disabled={saving} />
      </label>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
        Preco de custo
        <input aria-label="Preco de custo" value={costPrice} onChange={event => setCostPrice(event.target.value)} placeholder="0,00" inputMode="decimal" style={inputStyle} disabled={saving} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13 }}>
        <input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} disabled={saving} />
        Preco ativo
      </label>
      {error && <div role="alert" style={{ color: '#B91C1C', background: '#FEF2F2', padding: 10, borderRadius: 8, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Button secondary onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving || (creating && !catalogItemId)}><Save size={14} /> {saving ? 'Salvando...' : 'Salvar preco'}</Button>
      </div>
    </form>
  );
}

function UnitPriceForm({ item, row, onClose, onSaved }: {
  item: CatalogItem;
  row: UnitPriceRow;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [salePrice, setSalePrice] = useState(moneyInput(row.override?.salePrice ?? row.effective?.effectivePrice));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const parsed = parseMoneyInput(salePrice);
    if (parsed === null || parsed < 0) { setError('Informe um preco personalizado valido e maior ou igual a zero.'); return; }
    setSaving(true);
    setError('');
    try {
      await pricingService.updateUnitPrice(item.id, row.unit.id, { salePrice: parsed, active: true });
      toast.success('Preco personalizado da unidade salvo.');
      await onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel salvar o preco da unidade.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <div style={{ ...cardStyle, padding: 12 }}>
        <strong style={{ color: '#0F172A', fontSize: 14 }}>{item.name}</strong>
        <div style={smallMuted}>{row.unit.name}{row.unit.code ? ` - ${row.unit.code}` : ''}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div style={{ ...cardStyle, padding: 12 }}><div style={smallMuted}>Preco padrao</div><strong>{money(row.effective?.networkPrice ?? null)}</strong></div>
        <div style={{ ...cardStyle, padding: 12 }}><div style={smallMuted}>Preco efetivo atual</div><strong>{money(row.effective?.effectivePrice ?? null)}</strong></div>
      </div>
      <p style={{ ...smallMuted, margin: 0 }}>Enquanto existir uma sobrescrita, esta unidade deixa de herdar alteracoes futuras do preco padrao da rede.</p>
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
        Preco personalizado
        <input aria-label="Preco personalizado" value={salePrice} onChange={event => setSalePrice(event.target.value)} placeholder="0,00" inputMode="decimal" style={inputStyle} disabled={saving} />
      </label>
      {error && <div role="alert" style={{ color: '#B91C1C', background: '#FEF2F2', padding: 10, borderRadius: 8, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Button secondary onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}><Save size={14} /> {saving ? 'Salvando...' : 'Salvar personalizacao'}</Button>
      </div>
    </form>
  );
}

function ProductDetails({ row, onClose, canUpdateUnit }: { row: PriceRow; onClose: () => void; canUpdateUnit: boolean }) {
  const [networkEffective, setNetworkEffective] = useState<EffectivePrice | null>(null);
  const [unitRows, setUnitRows] = useState<UnitPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUnit, setEditingUnit] = useState<UnitPriceRow | null>(null);
  const [restoreUnit, setRestoreUnit] = useState<UnitPriceRow | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoringUnitId, setRestoringUnitId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [effective, overrides, unitsResult] = await Promise.all([
        pricingService.effectivePrice(row.item.id),
        pricingService.unitPrices(row.item.id),
        unitManagementService.listUnits({ per_page: 100 }),
      ]);
      setNetworkEffective(effective);
      const overridesByUnit = new Map(overrides.map(price => [String(price.unitId), price]));
      const units = unitsResult.data ?? [];
      const effectiveByUnit = await Promise.all(units.map(unit => pricingService.effectivePrice(row.item.id, unit.id).catch(() => null)));
      setUnitRows(units.map((unit, index) => ({ unit, override: overridesByUnit.get(String(unit.id)) ?? null, effective: effectiveByUnit[index] })));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel carregar os detalhes de preco.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [row.item.id]);

  const confirmRestore = async () => {
    if (!restoreUnit || restoringUnitId) return;
    const unitId = String(restoreUnit.unit.id);
    setRestoringUnitId(unitId);
    setRestoreError('');
    try {
      await pricingService.restoreUnitDefaultPrice(row.item.id, restoreUnit.unit.id);
      toast.success('A unidade voltou a utilizar o preco padrao da rede.');
      await load();
      setRestoreUnit(null);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Nao foi possivel restaurar o preco padrao da unidade.');
      setRestoreError(message);
      toast.error(message);
      await load();
    } finally {
      setRestoringUnitId(null);
    }
  };

  return (
    <div style={{ ...cardStyle, padding: 18 }} data-testid="pricing-details-panel">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0F172A', fontSize: 18, fontWeight: 850 }}>{row.item.name}</h2>
          <p style={{ ...smallMuted, margin: '4px 0 0' }}>Item identificado por catalog_item_id {row.item.id}. Dados cadastrais permanecem no Catalogo.</p>
        </div>
        <Button secondary onClick={onClose}><X size={14} /> Fechar</Button>
      </div>

      {loading ? <div data-testid="pricing-details-loading" style={{ ...cardStyle, padding: 18, color: '#64748B' }}>Carregando precos por unidade...</div> : null}
      {error ? <div role="alert" style={{ color: '#B91C1C', background: '#FEF2F2', padding: 12, borderRadius: 9 }}>{error}</div> : null}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ ...cardStyle, padding: 14 }}><div style={smallMuted}>Preco padrao da rede</div><strong style={{ fontSize: 18 }}>{money(networkEffective?.networkPrice ?? null, networkEffective?.currency)}</strong></div>
            <div style={{ ...cardStyle, padding: 14 }}><div style={smallMuted}>Preco efetivo consultado</div><strong style={{ fontSize: 18 }}>{money(networkEffective?.effectivePrice ?? null, networkEffective?.currency)}</strong></div>
            <div style={{ ...cardStyle, padding: 14 }}><div style={smallMuted}>Unidades personalizadas</div><strong style={{ fontSize: 18 }}>{unitRows.filter(unit => unit.effective?.priceOrigin === 'unit').length}</strong></div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead><tr style={{ textAlign: 'left', color: '#64748B', fontSize: 12 }}><th style={{ padding: 10 }}>Unidade</th><th style={{ padding: 10 }}>Preco padrao</th><th style={{ padding: 10 }}>Personalizado</th><th style={{ padding: 10 }}>Efetivo</th><th style={{ padding: 10 }}>Origem</th><th style={{ padding: 10 }}>Acao</th></tr></thead>
              <tbody>
                {unitRows.map(unitRow => {
                  const customized = unitRow.effective?.priceOrigin === 'unit';
                  return (
                    <tr key={unitRow.unit.id} style={{ borderTop: '1px solid rgba(15,23,42,.08)' }}>
                      <td style={{ padding: 10 }}><strong style={{ color: '#0F172A', fontSize: 13 }}>{unitRow.unit.name}</strong><div style={smallMuted}>{unitRow.unit.code ?? 'Sem codigo'}</div></td>
                      <td style={{ padding: 10 }}>{money(unitRow.effective?.networkPrice ?? null, unitRow.effective?.currency)}</td>
                      <td style={{ padding: 10 }}>{customized ? money(unitRow.effective?.unitPrice ?? null, unitRow.effective?.currency) : '-'}</td>
                      <td style={{ padding: 10, fontWeight: 800 }}>{money(unitRow.effective?.effectivePrice ?? null, unitRow.effective?.currency)}</td>
                      <td style={{ padding: 10 }}><Badge tone={customized ? 'info' : 'muted'}>{customized ? 'Personalizado' : 'Herdado'}</Badge></td>
                      <td style={{ padding: 10 }}>
                        {canUpdateUnit ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            <Button secondary onClick={() => setEditingUnit(unitRow)} disabled={restoringUnitId === String(unitRow.unit.id)}><Edit size={13} /> Personalizar</Button>
                            {customized && (
                              <Button secondary onClick={() => { setRestoreError(''); setRestoreUnit(unitRow); }} disabled={restoringUnitId === String(unitRow.unit.id)}>
                                <RefreshCw size={13} /> {restoringUnitId === String(unitRow.unit.id) ? 'Restaurando...' : 'Restaurar preco padrao'}
                              </Button>
                            )}
                          </div>
                        ) : <span style={smallMuted}>Somente leitura</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {editingUnit && <Modal title="Personalizar preco da unidade" onClose={() => setEditingUnit(null)}><UnitPriceForm item={row.item} row={editingUnit} onClose={() => setEditingUnit(null)} onSaved={load} /></Modal>}
      {restoreUnit && (
        <Modal title="Restaurar preco padrao?" onClose={() => restoringUnitId ? undefined : setRestoreUnit(null)}>
          <div style={{ display: 'grid', gap: 14 }} data-testid="pricing-restore-confirmation">
            <p style={{ margin: 0, color: '#334155', fontSize: 13, lineHeight: 1.6 }}>
              O preco personalizado desta unidade sera removido. A unidade voltara a utilizar automaticamente o preco padrao da rede e acompanhara futuras alteracoes desse valor.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <div style={{ ...cardStyle, padding: 12 }}><div style={smallMuted}>Unidade</div><strong>{restoreUnit.unit.name}</strong></div>
              <div style={{ ...cardStyle, padding: 12 }}><div style={smallMuted}>Preco personalizado atual</div><strong>{money(restoreUnit.effective?.unitPrice ?? null, restoreUnit.effective?.currency)}</strong></div>
              <div style={{ ...cardStyle, padding: 12 }}><div style={smallMuted}>Preco padrao atual</div><strong>{money(restoreUnit.effective?.networkPrice ?? networkEffective?.networkPrice ?? null, restoreUnit.effective?.currency ?? networkEffective?.currency)}</strong></div>
              <div style={{ ...cardStyle, padding: 12 }}><div style={smallMuted}>Efetivo apos restaurar</div><strong>{money(restoreUnit.effective?.networkPrice ?? networkEffective?.networkPrice ?? null, restoreUnit.effective?.currency ?? networkEffective?.currency)}</strong></div>
            </div>
            {restoreError && <div role="alert" style={{ color: '#B91C1C', background: '#FEF2F2', padding: 10, borderRadius: 8, fontSize: 13 }}>{restoreError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <Button secondary onClick={() => setRestoreUnit(null)} disabled={Boolean(restoringUnitId)}>Cancelar</Button>
              <Button danger onClick={() => void confirmRestore()} disabled={Boolean(restoringUnitId)}><RefreshCw size={14} /> {restoringUnitId ? 'Restaurando...' : 'Restaurar preco padrao'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function PricingProductsPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PRICING_PERMISSIONS.create);
  const canUpdate = hasPermission(PRICING_PERMISSIONS.update);
  const canUpdateUnit = hasPermission(PRICING_PERMISSIONS.unitUpdate);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [editingRow, setEditingRow] = useState<PriceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailsRow, setDetailsRow] = useState<PriceRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [catalogItems, pricing] = await Promise.all([
        getItems({ search, status: 'active' }),
        pricingService.listPrices({ search, active: activeOnly ? true : '', perPage: 100 }),
      ]);
      setItems(catalogItems);
      setPrices(pricing.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Nao foi possivel carregar os precos.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const rows = useMemo<PriceRow[]>(() => {
    const pricesByItem = new Map(prices.map(price => [String(price.catalogItemId), price]));
    return items.map(item => ({ item, price: pricesByItem.get(String(item.id)) ?? null }))
      .filter(row => !activeOnly || row.price?.active);
  }, [activeOnly, items, prices]);

  const itemsWithoutPrice = useMemo(() => rows.filter(row => !row.price).map(row => row.item), [rows]);
  const configuredCount = rows.filter(row => row.price).length;

  return (
    <div style={pageStyle} data-testid="pricing-products-page">
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#4F46E5', color: '#fff' }}><Tags size={22} /></div>
          <div><h1 style={{ margin: 0, color: '#0F172A', fontSize: 23, fontWeight: 850 }}>Precos</h1><p style={{ ...smallMuted, margin: '4px 0 0' }}>Gestao comercial de precos. Os dados do item sao definidos no Catalogo.</p></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button secondary onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Atualizar</Button>
          {canCreate && <Button onClick={() => setCreating(true)} disabled={itemsWithoutPrice.length === 0}><Plus size={14} /> Novo preco</Button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div style={{ ...cardStyle, padding: 14 }}><div style={smallMuted}>Itens consultados</div><strong style={{ fontSize: 20 }}>{rows.length}</strong></div>
        <div style={{ ...cardStyle, padding: 14 }}><div style={smallMuted}>Com preco padrao</div><strong style={{ fontSize: 20 }}>{configuredCount}</strong></div>
        <div style={{ ...cardStyle, padding: 14 }}><div style={smallMuted}>Sem preco</div><strong style={{ fontSize: 20 }}>{Math.max(0, rows.length - configuredCount)}</strong></div>
      </div>

      <div style={{ ...cardStyle, padding: 14, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
          <input aria-label="Buscar por nome, codigo ou SKU" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void load(); }} placeholder="Buscar por nome, codigo ou SKU" style={{ ...inputStyle, paddingLeft: 33 }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#334155' }}><input type="checkbox" checked={activeOnly} onChange={event => setActiveOnly(event.target.checked)} /> Somente precos ativos</label>
        <Button secondary onClick={() => void load()} disabled={loading}>Buscar</Button>
      </div>

      {loading && <div data-testid="pricing-loading" style={{ ...cardStyle, padding: 24, color: '#64748B' }}>Carregando precos...</div>}
      {error && <div data-testid="pricing-error" role="alert" style={{ color: '#B91C1C', background: '#FEF2F2', padding: 14, borderRadius: 10, marginBottom: 14 }}><AlertTriangle size={15} /> {error}</div>}

      {!loading && !error && rows.length === 0 && <div data-testid="pricing-empty" style={{ ...cardStyle, padding: 28, textAlign: 'center' }}><DollarSign size={30} style={{ color: '#94A3B8' }} /><h2 style={{ color: '#0F172A' }}>Nenhum item encontrado</h2><p style={smallMuted}>Crie itens no Catalogo e defina os precos comerciais nesta area.</p></div>}

      {!loading && !error && rows.length > 0 && (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead><tr style={{ textAlign: 'left', color: '#64748B', fontSize: 12, background: '#F8FAFC' }}><th style={{ padding: 12 }}>Item</th><th style={{ padding: 12 }}>SKU</th><th style={{ padding: 12 }}>Categoria</th><th style={{ padding: 12 }}>Preco padrao</th><th style={{ padding: 12 }}>Situacao</th><th style={{ padding: 12 }}>Personalizacoes</th><th style={{ padding: 12 }}>Atualizado</th><th style={{ padding: 12 }}>Acoes</th></tr></thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.item.id} data-testid="pricing-row" style={{ borderTop: '1px solid rgba(15,23,42,.08)' }}>
                    <td style={{ padding: 12 }}><strong style={{ color: '#0F172A', fontSize: 13 }}>{row.item.name}</strong><div style={smallMuted}>catalog_item_id {row.item.id}</div></td>
                    <td style={{ padding: 12, color: '#334155', fontSize: 13 }}>{row.item.sku ?? '-'}</td>
                    <td style={{ padding: 12, color: '#334155', fontSize: 13 }}>{row.item.metadata.find(field => field.key === 'categoria')?.value?.toString() ?? '-'}</td>
                    <td style={{ padding: 12, fontWeight: 850 }}>{money(row.price?.salePrice ?? null, row.price?.currency)}</td>
                    <td style={{ padding: 12 }}>{row.price ? <Badge tone={row.price.active ? 'success' : 'warning'}>{row.price.active ? 'Configurado' : 'Inativo'}</Badge> : <Badge tone="warning">Sem preco</Badge>}</td>
                    <td style={{ padding: 12, color: '#64748B', fontSize: 13 }}>Ver detalhes</td>
                    <td style={{ padding: 12, color: '#64748B', fontSize: 13 }}>{dateTime(row.price?.updatedAt)}</td>
                    <td style={{ padding: 12 }}><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}><Button secondary onClick={() => setDetailsRow(row)}><Eye size={13} /> Detalhes</Button>{row.price ? (canUpdate && <Button secondary onClick={() => setEditingRow(row)}><Edit size={13} /> Editar</Button>) : (canCreate && <Button secondary onClick={() => setEditingRow(row)}><Plus size={13} /> Definir</Button>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {creating && <Modal title="Criar preco padrao" onClose={() => setCreating(false)}><PriceForm row={null} itemsWithoutPrice={itemsWithoutPrice} onClose={() => setCreating(false)} onSaved={load} /></Modal>}
      {editingRow && <Modal title={editingRow.price ? 'Editar preco padrao' : 'Definir preco padrao'} onClose={() => setEditingRow(null)}><PriceForm row={editingRow} itemsWithoutPrice={itemsWithoutPrice} onClose={() => setEditingRow(null)} onSaved={load} /></Modal>}
      {detailsRow && <ProductDetails row={detailsRow} onClose={() => setDetailsRow(null)} canUpdateUnit={canUpdateUnit} />}
    </div>
  );
}
