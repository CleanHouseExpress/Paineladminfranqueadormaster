import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CheckCircle, ChevronRight, FilePlus, FileText, Lock, Save, X } from 'lucide-react';

import { CONTRACT_STATUS_CONFIG } from '../../../types/contract';
import type { ContractStatus } from '../../../types/contract';
import {
  createContract,
  getContract,
  getCustomerOptions,
  getDocumentOptions,
  getUnitOptions,
  updateContract,
} from '../../../services/contractService';

interface Option {
  value: string | number;
  label: string;
}

function computeDurationMonths(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) return null;
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }}>
        <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
        {label}{required ? <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span> : null}
      </label>
      {children}
      {hint ? <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94A3B8' }}>{hint}</p> : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  fontSize: '13px',
  color: '#0F172A',
  background: '#F8FAFC',
  outline: 'none',
  boxSizing: 'border-box',
};

export function ContractForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState<ContractStatus>('draft');
  const [clientId, setClientId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customers, setCustomers] = useState<Option[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [documents, setDocuments] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [customerOptions, unitOptions, documentOptions] = await Promise.all([
        getCustomerOptions(),
        getUnitOptions(),
        getDocumentOptions(),
      ]);
      setCustomers(customerOptions);
      setUnits(unitOptions);
      setDocuments(documentOptions);

      if (id) {
        const contract = await getContract(id);
        if (contract) {
          setTitle(contract.title);
          setNumber(contract.number.startsWith('CTR-') ? '' : contract.number);
          setStatus(contract.status);
          setClientId(contract.clientId);
          setUnitId(contract.unitId ?? '');
          setDocumentId(contract.documentId ?? '');
          setStartDate(contract.startDate);
          setEndDate(contract.endDate);
          setNotes(contract.notes ?? '');
        }
      }
    }

    void load();
  }, [id]);

  const durationMonths = useMemo(() => computeDurationMonths(startDate, endDate), [startDate, endDate]);
  const selectedDocument = documents.find(option => String(option.value) === documentId);

  async function handleSave(asDraft: boolean) {
    setSaving(true);
    try {
      const payload = {
        title,
        number,
        status: asDraft ? 'draft' as ContractStatus : status,
        clientId,
        unitId,
        documentId,
        startDate,
        endDate,
        notes,
      };

      if (id) {
        await updateContract(id, payload);
      } else {
        await createContract(payload);
      }

      navigate('/contracts');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          <Link to="/contracts" style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>Contratos</Link>
          <ChevronRight size={12} />
          <span style={{ color: '#64748B' }}>{isEdit ? 'Editar Contrato' : 'Novo Contrato'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FilePlus size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{isEdit ? 'Editar Contrato' : 'Novo Contrato'}</h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>Vincule cliente, unidade e documento PDF.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/contracts')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
              <X size={14} /> Cancelar
            </button>
            <button disabled={saving} onClick={() => void handleSave(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#6366F1', cursor: 'pointer' }}>
              <Save size={14} /> Salvar Rascunho
            </button>
            <button disabled={saving} onClick={() => void handleSave(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <CheckCircle size={14} /> Salvar Contrato
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '16px', alignItems: 'start' }}>
        <div>
          <SectionCard title="Identificacao">
            <FormField label="Titulo" required>
              <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Nome do contrato..." style={{ ...inputStyle, fontSize: '15px', fontWeight: 600 }} />
            </FormField>
            <FormField label="Numero do Contrato" hint="Sera gerado automaticamente se deixado em branco">
              <input value={number} onChange={event => setNumber(event.target.value)} placeholder="ACME-001" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </FormField>
            <FormField label="Status">
              <select value={status} onChange={event => setStatus(event.target.value as ContractStatus)} style={inputStyle}>
                {(Object.keys(CONTRACT_STATUS_CONFIG) as ContractStatus[]).map(item => <option key={item} value={item}>{CONTRACT_STATUS_CONFIG[item].label}</option>)}
              </select>
            </FormField>
          </SectionCard>

          <SectionCard title="Partes Envolvidas">
            <FormField label="Cliente" required>
              <select value={clientId} onChange={event => setClientId(event.target.value)} style={inputStyle}>
                <option value="">Selecionar cliente...</option>
                {customers.map(option => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
              </select>
            </FormField>
            <FormField label="Unidade">
              <select value={unitId} onChange={event => setUnitId(event.target.value)} style={inputStyle}>
                <option value="">Sem vinculo</option>
                {units.map(option => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
              </select>
            </FormField>
          </SectionCard>

          <SectionCard title="Vigencia e Notas">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Data Inicial" required>
                <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Data Final">
                <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} style={inputStyle} />
              </FormField>
            </div>
            {durationMonths !== null ? <div style={{ display: 'inline-flex', gap: '6px', padding: '5px 12px', background: '#F1F5F9', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>Duracao: <strong>{durationMonths} meses</strong></div> : null}
            <FormField label="Observacoes">
              <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={4} placeholder="Notas internas..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </FormField>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Documento Vinculado">
            <FormField label="Documento PDF/DOCX">
              <select value={documentId} onChange={event => setDocumentId(event.target.value)} style={inputStyle}>
                <option value="">Nenhum documento vinculado</option>
                {documents.map(option => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
              </select>
            </FormField>
            {selectedDocument ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: 800 }}>PDF</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{selectedDocument.label}</div>
              </div>
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B' }}>
                <FileText size={24} color="#94A3B8" />
                <p style={{ fontSize: '13px' }}>Nenhum documento vinculado</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Funcionalidades Futuras">
            {['Assinatura eletronica', 'Renovacao automatica', 'Portal Cliente', 'Workflow de aprovacao'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}><Lock size={13} /> {item}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>Em breve</span>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
