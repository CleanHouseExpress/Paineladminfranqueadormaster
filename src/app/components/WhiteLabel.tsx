import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  FileImage,
  Layers,
  Link as LinkIcon,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { ApiError, getApiErrorMessage } from "../../services/apiClient";
import {
  getWhiteLabelBranding,
  getWhiteLabelCompany,
  restoreWhiteLabelBranding,
  updateWhiteLabelBranding,
  uploadWhiteLabelAsset,
  type BrandingAsset,
  type WhiteLabelBranding,
} from "../../services/whiteLabelService";
import {
  buildTenantTheme,
  normalizeHexColor,
  ORCHESTRA_BRANDING,
  type TenantBrandingContract,
} from "../../services/tenantTheme";
import { useTenantTheme } from "../../shared/context/TenantThemeContext";
import { useTenant } from "../../shared/context/TenantContext";

type ColorField = Extract<keyof BrandingForm, `${string}Color`>;

interface BrandingForm {
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  sidebarColor: string;
  headerColor: string;
  foregroundColor: string;
  themeMode: "light" | "dark" | "system";
  loginTitle: string;
  loginSubtitle: string;
  logo: string | null;
  compactLogo: string | null;
  favicon: string | null;
  authenticationBackgroundImage: string | null;
}

interface AssetState {
  uploading: boolean;
  fileName: string | null;
  error: string | null;
}

const COLOR_FIELDS: Array<{
  key: ColorField;
  contractKey: keyof TenantBrandingContract;
  label: string;
  description: string;
}> = [
  { key: "primaryColor", contractKey: "primary_color", label: "Cor primaria", description: "Botoes principais, links e item ativo." },
  { key: "secondaryColor", contractKey: "secondary_color", label: "Cor secundaria", description: "Botoes secundarios, foco e apoio visual." },
  { key: "accentColor", contractKey: "accent_color", label: "Cor de destaque", description: "Superficies neutras, hover e badges." },
  { key: "backgroundColor", contractKey: "background_color", label: "Fundo principal", description: "Plano de fundo das telas autenticadas." },
  { key: "sidebarColor", contractKey: "sidebar_color", label: "Menu lateral", description: "Fundo da navegacao principal." },
  { key: "headerColor", contractKey: "header_color", label: "Cabecalho", description: "Barra superior e areas de busca." },
  { key: "foregroundColor", contractKey: "foreground_color", label: "Texto principal", description: "Texto usado em superficies claras." },
];

const ASSET_FIELDS: Array<{
  key: keyof Pick<BrandingForm, "logo" | "compactLogo" | "favicon" | "authenticationBackgroundImage">;
  asset: BrandingAsset;
  label: string;
  description: string;
  accept: string;
  maxSizeMb: number;
}> = [
  { key: "logo", asset: "logo", label: "Logo principal", description: "PNG, JPG ou WEBP ate 2MB.", accept: "image/png,image/jpeg,image/webp", maxSizeMb: 2 },
  { key: "compactLogo", asset: "compact_logo", label: "Logo reduzida", description: "Usada na sidebar recolhida. PNG, JPG ou WEBP ate 4MB.", accept: "image/png,image/jpeg,image/webp", maxSizeMb: 4 },
  { key: "favicon", asset: "favicon", label: "Favicon", description: "Icone do navegador. Ate 512px, PNG, JPG ou WEBP.", accept: "image/png,image/jpeg,image/webp", maxSizeMb: 4 },
  { key: "authenticationBackgroundImage", asset: "authentication_background_image", label: "Imagem do login", description: "Fundo da autenticacao. PNG, JPG ou WEBP ate 4MB.", accept: "image/png,image/jpeg,image/webp", maxSizeMb: 4 },
];

