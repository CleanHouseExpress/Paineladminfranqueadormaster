import { useState } from "react";
import { ChevronRight, Upload, Eye, Palette, Globe, MessageSquare } from "lucide-react";

export function WhiteLabel() {
  const [config, setConfig] = useState({
    brandName: "Bella Vita Franchising",
    primaryColor: "#6366F1",
    secondaryColor: "#8B5CF6",
    logoText: "BV",
    domain: "bellavita.orchestra.app",
    tone: "professional",
    loginTitle: "Bem-vindo de volta",
    loginSubtitle: "Acesse o painel da sua rede",
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"brand" | "domain" | "comms">("brand");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Configurações</span>
          <ChevronRight size={12} />
          <span>White Label</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Personalização White Label</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Configure a identidade visual e comunicação da plataforma para sua rede</p>
          </div>
          <button onClick={handleSave}
            className="px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: saved ? "#10B981" : config.primaryColor, fontSize: "13px", fontWeight: 500 }}>
            {saved ? "✓ Salvo!" : "Publicar alterações"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#F1F5F9" }}>
        {[
          { id: "brand", label: "Identidade Visual", icon: Palette },
          { id: "domain", label: "Domínio", icon: Globe },
          { id: "comms", label: "Comunicação", icon: MessageSquare },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="lg:col-span-2">
          {activeTab === "brand" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Logotipo & Nome</h3>
                <div className="grid grid-cols-2 gap-6 mb-5">
                  <div>
                    <label className="block mb-2" style={{ color: "#374151" }}>Logo da rede</label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                      style={{ borderColor: "rgba(0,0,0,0.1)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = config.primaryColor}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.1)"}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto mb-2"
                        style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "18px", fontWeight: 800 }}>
                        {config.logoText}
                      </div>
                      <Upload size={14} style={{ color: "#94A3B8", margin: "0 auto 4px" }} />
                      <p style={{ fontSize: "11px", color: "#94A3B8" }}>PNG, SVG · Max 2MB</p>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: "#374151" }}>Favicon</label>
                    <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                      style={{ borderColor: "rgba(0,0,0,0.1)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = config.primaryColor}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.1)"}>
                      <div className="w-8 h-8 rounded flex items-center justify-center text-white mx-auto mb-2"
                        style={{ background: config.primaryColor, fontSize: "12px", fontWeight: 800 }}>
                        {config.logoText[0]}
                      </div>
                      <Upload size={14} style={{ color: "#94A3B8", margin: "0 auto 4px" }} />
                      <p style={{ fontSize: "11px", color: "#94A3B8" }}>ICO, PNG 32×32</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ color: "#374151" }}>Nome da rede</label>
                  <input value={config.brandName} onChange={e => setConfig({ ...config, brandName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Paleta de cores</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { key: "primaryColor", label: "Cor principal", desc: "Botões, links, destaques" },
                    { key: "secondaryColor", label: "Cor secundária", desc: "Gradientes, hover" },
                  ].map(c => (
                    <div key={c.key}>
                      <label className="block mb-1.5" style={{ color: "#374151" }}>{c.label}</label>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)" }}>
                        <input type="color"
                          value={config[c.key as keyof typeof config]}
                          onChange={e => setConfig({ ...config, [c.key]: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 outline-none"
                          style={{ padding: "2px" }}
                        />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A", fontFamily: "monospace" }}>
                            {config[c.key as keyof typeof config]}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>{c.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Color preview */}
                <div className="p-4 rounded-xl" style={{ background: "#F8FAFC" }}>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "8px" }}>Pré-visualização de botões</div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 rounded-lg text-white"
                      style={{ background: config.primaryColor, fontSize: "12px", fontWeight: 500 }}>
                      Botão primário
                    </button>
                    <button className="px-4 py-2 rounded-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "12px", fontWeight: 500 }}>
                      Gradiente
                    </button>
                    <button className="px-4 py-2 rounded-lg"
                      style={{ background: `${config.primaryColor}15`, color: config.primaryColor, fontSize: "12px", fontWeight: 500 }}>
                      Outline
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "#0F172A", marginBottom: "16px" }}>Tela de login</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1.5" style={{ color: "#374151" }}>Título de boas-vindas</label>
                    <input value={config.loginTitle} onChange={e => setConfig({ ...config, loginTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl outline-none"
                      style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                  </div>
                  <div>
                    <label className="block mb-1.5" style={{ color: "#374151" }}>Subtítulo</label>
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
              <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Domínio personalizado</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ color: "#374151" }}>Domínio atual (Orchestra)</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <Globe size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: "13px", color: "#94A3B8", fontFamily: "monospace" }}>{config.domain}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#10B981", fontSize: "11px", fontWeight: 600 }}>Ativo</span>
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ color: "#374151" }}>Domínio personalizado</label>
                  <input placeholder="app.bellavita.com.br"
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
                  <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "6px" }}>
                    Configure o CNAME no seu DNS apontando para: orchestra.app
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <p style={{ fontSize: "12px", color: "#D97706" }}>
                    Disponível no plano Enterprise. O SSL é provisionado automaticamente após configuração do DNS.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "comms" && (
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: "#0F172A", marginBottom: "20px" }}>Tom de comunicação</h3>
              <div className="space-y-3 mb-6">
                {[
                  { value: "professional", label: "Profissional", desc: "Linguagem formal e objetiva para redes corporativas" },
                  { value: "friendly", label: "Amigável", desc: "Tom descontraído mas respeitoso, próximo ao cliente" },
                  { value: "technical", label: "Técnico", desc: "Linguagem precisa para times com perfil técnico" },
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

        {/* Preview */}
        <div>
          <div className="bg-white rounded-xl overflow-hidden sticky top-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="p-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2">
                <Eye size={14} style={{ color: "#6366F1" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>Pré-visualização</span>
              </div>
            </div>
            {/* Login preview */}
            <div className="p-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "#0F172A", aspectRatio: "4/5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4"
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "24px", fontWeight: 800 }}>
                  {config.logoText}
                </div>
                <div style={{ color: "white", fontSize: "16px", fontWeight: 700, textAlign: "center", marginBottom: "6px" }}>
                  {config.loginTitle}
                </div>
                <div style={{ color: "#64748B", fontSize: "12px", textAlign: "center", marginBottom: "20px" }}>
                  {config.loginSubtitle}
                </div>
                <input placeholder="E-mail" readOnly
                  className="w-full px-3 py-2 rounded-lg mb-2"
                  style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#94A3B8" }} />
                <input placeholder="Senha" readOnly type="password"
                  className="w-full px-3 py-2 rounded-lg mb-3"
                  style={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", color: "#94A3B8" }} />
                <button className="w-full py-2 rounded-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, fontSize: "12px", fontWeight: 600 }}>
                  Entrar
                </button>
                <div style={{ fontSize: "10px", color: "#334155", marginTop: "16px", textAlign: "center" }}>
                  {config.brandName} · Powered by Orchestra
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
