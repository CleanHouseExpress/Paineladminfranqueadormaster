import { useState } from "react";
import { Link } from "react-router";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";
import { useTenant } from "../../shared/context/TenantContext";
import {
  TrendingUp, TrendingDown, Building2, Users, DollarSign,
  AlertCircle, Star, Puzzle, Clock, ArrowRight, CheckCircle,
  XCircle, Activity, ChevronRight
} from "lucide-react";
import { mockUnits, mockAccessRequests, mockCashFlow } from "../data/mockData";

const metrics = [
  { label: "Faturamento da Rede", value: "R$ 477.400", change: "+6,8%", trend: "down", icon: DollarSign, color: "#6366F1", bg: "#EEF2FF" },
  { label: "Unidades Ativas", value: "8", change: "+1 este mês", trend: "up", icon: Building2, color: "#10B981", bg: "#ECFDF5" },
  { label: "Clientes Ativos", value: "1.798", change: "+142 este mês", trend: "up", icon: Users, color: "#3B82F6", bg: "#EFF6FF" },
  { label: "Royalties Previstos", value: "R$ 41.712", change: "R$ 29.236 recebidos", trend: "up", icon: DollarSign, color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Score Operacional", value: "86/100", change: "+3 pontos", trend: "up", icon: Star, color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "Pendências Críticas", value: "12", change: "+4 hoje", trend: "down", icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
  { label: "Módulos Ativos", value: "10", change: "6 disponíveis", trend: "up", icon: Puzzle, color: "#06B6D4", bg: "#ECFEFF" },
  { label: "Solicitações Pendentes", value: "3", change: "Aguardando aprovação", trend: "neutral", icon: Clock, color: "#64748B", bg: "#F8FAFC" },
];

const chartData = mockCashFlow.months.map((m, i) => ({
  month: m,
  dash_rec: mockCashFlow.income[i],
  dash_exp: mockCashFlow.expenses[i],
  resultado: mockCashFlow.income[i] - mockCashFlow.expenses[i],
}));

const alerts = [
  { type: "critical", message: "Unidade BH Savassi com royalties vencidos há 15 dias", time: "Agora" },
  { type: "warning", message: "Score operacional da Unidade Santos abaixo de 80", time: "2h atrás" },
  { type: "info", message: "Módulo Atendimento WhatsApp disponível para ativação", time: "5h atrás" },
  { type: "success", message: "Unidade Curitiba atingiu meta mensal de faturamento", time: "1d atrás" },
];

const alertStyles: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: { color: "#EF4444", bg: "#FEF2F2", icon: <XCircle size={14} /> },
  warning: { color: "#F59E0B", bg: "#FFFBEB", icon: <AlertCircle size={14} /> },
  info: { color: "#3B82F6", bg: "#EFF6FF", icon: <Activity size={14} /> },
  success: { color: "#10B981", bg: "#ECFDF5", icon: <CheckCircle size={14} /> },
};

function MetricCard({ metric }: { metric: typeof metrics[0] }) {
  const Icon = metric.icon;
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: metric.bg }}>
          <Icon size={18} style={{ color: metric.color }} />
        </div>
        {metric.trend !== "neutral" && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              fontSize: "11px", fontWeight: 600,
              background: metric.trend === "up" ? "#ECFDF5" : "#FEF2F2",
              color: metric.trend === "up" ? "#10B981" : "#EF4444"
            }}>
            {metric.trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {metric.change}
          </span>
        )}
        {metric.trend === "neutral" && (
          <span style={{ fontSize: "11px", color: "#94A3B8" }}>{metric.change}</span>
        )}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{metric.value}</div>
      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{metric.label}</div>
    </div>
  );
}

// ─── Pure-SVG chart — no recharts, no duplicate-key risk ─────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 0 }).format(v);

interface SvgChartProps {
  labels: string[];
  series: Array<{ values: number[]; color: string; label: string; dashed?: boolean }>;
  bars?: Array<{ values: number[]; color: string; label: string }>;
}

function SvgChart({ labels, series, bars }: SvgChartProps) {
  const W = 500; const H = 180;
  const PAD = { top: 12, right: 16, bottom: 28, left: 52 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const n = labels.length;

  const allVals = [
    ...series.flatMap(s => s.values),
    ...(bars?.flatMap(b => b.values) ?? []),
  ];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;

  const px = (i: number) => PAD.left + (i / (n - 1)) * cw;
  const py = (v: number) => PAD.top + (1 - (v - minV) / range) * ch;

  const linePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");

  const gridY = [0, 0.25, 0.5, 0.75, 1].map(t => minV + t * range);
  const barW = bars ? cw / n * 0.5 : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      {/* Grid */}
      {gridY.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={py(v)} y2={py(v)}
            stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={PAD.left - 6} y={py(v) + 4} textAnchor="end"
            fill="#94A3B8" fontSize={10}>{fmt(v)}</text>
        </g>
      ))}
      {/* X labels */}
      {labels.map((l, i) => (
        <text key={l} x={px(i)} y={H - PAD.bottom + 16} textAnchor="middle"
          fill="#94A3B8" fontSize={11}>{l}</text>
      ))}
      {/* Bars */}
      {bars?.map(b =>
        b.values.map((v, i) => (
          <rect key={i} x={px(i) - barW / 2} y={py(v)} width={barW} height={py(minV) - py(v)}
            rx={3} fill={b.color} opacity={0.85} />
        ))
      )}
      {/* Lines */}
      {series.map(s => (
        <path key={s.label} d={linePath(s.values)} fill="none"
          stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={s.dashed ? "6 3" : undefined} />
      ))}
      {/* Dots on lines */}
      {series.map(s =>
        s.values.map((v, i) => (
          <circle key={`${s.label}-${i}`} cx={px(i)} cy={py(v)} r={3}
            fill="white" stroke={s.color} strokeWidth={2} />
        ))
      )}
    </svg>
  );
}

