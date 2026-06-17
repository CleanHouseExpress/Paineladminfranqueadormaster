import { useEffect, useMemo, useState } from 'react';
import type { DynamicFieldOption, DynamicFieldSchema } from '../../types/userManagement';
import { apiClient } from '../../services/apiClient';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import { Textarea } from '../../app/components/ui/textarea';

type FormValue = string | number[] | boolean | undefined;

interface DynamicFormRendererProps {
  schema: DynamicFieldSchema[];
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  disabled?: boolean;
}

function asRoleIds(value: FormValue) {
  return Array.isArray(value) ? value.map(Number) : [];
}

function optionChecked(options: number[], option: DynamicFieldOption) {
  return options.includes(Number(option.value));
}

function normalizeOptions(payload: DynamicFieldOption[] | { data?: DynamicFieldOption[] }) {
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

export function DynamicFormRenderer({ schema, value, onChange, disabled }: DynamicFormRendererProps) {
  const [remoteOptions, setRemoteOptions] = useState<Record<string, DynamicFieldOption[]>>({});

  const remoteOptionFields = useMemo(
    () => schema.filter(field => field.options_source && ['select', 'multiselect'].includes(field.type)),
    [schema],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteOptions() {
      const entries = await Promise.all(remoteOptionFields.map(async field => {
        try {
          const payload = await apiClient.get<DynamicFieldOption[] | { data?: DynamicFieldOption[] }>(field.options_source as string);
          return [field.key, normalizeOptions(payload)] as const;
        } catch {
          return [field.key, field.options ?? []] as const;
        }
      }));

      if (!cancelled) {
        setRemoteOptions(Object.fromEntries(entries));
      }
    }

    if (remoteOptionFields.length > 0) {
      void loadRemoteOptions();
    }

    return () => {
      cancelled = true;
    };
  }, [remoteOptionFields]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {schema.map(field => {
        if (field.visible === false) return null;

        const fieldValue = value[field.key] as FormValue;
        const fieldDisabled = disabled || field.editable === false;

        if (field.type === 'boolean') {
          return (
            <div key={field.key} className="flex h-16 items-center justify-between rounded-md border px-3">
              <Label htmlFor={String(field.key)}>{field.label}</Label>
              <Switch
                id={String(field.key)}
                checked={Boolean(fieldValue)}
                disabled={fieldDisabled}
                onCheckedChange={checked => onChange({ [field.key]: checked })}
              />
            </div>
          );
        }

        if (field.type === 'multiselect') {
          const selected = asRoleIds(fieldValue);
          const options = remoteOptions[field.key] ?? field.options ?? [];

          return (
            <fieldset key={field.key} className="rounded-md border p-3 md:col-span-2">
              <legend className="px-1 text-sm font-medium">{field.label}</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {options.map(option => (
                  <label
                    key={String(option.value)}
                    className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={optionChecked(selected, option)}
                      disabled={fieldDisabled}
                      onChange={event => {
                        const optionValue = Number(option.value);
                        const roles = event.target.checked
                          ? [...selected, optionValue]
                          : selected.filter(item => item !== optionValue);
                        onChange({ [field.key]: roles });
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        }

        if (field.type === 'select') {
          const options = remoteOptions[field.key] ?? field.options ?? [];

          return (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={String(field.key)}>{field.label}</Label>
              <select
                id={String(field.key)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={String(fieldValue ?? '')}
                required={field.required}
                disabled={fieldDisabled}
                onChange={event => onChange({ [field.key]: event.target.value })}
              >
                <option value="">Selecione</option>
                {options.map(option => (
                  <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.key} className="grid gap-2 md:col-span-2">
              <Label htmlFor={String(field.key)}>{field.label}</Label>
              <Textarea
                id={String(field.key)}
                value={String(fieldValue ?? '')}
                placeholder={field.placeholder}
                required={field.required}
                disabled={fieldDisabled}
                onChange={event => onChange({ [field.key]: event.target.value })}
              />
            </div>
          );
        }

        return (
          <div key={field.key} className="grid gap-2">
            <Label htmlFor={String(field.key)}>{field.label}</Label>
            <Input
              id={String(field.key)}
              type={field.type === 'phone' ? 'tel' : field.type === 'currency' ? 'number' : field.type === 'document' || field.type === 'cpf' || field.type === 'cnpj' ? 'text' : field.type}
              value={String(fieldValue ?? '')}
              placeholder={field.placeholder}
              required={field.required}
              disabled={fieldDisabled}
              onChange={event => onChange({ [field.key]: event.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}
