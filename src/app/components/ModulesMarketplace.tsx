import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Building2, Users, DollarSign, TrendingUp, BarChart3, Package,
  Receipt, ClipboardCheck, AlertCircle, BookOpen, MessageCircle,
  Instagram, Bot, Zap, FileBarChart, Plug, Star, Boxes,
  Search, Filter, CheckCircle, Lock, Clock, ChevronRight
} from "lucide-react";
import { mockModules, moduleCategories } from "../data/mockData";

type ModuleStatus = "active" | "available" | "review" | "development" | "blocked";

const iconMap: Record<string, React.FC<any>> = {
  Building2, Users, DollarSign, TrendingUp, BarChart3, Package,
  Receipt, ClipboardCheck, AlertCircle, BookOpen, MessageCircle,
  Instagram, Bot, Zap, FileBarChart, Plug, Star, Boxes,
};

const statusConfig: Record<ModuleStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: { label: "Ativo", color: "#10B981", bg: "#ECFDF5", icon: <CheckCircle size={11} /> },
  available: { label: "Disponível", color: "#3B82F6", bg: "#EFF6FF", icon: <CheckCircle size={11} /> },
  review: { label: "Em análise", color: "#F59E0B", bg: "#FFFBEB", icon: <Clock size={11} /> },
  development: { label: "Em desenvolvimento", color: "#8B5CF6", bg: "#F5F3FF", icon: <Clock size={11} /> },
  blocked: { label: "Bloqueado", color: "#EF4444", bg: "#FEF2F2", icon: <Lock size={11} /> },
};

function ModuleCard({ module }: { module: typeof mockModules[0] }) {
  const navigate = useNavigate();
  const Icon = iconMap[module.icon] || Building2;
  const status = statusConfig[module.status];

  return (
    <div className="bg-white rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer group"
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      onClick={() => navigate(`/modules/${module.id}`)}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: module.status === "active" ? "#EEF2FF" : module.status === "blocked" ? "#FEF2F2" : "#F8FAFC" }}>
          <Icon size={20} style={{ color: module.status === "active" ? "#6366F1" : module.status === "blocked" ? "#EF4444" : "#64748B" }} />
        </div>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: status.bg, color: status.color, fontSize: "10px", fontWeight: 600 }}>
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h4 style={{ color: "#0F172A", marginBottom: "4px" }}>{module.name}</h4>
        <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>{module.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="px-2 py-1 rounded-md" style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: "11px" }}>
          {module.category}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 600, color: module.status === "active" ? "#10B981" : "#64748B" }}>
          {module.price}
        </span>
      </div>

      <div className="flex gap-2 mt-auto">
        {module.status === "active" && (
          <button className="flex-1 px-3 py-2 rounded-lg text-white transition-colors"
            style={{ background: "#6366F1", fontSize: "12px", fontWeight: 500 }}
            onClick={e => { e.stopPropagation(); }}>
            Configurar
          </button>
        )}
        {module.status === "available" && (
          <button className="flex-1 px-3 py-2 rounded-lg transition-colors"
            style={{ background: "#EEF2FF", color: "#6366F1", fontSize: "12px", fontWeight: 500 }}
            onClick={e => { e.stopPropagation(); navigate(`/modules/${module.id}/request`); }}>
            Ativar módulo
          </button>
        )}
        {(module.status === "review" || module.status === "development") && (
          <button className="flex-1 px-3 py-2 rounded-lg transition-colors"
            style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: "12px", fontWeight: 500 }}
            onClick={e => e.stopPropagation()}>
            Notificar-me
          </button>
        )}
        {module.status === "blocked" && (
          <button className="flex-1 px-3 py-2 rounded-lg transition-colors"
            style={{ background: "#FEF2F2", color: "#EF4444", fontSize: "12px", fontWeight: 500 }}
            onClick={e => e.stopPropagation()}>
            Solicitar acesso
          </button>
        )}
        <button className="px-3 py-2 rounded-lg transition-colors"
          style={{ background: "#F8FAFC", color: "#64748B", fontSize: "12px" }}
          onClick={e => { e.stopPropagation(); navigate(`/modules/${module.id}`); }}>
          Detalhes
        </button>
      </div>
    </div>
  );
}

export function ModulesMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered = mockModules.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todos" || m.category === category;
    const matchStatus = statusFilter === "Todos" || m.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const counts = {
    active: mockModules.filter(m => m.status === "active").length,
    available: mockModules.filter(m => m.status === "available").length,
    development: mockModules.filter(m => m.status === "development").length,
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Bella Vita Franchising</span>
          <ChevronRight size={12} />
          <span>Módulos Orchestra</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 style={{ color: "#0F172A" }}>Módulos Orchestra</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Ative, configure e explore os módulos disponíveis para sua rede</p>
          </div>
          <button
            onClick={() => navigate("/modules/request-new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}>
            + Solicitar novo módulo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Módulos ativos", value: counts.active, color: "#10B981", bg: "#ECFDF5" },
          { label: "Disponíveis para ativar", value: counts.available, color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Em desenvolvimento", value: counts.development, color: "#8B5CF6", bg: "#F5F3FF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 flex items-center gap-4"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
            <span style={{ fontSize: "13px", color: "#64748B" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white flex-1"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <Search size={14} style={{ color: "#94A3B8" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar módulos..."
            className="bg-transparent flex-1 outline-none"
            style={{ fontSize: "13px", color: "#0F172A" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Todos", "active", "available", "development"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-xl transition-colors"
              style={{
                fontSize: "12px", fontWeight: 500,
                background: statusFilter === s ? "#EEF2FF" : "white",
                color: statusFilter === s ? "#6366F1" : "#64748B",
                border: "1px solid",
                borderColor: statusFilter === s ? "#C7D2FE" : "rgba(0,0,0,0.08)"
              }}>
              {s === "Todos" ? "Todos" : s === "active" ? "Ativos" : s === "available" ? "Disponíveis" : "Em desenvolvimento"}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {moduleCategories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="px-3 py-2 rounded-xl whitespace-nowrap transition-colors"
            style={{
              fontSize: "12px", fontWeight: 500,
              background: category === cat ? "#6366F1" : "white",
              color: category === cat ? "white" : "#64748B",
              border: "1px solid",
              borderColor: category === cat ? "#6366F1" : "rgba(0,0,0,0.08)"
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Module grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-16 flex flex-col items-center justify-center text-center"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F1F5F9" }}>
            <Search size={24} style={{ color: "#94A3B8" }} />
          </div>
          <h3 style={{ color: "#0F172A" }}>Nenhum módulo encontrado</h3>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>Tente ajustar os filtros ou termos de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(m => <ModuleCard key={m.id} module={m} />)}
        </div>
      )}
    </div>
  );
}
