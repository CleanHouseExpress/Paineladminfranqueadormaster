import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ChecklistTemplateFormPage } from '../../../modules/checklists';
import { metadataService } from '../../../services/metadataService';
import type { EntityMetadata } from '../../../services/metadataService';
import type { DynamicFieldSchema } from '../../../types/userManagement';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

const CONFIGURABLE_ENTITIES = new Set(['customers', 'units', 'users', 'suppliers']);

function MetadataFieldVisibility({ entity }: { entity: string }) {
  const [metadata, setMetadata] = useState<EntityMetadata | null>(null);
  const [fields, setFields] = useState<DynamicFieldSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    metadataService.getEntity(entity)
      .then(payload => {
        if (!active) return;
        setMetadata(payload);
        setFields(payload.form_schema ?? payload.fields ?? []);
      })
      .catch(() => {
        if (active) setError('Nao foi possivel carregar os campos do formulario.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [entity]);

  const setVisibility = (key: string, visible: boolean) => {
    setSaved(false);
    setFields(current => current.map(field => field.key === key ? { ...field, visible } : field));
  };

  const save = async () => {
    if (!metadata) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const updated = await metadataService.updateEntity(entity, { ...metadata, form_schema: fields });
      setMetadata(updated);
      setFields(updated.form_schema ?? updated.fields ?? fields);
      setSaved(true);
    } catch {
      setError('Nao foi possivel salvar a configuracao de visibilidade.');
    } finally {
      setSaving(false);
    }
  };

  const title = metadata?.plural_label ?? entity;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Campos de {title}</h1>
          <p className="text-sm text-muted-foreground">Escolha os campos exibidos no formulario deste tenant.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/settings/form-builder"><ArrowLeft className="size-4" />Voltar</Link>
        </Button>
      </div>

      {error ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
      {saved ? <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">Configuracao salva.</div> : null}

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />Carregando campos...
          </div>
        ) : fields.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum campo configurado para esta entidade.</div>
        ) : (
          <div className="divide-y">
            {[...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(field => (
              <div key={field.key} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">{field.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{field.key}</div>
                </div>
                <Switch
                  aria-label={`Exibir ${field.label}`}
                  checked={field.visible !== false}
                  disabled={saving}
                  onCheckedChange={checked => setVisibility(field.key, checked)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" disabled={loading || saving || !metadata} onClick={() => void save()}>
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar alteracoes
        </Button>
      </div>
    </div>
  );
}

export function FieldManagement() {
  const { entityId = '' } = useParams();

  if (CONFIGURABLE_ENTITIES.has(entityId)) return <MetadataFieldVisibility entity={entityId} />;
  return <ChecklistTemplateFormPage />;
}
