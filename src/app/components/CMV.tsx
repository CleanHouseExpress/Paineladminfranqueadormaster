import { ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { mockCMV } from "../data/mockData";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);

export function CMV() {
  const totalRevenue = mockCMV.reduce((s, p) => s + p.revenue, 0);
  const totalCost = mockCMV.reduce((s, p) => s + p.cost, 0);
  const avgMargin = ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1);
  const avgCMV = (totalCost / totalRevenue * 100).toFixed(1);

  const chartData = mockCMV.map(p => ({
    name: p.product.split(" ").slice(0, 2).join(" "),
    margem: p.margin,
    cmv: p.cmv,
  }));

  const marginColor = (m: number) => m >= 70 ? "#10B981" : m >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Financeiro</span>
          <ChevronRight size={12} />
          <span>CMV & Custos</span>
        </div>
        <div>
          <h1 style={{ color: "#0F172A" }}>CMV & Análise de Custos</h1>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Custo de Mercadoria Vendida · Janeiro 2024</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Receita total", value: fmt(totalRevenue), color: "#6366F1" },
          { label: "Custo total (CMV)", value: fmt(totalCost), color: "#EF4444" },
          { label: "CMV médio (%)", value: `${avgCMV}%`, color: "#F59E0B" },
          { label: "Margem média", value: `${avgMargin}%`, color: "#10B981" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: k.color, letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              {k.value}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 mb-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 style={{ color: "#0F172A", marginBottom: "16px" }}>Margem por produto/serviço</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip formatter={(v: number) => [`${v}%`]} />
            <Bar dataKey="margem" name="Margem %" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cmv-cell-${index}`} fill={marginColor(entry.margem)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3">
          {[
            { color: "#10B981", label: "Margem ≥ 70%" },
            { color: "#F59E0B", label: "Margem 60–69%" },
            { color: "#EF4444", label: "Margem < 60%" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F8FAFC" }}>
                {["Produto / Serviço", "Categoria", "Receita", "Custo", "CMV %", "Margem %", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCMV.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td className="px-4 py-3" style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>{row.product}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg" style={{ background: "#F8FAFC", color: "#64748B", fontSize: "11px" }}>
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "13px", color: "#0F172A", fontFamily: "monospace" }}>{fmt(row.revenue)}</td>
                  <td className="px-4 py-3" style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>{fmt(row.cost)}</td>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#EF4444", fontFamily: "monospace" }}>{row.cmv}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F1F5F9", maxWidth: "80px" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${row.margin}%`, background: marginColor(row.margin) }} />
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: marginColor(row.margin), fontFamily: "monospace" }}>
                        {row.margin}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full"
                      style={{
                        fontSize: "11px", fontWeight: 600,
                        background: row.margin >= 70 ? "#ECFDF5" : row.margin >= 60 ? "#FFFBEB" : "#FEF2F2",
                        color: row.margin >= 70 ? "#10B981" : row.margin >= 60 ? "#D97706" : "#EF4444"
                      }}>
                      {row.margin >= 70 ? "Saudável" : row.margin >= 60 ? "Atenção" : "Crítico"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
