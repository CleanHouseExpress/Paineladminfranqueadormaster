import { useEffect, useMemo, useState } from 'react';
import {
  Banknote, Building2, CheckCircle2, CreditCard, Edit, Landmark, Plus,
  Search, Trash2, WalletCards, X,
} from 'lucide-react';
import { toast } from 'sonner';

import { DynamicTableRenderer, type ColumnDef } from '../../../shared/components/DynamicTableRenderer';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';
import { usePermission } from '../../../shared/hooks/usePermission';
import { ApiError } from '../../../services/apiClient';
import { financialService } from '../../../services/financialService';
import {
  FINANCIAL_ACCOUNT_TYPES, FINANCIAL_PERMISSIONS,
  type FinancialAccount, type FinancialAccountOption, type FinancialAccountPayload,
  type FinancialAccountType, type FinancialTransaction, type FinancialTransactionPayload,
  type FinancialTransactionStatus, type FinancialTransactionType,
} from '../../../types/financial';

const pageStyle: React.CSSProperties = { padding: 24, background: '#F8FAFC', minHeight: '100%' };
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 14,
  boxShadow: '0 1px 4px rgba(15,23,42,.04)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid rgba(0,0,0,.12)',
  borderRadius: 9, fontSize: 13, color: '#0F172A', background: '#fff',
  outline: 'none', boxSizing: 'border-box',
};

const TRANSACTION_STATUS: Record<FinancialTransactionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#D97706', bg: '#FFFBEB' },
  paid: { label: 'Pago', color: '#059669', bg: '#ECFDF5' },
  overdue: { label: 'Vencido', color: '#DC2626', bg: '#FEF2F2' },
  canceled: { label: 'Cancelado', color: '#64748B', bg: '#F1F5F9' },
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function apiMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object') return fallback;
  const payload = error.data as { message?: string; errors?: Record<string, string[]> };
  const validation = payload.errors ? Object.values(payload.errors).flat()[0] : undefined;
  return validation ?? payload.message ?? fallback;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{label}</span>
      {children}
      {hint && <small style={{ color: '#94A3B8', fontSize: 11 }}>{hint}</small>}
    </label>
  );
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#10B981,#059669)' }}>
          <Banknote size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, color: '#0F172A', fontSize: 22, fontWeight: 800 }}>{title}</h1>
          <p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px',
      borderRadius: 10, border: 0, background: disabled ? '#CBD5E1' : 'linear-gradient(135deg,#10B981,#059669)',
      color: '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{children}</button>
  );
}

function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.46)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ ...cardStyle, width: 'min(680px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '17px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 17, color: '#0F172A' }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ border: 0, background: 'transparent', color: '#64748B', cursor: 'pointer' }}><X size={19} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function Filters({ children }: { children: React.ReactNode }) {
  return <div style={{ ...cardStyle, padding: 14, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', minWidth: 250, flex: '1 1 280px' }}>
      <Search size={14} style={{ position: 'absolute', left: 11, top: 11, color: '#94A3B8' }} />
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 33 }} />
    </div>
  );
}

const emptyTransactionForm = (): FinancialTransactionPayload => ({
  description: '', type: 'expense', status: 'pending', amount: 0,
  issued_at: new Date().toISOString().slice(0, 10), due_date: '', category: '', method: '',
});