const EMPTY_FORM: BrandingForm = {
  displayName: ORCHESTRA_BRANDING.display_name,
  primaryColor: ORCHESTRA_BRANDING.primary_color,
  secondaryColor: ORCHESTRA_BRANDING.secondary_color,
  accentColor: ORCHESTRA_BRANDING.accent_color,
  backgroundColor: ORCHESTRA_BRANDING.background_color,
  sidebarColor: ORCHESTRA_BRANDING.sidebar_color,
  headerColor: ORCHESTRA_BRANDING.header_color,
  foregroundColor: ORCHESTRA_BRANDING.foreground_color,
  themeMode: "light",
  loginTitle: "",
  loginSubtitle: "",
  logo: null,
  compactLogo: null,
  favicon: null,
  authenticationBackgroundImage: null,
};

function initials(name: string) {
  const letters = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
  return letters || "OR";
}

function fromContract(branding?: WhiteLabelBranding | null): BrandingForm {
  const data = branding ?? {};
  return {
    displayName: data.display_name ?? ORCHESTRA_BRANDING.display_name,
    primaryColor: data.primary_color ?? ORCHESTRA_BRANDING.primary_color,
    secondaryColor: data.secondary_color ?? ORCHESTRA_BRANDING.secondary_color,
    accentColor: data.accent_color ?? ORCHESTRA_BRANDING.accent_color,
    backgroundColor: data.background_color ?? ORCHESTRA_BRANDING.background_color,
    sidebarColor: data.sidebar_color ?? ORCHESTRA_BRANDING.sidebar_color,
    headerColor: data.header_color ?? ORCHESTRA_BRANDING.header_color,
    foregroundColor: data.foreground_color ?? ORCHESTRA_BRANDING.foreground_color,
    themeMode: data.theme_mode === "dark" || data.theme_mode === "system" ? data.theme_mode : "light",
    loginTitle: data.login_title ?? "",
    loginSubtitle: data.login_subtitle ?? "",
    logo: data.logo ?? data.logo_url ?? null,
    compactLogo: data.compact_logo ?? null,
    favicon: data.favicon ?? null,
    authenticationBackgroundImage: data.authentication_background_image ?? null,
  };
}

function toContract(form: BrandingForm): WhiteLabelBranding {
  const value = (text: string) => text.trim() === "" ? null : text.trim();
  return {
    display_name: value(form.displayName),
    primary_color: value(form.primaryColor),
    secondary_color: value(form.secondaryColor),
    accent_color: value(form.accentColor),
    background_color: value(form.backgroundColor),
    sidebar_color: value(form.sidebarColor),
    header_color: value(form.headerColor),
    foreground_color: value(form.foregroundColor),
    theme_mode: form.themeMode,
    login_title: value(form.loginTitle),
    login_subtitle: value(form.loginSubtitle),
    logo: form.logo,
    compact_logo: form.compactLogo,
    favicon: form.favicon,
    authentication_background_image: form.authenticationBackgroundImage,
  };
}

function toSavePayload(form: BrandingForm, removedAssets: Set<BrandingAsset>): WhiteLabelBranding {
  const payload = toContract(form);
  delete payload.logo;
  delete payload.compact_logo;
  delete payload.favicon;
  delete payload.authentication_background_image;

  if (removedAssets.has("logo")) payload.logo = null;
  if (removedAssets.has("compact_logo")) payload.compact_logo = null;
  if (removedAssets.has("favicon")) payload.favicon = null;
  if (removedAssets.has("authentication_background_image")) payload.authentication_background_image = null;

  return payload;
}

function formToThemeContract(form: BrandingForm): TenantBrandingContract {
  return toContract(form);
}

function isValidOptionalHex(value: string) {
  return value.trim() === "" || Boolean(normalizeHexColor(value));
}

function normalizeColorInput(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? "" : normalizeHexColor(trimmed) ?? trimmed;
}

function fieldErrorMessages(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) return {};
  const errors = (error.data as { errors?: Record<string, unknown> }).errors;
  if (!errors || typeof errors !== "object") return {};
  return Object.fromEntries(Object.entries(errors).map(([key, value]) => {
    const list = Array.isArray(value) ? value : [value];
    return [key, list.filter((item): item is string => typeof item === "string").join(" ") || "Valor invalido."];
  }));
}

