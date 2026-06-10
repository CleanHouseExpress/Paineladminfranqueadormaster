import { useState } from "react";
import { ChevronRight, Check, X, MessageSquare, Filter, Clock } from "lucide-react";
import { mockAccessRequests } from "../data/mockData";

type Status = "pending" | "review" | "approved" | "denied";

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "#D97706", bg: "#FFFBEB" },
  review: { label: "Em análise", color: "#3B82F6", bg: "#EFF6FF" },
  approved: { label: "Aprovado", color: "#10B981", bg: "#ECFDF5" },
  denied: { label: "Recusado", color: "#EF4444", bg: "#FEF2F2" },
};

const typeColors: Record<string, { color: string; bg: string }> = {
  "Acesso de usuário": { color: "#6366F1", bg: "#EEF2FF" },
  "Permissão adicional": { color: "#8B5CF6", bg: "#F5F3FF" },
  "Acesso a módulo": { color: "#3B82F6", bg: "#EFF6FF" },
  "Acesso a unidade": { color: "#F59E0B", bg: "#FFFBEB" },
  "Criação de novo módulo": { color: "#10B981", bg: "#ECFDF5" },
};

export function AccessRequests() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [requests, setRequests] = useState(mockAccessRequests);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  const updateStatus = (id: number, status: Status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Acessos</span>
          <ChevronRight size={12} />
          <span>Solicitações</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Solicitações de Acesso</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
              {pendingCount} solicitação{pendingCount !== 1 ? "ões" : ""} aguardando sua decisão
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <Clock size={14} style={{ color: "#EF4444" }} />
              <span style={{ fontSize: "12px", color: "#EF4444", fontWeight: 600 }}>{pendingCount} pendentes</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter("all")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
          style={{ fontSize: "12px", fontWeight: 500, background: filter === "all" ? "#6366F1" : "white", color: filter === "all" ? "white" : "#64748B", border: "1px solid", borderColor: filter === "all" ? "#6366F1" : "rgba(0,0,0,0.08)" }}>
          <Filter size={12} />
          Todas ({requests.length})
        </button>
        {(["pending", "review", "approved", "denied"] as Status[]).map(s => {
          const sc = statusConfig[s];
          const count = requests.filter(r => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-2 rounded-xl transition-colors"
              style={{ fontSize: "12px", fontWeight: 500, background: filter === s ? sc.bg : "white", color: filter === s ? sc.color : "#64748B", border: "1px solid", borderColor: filter === s ? sc.color + "40" : "rgba(0,0,0,0.08)" }}>
              {sc.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>✓</div>
          <h3 style={{ color: "#0F172A" }}>Nenhuma solicitação</h3>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>Não há solicitações com este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const sc = statusConfig[req.status as Status];
            const tc = typeColors[req.type] || { color: "#64748B", bg: "#F8FAFC" };
            const isExpanded = expanded === req.id;
            return (
              <div key={req.id} className="bg-white rounded-xl overflow-hidden transition-shadow"
                style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: isExpanded ? "0 4px 20px rgba(0,0,0,0.08)" : "none" }}>
                {/* Card header */}
                <div className="p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : req.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontSize: "12px", fontWeight: 700 }}>
                        {req.requester.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{req.requester}</div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="px-2 py-0.5 rounded-md" style={{ background: tc.bg, color: tc.color, fontSize: "11px", fontWeight: 500 }}>
                            {req.type}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748B" }}>·</span>
                          <span style={{ fontSize: "12px", color: "#64748B" }}>{req.module}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-full"
                        style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 600 }}>
                        {sc.label}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{req.date}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="p-5 pt-4">
                      <div className="p-4 rounded-xl mb-4" style={{ background: "#F8FAFC" }}>
                        <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                          Justificativa
                        </div>
                        <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{req.justification}</p>
                      </div>

                      {req.unit && (
                        <div className="flex items-center gap-2 mb-4">
                          <span style={{ fontSize: "12px", color: "#64748B" }}>Unidade:</span>
                          <span className="px-2 py-1 rounded-lg" style={{ background: "#EEF2FF", color: "#6366F1", fontSize: "12px", fontWeight: 500 }}>
                            {req.unit}
                          </span>
                        </div>
                      )}

                      {(req.status === "pending" || req.status === "review") && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(req.id, "approved")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                            style={{ background: "#10B981", fontSize: "13px", fontWeight: 500 }}>
                            <Check size={14} />
                            Aprovar
                          </button>
                          <button onClick={() => updateStatus(req.id, "denied")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                            style={{ background: "#FEF2F2", color: "#EF4444", fontSize: "13px", fontWeight: 500 }}>
                            <X size={14} />
                            Recusar
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                            style={{ background: "#F8FAFC", color: "#64748B", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)" }}>
                            <MessageSquare size={14} />
                            Pedir mais info
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
