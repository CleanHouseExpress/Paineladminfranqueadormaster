import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Edit, Plus, RefreshCw, Save, Search, Settings, Trash2 } from 'lucide-react';
import { DynamicFormRenderer } from '../../shared/components/DynamicFormRenderer';
import { DynamicTableRenderer } from '../../shared/components/DynamicTableRenderer';
import { unitManagementService } from '../../services/unitManagementService';
import type { Unit, UnitMetadata, UnitsMeta } from '../../types/unitManagement';
import { DEFAULT_UNIT_METADATA } from '../../types/unitManagement';
import { UnitImplementationTab } from '../../app/components/units/UnitImplementationTab';
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

const EMPTY_META: UnitsMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

function normalizeMetadata(metadata: UnitMetadata): UnitMetadata {
  return {
    ...metadata,
    fields: metadata.form_schema ?? metadata.fields,
    table_columns: metadata.table_schema ?? metadata.table_columns,
  };
}

async function loadMetadata() {
  try {
    return normalizeMetadata(await unitManagementService.getUnitMetadata());
  } catch {
    return DEFAULT_UNIT_METADATA;
  }
}

function emptyUnit(metadata: UnitMetadata) {
  return metadata.fields.reduce<Record<string, unknown>>((payload, field) => {
    payload[field.key] = field.key === 'status' ? 'active' : '';
    return payload;
  }, {});
}

