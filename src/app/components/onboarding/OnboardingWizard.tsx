import { useEffect, useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Check, Layers, Building2,
  Palette, Users, Puzzle, DollarSign, FileUp, Sparkles,
  Plus, Trash2, Network, Star,
} from 'lucide-react';
import { useOnboarding } from '../../../shared/hooks/useOnboarding';
import { useTenant } from '../../../shared/context/TenantContext';
import { WIZARD_STEPS, type WizardStepData, type WizardStepId } from '../../../types/onboarding';
import { MODULE_REGISTRY } from '../../../services/moduleRegistry';
import { unitManagementService } from '../../../services/unitManagementService';
import { userManagementService } from '../../../services/userManagementService';
import type { TenantRole } from '../../../types/userManagement';

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? '20px' : '6px',
            height: '6px',
            background: i <= current ? '#6366F1' : '#E2E8F0',
          }}
        />
      ))}
    </div>
  );
}

// ─── Step components ───────────────────────────────────────────────────────────

function StepWelcome() {
  const { state } = useOnboarding();
  const name = state.stepData.network.networkName ?? 'sua rede';
  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
        <Layers size={36} color="white" />
      </div>
      <h2 style={{ color: '#0F172A', marginBottom: '8px' }}>Bem-vindo ao Orchestra! 🎉</h2>
      <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.7, maxWidth: '420px', marginBottom: '40px' }}>
        Olá! Vamos configurar a plataforma de gestão para <strong style={{ color: '#0F172A' }}>{name}</strong> em poucos minutos.
      </p>
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {[
          { icon: Building2, label: 'Gerencie unidades', desc: 'Monitore toda a rede', color: '#6366F1', bg: '#EEF2FF' },
          { icon: DollarSign, label: 'Controle financeiro', desc: 'Royalties e fluxo', color: '#10B981', bg: '#ECFDF5' },
          { icon: Users, label: 'Equipe integrada', desc: 'Permissões por perfil', color: '#F59E0B', bg: '#FFFBEB' },
        ].map(f => (
          <div key={f.label} className="p-4 rounded-xl text-center" style={{ background: f.bg }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: f.color }}>
              <f.icon size={16} color="white" />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{f.label}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepNetwork() {
  const { state, updateStepData } = useOnboarding();
  const d = state.stepData.network;
  const update = (k: string, v: string) => updateStepData({ network: { ...d, [k]: v } });
  const field = (label: string, key: keyof typeof d, placeholder: string, half?: boolean) => (
    <div className={half ? 'flex-1' : 'w-full'}>
      <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{label}</label>
      <input
        value={d[key] ?? ''}
        onChange={e => update(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl outline-none"
        style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', color: '#0F172A' }}
      />
    </div>
  );
  const SEGMENTS = ['Beleza e Estética', 'Alimentação', 'Educação', 'Saúde e Bem-estar', 'Serviços', 'Varejo', 'Outro'];
  return (
    <div className="space-y-4">
      {field('Nome da rede', 'networkName', 'Ex: Clin Franchising')}
      <div>
        <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Segmento</label>
        <select
          value={d.segment ?? ''}
          onChange={e => update('segment', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl outline-none"
          style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', color: '#0F172A' }}
        >
          <option value="">Selecione o segmento</option>
          {SEGMENTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-3">
        {field('CNPJ', 'cnpj', '00.000.000/0001-00', true)}
        {field('E-mail', 'email', 'contato@suarede.com.br', true)}
      </div>
      <div className="flex gap-3">
        {field('Cidade', 'city', 'São Paulo', true)}
        <div className="flex-1">
          <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Estado</label>
          <select value={d.state ?? 'SP'} onChange={e => update('state', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl outline-none"
            style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', color: '#0F172A' }}>
            {['SP','RJ','MG','PR','RS','BA','SC','GO','PE','CE','DF','ES','MT','MS','PA','MA','PI','AL','SE','RN','PB','AM','RO','AC','AP','RR','TO'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function StepWhiteLabel() {
  const { state, updateStepData } = useOnboarding();
  const { updateWhiteLabel } = useTenant();
  const d = state.stepData.whitelabel;
  const update = (k: string, v: string) => {
    updateStepData({ whitelabel: { ...d, [k]: v } });
    updateWhiteLabel({ [k]: v } as Record<string, string>);
  };
  const primary = d.primaryColor ?? '#6366F1';
  const secondary = d.secondaryColor ?? '#8B5CF6';
  const name = d.platformName ?? 'Orchestra';
  return (
    <div className="space-y-5">
      <div>
        <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Nome da plataforma</label>
        <input value={name} onChange={e => update('platformName', e.target.value)}
          placeholder="Orchestra"
          className="w-full px-3 py-2.5 rounded-xl outline-none"
          style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }} />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Cor primária</label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}>
            <input type="color" value={primary} onChange={e => update('primaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{primary}</span>
          </div>
        </div>
        <div className="flex-1">
          <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Cor secundária</label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}>
            <input type="color" value={secondary} onChange={e => update('secondaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{secondary}</span>
          </div>
        </div>
      </div>
      {/* Mini preview */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', padding: '8px 12px', background: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prévia da sidebar</div>
        <div className="flex" style={{ height: '120px', background: '#0F172A' }}>
          <div style={{ width: '180px', padding: '12px 8px' }}>
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                <Layers size={12} color="white" />
              </div>
              <div>
                <div style={{ color: '#F1F5F9', fontSize: '11px', fontWeight: 600, lineHeight: 1 }}>{name}</div>
                <div style={{ color: '#64748B', fontSize: '9px' }}>{state.stepData.network.networkName ?? 'Sua Rede'}</div>
              </div>
            </div>
            {['Dashboard', 'Unidades', 'Financeiro'].map(item => (
              <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5"
                style={{ background: item === 'Dashboard' ? `${primary}25` : 'transparent' }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: item === 'Dashboard' ? primary : '#334155' }} />
                <span style={{ fontSize: '11px', color: item === 'Dashboard' ? '#F1F5F9' : '#64748B' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepUnits() {
  const { state, updateStepData } = useOnboarding();
  const units = state.stepData.units;
  const [form, setForm] = useState({ name: '', city: '', state: 'SP', manager: '' });
  const STATES = ['SP','RJ','MG','PR','RS','BA','SC','GO','PE','CE'];

  const add = async () => {
    if (!form.name) return;
    const created = await unitManagementService.createUnit({
      name: form.name,
      status: 'active',
      address_city: form.city || null,
      address_state: form.state || null,
      responsible_name: form.manager || null,
    });
    const next = [...units, { id: String(created.id), name: created.name, city: created.address_city ?? '', state: created.address_state ?? '', manager: created.responsible_name ?? '' }];
    updateStepData({ units: next });
    setForm({ name: '', city: '', state: 'SP', manager: '' });
  };

  const remove = async (id: string) => {
    await unitManagementService.deleteUnit(id);
    updateStepData({ units: units.filter(u => u.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Adicionar unidade</div>
        <div className="space-y-2">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nome da unidade (ex: Unidade Centro SP)"
            className="w-full px-3 py-2 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }} />
          <div className="flex gap-2">
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Cidade" className="flex-1 px-3 py-2 rounded-lg outline-none"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }} />
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              className="px-3 py-2 rounded-lg outline-none"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}
            placeholder="Nome do gestor" className="w-full px-3 py-2 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }} />
          <button onClick={add} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white"
            style={{ background: '#6366F1', fontSize: '12px', fontWeight: 500 }}>
            <Plus size={14} /> Adicionar unidade
          </button>
        </div>
      </div>
      {units.length > 0 && (
        <div className="space-y-2">
          {units.map(u => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{u.name}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{u.city}, {u.state} · {u.manager}</div>
              </div>
              <button onClick={() => remove(u.id)} style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {units.length === 0 && (
        <div className="text-center py-4" style={{ color: '#94A3B8', fontSize: '13px' }}>
          Adicione ao menos uma unidade, ou pule esta etapa para fazer depois.
        </div>
      )}
    </div>
  );
}

function StepUsers() {
  const { state, updateStepData } = useOnboarding();
  const users = state.stepData.users;
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [role, setRole] = useState('');

  useEffect(() => {
    void userManagementService.listRoles().then(items => {
      setRoles(items);
      setRole(current => current || String(items[0]?.id ?? ''));
    }).catch(() => setRoles([]));
  }, []);

  const invite = async () => {
    if (!email || !role) return;
    const selectedRole = roles.find(item => String(item.id) === role);
    const created = await userManagementService.createUser({
      name: email.split('@')[0] || email,
      email,
      roles: [Number(role)],
      active: true,
    });
    const next = [...users, { id: String(created.id), email: created.email, role: selectedRole?.name ?? selectedRole?.slug ?? 'Perfil operacional' }];
    updateStepData({ users: next });
    setEmail('');
  };
  const remove = async (id: string) => {
    await userManagementService.deactivateUser(id);
    updateStepData({ users: users.filter(u => u.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Convidar colaborador</div>
        <div className="flex gap-2 mb-2">
          <input value={email} onChange={e => setEmail(e.target.value)} type="email"
            placeholder="email@colaborador.com.br" className="flex-1 px-3 py-2 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }} />
          <select value={role} onChange={e => setRole(e.target.value)} className="px-3 py-2 rounded-lg outline-none"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px' }}>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <button onClick={invite} disabled={!email || !role} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ background: '#6366F1', fontSize: '12px', fontWeight: 500 }}>
          <Plus size={14} /> Enviar convite
        </button>
      </div>
      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#0F172A' }}>{u.email}</div>
                <div style={{ fontSize: '11px', color: '#6366F1', fontWeight: 500 }}>{u.role}</div>
              </div>
              <button onClick={() => remove(u.id)} style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4" style={{ color: '#94A3B8', fontSize: '13px' }}>Convide colaboradores agora ou faça depois em Acessos.</div>
      )}
    </div>
  );
}

function StepModules() {
  const { state, updateStepData } = useOnboarding();
  const selected = new Set(state.stepData.modules);
  const CORE = new Set(['dashboard', 'units', 'clients', 'financial', 'access', 'settings', 'marketplace']);
  const marketplaceModules = MODULE_REGISTRY.filter(m => m.marketplace?.show && !CORE.has(m.id));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    updateStepData({ modules: Array.from(next) });
  };

  const statusColors: Record<string, string> = {
    active: '#10B981', available: '#6366F1', review: '#F59E0B', development: '#94A3B8', blocked: '#EF4444',
  };

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl" style={{ background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: 500 }}>
          Módulos core (Dashboard, Unidades, Clientes, Financeiro, Acessos) já estão inclusos em todos os planos.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {marketplaceModules.map(mod => {
          const isSelected = selected.has(mod.id);
          const isPaid = mod.status === 'available' && mod.price && mod.price !== 'Incluso';
          return (
            <button key={mod.id} onClick={() => mod.status !== 'blocked' && toggle(mod.id)}
              className="text-left p-3 rounded-xl transition-colors"
              style={{
                background: isSelected ? '#EEF2FF' : '#F8FAFC',
                border: `1px solid ${isSelected ? '#6366F1' : 'rgba(0,0,0,0.06)'}`,
                opacity: mod.status === 'blocked' ? 0.5 : 1,
                cursor: mod.status === 'blocked' ? 'not-allowed' : 'pointer',
              }}>
              <div className="flex items-start justify-between mb-1">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{mod.name}</span>
                {isSelected && <Check size={12} style={{ color: '#6366F1', flexShrink: 0 }} />}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-full" style={{
                  fontSize: '10px', fontWeight: 600,
                  background: `${statusColors[mod.status]}20`,
                  color: statusColors[mod.status],
                }}>
                  {mod.status === 'active' ? 'Incluso' : mod.status === 'available' ? 'Disponível' : mod.status === 'review' ? 'Em análise' : mod.status === 'development' ? 'Em breve' : 'Bloqueado'}
                </span>
                {isPaid && <span style={{ fontSize: '10px', color: '#64748B' }}>{mod.price}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepFinancial() {
  const { state, updateStepData } = useOnboarding();
  const d = state.stepData.financial;
  const update = (k: string, v: number) => updateStepData({ financial: { ...d, [k]: v } });

  const field = (label: string, key: keyof typeof d, suffix: string, min: number, max: number) => (
    <div>
      <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}>
        <input
          type="number" min={min} max={max} value={d[key] ?? 0}
          onChange={e => update(key, Number(e.target.value))}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}
        />
        <span style={{ fontSize: '13px', color: '#94A3B8' }}>{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div style={{ fontSize: '12px', color: '#92400E' }}>Estes valores podem ser ajustados individualmente por unidade depois da implantação.</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('Taxa de Royalties', 'royaltyRate', '%', 0, 20)}
        {field('Fundo de Marketing', 'adFundRate', '%', 0, 10)}
        {field('Dia de vencimento', 'billingDay', 'do mês', 1, 28)}
        {field('Prazo de carência', 'graceDays', 'dias', 0, 30)}
      </div>
      <div className="p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Resumo do modelo financeiro</div>
        <div style={{ fontSize: '13px', color: '#0F172A', lineHeight: 1.8 }}>
          Royalties de <strong>{d.royaltyRate ?? 7}%</strong> + Fundo de Marketing de <strong>{d.adFundRate ?? 2}%</strong> sobre faturamento bruto.
          Vencimento todo dia <strong>{d.billingDay ?? 15}</strong> com {d.graceDays ?? 5} dias de carência.
        </div>
      </div>
    </div>
  );
}

function StepClients() {
  const { state, updateStepData } = useOnboarding();
  const [selected, setSelected] = useState<'csv' | 'manual' | null>(null);
  const imported = state.stepData.clientsImported;

  const handleCSV = () => {
    setSelected('csv');
    updateStepData({ clientsImported: true });
  };

  return (
    <div className="space-y-4">
      {!imported ? (
        <>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
            Importe sua base de clientes existente para começar a usar o CRM desde o primeiro dia.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleCSV}
              className={`p-5 rounded-xl text-left transition-colors ${selected === 'csv' ? 'ring-2 ring-indigo-500' : ''}`}
              style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}>
              <FileUp size={24} style={{ color: '#6366F1', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Importar CSV</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Planilha com nome, e-mail, telefone e unidade</div>
            </button>
            <button onClick={() => setSelected('manual')}
              className={`p-5 rounded-xl text-left transition-colors ${selected === 'manual' ? 'ring-2 ring-indigo-500' : ''}`}
              style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}>
              <Users size={24} style={{ color: '#10B981', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Cadastro manual</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Adicionar clientes um a um depois do lançamento</div>
            </button>
          </div>
          {selected === 'csv' && (
            <div className="p-4 rounded-xl text-center" style={{ background: '#EEF2FF', border: '2px dashed #6366F1' }}>
              <div style={{ fontSize: '13px', color: '#6366F1', fontWeight: 500 }}>Importacao CSV sera feita pelo modulo de clientes</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Esta etapa registra apenas a preferencia inicial no backend.</div>
              <button className="mt-3 px-4 py-2 rounded-lg text-white" style={{ background: '#6366F1', fontSize: '12px' }}
                onClick={() => updateStepData({ clientsImported: true })}>
                Continuar depois
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: '#ECFDF5' }}>
            <Check size={28} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Importação concluída!</div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>Clientes prontos para uso no módulo CRM.</div>
        </div>
      )}
    </div>
  );
}

function StepReview() {
  const { state } = useOnboarding();
  const { tenant } = useTenant();
  const d = state.stepData;

  const items = [
    { label: 'Rede', value: d.network.networkName ?? tenant.name, icon: Network, color: '#6366F1' },
    { label: 'Segmento', value: d.network.segment ?? '—', icon: Star, color: '#F59E0B' },
    { label: 'Unidades cadastradas', value: `${d.units.length} unidade${d.units.length !== 1 ? 's' : ''}`, icon: Building2, color: '#10B981' },
    { label: 'Convites enviados', value: `${d.users.length} convite${d.users.length !== 1 ? 's' : ''}`, icon: Users, color: '#3B82F6' },
    { label: 'Módulos ativos', value: `${d.modules.length} módulos`, icon: Puzzle, color: '#8B5CF6' },
    { label: 'Taxa de royalties', value: `${d.financial.royaltyRate ?? 7}% + ${d.financial.adFundRate ?? 2}% fundo`, icon: DollarSign, color: '#10B981' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <Sparkles size={28} color="white" />
        </div>
        <h3 style={{ color: '#0F172A', marginBottom: '4px' }}>Tudo pronto!</h3>
        <p style={{ fontSize: '13px', color: '#64748B' }}>Revise o resumo e clique em Lançar para começar.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-xl"
            style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}15` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <div className="min-w-0">
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 600 }} className="truncate">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step registry ─────────────────────────────────────────────────────────────

const STEP_ICONS = [Layers, Network, Palette, Building2, Users, Puzzle, DollarSign, FileUp, Sparkles];
const STEP_COMPONENTS = [StepWelcome, StepNetwork, StepWhiteLabel, StepUnits, StepUsers, StepModules, StepFinancial, StepClients, StepReview];

function stepPayload(stepId: WizardStepId, data: WizardStepData): Partial<WizardStepData> {
  if (stepId === 'network') return { network: data.network };
  if (stepId === 'whitelabel') return { whitelabel: data.whitelabel };
  if (stepId === 'units') return { units: data.units };
  if (stepId === 'users') return { users: data.users };
  if (stepId === 'modules') return { modules: data.modules };
  if (stepId === 'financial') return { financial: data.financial };
  if (stepId === 'clients') return { clientsImported: data.clientsImported };

  return {};
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { state, closeWizard, goToStep, saveStepData, completeWizard } = useOnboarding();
  const { wizardOpen, currentWizardStep } = state;

  if (!wizardOpen) return null;

  const stepDef = WIZARD_STEPS[currentWizardStep];
  const StepContent = STEP_COMPONENTS[currentWizardStep];
  const StepIcon = STEP_ICONS[currentWizardStep];
  const isLast = currentWizardStep === WIZARD_STEPS.length - 1;
  const isFirst = currentWizardStep === 0;

  const next = async () => {
    const stepId = stepDef.id as WizardStepId;
    await saveStepData(stepId, stepPayload(stepId, state.stepData));
    if (isLast) {
      await completeWizard();
    } else {
      goToStep(currentWizardStep + 1);
    }
  };

  const back = () => goToStep(currentWizardStep - 1);
  const skip = async () => {
    const stepId = stepDef.id as WizardStepId;
    await saveStepData(stepId, stepPayload(stepId, state.stepData));
    goToStep(currentWizardStep + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'white', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
              <StepIcon size={18} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{stepDef.title}</div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>{stepDef.subtitle}</div>
            </div>
          </div>
          {state.wizardStarted && (
            <button onClick={closeWizard} className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <StepIndicator current={currentWizardStep} total={WIZARD_STEPS.length} />
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
              {currentWizardStep + 1} / {WIZARD_STEPS.length}
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: '#F1F5F9' }}>
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${((currentWizardStep + 1) / WIZARD_STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <StepContent />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div>
            {!isFirst && (
              <button onClick={back} className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors"
                style={{ color: '#64748B', fontSize: '13px', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <ChevronLeft size={16} /> Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stepDef.skippable && !isLast && (
              <button onClick={skip} style={{ fontSize: '13px', color: '#94A3B8', padding: '8px 12px' }}>Pular</button>
            )}
            <button onClick={next}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: isLast ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '13px', fontWeight: 600 }}>
              {isLast ? (
                <><Sparkles size={14} /> Lançar plataforma!</>
              ) : (
                <>Próximo <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