export function FinancialTransactions() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [accountId, setAccountId] = useState('');
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState<FinancialTransaction | null>(null);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [form, setForm] = useState<FinancialTransactionPayload>(emptyTransactionForm);
  const [payAccountId, setPayAccountId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [result, options] = await Promise.all([
        financialService.listTransactions({ search, type, status, financial_account_id: accountId }),
        financialService.accountOptions(),
      ]);
      setTransactions(result.data);
      setAccounts(options);
    } catch (loadError) {
      setError(apiMessage(loadError, 'Não foi possível carregar as transações financeiras.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [search, type, status, accountId]);

  const showForm = (transaction?: FinancialTransaction) => {
    setEditing(transaction ?? null);
    setForm(transaction ? {
      description: transaction.description,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      issued_at: transaction.issuedAt ?? '',
      due_date: transaction.dueDate ?? '',
      category: transaction.category ?? '',
      method: transaction.method ?? '',
      financial_account_id: transaction.financialAccountId ? Number(transaction.financialAccountId) : null,
    } : emptyTransactionForm());
    setOpen(true);
  };

  const save = async () => {
    if (!form.description.trim() || Number(form.amount) <= 0) {
      toast.error('Informe a descrição e um valor maior que zero.');
      return;
    }
    setSaving(true);
    try {
      if (editing) await financialService.updateTransaction(editing.id, form);
      else await financialService.createTransaction(form);
      toast.success(editing ? 'Transação atualizada.' : 'Transação criada.');
      setOpen(false);
      await load();
    } catch (saveError) {
      toast.error(apiMessage(saveError, 'Não foi possível salvar a transação.'));
    } finally {
      setSaving(false);
    }
  };

  const pay = async () => {
    if (!paying || !payAccountId) {
      toast.error('Selecione a conta que receberá a movimentação.');
      return;
    }
    setSaving(true);
    try {
      await financialService.payTransaction(paying.id, payAccountId);
      toast.success(paying.type === 'income' ? 'Receita recebida e saldo atualizado.' : 'Despesa paga e saldo atualizado.');
      setPaying(null);
      setPayAccountId('');
      await load();
    } catch (payError) {
      toast.error(apiMessage(payError, 'Não foi possível concluir o pagamento.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (transaction: FinancialTransaction) => {
    if (!window.confirm(`Excluir a transação "${transaction.description}"?`)) return;
    try {
      await financialService.deleteTransaction(transaction.id);
      toast.success('Transação excluída.');
      await load();
    } catch (deleteError) {
      toast.error(apiMessage(deleteError, 'Não foi possível excluir a transação.'));
    }
  };

  const columns: ColumnDef[] = [
    { key: 'description', label: 'Descrição', sortable: true, width: '25%' },
    {
      key: 'type', label: 'Tipo', type: 'badge', width: '90px',
      badgeConfig: {
        income: { label: 'Receita', color: '#059669', bg: '#ECFDF5' },
        expense: { label: 'Despesa', color: '#DC2626', bg: '#FEF2F2' },
      },
    },
    { key: 'category', label: 'Categoria', width: '130px' },
    { key: 'dueDate', label: 'Vencimento', type: 'date', sortable: true, width: '110px' },
    {
      key: 'accountName', label: 'Conta', width: '150px',
      render: (_value, row) => <span style={{ color: row.accountName ? '#0F172A' : '#94A3B8', fontSize: 13 }}>{String(row.accountName || 'Não definida')}</span>,
    },
    {
      key: 'status', label: 'Status', type: 'badge', width: '100px',
      badgeConfig: TRANSACTION_STATUS,
    },
    {
      key: 'amount', label: 'Valor', width: '125px', sortable: true,
      render: (value, row) => <strong style={{ color: row.type === 'income' ? '#059669' : '#DC2626', fontSize: 13 }}>{row.type === 'income' ? '+' : '-'} {money(Number(value))}</strong>,
    },
  ];

  const tableData = transactions.map(transaction => ({
    ...transaction,
    accountName: transaction.financialAccount?.name ?? '',
  }));

  if (error && transactions.length === 0) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  return (
    <div style={pageStyle}>
      <PageHeader title="Transações Financeiras" description="Registre receitas e despesas e movimente o saldo das contas ao pagar ou receber." action={
        <PrimaryButton onClick={() => showForm()}><Plus size={15} /> Nova transação</PrimaryButton>
      } />

      <Filters>
        <SearchField value={search} onChange={setSearch} placeholder="Buscar por descrição..." />
        <select value={type} onChange={event => setType(event.target.value)} style={{ ...inputStyle, width: 145 }}>
          <option value="">Todos os tipos</option><option value="income">Receitas</option><option value="expense">Despesas</option>
        </select>
        <select value={status} onChange={event => setStatus(event.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">Todos os status</option>
          {Object.entries(TRANSACTION_STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
        </select>
        <select value={accountId} onChange={event => setAccountId(event.target.value)} style={{ ...inputStyle, width: 190 }}>
          <option value="">Todas as contas</option>
          {accounts.map(account => <option key={account.id} value={account.id}>{account.label}</option>)}
        </select>
      </Filters>

      <DynamicTableRenderer columns={columns} data={tableData as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhuma transação encontrada." actions={[
        { label: 'Editar', icon: <Edit size={13} />, onClick: row => showForm(row as unknown as FinancialTransaction), showCondition: row => row.status !== 'paid' },
        {
          label: 'Marcar como pago', icon: <CheckCircle2 size={13} />, showCondition: row => !['paid', 'canceled'].includes(String(row.status)),
          onClick: row => { setPaying(row as unknown as FinancialTransaction); setPayAccountId(''); },
        },
        { label: 'Excluir', icon: <Trash2 size={13} />, variant: 'danger', onClick: row => void remove(row as unknown as FinancialTransaction), showCondition: row => row.status !== 'paid' },
      ]} />

      <Modal title={editing ? 'Editar transação' : 'Nova transação'} open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'grid', gap: 15 }}>
          <Field label="Descrição">
            <input value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} style={inputStyle} placeholder="Ex.: Pagamento de energia" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
            <Field label="Tipo">
              <select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as FinancialTransactionType }))} style={inputStyle}>
                <option value="income">Receita</option><option value="expense">Despesa</option>
              </select>
            </Field>
            <Field label="Valor">
              <input type="number" min="0.01" step="0.01" value={form.amount || ''} onChange={event => setForm(current => ({ ...current, amount: Number(event.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="Data de emissão">
              <input type="date" value={form.issued_at ?? ''} onChange={event => setForm(current => ({ ...current, issued_at: event.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Vencimento">
              <input type="date" value={form.due_date ?? ''} onChange={event => setForm(current => ({ ...current, due_date: event.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Categoria">
              <input value={form.category ?? ''} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} style={inputStyle} placeholder="Ex.: Fornecedores" />
            </Field>
            <Field label="Forma de pagamento">
              <input value={form.method ?? ''} onChange={event => setForm(current => ({ ...current, method: event.target.value }))} style={inputStyle} placeholder="Ex.: Boleto, PIX" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as FinancialTransactionStatus }))} style={inputStyle}>
                <option value="pending">Pendente</option><option value="overdue">Vencido</option><option value="canceled">Cancelado</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, paddingTop: 5 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
            <PrimaryButton onClick={() => void save()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar transação'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal title={paying?.type === 'income' ? 'Receber receita' : 'Pagar despesa'} open={Boolean(paying)} onClose={() => setPaying(null)}>
        {paying && <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ padding: 15, borderRadius: 11, background: paying.type === 'income' ? '#ECFDF5' : '#FEF2F2' }}>
            <strong style={{ color: '#0F172A', display: 'block' }}>{paying.description}</strong>
            <span style={{ color: paying.type === 'income' ? '#059669' : '#DC2626', fontSize: 20, fontWeight: 800 }}>{money(paying.amount)}</span>
          </div>
          <Field label="Conta financeira" hint="O saldo desta conta será atualizado imediatamente.">
            <select value={payAccountId} onChange={event => setPayAccountId(event.target.value)} style={inputStyle}>
              <option value="">Selecione uma conta ativa</option>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.label}</option>)}
            </select>
          </Field>
          {accounts.length === 0 && <p style={{ margin: 0, color: '#D97706', fontSize: 12 }}>Cadastre uma conta financeira ativa antes de concluir o pagamento.</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <button type="button" onClick={() => setPaying(null)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
            <PrimaryButton onClick={() => void pay()} disabled={saving || !payAccountId}>{saving ? 'Processando...' : 'Confirmar'}</PrimaryButton>
          </div>
        </div>}
      </Modal>
    </div>
  );
}

const emptyAccountForm = (): FinancialAccountPayload => ({
  name: '', type: 'bank', bank_name: '', agency: '', account_number: '',
  pix_key: '', initial_balance: 0, active: true,
});

export function FinancialAccounts() {
  const { hasPermission } = usePermission();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);
  const [form, setForm] = useState<FinancialAccountPayload>(emptyAccountForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await financialService.listAccounts({ search, type, active });
      setAccounts(result.data);
    } catch (loadError) {
      setError(apiMessage(loadError, 'Não foi possível carregar as contas financeiras.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [search, type, active]);

  const totals = useMemo(() => ({
    balance: accounts.filter(account => account.active).reduce((sum, account) => sum + account.currentBalance, 0),
    active: accounts.filter(account => account.active).length,
  }), [accounts]);

  const showForm = (account?: FinancialAccount) => {
    setEditing(account ?? null);
    setForm(account ? {
      name: account.name,
      type: account.type,
      bank_name: account.bankName ?? '',
      agency: account.agency ?? '',
      account_number: account.accountNumber ?? '',
      pix_key: account.pixKey ?? '',
      initial_balance: account.initialBalance,
      active: account.active,
      metadata: account.metadata,
    } : emptyAccountForm());
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Informe o nome da conta.');
      return;
    }
    setSaving(true);
    try {
      if (editing) await financialService.updateAccount(editing.id, form);
      else await financialService.createAccount(form);
      toast.success(editing ? 'Conta financeira atualizada.' : 'Conta financeira criada.');
      setOpen(false);
      await load();
    } catch (saveError) {
      toast.error(apiMessage(saveError, 'Não foi possível salvar a conta.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (account: FinancialAccount) => {
    if (!window.confirm(`Excluir a conta "${account.name}"?`)) return;
    try {
      await financialService.deleteAccount(account.id);
      toast.success('Conta financeira excluída.');
      await load();
    } catch (deleteError) {
      toast.error(apiMessage(deleteError, 'Não foi possível excluir a conta. Se ela possui transações, desative-a.'));
    }
  };

  const columns: ColumnDef[] = [
    {
      key: 'name', label: 'Conta', sortable: true, width: '25%',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: '#ECFDF5', color: '#059669' }}>
            {row.type === 'cash' ? <Banknote size={15} /> : row.type === 'investment' ? <CreditCard size={15} /> : <Landmark size={15} />}
          </span>
          <strong style={{ fontSize: 13, color: '#0F172A' }}>{String(value)}</strong>
        </div>
      ),
    },
    {
      key: 'type', label: 'Tipo', type: 'badge', width: '105px',
      badgeConfig: Object.fromEntries(Object.entries(FINANCIAL_ACCOUNT_TYPES).map(([key, config]) => [key, config])),
    },
    { key: 'bankName', label: 'Instituição', width: '140px' },
    {
      key: 'details', label: 'Agência / Conta', width: '160px',
      render: (_value, row) => <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>{String(row.details || '—')}</span>,
    },
    { key: 'initialBalance', label: 'Saldo inicial', type: 'currency', width: '125px' },
    {
      key: 'currentBalance', label: 'Saldo atual', width: '135px', sortable: true,
      render: value => <strong style={{ color: Number(value) >= 0 ? '#059669' : '#DC2626', fontSize: 13 }}>{money(Number(value))}</strong>,
    },
    {
      key: 'active', label: 'Situação', type: 'badge', width: '90px',
      badgeConfig: {
        true: { label: 'Ativa', color: '#059669', bg: '#ECFDF5' },
        false: { label: 'Inativa', color: '#64748B', bg: '#F1F5F9' },
      },
    },
  ];

  const tableData = accounts.map(account => ({
    ...account,
    details: [account.agency, account.accountNumber].filter(Boolean).join(' / '),
  }));

  if (error && accounts.length === 0) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void load()} />;

  return (
    <div style={pageStyle}>
      <PageHeader title="Contas Financeiras" description="Controle caixas, bancos, PIX, carteiras e investimentos onde o dinheiro da operação está." action={
        hasPermission(FINANCIAL_PERMISSIONS.accountsCreate)
          ? <PrimaryButton onClick={() => showForm()}><Plus size={15} /> Nova conta</PrimaryButton>
          : undefined
      } />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,240px))', gap: 12, marginBottom: 16 }}>
        <div style={{ ...cardStyle, padding: 16 }}><small style={{ color: '#64748B' }}>Saldo das contas exibidas</small><strong style={{ display: 'block', fontSize: 22, color: totals.balance >= 0 ? '#059669' : '#DC2626', marginTop: 5 }}>{money(totals.balance)}</strong></div>
        <div style={{ ...cardStyle, padding: 16 }}><small style={{ color: '#64748B' }}>Contas ativas exibidas</small><strong style={{ display: 'block', fontSize: 22, color: '#0F172A', marginTop: 5 }}>{totals.active}</strong></div>
      </div>

      <Filters>
        <SearchField value={search} onChange={setSearch} placeholder="Buscar conta, banco ou chave PIX..." />
        <select value={type} onChange={event => setType(event.target.value)} style={{ ...inputStyle, width: 170 }}>
          <option value="">Todos os tipos</option>
          {Object.entries(FINANCIAL_ACCOUNT_TYPES).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
        </select>
        <select value={active} onChange={event => setActive(event.target.value)} style={{ ...inputStyle, width: 145 }}>
          <option value="">Todas</option><option value="true">Ativas</option><option value="false">Inativas</option>
        </select>
      </Filters>

      <DynamicTableRenderer columns={columns} data={tableData as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Nenhuma conta financeira encontrada." actions={[
        { label: 'Editar', icon: <Edit size={13} />, onClick: row => showForm(row as unknown as FinancialAccount), showCondition: () => hasPermission(FINANCIAL_PERMISSIONS.accountsUpdate) },
        { label: 'Excluir', icon: <Trash2 size={13} />, variant: 'danger', onClick: row => void remove(row as unknown as FinancialAccount), showCondition: () => hasPermission(FINANCIAL_PERMISSIONS.accountsDelete) },
      ]} />

      <Modal title={editing ? 'Editar conta financeira' : 'Nova conta financeira'} open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'grid', gap: 15 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Nome da conta">
              <input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} style={inputStyle} placeholder="Ex.: Banco Inter Operacional" />
            </Field>
            <Field label="Tipo">
              <select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as FinancialAccountType }))} style={inputStyle}>
                {Object.entries(FINANCIAL_ACCOUNT_TYPES).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
              </select>
            </Field>
          </div>

          {['bank', 'investment'].includes(form.type) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
              <Field label="Banco / instituição"><input value={form.bank_name ?? ''} onChange={event => setForm(current => ({ ...current, bank_name: event.target.value }))} style={inputStyle} /></Field>
              <Field label="Agência"><input value={form.agency ?? ''} onChange={event => setForm(current => ({ ...current, agency: event.target.value }))} style={inputStyle} /></Field>
              <Field label="Número da conta"><input value={form.account_number ?? ''} onChange={event => setForm(current => ({ ...current, account_number: event.target.value }))} style={inputStyle} /></Field>
            </div>
          )}

          {form.type === 'pix' && <Field label="Chave PIX"><input value={form.pix_key ?? ''} onChange={event => setForm(current => ({ ...current, pix_key: event.target.value }))} style={inputStyle} /></Field>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Saldo inicial" hint={editing ? 'A diferença altera o saldo atual da conta.' : 'Será usado como saldo atual ao criar a conta.'}>
              <input type="number" step="0.01" value={form.initial_balance ?? 0} onChange={event => setForm(current => ({ ...current, initial_balance: Number(event.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="Situação">
              <select value={form.active ? 'true' : 'false'} onChange={event => setForm(current => ({ ...current, active: event.target.value === 'true' }))} style={inputStyle}>
                <option value="true">Ativa</option><option value="false">Inativa</option>
              </select>
            </Field>
          </div>

          {editing && <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', color: '#475569', fontSize: 12 }}>Saldo atual antes da alteração: <strong>{money(editing.currentBalance)}</strong></div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Cancelar</button>
            <PrimaryButton onClick={() => void save()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar conta'}</PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
