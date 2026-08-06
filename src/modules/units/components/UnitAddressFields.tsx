import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiError } from '../../../services/apiClient';
import { formatCep, isValidCep, lookupPostalCode, normalizeCep } from '../../../services/postalCodeService';
import type { DynamicFieldSchema } from '../../../types/userManagement';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';

const CEP_LOOKUP_DEBOUNCE_MS = 300;

const ADDRESS_FIELD_KEYS = [
  'address_zipcode',
  'address_street',
  'address_number',
  'address_complement',
  'address_district',
  'address_city',
  'address_state',
] as const;

type AddressFieldKey = typeof ADDRESS_FIELD_KEYS[number];
type FormValues = Record<string, unknown>;

const ADDRESS_FIELD_LABELS: Partial<Record<AddressFieldKey, string>> = {
  address_zipcode: 'CEP',
  address_street: 'Logradouro',
  address_number: 'Numero',
  address_complement: 'Complemento',
  address_district: 'Bairro',
  address_city: 'Cidade',
  address_state: 'Estado',
};

interface UnitAddressFieldsProps {
  fields: DynamicFieldSchema[];
  value: FormValues;
  disabled?: boolean;
  cepErrorMessage?: string | null;
  onChange: (patch: FormValues) => void;
  onCepValidityChange?: (valid: boolean) => void;
}

function fieldOrder(field: DynamicFieldSchema): number {
  return typeof field.order === 'number' ? field.order : 0;
}

function isAddressFieldKey(key: string): key is AddressFieldKey {
  return ADDRESS_FIELD_KEYS.includes(key as AddressFieldKey);
}

function isVisible(field: DynamicFieldSchema): boolean {
  return field.visible !== false;
}

function isAbortError(error: unknown): boolean {
  return typeof DOMException !== 'undefined'
    && error instanceof DOMException
    && error.name === 'AbortError';
}

function cepLookupMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'CEP nao localizado. Verifique o numero informado ou preencha o endereco manualmente.';
    if (error.status === 504) return 'A consulta do CEP demorou mais que o esperado. Preencha o endereco manualmente ou tente novamente.';
    if (error.status === 502) return 'Nao foi possivel consultar o endereco no momento. Preencha os campos manualmente.';
    if (error.status === 422) return 'Informe um CEP valido com oito digitos.';
  }

  return 'Nao foi possivel consultar o endereco no momento. Preencha os campos manualmente.';
}

function fieldInputType(field: DynamicFieldSchema): string {
  if (field.type === 'email') return 'email';
  if (field.type === 'phone') return 'tel';
  return 'text';
}

export function visibleUnitAddressFieldKeys(fields: DynamicFieldSchema[]): Set<string> {
  return new Set(fields.filter(field => isVisible(field) && isAddressFieldKey(String(field.key))).map(field => String(field.key)));
}