export function Dashboard() {
  const [tab, setTab] = useState<"receita" | "resultado">("receita");
  const { tenant } = useTenant();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>{tenant.name}</span>
          <ChevronRight size={12} />
          <span>Dashboard</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 data-testid="dashboard-title" style={{ color: "#0F172A" }}>Painel Executivo</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Janeiro 2024 · Última atualização há 5 minutos</p>
          </div>
          <div className="flex gap-2">
            {["Jan", "Trimestre", "Ano"].map((p, i) => (
              <button key={p} className="px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  fontSize: "12px", fontWeight: 500,
                  background: i === 0 ? "#6366F1" : "white",
                  color: i === 0 ? "white" : "#64748B",
                  border: "1px solid",
                  borderColor: i === 0 ? "#6366F1" : "rgba(0,0,0,0.08)"
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding checklist — visible until all items are complete */}
      <OnboardingChecklist />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-tour="dashboard-metrics">
        {metrics.map((m, i) => <MetricCard key={i} metric={m} />)}
      </div>

      {/* Charts + Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: "#0F172A" }}>Evolução Financeira</h3>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>6 meses · Rede consolidada</p>
            </div>
            <div className="flex gap-1">
              {(["receita", "resultado"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3 py-1.5 rounded-lg transition-colors capitalize"
                  style={{
                    fontSize: "12px", fontWeight: 500,
                    background: tab === t ? "#EEF2FF" : "transparent",
                    color: tab === t ? "#6366F1" : "#94A3B8"
                  }}>
                  {t === "receita" ? "Receita vs Despesas" : "Resultado"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 220 }}>
            {tab === "receita" ? (
              <SvgChart
                labels={chartData.map(d => d.month)}
                series={[
                  { values: chartData.map(d => d.dash_rec), color: "#6366F1", label: "Receita" },
                  { values: chartData.map(d => d.dash_exp), color: "#EF4444", label: "Despesas", dashed: true },
                ]}
              />
            ) : (
              <SvgChart
                labels={chartData.map(d => d.month)}
                series={[]}
                bars={[{ values: chartData.map(d => d.resultado), color: "#10B981", label: "Resultado" }]}
              />
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2">
            {tab === "receita" ? (
              <>
                <span className="flex items-center gap-1.5" style={{ fontSize: "11px", color: "#64748B" }}>
                  <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#6366F1" }} /> Receita
                </span>
                <span className="flex items-center gap-1.5" style={{ fontSize: "11px", color: "#64748B" }}>
                  <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#EF4444" }} /> Despesas
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5" style={{ fontSize: "11px", color: "#64748B" }}>
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#10B981" }} /> Resultado Líquido
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0F172A" }}>Alertas Inteligentes</h3>
            <span className="px-2 py-0.5 rounded-full text-white" style={{ background: "#EF4444", fontSize: "11px", fontWeight: 600 }}>4</span>
          </div>
          <div className="space-y-3">
            {alerts.map((a, i) => {
              const s = alertStyles[a.type];
              return (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: s.bg }}>
                  <span style={{ color: s.color, marginTop: "1px", flexShrink: 0 }}>{s.icon}</span>
                  <div className="min-w-0">
                    <p style={{ fontSize: "12px", color: "#0F172A", lineHeight: 1.4 }}>{a.message}</p>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Unit ranking */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0F172A" }}>Ranking de Unidades</h3>
            <Link to="/units" className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ fontSize: "12px", color: "#6366F1", fontWeight: 500 }}>
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {mockUnits.slice(0, 5).sort((a, b) => b.score - a.score).map((unit, i) => (
              <div key={unit.id} className="flex items-center gap-4">
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#94A3B8", width: "20px" }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }} className="truncate">{unit.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: unit.score >= 90 ? "#10B981" : unit.score >= 80 ? "#F59E0B" : "#EF4444" }}>
                      {unit.score}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: "#F1F5F9" }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${unit.score}%`,
                        background: unit.score >= 90 ? "#10B981" : unit.score >= 80 ? "#F59E0B" : "#EF4444"
                      }} />
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "#64748B", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(unit.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent requests */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0F172A" }}>Solicitações</h3>
            <Link to="/access/requests" className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ fontSize: "12px", color: "#6366F1", fontWeight: 500 }}>
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {mockAccessRequests.slice(0, 4).map(req => (
              <div key={req.id} className="p-3 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#0F172A" }}>{req.requester}</span>
                  <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      fontSize: "10px", fontWeight: 600,
                      background: req.status === "pending" ? "#FFFBEB" : req.status === "approved" ? "#ECFDF5" : req.status === "denied" ? "#FEF2F2" : "#EFF6FF",
                      color: req.status === "pending" ? "#D97706" : req.status === "approved" ? "#10B981" : req.status === "denied" ? "#EF4444" : "#3B82F6",
                    }}>
                    {req.status === "pending" ? "Pendente" : req.status === "approved" ? "Aprovado" : req.status === "denied" ? "Recusado" : "Em análise"}
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "#64748B" }}>{req.type} · {req.module}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
