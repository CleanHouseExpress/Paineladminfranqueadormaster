import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, ClipboardCheck, Edit, Plus, RefreshCw, Save, Search, Settings, Trash2 } from 'lucide-react';
import { DynamicFormRenderer } from '../../shared/components/DynamicFormRenderer';
import { DynamicTableRenderer } from '../../shared/components/DynamicTableRenderer';
import { NotificationDialog } from '../../shared/components/NotificationDialog';
import { FormActions, ListToolbar, PageContainer, PageHeader, PageSection } from '../../shared/components/PageLayout';
import { unitManagementService } from '../../services/unitManagementService';
import { getApiErrorMessage } from '../../services/apiClient';
import type { Unit, UnitMetadata, UnitsMeta } from '../../types/unitManagement';
import { DEFAULT_UNIT_METADATA } from '../../types/unitManagement';
import { UnitImplementationTab } from '../../app/components/units/UnitImplementationTab';
import { implementationService } from '../../services/implementationService';
import type { ImplementationTemplate } from '../../types/implementation';
import { userManagementService } from '../../services/userManagementService';
import type { DynamicFieldSchema, TenantRole, TenantUser, TenantUserPayload } from '../../types/userManagement';
import { isValidCep, normalizeCep } from '../../services/postalCodeService';
import { UnitAddressFields, visibleUnitAddressFieldKeys } from './components/UnitAddressFields';
import { UnitFormSection } from './components/UnitFormSection';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../app/components/ui/dialog';
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

const UNIT_CREATE_MANAGED_FIELDS = new Set([
  'responsible_name',
  'responsible_email',
  'responsible_phone',
  'status',
  'opening_date',
]);

const UNIT_IDENTIFICATION_FIELD_KEYS = ['name', 'code', 'document', 'status', 'opening_date'];
const UNIT_CONTACT_FIELD_KEYS = ['phone', 'email'];
const UNIT_RESPONSIBLE_FIELD_KEYS = ['responsible_name', 'responsible_email', 'responsible_phone'];
const UNIT_ADDITIONAL_FIELD_KEYS = ['notes'];
const UNIT_STANDARD_FIELD_KEYS = new Set([
  ...UNIT_IDENTIFICATION_FIELD_KEYS,
  ...UNIT_CONTACT_FIELD_KEYS,
  ...UNIT_RESPONSIBLE_FIELD_KEYS,
  ...UNIT_ADDITIONAL_FIELD_KEYS,
]);

const UNIT_FIELD_LABELS: Record<string, string> = {
  name: 'Nome da unidade',
  code: 'Codigo',
  document: 'CNPJ',
  status: 'Status',
  opening_date: 'Data de abertura',
  phone: 'Telefone',
  email: 'E-mail',
  responsible_name: 'Nome do responsavel',
  responsible_email: 'E-mail do responsavel',
  responsible_phone: 'Telefone do responsavel',
  notes: 'Observacoes',
};

const UNIT_FIELD_CLASS_NAMES: Record<string, string> = {
  name: 'md:col-span-2 xl:col-span-3',
  code: 'xl:col-span-1',
  document: 'xl:col-span-2',
  status: 'xl:col-span-2',
  opening_date: 'xl:col-span-2',
  phone: 'md:col-span-1 xl:col-span-2',
  email: 'md:col-span-1 xl:col-span-4',
  responsible_name: 'md:col-span-2 xl:col-span-3',
  responsible_email: 'md:col-span-1 xl:col-span-3',
  responsible_phone: 'md:col-span-1 xl:col-span-2',
  notes: 'md:col-span-2 xl:col-span-6',
};

function unitFieldClassName(field: { key: string }) {
  return UNIT_FIELD_CLASS_NAMES[String(field.key)] ?? '';
}