export function UnitAddressFields({
  fields,
  value,
  disabled = false,
  cepErrorMessage = null,
  onChange,
  onCepValidityChange,
}: UnitAddressFieldsProps) {
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [cepValidationError, setCepValidationError] = useState<string | null>(null);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const currentCepRef = useRef('');
  const lastRequestedCepRef = useRef('');
  const didInitializeCepRef = useRef(false);
  const numberInputRef = useRef<HTMLInputElement | null>(null);

  const addressFields = useMemo(
    () => fields.filter(field => isVisible(field) && isAddressFieldKey(String(field.key))).sort((a, b) => fieldOrder(a) - fieldOrder(b)),
    [fields],
  );
  const fieldMap = useMemo(() => new Map(addressFields.map(field => [String(field.key), field])), [addressFields]);
  const cepField = fieldMap.get('address_zipcode');
  const normalizedCep = normalizeCep(String(value.address_zipcode ?? ''));

  useEffect(() => {
    currentCepRef.current = normalizedCep;
  }, [normalizedCep]);

  useEffect(() => {
    if (!didInitializeCepRef.current) {
      didInitializeCepRef.current = true;
      lastRequestedCepRef.current = normalizedCep;
      if (String(value.address_zipcode ?? '') !== normalizedCep) {
        onChange({ address_zipcode: normalizedCep });
      }
    }
  }, [normalizedCep, onChange, value.address_zipcode]);

  useEffect(() => () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    abortControllerRef.current?.abort();
  }, []);

  const updateCepValidity = (message: string | null) => {
    setCepValidationError(message);
    onCepValidityChange?.(!message);
  };

  const abortPendingLookup = () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLookingUpCep(false);
  };

  const applyLookupResult = (queriedCep: string, requestId: number, data: Awaited<ReturnType<typeof lookupPostalCode>>) => {
    if (requestId !== requestIdRef.current || currentCepRef.current !== queriedCep) return;

    const patch: FormValues = {};
    if (data.street !== null && fieldMap.has('address_street')) patch.address_street = data.street;
    if (data.neighborhood !== null && fieldMap.has('address_district')) patch.address_district = data.neighborhood;
    if (data.city !== null && fieldMap.has('address_city')) patch.address_city = data.city;
    if (data.state !== null && fieldMap.has('address_state')) patch.address_state = data.state;

    if (Object.keys(patch).length > 0) onChange(patch);
    setLookupError(null);

    if (fieldMap.has('address_number') && !disabled) {
      requestAnimationFrame(() => {
        if (requestId === requestIdRef.current && currentCepRef.current === queriedCep) {
          numberInputRef.current?.focus();
        }
      });
    }
  };

  const startLookup = (cep: string) => {
    abortPendingLookup();
    setLookupError(null);
    updateCepValidity(null);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    lastRequestedCepRef.current = cep;

    debounceRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLookingUpCep(true);

      void lookupPostalCode(cep, controller.signal)
        .then(data => applyLookupResult(cep, requestId, data))
        .catch(error => {
          if (isAbortError(error) || requestId !== requestIdRef.current || currentCepRef.current !== cep) return;
          setLookupError(cepLookupMessage(error));
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setIsLookingUpCep(false);
            abortControllerRef.current = null;
          }
        });
    }, CEP_LOOKUP_DEBOUNCE_MS);
  };

  const handleCepChange = (rawValue: string) => {
    const nextCep = normalizeCep(rawValue);
    currentCepRef.current = nextCep;
    onChange({ address_zipcode: nextCep });
    setLookupError(null);
    updateCepValidity(null);

    if (!isValidCep(nextCep)) {
      abortPendingLookup();
      lastRequestedCepRef.current = '';
      return;
    }

    if (nextCep === lastRequestedCepRef.current) return;
    startLookup(nextCep);
  };

  const handleCepBlur = () => {
    if (!normalizedCep) {
      updateCepValidity(null);
      return;
    }
    updateCepValidity(isValidCep(normalizedCep) ? null : 'Informe um CEP valido com oito digitos.');
  };

  const renderField = (field: DynamicFieldSchema) => {
    const key = String(field.key);
    const current = value[key];
    const stringValue = current === null || current === undefined ? '' : String(current);
    const isCep = key === 'address_zipcode';
    const inputId = `unit-${key}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    const loadingId = `${inputId}-loading`;
    const currentCepError = cepValidationError || cepErrorMessage;
    const hasError = isCep && Boolean(currentCepError || lookupError);
    const describedBy = [
      hasError ? errorId : null,
      field.helpText ? helpId : null,
      isCep && isLookingUpCep ? loadingId : null,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div key={key} className="grid gap-2">
        <Label htmlFor={inputId}>
          {ADDRESS_FIELD_LABELS[key as AddressFieldKey] ?? field.label}
          {field.required ? <span aria-label="obrigatorio" className="ml-1 text-destructive">*</span> : null}
        </Label>
        <div className={isCep ? 'relative' : undefined}>
          <Input
            ref={key === 'address_number' ? numberInputRef : undefined}
            id={inputId}
            data-testid={`unit-${key}`}
            type={fieldInputType(field)}
            className={isCep && isLookingUpCep ? 'pr-10' : undefined}
            value={isCep ? formatCep(stringValue) : stringValue}
            required={field.required}
            aria-required={field.required || undefined}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            aria-busy={isCep && isLookingUpCep ? true : undefined}
            inputMode={isCep ? 'numeric' : undefined}
            autoComplete={isCep ? 'postal-code' : undefined}
            onBlur={isCep ? handleCepBlur : undefined}
            onChange={event => {
              if (isCep) {
                handleCepChange(event.target.value);
                return;
              }
              onChange({ [key]: event.target.value });
            }}
          />
          {isCep && isLookingUpCep ? (
            <span
              id={loadingId}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-live="polite"
              aria-label="Consultando endereco"
              data-testid="unit-cep-loading"
            >
              <RefreshCw className="size-4 animate-spin" />
              <span className="sr-only">Consultando endereco</span>
            </span>
          ) : null}
        </div>
        {field.helpText ? <p id={helpId} className="text-xs text-muted-foreground">{field.helpText}</p> : null}
        {isCep && currentCepError ? <p id={errorId} className="text-xs text-destructive">{currentCepError}</p> : null}
        {isCep && !currentCepError && lookupError ? <p id={errorId} className="text-xs text-amber-700">{lookupError}</p> : null}
      </div>
    );
  };

  if (addressFields.length === 0) return null;

  return (
    <div className="grid gap-4" aria-label="Endereco da unidade">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        {cepField ? <div className="lg:col-span-2">{renderField(cepField)}</div> : null}
        {fieldMap.get('address_street') ? <div className="lg:col-span-4">{renderField(fieldMap.get('address_street')!)}</div> : null}
        {fieldMap.get('address_number') ? <div className="lg:col-span-2">{renderField(fieldMap.get('address_number')!)}</div> : null}
        {fieldMap.get('address_complement') ? <div className="lg:col-span-4">{renderField(fieldMap.get('address_complement')!)}</div> : null}
        {fieldMap.get('address_district') ? <div className="lg:col-span-2">{renderField(fieldMap.get('address_district')!)}</div> : null}
        {fieldMap.get('address_city') ? <div className="lg:col-span-3">{renderField(fieldMap.get('address_city')!)}</div> : null}
        {fieldMap.get('address_state') ? <div className="lg:col-span-1">{renderField(fieldMap.get('address_state')!)}</div> : null}
      </div>
    </div>
  );
}
