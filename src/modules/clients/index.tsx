import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Edit, Plus, RefreshCw, Save, Search, Settings, Trash2 } from 'lucide-react';
import { DynamicFormRenderer } from '../../shared/components/DynamicFormRenderer';
import { DynamicTableRenderer } from '../../shared/components/DynamicTableRenderer';
import { customerManagementService } from '../../services/customerManagementService';
import type { Customer, CustomerFormSettings, CustomersMeta } from '../../types/customerManagement';
import { DEFAULT_CUSTOMER_SETTINGS } from '../../types/customerManagement';
import { unitManagementService } from '../../services/unitManagementService';
import type { UnitOption } from '../../types/unitManagement';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';
import type { CustomerTableColumn } from '../../types/customerManagement';
import { metadataService } from '../../services/metadataService';

const EMPTY_META: CustomersMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

function emptyCustomer(settings: CustomerFormSettings) {
  return settings.fields.reduce<Record<string, unknown>>((payload, field) => {
    payload[field.key] = '';
    return payload;
  }, {});
}

async function loadSettings() {
  try {
    const metadata = await metadataService.getEntity('customers');

    return {
      ...metadata,
      fields: metadata.form_schema ?? metadata.fields,
      table_columns: metadata.table_schema ?? metadata.table_columns,
    };
  } catch {
    return DEFAULT_CUSTOMER_SETTINGS;
  }
}

