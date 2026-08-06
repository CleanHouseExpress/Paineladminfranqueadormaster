import { apiClient } from './apiClient';

export interface PostalCodeAddress {
  cep: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  city_code: string | null;
}

interface DataResponse<T> {
  data: T;
}

export function normalizeCep(value: string): string {
  return value.replace(/\D+/g, '').slice(0, 8);
}

export function formatCep(value: string): string {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(value: string): boolean {
  return normalizeCep(value).length === 8;
}

export async function lookupPostalCode(
  cep: string,
  signal?: AbortSignal,
): Promise<PostalCodeAddress> {
  const normalizedCep = normalizeCep(cep);
  const response = await apiClient.get<DataResponse<PostalCodeAddress>>(
    `/api/company/address/cep/${normalizedCep}`,
    { signal },
  );

  return response.data;
}
