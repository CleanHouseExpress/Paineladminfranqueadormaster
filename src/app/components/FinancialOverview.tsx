import { Link } from "react-router";
import { ChevronRight, TrendingUp, TrendingDown, ArrowRight, DollarSign } from "lucide-react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { mockCashFlow, mockRoyalties } from "../data/mockData";

const financialSections = [
  { label: "Fluxo de Caixa", path: "/financial/cashflow", desc: "Entradas e saídas em tempo real", value: "R$ 143.200", change: "+4,1%", up: true },
  { label: "DRE Gerencial", path: "/financial/dre", desc: "Resultado mensal da rede", value: "R$ 97.363", change: "+8,2% vs Dez", up: true },
  { label: "CMV & Custos", path: "/financial/cmv", desc: "Análise de margem por produto", value: "28,1%", change: "CMV médio", up: true },
  { label: "Royalties", path: "/financial/royalties", desc: "Cobranças e recebimentos", value: "R$ 29.236", change: "R$ 12.476 pendentes", up: false },
];

const pieData = [
  { name: "Serviços", value: 47, color: "#6366F1" },
  { name: "Produtos", value: 23, color: "#10B981" },
  { name: "Assinaturas", value: 18, color: "#F59E0B" },
  { name: "Outros", value: 12, color: "#E2E8F0" },
];

const chartData = mockCashFlow.months.map((m, i) => ({
  month: m,
  receita: mockCashFlow.income[i],
  despesas: mockCashFlow.expenses[i],
}));

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

export function FinancialOverview() {
  const totalRevenue = mockCashFlow.income[mockCashFlow.income.length - 1];
  const totalExpenses = mockCashFlow.expenses[mockCashFlow.expenses.length - 1];
  const result = totalRevenue - totalExpenses;
  const margin = ((result / totalRevenue) * 100).toFixed(1);

  const royaltiesTotal = mockRoyalties.reduce((s, r) => s + r.total, 0);
  const royaltiesPaid = mockRoyalties.filter(r => r.status === "paid").reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Bella Vita Franchising</span>
          <ChevronRight size={12} />
          <span>Financeiro</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Visão Geral Financeira</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Janeiro 2024 · Consolidado da rede</p>
          </div>
          <button className="px-4 py-2.5 rounded-xl"
            style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#64748B" }}>
            Exportar relatório
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Faturamento bruto", value: totalRevenue, color: "#6366F1", bg: "#EEF2FF", prefix: true, change: "+6,8% vs Dez", up: true },
          { label: "Despesas totais", value: totalExpenses, color: "#EF4444", bg: "#FEF2F2", prefix: true, change: "+4,2% vs Dez", up: false },
          { label: "Resultado líquido", value: result, color: "#10B981", bg: "#ECFDF5", prefix: true, change: `${margin}% de margem`, up: true },
          { label: "Royalties coletados", value: royaltiesPaid, color: "#F59E0B", bg: "#FFFBEB", prefix: true, change: `${((royaltiesPaid/royaltiesTotal)*100).toFixed(0)}% do previsto`, up: true },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: kpi.bg }}>
              <DollarSign size={16} style={{ color: kpi.color }} />
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              {kpi.prefix && "R$ "}
              {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0 }).format(kpi.value)}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{kpi.label}</div>
            <div className="flex items-center gap-1 mt-2">
              {kpi.up ? <TrendingUp size={11} style={{ color: "#10B981" }} /> : <TrendingDown size={11} style={{ color: "#EF4444" }} />}
              <span style={{ fontSize: "11px", color: kpi.up ? "#10B981" : "#EF4444", fontWeight: 500 }}>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A", marginBottom: "4px" }}>Receita vs Despesas</h3>
          <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "16px" }}>6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="#6366F1" strokeWidth={2} fill="#6366F1" fillOpacity={0.1} isAnimationActive={false} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A", marginBottom: "4px" }}>Mix de receita</h3>
          <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "8px" }}>Por categoria</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`fov-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A", fontFamily: "monospace" }}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialSections.map(s => (
          <Link key={s.path} to={s.path}
            className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow group"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", marginBottom: "2px" }}>{s.label}</div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px" }}>{s.desc}</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", fontFamily: "monospace", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                {s.up ? <TrendingUp size={11} style={{ color: "#10B981" }} /> : <TrendingDown size={11} style={{ color: "#F59E0B" }} />}
                <span style={{ fontSize: "11px", color: s.up ? "#10B981" : "#F59E0B" }}>{s.change}</span>
              </div>
              <ArrowRight size={14} style={{ color: "#94A3B8" }} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