export function CustomersListPage() {
  const [settings, setSettings] = useState<CustomerFormSettings>(DEFAULT_CUSTOMER_SETTINGS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<CustomersMeta>(EMPTY_META);
  const [search, setSearch] = useState('');
  const [unitId, setUnitId] = useState('');
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<CustomerTableColumn[]>(() => settings.table_columns ?? settings.table_schema ?? [], [settings]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextSettings = await loadSettings();
      const customersPayload = await customerManagementService.listCustomers({ search, unit_id: unitId, page });
      setSettings(nextSettings);
      setCustomers(customersPayload.data);
      setMeta(customersPayload.meta);
    } catch {
      setError(`Nao foi possivel carregar ${settings.plural_label.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  useEffect(() => {
    async function loadUnits() {
      try {
        setUnitOptions(await unitManagementService.getUnitOptions());
      } catch {
        setUnitOptions([]);
      }
    }

    void loadUnits();
  }, []);

  const applySearch = () => {
    setPage(1);
    void load();
  };

  const remove = async (customer: Customer) => {
    if (!confirm(`Remover ${settings.singular_label.toLowerCase()} ${customer.name}?`)) return;

    try {
      await customerManagementService.deleteCustomer(customer.id);
      setCustomers(items => items.filter(item => item.id !== customer.id));
      setMeta(current => ({ ...current, total: Math.max(0, current.total - 1) }));
    } catch {
      setError(`Nao foi possivel remover ${settings.singular_label.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{settings.plural_label}</h1>
          <p className="text-sm text-muted-foreground">Gestao de {settings.plural_label.toLowerCase()} do tenant.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/customers/settings">
              <Settings className="size-4" />
              Configurar
            </Link>
          </Button>
          <Button asChild>
            <Link to="/customers/new">
              <Plus className="size-4" />
              Novo {settings.singular_label}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`Buscar ${settings.singular_label.toLowerCase()} por nome, telefone ou e-mail`}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') applySearch();
            }}
          />
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={unitId}
          onChange={event => setUnitId(event.target.value)}
        >
          <option value="">Todas as unidades</option>
          {unitOptions.map(option => (
            <option key={option.value} value={String(option.value)}>{option.label}</option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={applySearch}>
          <RefreshCw className="size-4" />
          Filtrar
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <DynamicTableRenderer
        schema={columns}
        rows={customers as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyLabel={`Nenhum ${settings.singular_label.toLowerCase()} encontrado`}
        actions={row => {
          const customer = row as unknown as Customer;

          return (
            <div className="flex justify-end gap-1">
              <Button asChild size="icon" variant="ghost" title={`Editar ${settings.singular_label}`}>
                <Link to={`/customers/${customer.id}`}>
                  <Edit className="size-4" />
                </Link>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title={`Remover ${settings.singular_label}`}
                onClick={() => void remove(customer)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        }}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{meta.total} registro(s)</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.current_page <= 1}
            onClick={() => setPage(item => Math.max(1, item - 1))}
          >
            Anterior
          </Button>
          <span>{meta.current_page} / {meta.last_page}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => setPage(item => item + 1)}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [settings, setSettings] = useState<CustomerFormSettings>(DEFAULT_CUSTOMER_SETTINGS);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextSettings = await loadSettings();
        setSettings(nextSettings);

        if (editing && id) {
          const customer = await customerManagementService.getCustomer(id);
          setForm({ ...emptyCustomer(nextSettings), ...customer });
        } else {
          setForm(emptyCustomer(nextSettings));
        }
      } catch {
        setError('Nao foi possivel carregar o formulario.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [editing, id]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editing && id) {
        await customerManagementService.updateCustomer(id, form);
      } else {
        await customerManagementService.createCustomer(form);
      }

      navigate('/customers');
    } catch {
      setError(`Nao foi possivel salvar ${settings.singular_label.toLowerCase()}. Verifique os campos obrigatorios.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {editing ? `Editar ${settings.singular_label}` : `Novo ${settings.singular_label}`}
          </h1>
          <p className="text-sm text-muted-foreground">Formulario configurado para este tenant.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <form className="space-y-5 rounded-md border p-4" onSubmit={save}>
        {loading ? (
          <div className="h-32 content-center text-center text-sm text-muted-foreground">Carregando formulario</div>
        ) : (
          <DynamicFormRenderer
            schema={settings.fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
            value={form}
            disabled={saving}
            onChange={patch => setForm(current => ({ ...current, ...patch }))}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/customers">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving || loading}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CustomerSettingsPage() {
  const [settings, setSettings] = useState<CustomerFormSettings>(DEFAULT_CUSTOMER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSettings(await loadSettings());
      setLoading(false);
    }

    void load();
  }, []);

  const updateField = (key: string, patch: Record<string, unknown>) => {
    setSettings(current => ({
      ...current,
      fields: current.fields.map(field => field.key === key ? { ...field, ...patch } : field),
      table_columns: current.table_columns.map(column => column.key === key ? { ...column, ...patch } : column),
    }));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const tableColumns = settings.fields
        .filter(field => field.visible !== false)
        .map(field => ({
          key: field.key,
          label: field.label,
          visible: field.visible !== false,
          sortable: ['name', 'phone', 'email', 'document'].includes(field.key),
          order: field.order,
        }));

      const payload = {
        ...settings,
        form_schema: settings.fields,
        table_schema: tableColumns,
        table_columns: tableColumns,
      };

      const updated = await customerManagementService.updateSettings(payload);
      setSettings({
        ...updated,
        fields: updated.form_schema ?? updated.fields,
        table_columns: updated.table_schema ?? updated.table_columns,
      });
      setSaved(true);
    } catch {
      setError('Nao foi possivel salvar a configuracao.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Configuracao de {settings.plural_label}</h1>
          <p className="text-sm text-muted-foreground">Padrao de formulario usado por toda a rede.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
      {saved ? <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">Configuracao salva.</div> : null}

      <div className="grid gap-4 rounded-md border p-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="singular_label">Nome singular</Label>
          <Input
            id="singular_label"
            value={settings.singular_label}
            disabled={loading || saving}
            onChange={event => setSettings(current => ({ ...current, singular_label: event.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="plural_label">Nome plural</Label>
          <Input
            id="plural_label"
            value={settings.plural_label}
            disabled={loading || saving}
            onChange={event => setSettings(current => ({ ...current, plural_label: event.target.value }))}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campo</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-28">Visivel</TableHead>
              <TableHead className="w-36">Obrigatorio</TableHead>
              <TableHead className="w-28">Ordem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(field => (
              <TableRow key={field.key}>
                <TableCell className="font-mono text-xs">{field.key}</TableCell>
                <TableCell>
                  <Input
                    value={field.label}
                    disabled={saving}
                    onChange={event => updateField(field.key, { label: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={field.visible !== false}
                    disabled={saving || field.key === 'name'}
                    onCheckedChange={checked => updateField(field.key, { visible: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={Boolean(field.required)}
                    disabled={saving || field.key === 'name'}
                    onCheckedChange={checked => updateField(field.key, { required: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={field.order ?? 0}
                    disabled={saving}
                    onChange={event => updateField(field.key, { order: Number(event.target.value) })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button type="button" disabled={saving || loading} onClick={() => void save()}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar configuracao
        </Button>
      </div>
    </div>
  );
}
