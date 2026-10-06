import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '../../services/apiClient';
import {
  replenishmentService,
  type ReplenishmentOffer,
  type ReplenishmentSuggestion,
} from '../../services/replenishmentService';
import { unitManagementService } from '../../services/unitManagementService';
import { usePermission } from '../../shared/hooks/usePermission';

type SelectedOffer = { quantity: number };

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 14, overflow: 'hidden' };

function offerKey(itemId: number, offerId: number) {
  return `${itemId}:${offerId}`;
}

function Offer({
  item,
  offer,
  selected,
  onSelect,
  onQuantity,
}: {
  item: ReplenishmentSuggestion;
  offer: ReplenishmentOffer;
  selected?: SelectedOffer;
  onSelect: (checked: boolean) => void;
  onQuantity: (quantity: number) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 5, padding: '8px 0', borderTop: '1px solid #E2E8F0' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#334155' }}>
        <input
          type="checkbox"
          aria-label={`${item.item_name} - ${offer.supplier_name}`}
          checked={Boolean(selected)}
          onChange={event => onSelect(event.target.checked)}
        />
        {offer.supplier_name}{offer.preferred ? ' (preferencial)' : ''}
      </label>
      <div style={{ color: '#64748B', fontSize: 12 }}>
        Sugerido {offer.suggested_quantity} · MOQ {offer.moq} · múltiplo {offer.purchase_multiple} · embalagem {offer.package_quantity} · prazo {offer.lead_time_days} dias
      </div>
      {selected && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12 }}>
          Quantidade de {item.item_name}
          <input
            type="number"
            min={offer.moq}
            step={offer.purchase_multiple}
            aria-label={`Quantidade de ${item.item_name}`}
            value={selected.quantity}
            onChange={event => onQuantity(Number(event.target.value))}
            style={{ width: 90, border: '1px solid #CBD5E1', borderRadius: 7, padding: '6px 8px' }}
          />
        </label>
      )}
    </div>
  );
}

export function ReplenishmentPage() {
  const { hasPermission } = usePermission();
  const [suggestions, setSuggestions] = useState<ReplenishmentSuggestion[]>([]);
  const [selected, setSelected] = useState<Record<string, SelectedOffer>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const units = await unitManagementService.getUnitOptions();
        const unitId = Number(units[0]?.value);
        if (!unitId) throw new Error('Nenhuma unidade disponivel.');
        const data = await replenishmentService.listSuggestions(unitId);
        if (active) setSuggestions(data);
      } catch (loadError) {
        if (active) setError(getApiErrorMessage(loadError, 'Nao foi possivel carregar as sugestoes.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  const createOrders = async () => {
    const groups = new Map<string, Parameters<typeof replenishmentService.createPurchaseOrder>[0]>();
    suggestions.forEach(item => item.offers.forEach(offer => {
      const choice = selected[offerKey(item.inventory_item_id, offer.id)];
      if (!choice) return;
      const key = `${item.unit_id}:${offer.supplier_id}`;
      const group = groups.get(key) ?? { unit_id: item.unit_id, supplier_id: offer.supplier_id, items: [] };
      group.items.push({ inventory_item_id: item.inventory_item_id, supplier_offer_id: offer.id, quantity: choice.quantity });
      groups.set(key, group);
    }));
    if (!groups.size) return;

    setCreating(true);
    try {
      await Promise.all([...groups.values()].map(payload => replenishmentService.createPurchaseOrder(payload)));
      setSelected({});
      toast.success(groups.size === 1 ? 'Pedido de compra criado.' : 'Pedidos de compra criados.');
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, 'Nao foi possivel criar os pedidos de compra.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <main style={pageStyle}>
      <Link to="/inventory" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748B', textDecoration: 'none', fontSize: 12, marginBottom: 10 }}>
        <ChevronLeft size={14} /> Voltar
      </Link>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}><PackagePlus size={22} /></div>
          <div>
            <h1 style={{ margin: 0, color: '#0F172A', fontSize: 22 }}>Sugestões de reposição</h1>
            <p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>Recomendações de compra calculadas com o saldo atual.</p>
          </div>
        </div>
        <button type="button" disabled={!selectedCount || creating || !hasPermission('tenant.procurement.purchase_orders.create')} onClick={() => void createOrders()} style={{ border: 0, borderRadius: 10, padding: '10px 16px', color: '#fff', fontWeight: 700, background: !selectedCount || creating || !hasPermission('tenant.procurement.purchase_orders.create') ? '#CBD5E1' : '#6366F1', cursor: !selectedCount || creating || !hasPermission('tenant.procurement.purchase_orders.create') ? 'not-allowed' : 'pointer' }}>
          {creating ? 'Criando...' : 'Criar pedidos de compra'}
        </button>
      </header>

      {loading && <p>Carregando sugestões...</p>}
      {error && <div role="alert" style={{ ...cardStyle, padding: 18, color: '#B91C1C' }}>{error}</div>}
      {!loading && !error && (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', background: '#F8FAFC', color: '#475569' }}><th style={{ padding: 14 }}>Item</th><th>Saldo</th><th>Alvo</th><th style={{ padding: 14 }}>Ofertas e quantidade sugerida</th></tr></thead>
            <tbody>
              {suggestions.map(item => (
                <tr key={item.inventory_item_id} style={{ borderTop: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                  <td style={{ padding: 14 }}><strong>{item.item_name}</strong><div style={{ color: '#64748B', fontSize: 12 }}>{item.sku}</div></td>
                  <td style={{ padding: '14px 0' }}>{item.current_stock}</td>
                  <td style={{ padding: '14px 0' }}>{item.target_stock}</td>
                  <td style={{ padding: 14 }}>
                    {!item.offers.length && <span style={{ color: '#B45309', fontWeight: 700 }}>Sem oferta autorizada</span>}
                    {item.offers.map(offer => {
                      const key = offerKey(item.inventory_item_id, offer.id);
                      return <Offer key={offer.id} item={item} offer={offer} selected={selected[key]} onSelect={checked => setSelected(current => {
                        if (checked) return { ...current, [key]: { quantity: offer.suggested_quantity } };
                        const next = { ...current }; delete next[key]; return next;
                      })} onQuantity={quantity => setSelected(current => ({ ...current, [key]: { quantity } }))} />;
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