export function UnitsListPage() {
  const [metadata, setMetadata] = useState<UnitMetadata>(DEFAULT_UNIT_METADATA);
  const [units, setUnits] = useState<Unit[]>([]);
  const [meta, setMeta] = useState<UnitsMeta>(EMPTY_META);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<CustomerTableColumn[]>(() => metadata.table_columns ?? metadata.table_schema ?? [], [metadata]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextMetadata = await loadMetadata();
      const unitsPayload = await unitManagementService.listUnits({ search, status, page });
      setMetadata(nextMetadata);
      setUnits(unitsPayload.data);
      setMeta(unitsPayload.meta);
    } catch {
      setError(`Nao foi possivel carregar ${metadata.plural_label.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    void load();
  };

  const remove = async (unit: Unit) => {
    if (!confirm(`Remover ${metadata.singular_label.toLowerCase()} ${unit.name}?`)) return;

    try {
      await unitManagementService.deleteUnit(unit.id);
      setUnits(items => items.filter(item => item.id !== unit.id));
      setMeta(current => ({ ...current, total: Math.max(0, current.total - 1) }));
    } catch {
      setError(`Nao foi possivel remover ${metadata.singular_label.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{metadata.plural_label}</h1>
          <p className="text-sm text-muted-foreground">Gestao operacional de {metadata.plural_label.toLowerCase()}.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/units/settings">
              <Settings className="size-4" />
              Configurar
            </Link>
          </Button>
          <Button asChild>
            <Link to="/units/new">
              <Plus className="size-4" />
              Nova {metadata.singular_label}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`Buscar ${metadata.singular_label.toLowerCase()} por nome, codigo ou documento`}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') applyFilters();
            }}
          />
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
          <option value="opening">Em abertura</option>
          <option value="closed">Fechadas</option>
        </select>
        <Button type="button" variant="outline" onClick={applyFilters}>
          <RefreshCw className="size-4" />
          Filtrar
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <DynamicTableRenderer
        schema={columns}
        rows={units as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyLabel={`Nenhuma ${metadata.singular_label.toLowerCase()} encontrada`}
        actions={row => {
          const unit = row as unknown as Unit;

          return (
            <div className="flex justify-end gap-1">
              <Button asChild size="icon" variant="ghost" title={`Editar ${metadata.singular_label}`}>
                <Link to={`/units/${unit.id}`}>
                  <Edit className="size-4" />
                </Link>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title={`Remover ${metadata.singular_label}`}
                onClick={() => void remove(unit)}
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
          <Button type="button" variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage(item => Math.max(1, item - 1))}>Anterior</Button>
          <span>{meta.current_page} / {meta.last_page}</span>
          <Button type="button" variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(item => item + 1)}>Proxima</Button>
        </div>
      </div>
    </div>
  );
}

export function UnitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editing = Boolean(id);
  const activeTab = editing && searchParams.get('tab') === 'implantacao' ? 'implantacao' : 'dados';
  const [metadata, setMetadata] = useState<UnitMetadata>(DEFAULT_UNIT_METADATA);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextMetadata = await loadMetadata();
        setMetadata(nextMetadata);

        if (editing && id) {
          const unit = await unitManagementService.getUnit(id);
          setForm({ ...emptyUnit(nextMetadata), ...unit });
        } else {
          setForm(emptyUnit(nextMetadata));
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
        await unitManagementService.updateUnit(id, form);
      } else {
        await unitManagementService.createUnit(form);
      }

      navigate('/units');
    } catch {
      setError(`Nao foi possivel salvar ${metadata.singular_label.toLowerCase()}. Verifique os campos obrigatorios.`);
    } finally {
      setSaving(false);
    }
  };

  const unitForImplementation = useMemo<Unit>(() => ({
    id: Number(form.id ?? id ?? 0),
    name: String(form.name ?? ''),
    code: form.code as string | null | undefined,
    document: form.document as string | null | undefined,
    phone: form.phone as string | null | undefined,
    email: form.email as string | null | undefined,
    status: String(form.status ?? 'opening'),
    responsible_name: form.responsible_name as string | null | undefined,
    responsible_email: form.responsible_email as string | null | undefined,
    responsible_phone: form.responsible_phone as string | null | undefined,
    opening_date: form.opening_date as string | null | undefined,
    address_zipcode: form.address_zipcode as string | null | undefined,
    address_street: form.address_street as string | null | undefined,
    address_number: form.address_number as string | null | undefined,
    address_complement: form.address_complement as string | null | undefined,
    address_district: form.address_district as string | null | undefined,
    address_city: form.address_city as string | null | undefined,
    address_state: form.address_state as string | null | undefined,
    notes: form.notes as string | null | undefined,
    created_at: form.created_at as string | null | undefined,
    updated_at: form.updated_at as string | null | undefined,
  }), [form, id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{editing ? `Editar ${metadata.singular_label}` : `Nova ${metadata.singular_label}`}</h1>
          <p className="text-sm text-muted-foreground">Formulario controlado pela Metadata Engine.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/units">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      {editing ? (
        <div className="flex gap-2 rounded-md border p-1">
          <Button
            type="button"
            variant={activeTab === 'dados' ? 'default' : 'ghost'}
            onClick={() => setSearchParams({})}
          >
            Dados
          </Button>
          <Button
            type="button"
            variant={activeTab === 'implantacao' ? 'default' : 'ghost'}
            onClick={() => setSearchParams({ tab: 'implantacao' })}
          >
            Implantacao
          </Button>
        </div>
      ) : null}

      {activeTab === 'implantacao' && editing ? (
        <UnitImplementationTab unit={unitForImplementation} />
      ) : (
        <form className="space-y-5 rounded-md border p-4" onSubmit={save}>
          {loading ? (
            <div className="h-32 content-center text-center text-sm text-muted-foreground">Carregando formulario</div>
          ) : (
            <DynamicFormRenderer
              schema={[...metadata.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
              value={form}
              disabled={saving}
              onChange={patch => setForm(current => ({ ...current, ...patch }))}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link to="/units">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function UnitSettingsPage() {
  const [metadata, setMetadata] = useState<UnitMetadata>(DEFAULT_UNIT_METADATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMetadata(await loadMetadata());
      setLoading(false);
    }

    void load();
  }, []);

  const updateField = (key: string, patch: Record<string, unknown>) => {
    setMetadata(current => ({
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
      const tableColumns = metadata.fields
        .filter(field => field.visible !== false)
        .map(field => ({
          key: field.key,
          label: field.label,
          visible: field.visible !== false,
          sortable: ['name', 'code', 'phone', 'email', 'document', 'address_city', 'address_state'].includes(field.key),
          order: field.order,
        }));

      const updated = await unitManagementService.updateUnitMetadata({
        ...metadata,
        form_schema: metadata.fields,
        table_schema: tableColumns,
        table_columns: tableColumns,
      });

      setMetadata(normalizeMetadata(updated));
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
          <h1 className="text-2xl font-semibold tracking-normal">Configuracao de {metadata.plural_label}</h1>
          <p className="text-sm text-muted-foreground">Schema usado por toda a rede.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/units">
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
          <Input id="singular_label" value={metadata.singular_label} disabled={loading || saving} onChange={event => setMetadata(current => ({ ...current, singular_label: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="plural_label">Nome plural</Label>
          <Input id="plural_label" value={metadata.plural_label} disabled={loading || saving} onChange={event => setMetadata(current => ({ ...current, plural_label: event.target.value }))} />
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
            {metadata.fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(field => (
              <TableRow key={field.key}>
                <TableCell className="font-mono text-xs">{field.key}</TableCell>
                <TableCell><Input value={field.label} disabled={saving} onChange={event => updateField(field.key, { label: event.target.value })} /></TableCell>
                <TableCell><Switch checked={field.visible !== false} disabled={saving || field.key === 'name'} onCheckedChange={checked => updateField(field.key, { visible: checked })} /></TableCell>
                <TableCell><Switch checked={Boolean(field.required)} disabled={saving || field.key === 'name'} onCheckedChange={checked => updateField(field.key, { required: checked })} /></TableCell>
                <TableCell><Input type="number" min={1} value={field.order ?? 0} disabled={saving} onChange={event => updateField(field.key, { order: Number(event.target.value) })} /></TableCell>
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
