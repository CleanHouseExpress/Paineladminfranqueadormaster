import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Upload, Eye, Palette, Globe, MessageSquare, Loader2 } from "lucide-react";
import {
  getApiErrorMessage,
} from "../../services/apiClient";
import {
  getWhiteLabelBranding,
  getWhiteLabelCompany,
  getWhiteLabelLogoObjectUrl,
  updateWhiteLabelBranding,
  uploadWhiteLabelLogo,
} from "../../services/whiteLabelService";

interface WhiteLabelConfig {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  logoFileName: string | null;
  domain: string;
  tone: string;
  loginTitle: string;
  loginSubtitle: string;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  brandName: "",
  primaryColor: "#0F172A",
  secondaryColor: "#2563EB",
  logoUrl: null,
  logoFileName: null,
  domain: "",
  tone: "professional",
  loginTitle: "Bem-vindo de volta",
  loginSubtitle: "Acesse o painel da sua rede",
};

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("");

  return letters || "OR";
}

export function WhiteLabel() {
  const [config, setConfig] = useState<WhiteLabelConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"brand" | "domain" | "comms">("brand");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const logoText = useMemo(() => initials(config.brandName), [config.brandName]);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [branding, company] = await Promise.all([
          getWhiteLabelBranding(),
          getWhiteLabelCompany(),
        ]);

        if (branding.data.logo_url) {
          objectUrl = await getWhiteLabelLogoObjectUrl();
        }

        if (!mounted) return;

        setConfig(current => ({
          ...current,
          brandName: company.name || current.brandName,
          domain: company.subdomain ? `${company.subdomain}.orchestra.app` : current.domain,
          primaryColor: branding.data.primary_color || current.primaryColor,
          secondaryColor: branding.data.secondary_color || current.secondaryColor,
          loginTitle: branding.data.login_title || current.loginTitle,
          loginSubtitle: branding.data.login_subtitle || current.loginSubtitle,
          logoUrl: objectUrl,
          logoFileName: branding.data.logo_file_name ?? null,
        }));
      } catch {
        if (mounted) setError("Nao foi possivel carregar o white label da rede.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await updateWhiteLabelBranding({
        primary_color: config.primaryColor,
        secondary_color: config.secondaryColor,
        login_title: config.loginTitle,
        login_subtitle: config.loginSubtitle,
      });

      setConfig(current => ({
        ...current,
        primaryColor: response.data.primary_color || current.primaryColor,
        secondaryColor: response.data.secondary_color || current.secondaryColor,
        loginTitle: response.data.login_title || current.loginTitle,
        loginSubtitle: response.data.login_subtitle || current.loginSubtitle,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Nao foi possivel publicar as alteracoes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const response = await uploadWhiteLabelLogo(file);
      const objectUrl = await getWhiteLabelLogoObjectUrl();

      setConfig(current => {
        if (current.logoUrl?.startsWith("blob:")) URL.revokeObjectURL(current.logoUrl);

        return {
          ...current,
          logoUrl: objectUrl,
          logoFileName: response.data.logo_file_name ?? file.name,
        };
      });
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Nao foi possivel enviar a logo. Use PNG, JPG, WEBP ou SVG com ate 2MB."));
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Configuracoes</span>
          <ChevronRight size={12} />
          <span>White Label</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 style={{ color: "#0F172A" }}>Personalizacao White Label</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Configure a identidade visual e comunicacao da plataforma para sua rede</p>
          </div>
          <button onClick={handleSave}
            disabled={loading || saving}
            className="px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: saved ? "#10B981" : config.primaryColor, fontSize: "13px", fontWeight: 500 }}>
            {saving ? "Salvando..." : saved ? "Salvo!" : "Publicar alteracoes"}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "13px" }}>
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#F1F5F9" }}>
        {[
          { id: "brand", label: "Identidade Visual", icon: Palette },
          { id: "domain", label: "Dominio", icon: Globe },
          { id: "comms", label: "Comunicacao", icon: MessageSquare },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id as "brand" | "domain" | "comms")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                fontSize: "13px", fontWeight: 500,
                background: activeTab === t.id ? "white" : "transparent",
                color: activeTab === t.id ? "#0F172A" : "#64748B",
                boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
              }}>
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center rounded-xl bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <Loader2 className="animate-spin" size={24} style={{ color: config.primaryColor }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "brand" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Logotipo & Nome</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                    <div>
                      <label className="block mb-2" style={{ color: "#374151" }}>Logo da rede</label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <button type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors disabled:opacity-60"
                        style={{ borderColor: "rgba(0,0,0,0.1)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = config.primaryColor}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.1)"}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto mb-2 overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "18px", fontWeight: 800 }}>
                          {config.logoUrl ? <img src={config.logoUrl} alt="" className="w-full h-full object-contain" /> : logoText}
                        </div>
                        {uploadingLogo ? <Loader2 className="animate-spin" size={14} style={{ color: "#94A3B8", margin: "0 auto 4px" }} /> : <Upload size={14} style={{ color: "#94A3B8", margin: "0 auto 4px" }} />}
                        <p style={{ fontSize: "11px", color: "#94A3B8" }}>
                          {config.logoFileName || "PNG, JPG, WEBP ou SVG - Max 2MB"}
                        </p>
                      </button>
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: "#374151" }}>Favicon</label>
                      <div className="border-2 border-dashed rounded-xl p-6 text-center"
                        style={{ borderColor: "rgba(0,0,0,0.1)", background: "#F8FAFC" }}>
                        <div className="w-8 h-8 rounded flex items-center justify-center text-white mx-auto mb-2"
                          style={{ background: config.primaryColor, fontSize: "12px", fontWeight: 800 }}>
                          {logoText[0]}
                        </div>
                        <Upload size={14} style={{ color: "#CBD5E1", margin: "0 auto 4px" }} />
                        <p style={{ fontSize: "11px", color: "#94A3B8" }}>Upload de favicon ainda nao publicado</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1.5" style={{ color: "#374151" }}>Nome da rede</label>
                    <input value={config.brandName} readOnly
                      className="w-full px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Paleta de cores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {[
                      { key: "primaryColor", label: "Cor principal", desc: "Botoes, links, destaques" },
                      { key: "secondaryColor", label: "Cor secundaria", desc: "Gradientes, hover" },
                    ].map(c => (
                      <div key={c.key}>
                        <label className="block mb-1.5" style={{ color: "#374151" }}>{c.label}</label>
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)" }}>
                          <input type="color"
                            value={config[c.key as "primaryColor" | "secondaryColor"]}
                            onChange={e => setConfig({ ...config, [c.key]: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0 outline-none"
                            style={{ padding: "2px" }}
                          />
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A", fontFamily: "monospace" }}>
                              {config[c.key as "primaryColor" | "secondaryColor"]}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>{c.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: "#F8FAFC" }}>
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "8px" }}>Pre-visualizacao de botoes</div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="px-4 py-2 rounded-lg text-white" style={{ background: config.primaryColor, fontSize: "12px", fontWeight: 500 }}>Botao primario</button>
                      <button className="px-4 py-2 rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "12px", fontWeight: 500 }}>Gradiente</button>
                      <button className="px-4 py-2 rounded-lg" style={{ background: `${config.primaryColor}15`, color: config.primaryColor, fontSize: "12px", fontWeight: 500 }}>Outline</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 style={{ color: "#0F172A", marginBottom: "16px" }}>Tela de login</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1.5" style={{ color: "#374151" }}>Titulo de boas-vindas</label>
                      <input value={config.loginTitle} onChange={e => setConfig({ ...config, loginTitle: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl outline-none"
                        style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                    </div>
                    <div>
                      <label className="block mb-1.5" style={{ color: "#374151" }}>Subtitulo</label>
                      <input value={config.loginSubtitle} onChange={e => setConfig({ ...config, loginSubtitle: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl outline-none"
                        style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "domain" && (
              <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Dominio personalizado</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1.5" style={{ color: "#374151" }}>Dominio atual</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)" }}>
                      <Globe size={14} style={{ color: "#94A3B8" }} />
                      <span style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>{config.domain || "Nao confirmado"}</span>
                      {config.domain && <span className="ml-auto px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#10B981", fontSize: "11px", fontWeight: 600 }}>Ativo</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1.5" style={{ color: "#374151" }}>Dominio personalizado</label>
                    <input placeholder="app.suarede.com.br"
                      className="w-full px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                    <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "6px" }}>
                      Configure o CNAME no DNS apontando para o host informado pela equipe Orchestra.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <p style={{ fontSize: "12px", color: "#D97706" }}>
                      Publicacao de dominio customizado depende do provisionamento de DNS e SSL.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comms" && (
              <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Tom de comunicacao</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { value: "professional", label: "Profissional", desc: "Linguagem formal e objetiva para redes corporativas" },
                    { value: "friendly", label: "Amigavel", desc: "Tom proximo ao cliente, sem perder clareza" },
                    { value: "technical", label: "Tecnico", desc: "Linguagem precisa para times com perfil tecnico" },
                  ].map(t => (
                    <div key={t.value} onClick={() => setConfig({ ...config, tone: t.value })}
                      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                      style={{
                        border: `2px solid ${config.tone === t.value ? config.primaryColor : "rgba(0,0,0,0.08)"}`,
                        background: config.tone === t.value ? `${config.primaryColor}08` : "white"
                      }}>
                      <div className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center"
                        style={{ border: `2px solid ${config.tone === t.value ? config.primaryColor : "#CBD5E1"}` }}>
                        {config.tone === t.value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: config.primaryColor }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>{t.label}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-xl overflow-hidden sticky top-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="p-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <Eye size={14} style={{ color: config.primaryColor }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>Pre-visualizacao</span>
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-xl overflow-hidden" style={{ background: "#0F172A", aspectRatio: "4/5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "24px", fontWeight: 800 }}>
                    {config.logoUrl ? <img src={config.logoUrl} alt="" className="w-full h-full object-contain" /> : logoText}
                  </div>
                  <div style={{ color: "white", fontSize: "16px", fontWeight: 700, textAlign: "center", marginBottom: "6px" }}>
                    {config.loginTitle}
                  </div>
                  <div style={{ color: "#64748B", fontSize: "12px", textAlign: "center", marginBottom: "20px" }}>
                    {config.loginSubtitle}
                  </div>
                  <input placeholder="E-mail" readOnly className="w-full px-3 py-2 rounded-lg mb-2" style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#94A3B8" }} />
                  <input placeholder="Senha" readOnly type="password" className="w-full px-3 py-2 rounded-lg mb-3" style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#94A3B8" }} />
                  <button className="w-full py-2 rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "12px", fontWeight: 600 }}>Entrar</button>
                  <div style={{ fontSize: "10px", color: "#334155", marginTop: "16px", textAlign: "center" }}>
                    {config.brandName || "Orchestra"} - Powered by Orchestra
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