function variableStyle(theme: ReturnType<typeof buildTenantTheme>): CSSProperties {
  return theme.variables as CSSProperties;
}

function sectionStyle(): CSSProperties {
  return {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 20,
  };
}

function inputStyle(hasError = false): CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${hasError ? "#EF4444" : "var(--border)"}`,
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  };
}

function AssetPreview({ src, label, initialsText, wide = false }: { src: string | null; label: string; initialsText: string; wide?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        onError={() => setFailed(true)}
        style={{ width: "100%", height: wide ? 78 : 46, objectFit: "contain", display: "block" }}
      />
    );
  }

  return (
    <div
      aria-label={`${label} padrao Orchestra`}
      style={{
        width: wide ? "100%" : 46,
        height: wide ? 78 : 46,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
        color: "var(--primary-foreground)",
        fontWeight: 800,
        fontSize: wide ? 18 : 13,
      }}
    >
      {initialsText}
    </div>
  );
}

function ThemePreview({ form, colorErrors }: { form: BrandingForm; colorErrors: Record<string, string> }) {
  const safeForm = useMemo(() => {
    const next = { ...form };
    for (const field of COLOR_FIELDS) {
      if (colorErrors[field.key]) next[field.key] = "";
    }
    return next;
  }, [form, colorErrors]);
  const theme = useMemo(() => buildTenantTheme(formToThemeContract(safeForm)), [safeForm]);
  const vars = variableStyle(theme);
  const logoText = initials(theme.branding.display_name);

  return (
    <section
      aria-label="Pre-visualizacao do tema"
      data-testid="branding-preview"
      style={{ ...vars, ...sectionStyle(), padding: 0, overflow: "hidden", background: "var(--background)" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(92px, 0.35fr) minmax(0, 1fr)", minHeight: 430 }}>
        <aside style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--surface)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AssetPreview src={theme.branding.compact_logo ?? theme.branding.logo} label="Logo na pre-visualizacao" initialsText={logoText.slice(0, 2)} />
            </div>
            <strong style={{ fontSize: 12, lineHeight: 1.2 }}>{theme.branding.display_name}</strong>
          </div>
          <div style={{ display: "grid", gap: 6, fontSize: 11 }}>
            <div style={{ padding: "8px 9px", borderRadius: 8, color: "var(--sidebar-foreground)" }}>Dashboard</div>
            <div style={{ padding: "8px 9px", borderRadius: 8, background: "var(--sidebar-active)", color: "var(--sidebar-active-foreground)", fontWeight: 700, boxShadow: "inset 3px 0 0 var(--sidebar-active-foreground)" }}>Unidades</div>
            <div style={{ padding: "8px 9px", borderRadius: 8, color: "var(--sidebar-foreground)" }}>Financeiro</div>
          </div>
          <span style={{ marginTop: "auto", padding: "6px 8px", borderRadius: 999, background: "color-mix(in srgb, var(--sidebar-active) 16%, transparent)", color: "var(--sidebar-active-foreground)", fontSize: 10, fontWeight: 700 }}>Ativo</span>
        </aside>
        <main style={{ minWidth: 0 }}>
          <header style={{ background: "var(--header)", color: "var(--header-foreground)", borderBottom: "1px solid var(--border)", padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <strong style={{ fontSize: 14 }}>Painel da rede</strong>
              <p style={{ margin: 0, color: "var(--muted-text)", fontSize: 11 }}>Cabecalho com token do tenant</p>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: "var(--primary)", color: "var(--primary-foreground)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
              <Layers size={14} />
            </div>
          </header>
          <div style={{ padding: 16, color: "var(--text)" }}>
            <div style={{ background: "var(--surface)", color: "var(--surface-foreground)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15 }}>Card operacional</h3>
                  <p style={{ margin: "2px 0 0", color: "var(--muted-text)", fontSize: 12 }}>Texto secundario preserva legibilidade.</p>
                </div>
                <span style={{ padding: "4px 9px", borderRadius: 999, background: "var(--accent)", color: "var(--accent-foreground)", fontSize: 11, fontWeight: 700 }}>Neutro</span>
              </div>
              <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 700 }}>
                Campo em foco
                <input readOnly value="Valor de exemplo" style={{ ...inputStyle(), boxShadow: "0 0 0 3px color-mix(in srgb, var(--focus-ring) 24%, transparent)" }} />
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <button type="button" style={{ border: 0, borderRadius: 8, padding: "9px 12px", background: "var(--primary)", color: "var(--primary-foreground)", fontSize: 12, fontWeight: 700 }}>Botao primario</button>
                <button type="button" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", background: "var(--secondary)", color: "var(--secondary-foreground)", fontSize: 12, fontWeight: 700 }}>Secundario</button>
                <a href="#preview" onClick={event => event.preventDefault()} style={{ color: "var(--link)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}><LinkIcon size={13} /> Link</a>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", color: "var(--muted-text)", fontSize: 11 }}>
        Contraste calculado: sidebar usa {theme.variables["--sidebar-foreground"]}, primario usa {theme.variables["--primary-foreground"]}.
      </div>
    </section>
  );
}

export function WhiteLabel() {
  const { refreshTheme } = useTenantTheme();
  const { updateWhiteLabel } = useTenant();
  const [form, setForm] = useState<BrandingForm>(EMPTY_FORM);
  const [company, setCompany] = useState({ name: "", subdomain: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [removedAssets, setRemovedAssets] = useState<Set<BrandingAsset>>(() => new Set());
  const [assetState, setAssetState] = useState<Record<BrandingAsset, AssetState>>({
    logo: { uploading: false, fileName: null, error: null },
    compact_logo: { uploading: false, fileName: null, error: null },
    favicon: { uploading: false, fileName: null, error: null },
    authentication_background_image: { uploading: false, fileName: null, error: null },
  });
  const requestId = useRef(0);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const colorErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const field of COLOR_FIELDS) {
      if (!isValidOptionalHex(form[field.key])) errors[field.key] = "Use #RGB ou #RRGGBB.";
    }
    return errors;
  }, [form]);

  const hasInvalidColors = Object.keys(colorErrors).length > 0;
  const logoText = initials(form.displayName || company.name || ORCHESTRA_BRANDING.display_name);

  useEffect(() => {
    let mounted = true;
    const id = ++requestId.current;

    async function load() {
      setLoading(true);
      setError(null);
      setStatus(null);
      try {
        const [branding, nextCompany] = await Promise.all([getWhiteLabelBranding(), getWhiteLabelCompany()]);
        if (!mounted || id !== requestId.current) return;
        setCompany(nextCompany);
        setForm(fromContract(branding.data));
        setRemovedAssets(new Set());
      } catch {
        if (mounted) setError("Nao foi possivel carregar o branding da rede.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => { mounted = false; };
  }, [reloadSeq]);

  useEffect(() => {
    if (showRestore) confirmButtonRef.current?.focus();
    if (!showRestore) restoreButtonRef.current?.focus();
  }, [showRestore]);

  const setField = <K extends keyof BrandingForm>(key: K, value: BrandingForm[K]) => {
    setStatus(null);
    setFieldErrors(current => {
      const next = { ...current };
      delete next[String(key)];
      return next;
    });
    setForm(current => ({ ...current, [key]: value }));
  };

  const updateFromResponse = async (branding: WhiteLabelBranding) => {
    const nextForm = fromContract(branding);
    setForm(nextForm);
    setRemovedAssets(new Set());
    updateWhiteLabel({
      platformName: nextForm.displayName,
      primaryColor: nextForm.primaryColor,
      secondaryColor: nextForm.secondaryColor,
      accentColor: nextForm.accentColor,
      backgroundColor: nextForm.backgroundColor,
      sidebarColor: nextForm.sidebarColor,
      headerColor: nextForm.headerColor,
      foregroundColor: nextForm.foregroundColor,
      logoUrl: nextForm.logo ?? "",
      compactLogoUrl: nextForm.compactLogo ?? "",
      favicon: nextForm.favicon ?? "",
      loginBg: nextForm.authenticationBackgroundImage ?? "",
      themeMode: nextForm.themeMode,
    });
    await refreshTheme(branding);
  };

  const handleSave = async () => {
    if (saving || restoring || hasInvalidColors) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    setFieldErrors({});

    try {
      const payload = toSavePayload({
        ...form,
        primaryColor: normalizeColorInput(form.primaryColor),
        secondaryColor: normalizeColorInput(form.secondaryColor),
        accentColor: normalizeColorInput(form.accentColor),
        backgroundColor: normalizeColorInput(form.backgroundColor),
        sidebarColor: normalizeColorInput(form.sidebarColor),
        headerColor: normalizeColorInput(form.headerColor),
        foregroundColor: normalizeColorInput(form.foregroundColor),
      }, removedAssets);
      const response = await updateWhiteLabelBranding(payload);
      await updateFromResponse(response.data);
      setStatus("Branding salvo e aplicado para esta sessao.");
    } catch (saveError) {
      setFieldErrors(fieldErrorMessages(saveError));
      setError(getApiErrorMessage(saveError, "Nao foi possivel salvar o branding."));
    } finally {
      setSaving(false);
    }
  };

  const validateFile = (file: File, maxSizeMb: number) => {
    const validType = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    const validExt = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!validType || !validExt) return "Use PNG, JPG ou WEBP.";
    if (file.size > maxSizeMb * 1024 * 1024) return `Arquivo deve ter ate ${maxSizeMb}MB.`;
    return null;
  };

  const handleAssetChange = async (asset: BrandingAsset, key: keyof BrandingForm, event: ChangeEvent<HTMLInputElement>, maxSizeMb: number) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || assetState[asset].uploading) return;

    const validation = validateFile(file, maxSizeMb);
    if (validation) {
      setAssetState(current => ({ ...current, [asset]: { ...current[asset], error: validation } }));
      return;
    }

    setAssetState(current => ({ ...current, [asset]: { uploading: true, fileName: file.name, error: null } }));
    setError(null);
    setStatus(null);

    try {
      const response = await uploadWhiteLabelAsset(asset, file);
      await updateFromResponse(response.data);
      setRemovedAssets(current => {
        const next = new Set(current);
        next.delete(asset);
        return next;
      });
      setAssetState(current => ({ ...current, [asset]: { uploading: false, fileName: file.name, error: null } }));
      setStatus("Asset enviado e aplicado.");
    } catch (uploadError) {
      setAssetState(current => ({ ...current, [asset]: { ...current[asset], uploading: false, error: getApiErrorMessage(uploadError, "Nao foi possivel enviar o arquivo.") } }));
    }
  };

  const clearAsset = (key: keyof BrandingForm, asset: BrandingAsset) => {
    if (assetState[asset].uploading) return;
    setField(key, null as BrandingForm[typeof key]);
    setRemovedAssets(current => new Set(current).add(asset));
    setAssetState(current => ({ ...current, [asset]: { uploading: false, fileName: null, error: null } }));
  };

  const handleRestore = async () => {
    if (restoring || saving) return;
    setRestoring(true);
    setError(null);
    try {
      const response = await restoreWhiteLabelBranding();
      await updateFromResponse(response.data);
      setShowRestore(false);
      setStatus("Tema padrao Orchestra restaurado.");
    } catch (restoreError) {
      setError(getApiErrorMessage(restoreError, "Nao foi possivel restaurar o tema padrao."));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] p-4 md:p-6" style={{ color: "var(--text)" }}>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2" style={{ fontSize: 12, color: "var(--muted-text)" }}>
            <span>Configuracoes</span>
            <ChevronRight size={12} />
            <span>White Label</span>
          </div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Personalizacao White Label</h1>
          <p style={{ fontSize: 13, color: "var(--muted-text)", marginTop: 2 }}>Configure identidade visual, assets e login da rede.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            ref={restoreButtonRef}
            type="button"
            onClick={() => setShowRestore(true)}
            disabled={loading || saving || restoring}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            <RotateCcw size={15} /> Restaurar padrao
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving || restoring || hasInvalidColors}
            data-testid="branding-save"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ border: 0, background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            {saving ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {status ? <div className="mb-4 rounded-md px-4 py-3 text-sm" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857" }}><Check size={15} style={{ display: "inline", marginRight: 6 }} />{status}</div> : null}
        {error ? (
          <div className="mb-4 flex flex-col gap-3 rounded-md px-4 py-3 text-sm md:flex-row md:items-center md:justify-between" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}>
            <span><AlertTriangle size={15} style={{ display: "inline", marginRight: 6 }} />{error}</span>
            <button type="button" onClick={() => setReloadSeq(value => value + 1)} className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: "#FFFFFF", border: "1px solid #FECACA", color: "#B91C1C" }}>Tentar novamente</button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div style={sectionStyle()} className="h-96 animate-pulse" />
          <div style={sectionStyle()} className="h-96 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-5">
            <section style={sectionStyle()}>
              <div className="mb-4 flex items-center gap-2">
                <Palette size={17} style={{ color: "var(--primary)" }} />
                <h2 style={{ margin: 0, fontSize: 17 }}>Identidade da rede</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold">
                  Nome exibido
                  <input value={form.displayName} onChange={event => setField("displayName", event.target.value)} style={inputStyle(Boolean(fieldErrors.display_name))} aria-invalid={Boolean(fieldErrors.display_name)} />
                  <span style={{ color: "var(--muted-text)", fontSize: 11 }}>Vazio ou indisponivel usa Orchestra.</span>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Modo do tema
                  <select value={form.themeMode} onChange={event => setField("themeMode", event.target.value as BrandingForm["themeMode"])} style={inputStyle()}>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Titulo do login
                  <input value={form.loginTitle} onChange={event => setField("loginTitle", event.target.value)} style={inputStyle(Boolean(fieldErrors.login_title))} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Subtitulo do login
                  <input value={form.loginSubtitle} onChange={event => setField("loginSubtitle", event.target.value)} style={inputStyle(Boolean(fieldErrors.login_subtitle))} />
                </label>
              </div>
            </section>

            <section style={sectionStyle()}>
              <h2 style={{ margin: "0 0 14px", fontSize: 17 }}>Paleta de cores</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {COLOR_FIELDS.map(field => {
                  const value = form[field.key];
                  const normalized = normalizeHexColor(value);
                  const inputId = `branding-${field.key}`;
                  const errorMessage = colorErrors[field.key] ?? fieldErrors[String(field.contractKey)];
                  return (
                    <div key={field.key} className="grid gap-2">
                      <label htmlFor={inputId} className="text-sm font-semibold">{field.label}</label>
                      <p id={`${inputId}-help`} style={{ margin: 0, color: "var(--muted-text)", fontSize: 11 }}>{field.description} Campo vazio usa o padrao Orchestra.</p>
                      <div className="flex items-center gap-2">
                        <input
                          id={inputId}
                          value={value}
                          onChange={event => setField(field.key, event.target.value)}
                          onBlur={() => setField(field.key, normalizeColorInput(value))}
                          aria-invalid={Boolean(errorMessage)}
                          aria-describedby={`${inputId}-help ${errorMessage ? `${inputId}-error` : ""}`}
                          placeholder={ORCHESTRA_BRANDING[field.contractKey as keyof typeof ORCHESTRA_BRANDING] as string}
                          style={inputStyle(Boolean(errorMessage))}
                        />
                        <input
                          type="color"
                          aria-label={`Seletor visual: ${field.label}`}
                          value={normalized ?? ORCHESTRA_BRANDING[field.contractKey as keyof typeof ORCHESTRA_BRANDING] as string}
                          onChange={event => setField(field.key, event.target.value.toUpperCase())}
                          style={{ width: 42, height: 42, border: "1px solid var(--border)", borderRadius: 8, padding: 4, background: "var(--surface)" }}
                        />
                        <span aria-hidden style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: normalized ?? "repeating-linear-gradient(45deg, #F1F5F9, #F1F5F9 4px, #E2E8F0 4px, #E2E8F0 8px)" }} />
                      </div>
                      {errorMessage ? <p id={`${inputId}-error`} style={{ margin: 0, color: "#DC2626", fontSize: 12 }}>{errorMessage}</p> : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={sectionStyle()}>
              <h2 style={{ margin: "0 0 14px", fontSize: 17 }}>Assets visuais</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {ASSET_FIELDS.map(asset => {
                  const state = assetState[asset.asset];
                  const src = form[asset.key] as string | null;
                  return (
                    <div key={asset.asset} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, display: "grid", gap: 12 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14 }}>{asset.label}</h3>
                          <p style={{ margin: "2px 0 0", color: "var(--muted-text)", fontSize: 11 }}>{asset.description}</p>
                        </div>
                        <FileImage size={17} style={{ color: "var(--primary)" }} />
                      </div>
                      <div style={{ minHeight: asset.asset === "authentication_background_image" ? 90 : 58, border: "1px dashed var(--border)", borderRadius: 8, padding: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
                        <AssetPreview src={src} label={asset.label} initialsText={logoText.slice(0, asset.asset === "favicon" ? 1 : 2)} wide={asset.asset === "authentication_background_image"} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)", opacity: state.uploading ? 0.65 : 1 }}>
                          {state.uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                          {state.uploading ? "Enviando..." : "Selecionar"}
                          <input type="file" accept={asset.accept} disabled={state.uploading} className="hidden" onChange={event => void handleAssetChange(asset.asset, asset.key, event, asset.maxSizeMb)} />
                        </label>
                        <button type="button" onClick={() => clearAsset(asset.key, asset.asset)} disabled={state.uploading || !src} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                          <X size={14} /> Remover
                        </button>
                      </div>
                      <p style={{ margin: 0, color: state.error ? "#DC2626" : "var(--muted-text)", fontSize: 11 }}>
                        {state.error ?? state.fileName ?? "Preview usa fallback quando o arquivo estiver ausente."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="lg:sticky lg:top-5 lg:self-start">
            <div className="mb-3 flex items-center gap-2" style={{ color: "var(--muted-text)", fontSize: 12 }}>
              <Eye size={15} style={{ color: "var(--primary)" }} />
              Pre-visualizacao isolada. Nada e aplicado antes de salvar.
            </div>
            <ThemePreview form={form} colorErrors={colorErrors} />
            <div className="mt-4 rounded-md p-3 text-xs" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted-text)" }}>
              <Shield size={14} style={{ display: "inline", marginRight: 6, color: "var(--primary)" }} />
              Cores de sucesso, erro, alerta e estados destrutivos continuam sob os tokens semanticos do Orchestra.
            </div>
          </div>
        </div>
      )}

      {showRestore ? (
        <div role="dialog" aria-modal="true" aria-labelledby="restore-title" className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }} onKeyDown={event => { if (event.key === "Escape" && !restoring) setShowRestore(false); }}>
          <div style={{ width: "100%", maxWidth: 460, background: "var(--surface)", color: "var(--text)", borderRadius: 8, border: "1px solid var(--border)", padding: 20, boxShadow: "0 24px 80px rgba(15,23,42,0.25)" }}>
            <h2 id="restore-title" style={{ margin: 0, fontSize: 18 }}>Restaurar tema padrao?</h2>
            <p style={{ color: "var(--muted-text)", fontSize: 13, lineHeight: 1.6 }}>
              As personalizacoes visuais serao removidas e o tema padrao Orchestra voltara para todos os usuarios deste tenant. Dados operacionais da rede nao serao alterados.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowRestore(false)} disabled={restoring} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>Cancelar</button>
              <button ref={confirmButtonRef} type="button" onClick={() => void handleRestore()} disabled={restoring} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ border: 0, background: "var(--primary)", color: "var(--primary-foreground)" }}>
                {restoring ? <Loader2 className="animate-spin" size={15} /> : <RotateCcw size={15} />}
                Restaurar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
