import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, CheckCircle2, Edit, Plus, Power, PowerOff, RefreshCw, Save, Search } from 'lucide-react';
import { DynamicFormRenderer } from '../../shared/components/DynamicFormRenderer';
import { userManagementService } from '../../services/userManagementService';
import type { DynamicFieldSchema, TenantRole, TenantUser, TenantUserPayload, TenantUsersMeta } from '../../types/userManagement';
import { USER_FORM_SCHEMA, USER_TABLE_SCHEMA } from '../../types/userManagement';
import { Badge } from '../../app/components/ui/badge';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';

const EMPTY_META: TenantUsersMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

function rolesLabel(user: TenantUser) {
  return user.roles.map(role => role.name).join(', ') || '-';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusBadge(user: TenantUser) {
  return user.active ? (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Ativo</Badge>
  ) : (
    <Badge variant="secondary">Inativo</Badge>
  );
}

function fieldValue(user: TenantUser, key: string) {
  if (key === 'roles') return rolesLabel(user);
  if (key === 'status') return statusBadge(user);
  if (key === 'last_login_at') return formatDate(user.last_login_at);
  return String(user[key as keyof TenantUser] ?? '-');
}

export function UsersListPage() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [meta, setMeta] = useState<TenantUsersMeta>(EMPTY_META);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersPayload, rolesPayload] = await Promise.all([
        userManagementService.listUsers({ search, role, status, page }),
        userManagementService.listRoles(),
      ]);

      setUsers(usersPayload.data);
      setMeta(usersPayload.meta);
      setRoles(rolesPayload);
    } catch {
      setError('Nao foi possivel carregar os usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    void loadUsers();
  };

  const toggleUser = async (user: TenantUser) => {
    try {
      const updated = user.active
        ? await userManagementService.deactivateUser(user.id)
        : await userManagementService.activateUser(user.id);
      setUsers(items => items.map(item => item.id === updated.id ? updated : item));
    } catch {
      setError('Nao foi possivel atualizar o status do usuario.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Perfis e acesso operacional do tenant.</p>
        </div>
        <Button asChild>
          <Link to="/users/new">
            <Plus className="size-4" />
            Novo usuario
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_180px_160px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') applyFilters();
            }}
          />
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={role}
          onChange={event => setRole(event.target.value)}
        >
          <option value="">Todos os perfis</option>
          {roles.map(item => (
            <option key={item.id} value={item.slug}>{item.name}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <Button type="button" variant="outline" onClick={applyFilters}>
          <RefreshCw className="size-4" />
          Filtrar
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {USER_TABLE_SCHEMA.map(column => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="w-32 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={USER_TABLE_SCHEMA.length + 1} className="h-24 text-center text-muted-foreground">
                  Carregando usuarios
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={USER_TABLE_SCHEMA.length + 1} className="h-24 text-center text-muted-foreground">
                  Nenhum usuario encontrado
                </TableCell>
              </TableRow>
            ) : users.map(user => (
              <TableRow key={user.id}>
                {USER_TABLE_SCHEMA.map(column => (
                  <TableCell key={column.key}>{fieldValue(user, column.key)}</TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="icon" variant="ghost" title="Editar usuario">
                      <Link to={`/users/${user.id}`}>
                        <Edit className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title={user.active ? 'Desativar usuario' : 'Ativar usuario'}
                      onClick={() => void toggleUser(user)}
                    >
                      {user.active ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{meta.total} usuario(s)</span>
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
          <span>
            {meta.current_page} / {meta.last_page}
          </span>
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

export function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [form, setForm] = useState<Partial<TenantUserPayload>>({
    name: '',
    email: '',
    password: '',
    roles: [],
    active: true,
  });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo<DynamicFieldSchema[]>(() => {
    const roleOptions = roles.map(item => ({ label: item.name, value: item.id }));

    return USER_FORM_SCHEMA
      .filter(field => editing ? field.key !== 'password' && field.key !== 'active' : true)
      .map(field => field.key === 'roles' ? { ...field, options: roleOptions } : field);
  }, [editing, roles]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextRoles = await userManagementService.listRoles();
        setRoles(nextRoles);

        if (editing && id) {
          const user = await userManagementService.getUser(id);
          setForm({
            name: user.name,
            email: user.email,
            roles: user.roles.map(role => role.id),
            active: user.active,
          });
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
      const payload: TenantUserPayload = {
        name: String(form.name ?? ''),
        email: String(form.email ?? ''),
        roles: Array.isArray(form.roles) ? form.roles : [],
        active: Boolean(form.active ?? true),
        ...(editing ? {} : { password: String(form.password ?? '') }),
      };

      if (editing && id) {
        await userManagementService.updateUser(id, payload);
      } else {
        await userManagementService.createUser(payload);
      }

      navigate('/users');
    } catch {
      setError('Nao foi possivel salvar o usuario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{editing ? 'Editar usuario' : 'Novo usuario'}</h1>
          <p className="text-sm text-muted-foreground">Cadastro operacional vinculado ao tenant atual.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/users">
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
            schema={schema}
            value={form as Record<string, unknown>}
            disabled={saving}
            onChange={patch => setForm(current => ({ ...current, ...patch } as Partial<TenantUserPayload>))}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/users">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving || loading}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : editing ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
