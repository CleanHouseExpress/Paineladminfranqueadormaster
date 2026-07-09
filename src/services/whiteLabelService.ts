import { apiClient, apiClientConfig, AUTH_TOKEN_STORAGE_KEY } from "./apiClient";

export interface WhiteLabelBranding {
  logo_url?: string | null;
  logo_file_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  login_title?: string | null;
  login_subtitle?: string | null;
}

interface BrandingResponse {
  data: WhiteLabelBranding;
  branding_completed?: boolean;
}

interface CompanyResponse {
  data?: {
    name?: string | null;
    subdomain?: {
      subdomain?: string | null;
    } | null;
  } | null;
  name?: string | null;
  subdomain?: {
    subdomain?: string | null;
  } | null;
}

function authHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function apiUrl(path: string) {
  return `${apiClientConfig.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getWhiteLabelBranding() {
  return apiClient.get<BrandingResponse>("/api/me/onboarding/branding");
}

export async function updateWhiteLabelBranding(payload: WhiteLabelBranding) {
  return apiClient.put<BrandingResponse>("/api/me/onboarding/branding", payload);
}

export async function uploadWhiteLabelLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);

  return apiClient.post<BrandingResponse>("/api/me/onboarding/branding/logo", formData);
}

export async function getWhiteLabelCompany() {
  const response = await apiClient.get<CompanyResponse>("/api/me/company");
  const data = response.data ?? response;

  return {
    name: data?.name ?? "",
    subdomain: data?.subdomain?.subdomain ?? "",
  };
}

export async function getWhiteLabelLogoObjectUrl() {
  const response = await fetch(apiUrl("/api/me/onboarding/branding/logo"), {
    headers: {
      Accept: "image/*",
      ...authHeaders(),
    },
  });

  if (!response.ok) return null;

  return URL.createObjectURL(await response.blob());
}
