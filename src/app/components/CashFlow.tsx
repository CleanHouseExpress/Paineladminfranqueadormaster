import { useState } from "react";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { mockCashFlow } from "../data/mockData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-lg" style={{ border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px" }}>
        <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: "#64748B" }}>{p.name}:</span>
            <span style={{ fontWeight: 600, color: "#0F172A" }}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const dailyChartData = mockCashFlow.daily.map(d => ({
  day: d.day,
  entradas: d.income,
  saidas: d.expenses,
  saldo: d.income - d.expenses,
}));

const monthlyData = mockCashFlow.months.map((m, i) => ({
  month: m,
  entradas: mockCashFlow.income[i],
  saidas: mockCashFlow.expenses[i],
  saldo: mockCashFlow.income[i] - mockCashFlow.expenses[i],
}));

const transactions = [
  { date: "09/01", description: "Royalties - Unidade Curitiba", type: "entrada", value: 8253, unit: "BV-006" },
  { date: "09/01", description: "Folha de Pagamento - Sede", type: "saída", value: -18400, unit: "Sede" },
  { date: "08/01", description: "Royalties - Unidade Centro SP", type: "entrada", value: 7866, unit: "BV-001" },
  { date: "08/01", description: "Marketing Digital - Janeiro", type: "saída", value: -4200, unit: "Sede" },
  { date: "07/01", description: "Royalties - Unidade RJ Ipanema", type: "entrada", value: 6102, unit: "BV-008" },
  { date: "07/01", description: "Aluguel - Sede Operacional", type: "saída", value: -8500, unit: "Sede" },
  { date: "06/01", description: "Taxa de franquia - BV-007", type: "entrada", value: 2800, unit: "BV-007" },
  { date: "05/01", description: "Consultoria Contábil", type: "saída", value: -2800, unit: "Sede" },
];

export function CashFlow() {
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const totalEntradas = dailyChartData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = dailyChartData.reduce((s, d) => s + d.saidas, 0);
  const saldoPeriodo = totalEntradas - totalSaidas;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Financeiro</span>
          <ChevronRight size={12} />
          <span>Fluxo de Caixa</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Fluxo de Caixa</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Janeiro 2024 · Consolidado da rede</p>
          </div>
          <div className="flex gap-2">
            {(["daily", "monthly"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-2 rounded-lg transition-colors"
                style={{ fontSize: "12px", fontWeight: 500, background: view === v ? "#6366F1" : "white", color: view === v ? "white" : "#64748B", border: "1px solid", borderColor: view === v ? "#6366F1" : "rgba(0,0,0,0.08)" }}>
                {v === "daily" ? "Diário" : "Mensal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total de entradas", value: totalEntradas, color: "#10B981", bg: "#ECFDF5", icon: TrendingUp },
          { label: "Total de saídas", value: totalSaidas, color: "#EF4444", bg: "#FEF2F2", icon: TrendingDown },
          { label: "Saldo do período", value: saldoPeriodo, color: "#6366F1", bg: "#EEF2FF", icon: TrendingUp },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.bg }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: s.color, letterSpacing: "-0.02em", fontFamily: "monospace" }}>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(s.value)}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 mb-6" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 style={{ color: "#0F172A", marginBottom: "16px" }}>
          {view === "daily" ? "Fluxo diário — Janeiro 2024" : "Fluxo mensal — Últimos 6 meses"}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={view === "daily" ? dailyChartData : monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey={view === "daily" ? "day" : "month"} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
            <Bar dataKey="entradas" name="Entradas" fill="#6366F1" opacity={0.8} radius={[4, 4, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="#EF4444" opacity={0.6} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#10B981" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A" }}>Lançamentos recentes</h3>
        </div>
        <div>
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 transition-colors"
              style={{ borderBottom: i < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: t.type === "entrada" ? "#ECFDF5" : "#FEF2F2" }}>
                {t.type === "entrada"
                  ? <TrendingUp size={14} style={{ color: "#10B981" }} />
                  : <TrendingDown size={14} style={{ color: "#EF4444" }} />
                }
              </div>
              <div className="flex-1">
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>{t.description}</div>
                <div style={{ fontSize: "11px", color: "#94A3B8" }}>{t.date} · {t.unit}</div>
              </div>
              <div style={{
                fontSize: "14px", fontWeight: 700,
                color: t.type === "entrada" ? "#10B981" : "#EF4444",
                fontFamily: "monospace"
              }}>
                {t.type === "entrada" ? "+" : ""}
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(t.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
