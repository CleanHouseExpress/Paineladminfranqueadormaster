import { useState } from "react";
import { ChevronRight, AlertCircle, CheckCircle, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { mockRoyalties } from "../data/mockData";

type RoyaltyStatus = "paid" | "pending" | "overdue";

const statusConfig: Record<RoyaltyStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  paid: { label: "Pago", color: "#10B981", bg: "#ECFDF5", icon: <CheckCircle size={12} /> },
  pending: { label: "Pendente", color: "#F59E0B", bg: "#FFFBEB", icon: <Clock size={12} /> },
  overdue: { label: "Vencido", color: "#EF4444", bg: "#FEF2F2", icon: <AlertCircle size={12} /> },
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);

export function Royalties() {
  const [filter, setFilter] = useState<"all" | RoyaltyStatus>("all");

  const filtered = filter === "all" ? mockRoyalties : mockRoyalties.filter(r => r.status === filter);

  const totals = {
    all: mockRoyalties.reduce((s, r) => s + r.total, 0),
    paid: mockRoyalties.filter(r => r.status === "paid").reduce((s, r) => s + r.total, 0),
    pending: mockRoyalties.filter(r => r.status === "pending").reduce((s, r) => s + r.total, 0),
    overdue: mockRoyalties.filter(r => r.status === "overdue").reduce((s, r) => s + r.total, 0),
  };

  const chartData = mockRoyalties.map(r => ({
    unit: r.code,
    royalties: r.royaltyValue,
    fundo: r.adFundValue,
    status: r.status,
  }));

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Financeiro</span>
          <ChevronRight size={12} />
          <span>Royalties</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Royalties</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Vencimento: 15/01/2024 · 8 unidades</p>
          </div>
          <button className="px-4 py-2.5 rounded-xl"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#64748B" }}>
            Gerar cobranças
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total previsto", value: totals.all, color: "#6366F1", bg: "#EEF2FF" },
          { label: "Recebido", value: totals.paid, color: "#10B981", bg: "#ECFDF5" },
          { label: "Pendente", value: totals.pending, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Vencido", value: totals.overdue, color: "#EF4444", bg: "#FEF2F2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-2 h-6 rounded-full mb-2" style={{ background: s.color, opacity: 0.4 }} />
            <div style={{ fontSize: "18px", fontWeight: 700, color: s.color, letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              {fmt(s.value)}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B" }}>{s.label}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
              {s.label !== "Total previsto" && `${((s.value / totals.all) * 100).toFixed(0)}% do total`}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 mb-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 style={{ color: "#0F172A", marginBottom: "16px" }}>Royalties por unidade</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="unit" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [fmt(v)]} />
            <Bar dataKey="royalties" name="Royalties" fill="#6366F1" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="fundo" name="Fundo de Marketing" fill="#8B5CF6" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "paid", "pending", "overdue"] as const).map(f => {
          const sc = f !== "all" ? statusConfig[f] : null;
          const count = f === "all" ? mockRoyalties.length : mockRoyalties.filter(r => r.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
              style={{
                fontSize: "12px", fontWeight: 500,
                background: filter === f ? (sc?.bg || "#EEF2FF") : "white",
                color: filter === f ? (sc?.color || "#6366F1") : "#64748B",
                border: "1px solid",
                borderColor: filter === f ? (sc?.color || "#6366F1") + "40" : "rgba(0,0,0,0.08)"
              }}>
              {sc?.icon}
              {f === "all" ? "Todas" : sc?.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F8FAFC" }}>
                {["Unidade", "Faturamento", "Royalties", "Taxa", "Fundo Mkt.", "Total", "Vencimento", "Status", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const sc = statusConfig[row.status];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>{row.unit}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>{row.code}</div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>{fmt(row.revenue)}</td>
                    <td className="px-4 py-3" style={{ fontSize: "13px", color: "#0F172A", fontFamily: "monospace" }}>{fmt(row.royaltyValue)}</td>
                    <td className="px-4 py-3" style={{ fontSize: "12px", color: "#64748B", fontFamily: "monospace" }}>{row.royaltyRate}%</td>
                    <td className="px-4 py-3" style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>{fmt(row.adFundValue)}</td>
                    <td className="px-4 py-3" style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{fmt(row.total)}</td>
                    <td className="px-4 py-3" style={{ fontSize: "12px", color: "#94A3B8" }}>{row.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full w-fit"
                        style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 600 }}>
                        {sc.icon}
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status !== "paid" && (
                        <button className="px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                          style={{ background: row.status === "overdue" ? "#EF4444" : "#6366F1", fontSize: "12px", fontWeight: 500 }}>
                          {row.status === "overdue" ? "Cobrar" : "Registrar"}
                        </button>
                      )}
                      {row.status === "paid" && (
                        <button className="px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: "#F8FAFC", color: "#94A3B8", fontSize: "12px" }}>
                          Recibo
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
