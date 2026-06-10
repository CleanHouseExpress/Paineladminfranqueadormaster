import { useState } from "react";
import { ChevronRight, Search, Filter, UserCheck, TrendingUp, Users, Star, ArrowRight } from "lucide-react";
import { mockClients } from "../data/mockData";

const tagColors: Record<string, { color: string; bg: string }> = {
  "VIP": { color: "#D97706", bg: "#FFFBEB" },
  "Recorrente": { color: "#6366F1", bg: "#EEF2FF" },
  "Novo": { color: "#10B981", bg: "#ECFDF5" },
  "Em risco": { color: "#EF4444", bg: "#FEF2F2" },
  "Promotor": { color: "#8B5CF6", bg: "#F5F3FF" },
};

export function Clients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");

  const units = Array.from(new Set(mockClients.map(c => c.unit)));

  const filtered = mockClients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchUnit = unitFilter === "all" || c.unit === unitFilter;
    return matchSearch && matchStatus && matchUnit;
  });

  const totalSpent = mockClients.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpent = totalSpent / mockClients.length;
  const activeClients = mockClients.filter(c => c.status === "active").length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Bella Vita Franchising</span>
          <ChevronRight size={12} />
          <span>Clientes</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Clientes</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Visão consolidada de clientes de toda a rede</p>
          </div>
          <button className="px-4 py-2.5 rounded-xl text-white"
            style={{ background: "#6366F1", fontSize: "13px", fontWeight: 500 }}>
            Exportar base
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de clientes", value: mockClients.length, icon: Users, color: "#6366F1", bg: "#EEF2FF", suffix: "" },
          { label: "Clientes ativos", value: activeClients, icon: UserCheck, color: "#10B981", bg: "#ECFDF5", suffix: "" },
          { label: "Ticket médio", value: Math.round(avgSpent), icon: TrendingUp, color: "#F59E0B", bg: "#FFFBEB", suffix: "R$", prefix: true },
          { label: "Clientes VIP", value: mockClients.filter(c => c.tags.includes("VIP")).length, icon: Star, color: "#8B5CF6", bg: "#F5F3FF", suffix: "" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
                {s.prefix && "R$ "}{new Intl.NumberFormat("pt-BR").format(s.value)}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white flex-1 max-w-sm"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <Search size={14} style={{ color: "#94A3B8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="bg-transparent flex-1 outline-none"
            style={{ fontSize: "13px", color: "#0F172A" }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl outline-none"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", color: "#64748B" }}>
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)}
            className="px-3 py-2 rounded-xl outline-none"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", color: "#64748B" }}>
            <option value="all">Todas as unidades</option>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", color: "#64748B" }}>
            <Filter size={13} />
            Mais filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F8FAFC" }}>
                {["Cliente", "Unidade", "Status", "Tags", "Origem", "Visitas", "Total gasto", "Última visita", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <tr key={client.id} className="cursor-pointer" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontSize: "11px", fontWeight: 700 }}>
                        {client.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>{client.name}</div>
                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "12px", color: "#64748B", maxWidth: "160px" }}>
                    <span className="truncate block">{client.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: client.status === "active" ? "#10B981" : "#E2E8F0" }} />
                      <span style={{ fontSize: "12px", color: client.status === "active" ? "#10B981" : "#94A3B8", fontWeight: 500 }}>
                        {client.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {client.tags.map(tag => {
                        const tc = tagColors[tag] || { color: "#64748B", bg: "#F8FAFC" };
                        return (
                          <span key={tag} className="px-1.5 py-0.5 rounded-md"
                            style={{ background: tc.bg, color: tc.color, fontSize: "10px", fontWeight: 600 }}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "12px", color: "#64748B" }}>{client.origin}</td>
                  <td className="px-4 py-3" style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", fontFamily: "monospace" }}>
                    {client.visits}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "13px", fontWeight: 600, color: "#10B981", fontFamily: "monospace" }}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(client.totalSpent)}
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "11px", color: "#94A3B8" }}>{client.lastVisit}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg transition-colors" style={{ color: "#94A3B8" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6366F1"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#94A3B8"}>
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>
            Exibindo {filtered.length} de {mockClients.length} clientes
          </span>
        </div>
      </div>
    </div>
  );
}