function humanizeSectionLabel(section?: string) {
  if (!section) return 'Campos personalizados';

  const normalized = section.replace(/[_-]+/g, ' ').trim();
  if (!normalized) return 'Campos personalizados';

  const knownLabels: Record<string, string> = {
    general: 'Campos personalizados',
    address: 'Campos personalizados de endereco',
    responsible: 'Campos personalizados de responsavel',
    operation: 'Campos personalizados operacionais',
    notes: 'Campos personalizados',
  };

  return knownLabels[section] ?? normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function presentUnitField(field: DynamicFieldSchema): DynamicFieldSchema {
  return {
    ...field,
    label: UNIT_FIELD_LABELS[field.key] ?? field.label,
  };
}

function sectionFields(schema: DynamicFieldSchema[], keys: string[]) {
  const keySet = new Set(keys);
  return schema.filter(field => keySet.has(String(field.key))).map(presentUnitField);
}

function customSectionFields(schema: DynamicFieldSchema[], addressFieldKeys: Set<string>) {
  return schema
    .filter(field => !addressFieldKeys.has(String(field.key)) && !UNIT_STANDARD_FIELD_KEYS.has(String(field.key)))
    .map(field => ({
      ...field,
      sectionLabel: humanizeSectionLabel(field.section),
    }) as DynamicFieldSchema & { sectionLabel: string });
}

function normalizeUnitFormPayload(payload: Record<string, unknown>) {
  const nextPayload = { ...payload };

  if (Object.prototype.hasOwnProperty.call(nextPayload, 'address_zipcode')) {
    nextPayload.address_zipcode = normalizeCep(String(nextPayload.address_zipcode ?? ''));
  }

  return nextPayload;
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
    <PageContainer>
      <PageHeader
        title={metadata.plural_label}
        description={`Gestao operacional de ${metadata.plural_label.toLowerCase()}.`}
        secondaryActions={(
          <Button asChild variant="outline">
            <Link to="/units/settings">
              <Settings className="size-4" />
              Configurar
            </Link>
          </Button>
        )}
        actions={(
          <Button asChild>
            <Link to="/units/new">
              <Plus className="size-4" />
              Nova {metadata.singular_label}
            </Link>
          </Button>
        )}
      />

      <ListToolbar className="md:grid-cols-[minmax(260px,1fr)_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`Buscar ${metadata.singular_label.toLowerCase()}`}
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
      </ListToolbar>

      <NotificationDialog open={Boolean(error)} message={error} onOpenChange={open => !open && setError(null)} />

      <DynamicTableRenderer
        schema={columns}
        rows={units as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyLabel={`Nenhuma ${metadata.singular_label.toLowerCase()} encontrada`}
        emptyDescription={`Ajuste a busca ou os filtros para localizar ${metadata.plural_label.toLowerCase()} cadastradas.`}
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

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{meta.total} registro(s)</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage(item => Math.max(1, item - 1))}>Anterior</Button>
          <span>{meta.current_page} / {meta.last_page}</span>
          <Button type="button" variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(item => item + 1)}>Proxima</Button>
        </div>
      </div>
    </PageContainer>
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
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);
  const [selectedResponsibleUserId, setSelectedResponsibleUserId] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [implementationTemplates, setImplementationTemplates] = useState<ImplementationTemplate[]>([]);
  const [implementationSetup, setImplementationSetup] = useState({
    initialStatus: 'none',
    templateId: '',
    phaseId: '',
    plannedOpeningDate: '',
    actualOpeningDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [implementationError, setImplementationError] = useState<string | null>(null);
  const [cepSaveError, setCepSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextMetadata = await loadMetadata();
        setMetadata(nextMetadata);

        if (editing && id) {
          const unit = await unitManagementService.getUnit(id);
          setForm(normalizeUnitFormPayload({ ...emptyUnit(nextMetadata), ...unit }));
        } else {
          setForm(normalizeUnitFormPayload(emptyUnit(nextMetadata)));
          try {
            const [templates, usersPayload, rolesPayload] = await Promise.all([
              implementationService.listTemplates(),
              userManagementService.listUsers({ per_page: 200 }),
              userManagementService.listRoles(),
            ]);
            setImplementationTemplates(templates);
            setTenantUsers(usersPayload.data);
            setTenantRoles(rolesPayload);
            setImplementationSetup(current => ({
              ...current,
              templateId: current.templateId || templates[0]?.id || '',
              phaseId: current.phaseId || templates[0]?.phases?.[0]?.id || '',
            }));
          } catch (templateError) {
            setImplementationError(implementationService.getErrorMessage(templateError, 'Nao foi possivel carregar os templates de implantacao.'));
          }
        }
      } catch {
        setError('Nao foi possivel carregar o formulario.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [editing, id]);

  const validateCepForSave = () => {
    const hasCepField = unitFormSchema.some(field => field.visible !== false && field.key === 'address_zipcode');
    if (!hasCepField) return true;

    const cep = normalizeCep(String(form.address_zipcode ?? ''));
    if (!cep) {
      setCepSaveError(null);
      return true;
    }
    if (isValidCep(cep)) {
      setCepSaveError(null);
      return true;
    }

    setCepSaveError('Informe um CEP valido com oito digitos.');
    return false;
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRef.current) return;
    if (!validateCepForSave()) return;

    savingRef.current = true;
    setSaving(true);
    setError(null);
    setCepSaveError(null);

    try {
      const normalizedForm = normalizeUnitFormPayload(form);

      if (editing && id) {
        await unitManagementService.updateUnit(id, normalizedForm);
      } else {
        if (!selectedResponsibleUserId) {
          setError('Selecione ou crie o admin da unidade antes de salvar.');
          return;
        }

        const payload = { ...normalizedForm };
        payload.unit_responsible_user_id = selectedResponsibleUserId;

        if (implementationSetup.initialStatus !== 'none') {
          payload.implementation_initial_status = implementationSetup.initialStatus;
          payload.implementation_template_id = implementationSetup.templateId;
          payload.implementation_planned_opening_date = implementationSetup.plannedOpeningDate || form.opening_date || null;

          if (implementationSetup.initialStatus === 'in_progress') {
            payload.implementation_current_template_phase_id = implementationSetup.phaseId;
          }

          if (implementationSetup.initialStatus === 'completed') {
            payload.implementation_actual_opening_date = implementationSetup.actualOpeningDate || form.opening_date || null;
          }
        }

        await unitManagementService.createUnit(payload);
      }

      navigate('/units');
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, `Nao foi possivel salvar ${metadata.singular_label.toLowerCase()}.`));
    } finally {
      savingRef.current = false;
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
  const selectedImplementationTemplate = useMemo(
    () => implementationTemplates.find(template => template.id === implementationSetup.templateId) ?? implementationTemplates[0] ?? null,
    [implementationSetup.templateId, implementationTemplates],
  );
  const unitFormSchema = useMemo(
    () => [...metadata.fields]
      .filter(field => field.visible !== false)
      .filter(field => editing || !UNIT_CREATE_MANAGED_FIELDS.has(String(field.key)))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [editing, metadata.fields],
  );
  const addressFieldKeys = useMemo(() => visibleUnitAddressFieldKeys(unitFormSchema), [unitFormSchema]);
  const addressFields = useMemo(
    () => unitFormSchema.filter(field => addressFieldKeys.has(String(field.key))).map(presentUnitField),
    [addressFieldKeys, unitFormSchema],
  );
  const identificationFields = useMemo(
    () => sectionFields(unitFormSchema, UNIT_IDENTIFICATION_FIELD_KEYS),
    [unitFormSchema],
  );
  const contactFields = useMemo(
    () => sectionFields(unitFormSchema, UNIT_CONTACT_FIELD_KEYS),
    [unitFormSchema],
  );
  const responsibleFields = useMemo(
    () => sectionFields(unitFormSchema, UNIT_RESPONSIBLE_FIELD_KEYS),
    [unitFormSchema],
  );
  const additionalFields = useMemo(
    () => sectionFields(unitFormSchema, UNIT_ADDITIONAL_FIELD_KEYS),
    [unitFormSchema],
  );
  const customFields = useMemo(
    () => customSectionFields(unitFormSchema, addressFieldKeys),
    [addressFieldKeys, unitFormSchema],
  );
  const selectedResponsibleUser = useMemo(
    () => tenantUsers.find(user => String(user.id) === selectedResponsibleUserId) ?? null,
    [selectedResponsibleUserId, tenantUsers],
  );

  useEffect(() => {
    if (!selectedImplementationTemplate) return;
    setImplementationSetup(current => {
      if (current.phaseId && selectedImplementationTemplate.phases.some(phase => phase.id === current.phaseId)) return current;
      return { ...current, phaseId: selectedImplementationTemplate.phases[0]?.id ?? '' };
    });
  }, [selectedImplementationTemplate]);

  const updateImplementationSetup = (patch: Partial<typeof implementationSetup>) => {
    setImplementationSetup(current => ({ ...current, ...patch }));
  };

  const selectResponsibleUser = (userId: string) => {
    setSelectedResponsibleUserId(userId);
    const user = tenantUsers.find(item => String(item.id) === userId);
    if (!user) return;

    setForm(current => ({
      ...current,
      responsible_name: user.name,
      responsible_email: user.email,
      responsible_phone: user.phone ?? '',
    }));
  };

  const openUserDialog = () => {
    setUserError(null);
    setUserForm({
      name: String(form.responsible_name ?? ''),
      email: String(form.responsible_email ?? ''),
      phone: String(form.responsible_phone ?? ''),
    });
    setUserDialogOpen(true);
  };

  const createUnitAdminUser = async () => {
    setCreatingUser(true);
    setUserError(null);

    try {
      const adminRole = tenantRoles.find(role => role.slug === 'franchise_admin') ?? tenantRoles.find(role => role.slug === 'gestor_unidade');

      if (!adminRole) {
        setUserError('Perfil de admin da unidade nao encontrado.');
        return;
      }
      if (userForm.phone.trim() === '') {
        setUserError('Informe o WhatsApp do admin da unidade.');
        return;
      }

      const payload: TenantUserPayload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        roles: [adminRole.id],
        active: true,
      };
      const createdUser = await userManagementService.createUser(payload);
      setTenantUsers(current => [createdUser, ...current.filter(user => user.id !== createdUser.id)]);
      setSelectedResponsibleUserId(String(createdUser.id));
      setForm(current => ({
        ...current,
        responsible_name: createdUser.name,
        responsible_email: createdUser.email,
        responsible_phone: createdUser.phone ?? userForm.phone,
      }));
      setUserDialogOpen(false);
    } catch (createError) {
      setUserError(getApiErrorMessage(createError, 'Nao foi possivel criar o usuario admin da unidade.'));
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={editing ? `Editar ${metadata.singular_label}` : `Nova ${metadata.singular_label}`}
        description={editing
          ? 'Atualize os dados cadastrais e operacionais da unidade.'
          : 'Cadastre os dados de identificacao, endereco e responsaveis pela unidade.'}
        secondaryActions={(
          <Button asChild variant="outline">
            <Link to="/units">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        )}
      />

      <NotificationDialog open={Boolean(error)} message={error} onOpenChange={open => !open && setError(null)} />
      <NotificationDialog open={Boolean(implementationError)} message={implementationError} variant="warning" onOpenChange={open => !open && setImplementationError(null)} />
      <NotificationDialog open={Boolean(userError)} message={userError} onOpenChange={open => !open && setUserError(null)} />

      {editing ? (
        <div className="flex gap-2 rounded-lg border bg-card p-1 shadow-sm shadow-foreground/5">
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
        <form className="space-y-5" onSubmit={save} data-testid="unit-form">
          {loading ? (
            <UnitFormSection title="Carregando formulario">
              <div className="h-24 content-center text-center text-sm text-muted-foreground">Carregando dados da unidade</div>
            </UnitFormSection>
          ) : (
            <>
              {identificationFields.length > 0 ? (
                <UnitFormSection
                  title="Identificacao da unidade"
                  description="Dados cadastrais e situacao operacional da unidade."
                  testId="unit-section-identification"
                >
                  <DynamicFormRenderer
                    schema={identificationFields}
                    value={form}
                    disabled={saving}
                    layout="plain"
                    getFieldClassName={unitFieldClassName}
                    onChange={patch => setForm(current => ({ ...current, ...patch }))}
                  />
                </UnitFormSection>
              ) : null}

              {contactFields.length > 0 ? (
                <UnitFormSection
                  title="Contato da unidade"
                  description="Canais usados para comunicacao com a unidade."
                  testId="unit-section-contact"
                >
                  <DynamicFormRenderer
                    schema={contactFields}
                    value={form}
                    disabled={saving}
                    layout="plain"
                    getFieldClassName={unitFieldClassName}
                    onChange={patch => setForm(current => ({ ...current, ...patch }))}
                  />
                </UnitFormSection>
              ) : null}

              {addressFields.length > 0 ? (
                <UnitFormSection
                  title="Endereco"
                  description="Informe o CEP para preencher automaticamente os dados disponiveis."
                  testId="unit-section-address"
                >
                  <UnitAddressFields
                    fields={addressFields}
                    value={form}
                    disabled={saving}
                    cepErrorMessage={cepSaveError}
                    onCepValidityChange={valid => {
                      if (valid) setCepSaveError(null);
                    }}
                    onChange={patch => {
                      if (Object.prototype.hasOwnProperty.call(patch, 'address_zipcode')) {
                        setCepSaveError(null);
                      }
                      setForm(current => ({ ...current, ...patch }));
                    }}
                  />
                </UnitFormSection>
              ) : null}

              {responsibleFields.length > 0 ? (
                <UnitFormSection
                  title="Responsavel pela unidade"
                  description="Informacoes de contato do responsavel operacional."
                  testId="unit-section-responsible"
                >
                  <DynamicFormRenderer
                    schema={responsibleFields}
                    value={form}
                    disabled={saving}
                    layout="plain"
                    getFieldClassName={unitFieldClassName}
                    onChange={patch => setForm(current => ({ ...current, ...patch }))}
                  />
                </UnitFormSection>
              ) : null}

              {additionalFields.length > 0 ? (
                <UnitFormSection
                  title="Informacoes adicionais"
                  testId="unit-section-additional"
                >
                  <DynamicFormRenderer
                    schema={additionalFields}
                    value={form}
                    disabled={saving}
                    layout="plain"
                    getFieldClassName={unitFieldClassName}
                    onChange={patch => setForm(current => ({ ...current, ...patch }))}
                  />
                </UnitFormSection>
              ) : null}

              {customFields.length > 0 ? (
                <UnitFormSection
                  title="Campos personalizados"
                  description="Campos configurados pela Metadata Engine para este tenant."
                  testId="unit-section-custom"
                >
                  <DynamicFormRenderer
                    schema={customFields}
                    value={form}
                    disabled={saving}
                    onChange={patch => setForm(current => ({ ...current, ...patch }))}
                  />
                </UnitFormSection>
              ) : null}

              {!editing ? (
                <>
                  <UnitFormSection
                    title="Admin da unidade"
                    description="Selecione o usuario que tera acesso administrativo a esta unidade."
                    testId="unit-section-admin"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <div className="grid gap-2">
                        <Label htmlFor="unit_responsible_user_id">Usuario com acesso admin nesta unidade</Label>
                        <select
                          id="unit_responsible_user_id"
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                          value={selectedResponsibleUserId}
                          disabled={saving}
                          onChange={event => selectResponsibleUser(event.target.value)}
                        >
                          <option value="">Selecione um usuario existente</option>
                          {tenantUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
                          ))}
                        </select>
                      </div>
                      <Button type="button" variant="outline" onClick={openUserDialog} disabled={saving}>
                        <Plus className="size-4" />
                        Criar usuario
                      </Button>
                    </div>
                    {selectedResponsibleUser ? (
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <div className="font-medium">{selectedResponsibleUser.name}</div>
                        <div className="text-muted-foreground">{selectedResponsibleUser.email}</div>
                        {selectedResponsibleUser.phone ? <div className="text-muted-foreground">{selectedResponsibleUser.phone}</div> : null}
                      </div>
                    ) : null}
                  </UnitFormSection>

                  <UnitFormSection
                    title="Implantacao inicial"
                    description="Defina se a unidade ja deve nascer vinculada a um fluxo de implantacao."
                    testId="unit-section-implementation"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ClipboardCheck className="size-4" />
                      Implantacao inicial
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="implementation_initial_status">Situacao</Label>
                        <select
                          id="implementation_initial_status"
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                          value={implementationSetup.initialStatus}
                          disabled={saving || implementationTemplates.length === 0}
                          onChange={event => {
                            const initialStatus = event.target.value;
                            updateImplementationSetup({ initialStatus });
                            if (initialStatus === 'in_progress') setForm(current => ({ ...current, status: 'opening' }));
                            if (initialStatus === 'completed') setForm(current => ({ ...current, status: 'active' }));
                          }}
                        >
                          <option value="none">Sem fluxo de implantacao</option>
                          <option value="in_progress">Em uma fase da implantacao</option>
                          <option value="completed">Ja implantada 100%</option>
                        </select>
                      </div>

                      {implementationSetup.initialStatus !== 'none' ? (
                        <div className="grid gap-2">
                          <Label htmlFor="implementation_template_id">Template</Label>
                          <select
                            id="implementation_template_id"
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={implementationSetup.templateId}
                            disabled={saving}
                            onChange={event => {
                              const templateId = event.target.value;
                              const template = implementationTemplates.find(item => item.id === templateId);
                              updateImplementationSetup({ templateId, phaseId: template?.phases[0]?.id ?? '' });
                            }}
                          >
                            {implementationTemplates.map(template => (
                              <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      {implementationSetup.initialStatus === 'in_progress' && selectedImplementationTemplate ? (
                        <div className="grid gap-2">
                          <Label htmlFor="implementation_current_template_phase_id">Fase atual</Label>
                          <select
                            id="implementation_current_template_phase_id"
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={implementationSetup.phaseId}
                            disabled={saving}
                            onChange={event => updateImplementationSetup({ phaseId: event.target.value })}
                          >
                            {selectedImplementationTemplate.phases.map(phase => (
                              <option key={phase.id} value={phase.id}>{phase.order}. {phase.title}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      {implementationSetup.initialStatus === 'in_progress' ? (
                        <div className="grid gap-2">
                          <Label htmlFor="implementation_planned_opening_date">Previsao de inauguracao</Label>
                          <Input
                            id="implementation_planned_opening_date"
                            type="date"
                            value={implementationSetup.plannedOpeningDate}
                            disabled={saving}
                            onChange={event => updateImplementationSetup({ plannedOpeningDate: event.target.value })}
                          />
                        </div>
                      ) : null}

                      {implementationSetup.initialStatus === 'completed' ? (
                        <div className="grid gap-2">
                          <Label htmlFor="implementation_actual_opening_date">Data de inauguracao</Label>
                          <Input
                            id="implementation_actual_opening_date"
                            type="date"
                            value={implementationSetup.actualOpeningDate}
                            disabled={saving}
                            onChange={event => updateImplementationSetup({ actualOpeningDate: event.target.value })}
                          />
                        </div>
                      ) : null}
                    </div>
                  </UnitFormSection>
                </>
              ) : null}
            </>
          )}

          <FormActions>
            <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
              <Link to="/units">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving || loading} aria-busy={saving || undefined} className="w-full sm:w-auto" data-testid="unit-save-button">
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </FormActions>
        </form>
      )}

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar admin da unidade</DialogTitle>
            <DialogDescription>Esse usuario sera associado como admin da unidade ao salvar o cadastro.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="unit_admin_name">Nome</Label>
              <Input
                id="unit_admin_name"
                value={userForm.name}
                disabled={creatingUser}
                onChange={event => setUserForm(current => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit_admin_email">E-mail</Label>
              <Input
                id="unit_admin_email"
                type="email"
                value={userForm.email}
                disabled={creatingUser}
                onChange={event => setUserForm(current => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit_admin_phone">WhatsApp</Label>
              <Input
                id="unit_admin_phone"
                type="tel"
                value={userForm.phone}
                disabled={creatingUser}
                onChange={event => setUserForm(current => ({ ...current, phone: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)} disabled={creatingUser}>Cancelar</Button>
            <Button type="button" onClick={() => void createUnitAdminUser()} disabled={creatingUser}>
              {creatingUser ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Criar usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
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
    <PageContainer>
      <PageHeader
        title={`Configuracao de ${metadata.plural_label}`}
        description="Schema usado por toda a rede."
        secondaryActions={(
          <Button asChild variant="outline">
            <Link to="/units">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        )}
      />

      <NotificationDialog open={Boolean(error)} message={error} onOpenChange={open => !open && setError(null)} />
      {saved ? <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">Configuracao salva.</div> : null}

      <PageSection className="grid gap-4 p-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="singular_label">Nome singular</Label>
          <Input id="singular_label" value={metadata.singular_label} disabled={loading || saving} onChange={event => setMetadata(current => ({ ...current, singular_label: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="plural_label">Nome plural</Label>
          <Input id="plural_label" value={metadata.plural_label} disabled={loading || saving} onChange={event => setMetadata(current => ({ ...current, plural_label: event.target.value }))} />
        </div>
      </PageSection>

      <PageSection className="overflow-hidden">
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
      </PageSection>

      <FormActions>
        <Button type="button" disabled={saving || loading} onClick={() => void save()}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar configuracao
        </Button>
      </FormActions>
    </PageContainer>
  );
}
