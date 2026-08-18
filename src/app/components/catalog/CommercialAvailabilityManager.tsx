import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../../services/apiClient';
import {
  commercialAvailabilityService,
  type CommercialAvailability,
  type CommercialAvailabilityUnit,
} from '../../../services/commercialAvailabilityService';

interface Props {
  itemId: string;
  canUpdate: boolean;
}

const sourceLabels: Record<CommercialAvailability['source'], string> = {
  network: 'rede',
  store_type: 'tipo de loja',
  unit: 'unidade',
};

export function CommercialAvailabilityManager({ itemId, canUpdate }: Props) {
  const [units, setUnits] = useState<CommercialAvailabilityUnit[]>([]);
  const [unitId, setUnitId] = useState('');
  const [availability, setAvailability] = useState<CommercialAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    commercialAvailabilityService.listUnits()
      .then(nextUnits => {
        if (!active) return;
        setUnits(nextUnits);
        if (nextUnits.length === 1) void load(String(nextUnits[0].id));
      })
      .catch(cause => { if (active) setError(getApiErrorMessage(cause, 'Não foi possível carregar as unidades.')); });
    return () => { active = false; };
  }, []);

  async function load(selectedUnitId: string) {
    setUnitId(selectedUnitId);
    setAvailability(null);
    setError('');
    if (!selectedUnitId) return;
    setLoading(true);
    try {
      setAvailability(await commercialAvailabilityService.get(itemId, selectedUnitId));
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Não foi possível consultar a disponibilidade.'));
    } finally {
      setLoading(false);
    }
  }

  async function mutate(action: () => Promise<CommercialAvailability>) {
    setLoading(true);
    setError('');
    try {
      setAvailability(await action());
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Não foi possível alterar a disponibilidade.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section data-testid="commercial-availability-section" style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 18px', paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        Disponibilidade comercial
      </h2>
      <label htmlFor="commercial-availability-unit" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        Unidade
      </label>
      <select
        id="commercial-availability-unit"
        data-testid="commercial-availability-unit-select"
        value={unitId}
        onChange={event => void load(event.target.value)}
        style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 10px', background: 'white', color: '#0F172A' }}
      >
        <option value="">Selecione uma unidade</option>
        {units.map(unit => <option key={String(unit.id)} value={String(unit.id)}>{unit.name}</option>)}
      </select>

      {!unitId && units.length === 0 && !error && <p style={{ color: '#64748B', fontSize: 13 }}>Nenhuma unidade disponível.</p>}
      {loading && <p role="status" style={{ color: '#64748B', fontSize: 13 }}>Carregando disponibilidade...</p>}
      {error && <p role="alert" style={{ color: '#DC2626', fontSize: 13 }}>{error}</p>}

      {availability && !loading && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!availability.applicable ? (
            <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>Este item não se aplica à unidade selecionada.</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Valor efetivo</span>
                <strong style={{ color: availability.commerciallyAvailable ? '#059669' : '#DC2626', fontSize: 13 }}>
                  {availability.commerciallyAvailable ? 'Disponível' : 'Indisponível'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Origem</span>
                <strong style={{ color: '#0F172A', fontSize: 13 }}>
                  {availability.inherited ? `Herdado da ${sourceLabels[availability.source]}` : `Definido pela ${sourceLabels[availability.source]}`}
                </strong>
              </div>
              {canUpdate && (
                <>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#64748B', fontSize: 12 }}>Default da rede</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" disabled={loading} onClick={() => void mutate(() => commercialAvailabilityService.updateNetwork(itemId, true, unitId))}>Disponibilizar na rede</button>
                      <button type="button" disabled={loading} onClick={() => void mutate(() => commercialAvailabilityService.updateNetwork(itemId, false, unitId))}>Indisponibilizar na rede</button>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px', color: '#64748B', fontSize: 12 }}>Override da unidade</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" disabled={loading} onClick={() => void mutate(() => commercialAvailabilityService.updateUnit(itemId, unitId, true))}>Disponibilizar na unidade</button>
                    <button type="button" disabled={loading} onClick={() => void mutate(() => commercialAvailabilityService.updateUnit(itemId, unitId, false))}>Indisponibilizar na unidade</button>
                  </div>
                  </div>
                  {!availability.inherited && availability.source === 'unit' && (
                    <button type="button" disabled={loading} onClick={() => void mutate(() => commercialAvailabilityService.restoreUnit(itemId, unitId))}>
                      Restaurar herança
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
