import { useState } from "react";
import { ChevronRight, GripVertical, Eye, EyeOff, Star, Home, Settings, Users } from "lucide-react";

const defaultMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊", visible: true, favorite: true, path: "/" },
  { id: "units", label: "Unidades", icon: "🏢", visible: true, favorite: false, path: "/units" },
  { id: "clients", label: "Clientes", icon: "👥", visible: true, favorite: true, path: "/clients" },
  { id: "financial", label: "Financeiro", icon: "💰", visible: true, favorite: false, path: "/financial" },
  { id: "operations", label: "Operação", icon: "⚙️", visible: true, favorite: false, path: "/operations" },
  { id: "support", label: "Atendimento", icon: "💬", visible: false, favorite: false, path: "/support" },
  { id: "automations", label: "Automações", icon: "⚡", visible: false, favorite: false, path: "/automations" },
  { id: "reports", label: "Relatórios", icon: "📈", visible: true, favorite: false, path: "/reports" },
  { id: "modules", label: "Módulos", icon: "🧩", visible: true, favorite: false, path: "/modules" },
  { id: "access", label: "Acessos", icon: "🔐", visible: true, favorite: false, path: "/access" },
  { id: "settings", label: "Configurações", icon: "⚙️", visible: true, favorite: false, path: "/settings" },
];

const profileViews = ["Franqueador Master", "Admin Financeiro", "Gestor de Unidade", "Visualizador"];

export function MenuConfig() {
  const [items, setItems] = useState(defaultMenuItems);
  const [homepage, setHomepage] = useState("dashboard");
  const [previewProfile, setPreviewProfile] = useState("Franqueador Master");
  const [saved, setSaved] = useState(false);

  const toggleVisible = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, visible: !item.visible } : item));
  };

  const toggleFavorite = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const visibleItems = items.filter(i => i.visible);

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Configurações</span>
          <ChevronRight size={12} />
          <span>Menu</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Configuração do Menu</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Organize a navegação da plataforma para sua rede</p>
          </div>
          <button onClick={handleSave}
            className="px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: saved ? "#10B981" : "#6366F1", fontSize: "13px", fontWeight: 500 }}>
            {saved ? "✓ Salvo!" : "Salvar configurações"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Homepage */}
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Home size={16} style={{ color: "#6366F1" }} />
              <h3 style={{ color: "#0F172A" }}>Página inicial</h3>
            </div>
            <select value={homepage} onChange={e => setHomepage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}>
              {items.filter(i => i.visible).map(i => (
                <option key={i.id} value={i.id}>{i.icon} {i.label}</option>
              ))}
            </select>
          </div>

          {/* Menu items */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: "#0F172A" }}>Itens do menu</h3>
              <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>Arraste para reordenar, ative/desative visibilidade e marque favoritos</p>
            </div>
            <div>
              {items.map((item, i) => (
                <div key={item.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                  style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <GripVertical size={16} style={{ color: "#CBD5E1", cursor: "grab", flexShrink: 0 }} />
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: item.visible ? "#0F172A" : "#94A3B8" }}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(item.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: item.favorite ? "#F59E0B" : "#CBD5E1" }}
                      title="Favorito">
                      <Star size={14} fill={item.favorite ? "#F59E0B" : "none"} />
                    </button>
                    <button onClick={() => toggleVisible(item.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: item.visible ? "#10B981" : "#CBD5E1" }}
                      title={item.visible ? "Ocultar" : "Mostrar"}>
                      {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <span className="px-2 py-1 rounded-md"
                      style={{ fontSize: "11px", background: item.visible ? "#ECFDF5" : "#F1F5F9", color: item.visible ? "#10B981" : "#94A3B8", fontWeight: 500 }}>
                      {item.visible ? "Visível" : "Oculto"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} style={{ color: "#6366F1" }} />
              <h3 style={{ color: "#0F172A" }}>Pré-visualização</h3>
            </div>
            <select value={previewProfile} onChange={e => setPreviewProfile(e.target.value)}
              className="w-full px-3 py-2 rounded-lg mb-4 outline-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", color: "#0F172A" }}>
              {profileViews.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Mini sidebar preview */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#0F172A" }}>
              <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                    <span style={{ fontSize: "10px" }}>🎼</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#CBD5E1", fontWeight: 600 }}>Orchestra</div>
                </div>
              </div>
              <div className="p-2">
                {visibleItems.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-colors"
                    style={{
                      background: item.id === homepage ? "rgba(99,102,241,0.15)" : "transparent",
                      cursor: "default"
                    }}>
                    <span style={{ fontSize: "12px" }}>{item.icon}</span>
                    <span style={{ fontSize: "10px", color: item.id === homepage ? "#C7D2FE" : "#64748B" }}>
                      {item.label}
                    </span>
                    {item.favorite && <Star size={8} style={{ color: "#F59E0B", marginLeft: "auto" }} fill="#F59E0B" />}
                    {item.id === homepage && <span style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: "#818CF8" }} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg" style={{ background: "#F8FAFC" }}>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                <span style={{ fontWeight: 600, color: "#64748B" }}>{visibleItems.length}</span> itens visíveis ·{" "}
                <span style={{ fontWeight: 600, color: "#F59E0B" }}>{items.filter(i => i.favorite).length}</span> favoritos
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} style={{ color: "#64748B" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>Atalhos rápidos</span>
            </div>
            <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.5 }}>
              Os itens marcados como favoritos aparecem em destaque no topo da navegação e na barra de atalhos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
