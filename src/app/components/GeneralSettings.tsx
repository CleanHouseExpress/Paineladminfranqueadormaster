import { useState } from "react";
import { ChevronRight, Bell, Shield, Globe, Database, CreditCard, Users, LayoutTemplate } from "lucide-react";
import { Link } from "react-router";

const settingsSections = [
  {
    icon: Globe,
    color: "#6366F1",
    bg: "#EEF2FF",
    title: "White Label",
    desc: "Logo, cores, domínio e identidade visual",
    path: "/settings/whitelabel",
    badge: null,
  },
  {
    icon: Users,
    color: "#10B981",
    bg: "#ECFDF5",
    title: "Configuração de Menu",
    desc: "Organize e personalize a navegação da plataforma",
    path: "/settings/menu",
    badge: null,
  },
  {
    icon: LayoutTemplate,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    title: "Form Builder",
    desc: "Metadata Engine — configure campos e formulários de toda a plataforma",
    path: "/settings/form-builder",
    badge: "Novo",
  },
  {
    icon: Bell,
    color: "#F59E0B",
    bg: "#FFFBEB",
    title: "Notificações",
    desc: "Alertas por e-mail, push e WhatsApp",
    path: "/settings/notifications",
    badge: null,
  },
  {
    icon: Shield,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    title: "Segurança",
    desc: "Autenticação de dois fatores, sessões ativas",
    path: "/settings/security",
    badge: null,
  },
  {
    icon: Database,
    color: "#3B82F6",
    bg: "#EFF6FF",
    title: "Dados & Exportações",
    desc: "Backups, exportações e histórico de dados",
    path: "/settings/data",
    badge: null,
  },
  {
    icon: CreditCard,
    color: "#EC4899",
    bg: "#FDF2F8",
    title: "Plano & Faturamento",
    desc: "Enterprise · Renova em 01/02/2024",
    path: "/settings/billing",
    badge: "Enterprise",
  },
];

const generalFields = [
  { key: "timezone", label: "Fuso horário", value: "America/Sao_Paulo (GMT-3)", type: "select" },
  { key: "currency", label: "Moeda", value: "BRL - Real Brasileiro", type: "select" },
  { key: "language", label: "Idioma", value: "Português (Brasil)", type: "select" },
  { key: "dateFormat", label: "Formato de data", value: "DD/MM/YYYY", type: "select" },
];

export function GeneralSettings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Bella Vita Franchising</span>
          <ChevronRight size={12} />
          <span>Configurações</span>
        </div>
        <h1 style={{ color: "#0F172A" }}>Configurações</h1>
        <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Gerencie as configurações da plataforma para sua rede</p>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {settingsSections.map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.path} to={s.path}
              className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>{s.title}</span>
                  {s.badge && (
                    <span className="px-2 py-0.5 rounded-full text-white"
                      style={{ background: "#6366F1", fontSize: "10px", fontWeight: 600 }}>
                      {s.badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "#94A3B8" }}>{s.desc}</p>
              </div>
              <Arrow size={16} style={{ color: "#CBD5E1", flexShrink: 0 }} className="group-hover:text-indigo-500 transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* General config */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ color: "#0F172A" }}>Configurações gerais</h3>
          <button onClick={handleSave}
            className="px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: saved ? "#10B981" : "#6366F1", fontSize: "13px", fontWeight: 500 }}>
            {saved ? "✓ Salvo!" : "Salvar"}
          </button>
        </div>
        <div className="space-y-4">
          {generalFields.map(f => (
            <div key={f.key} className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <label style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{f.label}</label>
              <select className="px-3 py-2 rounded-lg outline-none"
                style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}>
                <option>{f.value}</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Info block */}
      <div className="mt-4 p-4 rounded-xl flex gap-3" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
        <Shield size={16} style={{ color: "#6366F1", flexShrink: 0, marginTop: "1px" }} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#4338CA", marginBottom: "2px" }}>Orchestra · Plano Enterprise</div>
          <p style={{ fontSize: "12px", color: "#6366F1", lineHeight: 1.5 }}>
            Você tem acesso a todos os módulos ativos, suporte prioritário e SLA garantido de 99,9% de uptime.
            Próxima renovação: <strong>01/02/2024</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
