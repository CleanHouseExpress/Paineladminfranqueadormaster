import type { DynamicFieldOption, DynamicFieldSchema, TenantUserPayload } from '../../types/userManagement';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';

type FormValue = string | number[] | boolean | undefined;

interface DynamicFormRendererProps {
  schema: DynamicFieldSchema[];
  value: Partial<TenantUserPayload>;
  onChange: (patch: Partial<TenantUserPayload>) => void;
  disabled?: boolean;
}

function asRoleIds(value: FormValue) {
  return Array.isArray(value) ? value.map(Number) : [];
}

function optionChecked(options: number[], option: DynamicFieldOption) {
  return options.includes(Number(option.value));
}

export function DynamicFormRenderer({ schema, value, onChange, disabled }: DynamicFormRendererProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {schema.map(field => {
        const fieldValue = value[field.key] as FormValue;

        if (field.type === 'boolean') {
          return (
            <div key={field.key} className="flex h-16 items-center justify-between rounded-md border px-3">
              <Label htmlFor={String(field.key)}>{field.label}</Label>
              <Switch
                id={String(field.key)}
                checked={Boolean(fieldValue)}
                disabled={disabled}
                onCheckedChange={checked => onChange({ [field.key]: checked })}
              />
            </div>
          );
        }

        if (field.type === 'multiselect') {
          const selected = asRoleIds(fieldValue);

          return (
            <fieldset key={field.key} className="rounded-md border p-3 md:col-span-2">
              <legend className="px-1 text-sm font-medium">{field.label}</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(field.options ?? []).map(option => (
                  <label
                    key={String(option.value)}
                    className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={optionChecked(selected, option)}
                      disabled={disabled}
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

        return (
          <div key={field.key} className="grid gap-2">
            <Label htmlFor={String(field.key)}>{field.label}</Label>
            <Input
              id={String(field.key)}
              type={field.type}
              value={String(fieldValue ?? '')}
              placeholder={field.placeholder}
              required={field.required}
              disabled={disabled}
              onChange={event => onChange({ [field.key]: event.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}
