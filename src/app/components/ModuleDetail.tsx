import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CheckCircle, Settings, Link, History, Shield,
  TrendingUp, Users, Clock, ChevronRight, Building2, DollarSign,
  BarChart3, Package, Receipt, ClipboardCheck, AlertCircle,
  BookOpen, MessageCircle, Bot, Zap, FileBarChart, Plug, Star, Boxes, Instagram
} from "lucide-react";
import { getModuleByIdOrAlias } from "../../services/moduleRegistry";

const iconMap: Record<string, React.FC<any>> = {
  Building2, Users, DollarSign, TrendingUp, BarChart3, Package,
  Receipt, ClipboardCheck, AlertCircle, BookOpen, MessageCircle,
  Instagram, Bot, Zap, FileBarChart, Plug, Star, Boxes,
};

const moduleDetails: Record<string, {
  benefits: string[];
  features: string[];
  permissions: string[];
  integrations: string[];
  configs: string[];
  history: { date: string; note: string }[];
}> = {
  financial: {
    benefits: ["Visão gerencial rápida sem complexidade de ERP", "Comparativo mês a mês automático", "Alertas de desvio de resultado"],
    features: ["Dashboard financeiro consolidado", "Comparativo por período", "Projeções simples", "Exportação PDF e Excel"],
    permissions: ["Visualizar financeiro", "Editar lançamentos", "Aprovar despesas", "Exportar dados"],
    integrations: ["Fluxo de Caixa", "DRE Gerencial", "Royalties"],
    configs: ["Moeda e formato", "Alertas de desvio", "Permissões por perfil"],
    history: [{ date: "Dez 2023", note: "Adicionado comparativo trimestral" }, { date: "Nov 2023", note: "Melhorias de performance" }],
  },
};

const defaultDetails = {
  benefits: ["Melhora a eficiência operacional", "Centraliza informações em um único painel", "Reduz retrabalho e erros manuais"],
  features: ["Interface intuitiva e responsiva", "Relatórios automáticos", "Integração com outros módulos", "Controle de permissões granular"],
  permissions: ["Visualizar", "Criar registros", "Editar registros", "Exportar dados"],
  integrations: ["Dashboard principal", "Relatórios avançados"],
  configs: ["Preferências de notificação", "Permissões por perfil", "Layout personalizado"],
  history: [{ date: "Jan 2024", note: "Atualização de interface" }, { date: "Dez 2023", note: "Correções e melhorias" }],
};

export function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const module = id ? getModuleByIdOrAlias(id) : undefined;

  if (!module) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <button onClick={() => navigate("/modules")}
          className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
          style={{ fontSize: "13px", color: "#64748B" }}>
          <ArrowLeft size={16} />
          Voltar para MÃ³dulos
        </button>
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ color: "#0F172A", marginBottom: "8px" }}>MÃ³dulo nÃ£o encontrado</h2>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>
            O mÃ³dulo solicitado nÃ£o existe no catÃ¡logo atual da Orchestra.
          </p>
        </div>
      </div>
    );
  }

  const Icon = iconMap[module.icon] || Building2;
  const details = moduleDetails[module.id] || defaultDetails;
  const category = module.marketplace?.category ?? "Sistema";
  const price = module.marketplace?.price ?? module.price ?? "Sob consulta";

  const statusColors: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: "#10B981", bg: "#ECFDF5", label: "Ativo" },
    available: { color: "#3B82F6", bg: "#EFF6FF", label: "Disponível" },
    review: { color: "#F59E0B", bg: "#FFFBEB", label: "Em análise" },
    development: { color: "#8B5CF6", bg: "#F5F3FF", label: "Em desenvolvimento" },
    blocked: { color: "#EF4444", bg: "#FEF2F2", label: "Bloqueado" },
  };

  const sc = statusColors[module.status];

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      {/* Back */}
      <button onClick={() => navigate("/modules")}
        className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
        style={{ fontSize: "13px", color: "#64748B" }}>
        <ArrowLeft size={16} />
        Voltar para Módulos
      </button>

      {/* Hero */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: module.status === "active" ? "#EEF2FF" : "#F8FAFC" }}>
            <Icon size={28} style={{ color: module.status === "active" ? "#6366F1" : "#64748B" }} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 style={{ color: "#0F172A" }}>{module.name}</h1>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full"
                style={{ background: sc.bg, color: sc.color, fontSize: "12px", fontWeight: 600 }}>
                {sc.label}
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>{module.description}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="px-3 py-1 rounded-lg" style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: "12px" }}>
                {category}
              </span>
              <span className="px-3 py-1 rounded-lg" style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: "12px" }}>
                {price}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {module.status === "active" && (
              <button className="px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: "#6366F1", fontSize: "13px", fontWeight: 500 }}>
                Configurar módulo
              </button>
            )}
            {module.status === "available" && (
              <button onClick={() => navigate(`/modules/${module.id}/request`)}
                className="px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: "#6366F1", fontSize: "13px", fontWeight: 500 }}>
                Ativar módulo
              </button>
            )}
            {(module.status === "review" || module.status === "development") && (
              <button className="px-5 py-2.5 rounded-xl transition-colors"
                style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)" }}>
                Notificar quando disponível
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Benefits */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: "#10B981" }} />
            <h3 style={{ color: "#0F172A" }}>Benefícios</h3>
          </div>
          <div className="space-y-2">
            {details.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={14} style={{ color: "#10B981", marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#64748B" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} style={{ color: "#6366F1" }} />
            <h3 style={{ color: "#0F172A" }}>Funcionalidades</h3>
          </div>
          <div className="space-y-2">
            {details.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#6366F1" }} />
                <span style={{ fontSize: "13px", color: "#64748B" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: "#8B5CF6" }} />
            <h3 style={{ color: "#0F172A" }}>Permissões relacionadas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {details.permissions.map((p, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg" style={{ background: "#F5F3FF", color: "#8B5CF6", fontSize: "12px", fontWeight: 500 }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Link size={16} style={{ color: "#3B82F6" }} />
            <h3 style={{ color: "#0F172A" }}>Integrações necessárias</h3>
          </div>
          <div className="space-y-2">
            {details.integrations.map((int, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#EFF6FF" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#3B82F6" }} />
                <span style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 500 }}>{int}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Config + History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} style={{ color: "#F59E0B" }} />
            <h3 style={{ color: "#0F172A" }}>Configurações disponíveis</h3>
          </div>
          <div className="space-y-2">
            {details.configs.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                style={{ background: "#FFFBEB" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FEF3C7"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#FFFBEB"}>
                <span style={{ fontSize: "13px", color: "#64748B" }}>{c}</span>
                <ChevronRight size={14} style={{ color: "#94A3B8" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <History size={16} style={{ color: "#64748B" }} />
            <h3 style={{ color: "#0F172A" }}>Histórico de alterações</h3>
          </div>
          <div className="space-y-3">
            {details.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#E2E8F0" }} />
                <div>
                  <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>{h.date}</span>
                  <p style={{ fontSize: "13px", color: "#64748B" }}>{h.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
