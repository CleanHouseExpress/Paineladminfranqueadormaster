import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  Activity, AlertCircle, ArrowRight, Building2, ChevronRight, Clock,
  DollarSign, Puzzle, Star, Users,
} from "lucide-react";

import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";
import { useAuth } from "../../shared/context/AuthContext";
import { useTenant } from "../../shared/context/TenantContext";
import { unitManagementService } from "../../services/unitManagementService";
import type { Unit } from "../../types/unitManagement";

type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
};

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;

  return (
    <div className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: metric.bg }}>
          <Icon size={18} style={{ color: metric.color }} />
        </div>
        <span style={{ fontSize: "11px", color: "#94A3B8" }}>{metric.helper}</span>
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>{metric.value}</div>
      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{metric.label}</div>
    </div>
  );
}

function EmptyPanel({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div
      className="h-full rounded-lg flex flex-col items-center justify-center text-center p-8"
      style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}
    >
      <Activity size={28} color="#94A3B8" />
      <h4 style={{ margin: "12px 0 4px", color: "#0F172A", fontSize: 14 }}>{title}</h4>
      <p style={{ margin: 0, color: "#64748B", fontSize: 12, lineHeight: 1.5, maxWidth: 360 }}>{description}</p>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} style={{ fontSize: 12, color: "#6366F1", fontWeight: 700, textDecoration: "none" }}>
      {children}
    </Link>
  );
}

function unitStatusLabel(status: unknown) {
  if (typeof status !== "string" || !status) return "ativa";
  if (status === "active") return "ativa";
  if (status === "inactive") return "inativa";
  if (status === "pending") return "pendente";
  return status;
}

export function Dashboard() {
  const { tenant } = useTenant();
  const { modules } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsTotal, setUnitsTotal] = useState<number | null>(null);
  const [unitsError, setUnitsError] = useState("");

  useEffect(() => {
    let active = true;

    unitManagementService.listUnits({ per_page: 5 })
      .then(response => {
        if (!active) return;
        setUnits(response.data ?? []);
        setUnitsTotal(response.meta?.total ?? response.data?.length ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setUnits([]);
        setUnitsTotal(null);
        setUnitsError("Nao foi possivel carregar as unidades agora.");
      });

    return () => {
      active = false;
    };
  }, []);

  const activeModules = useMemo(
    () => modules.filter(module => module.status !== "blocked" && module.status !== "review").length,
    [modules],
  );

  const reviewModules = useMemo(
    () => modules.filter(module => module.status === "review").length,
    [modules],
  );

  const metrics = useMemo<DashboardMetric[]>(() => [
    { label: "Faturamento da Rede", value: "-", helper: "Sem endpoint", icon: DollarSign, color: "#6366F1", bg: "#EEF2FF" },
    { label: "Unidades", value: unitsTotal === null ? "-" : String(unitsTotal), helper: unitsError ? "Indisponivel" : "API real", icon: Building2, color: "#10B981", bg: "#ECFDF5" },
    { label: "Clientes Ativos", value: "-", helper: "Sem endpoint", icon: Users, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Royalties Previstos", value: "-", helper: "Ver modulo", icon: DollarSign, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Score Operacional", value: "-", helper: "Ver NOC", icon: Star, color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "Pendencias Criticas", value: "-", helper: "Ver tarefas", icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
    { label: "Modulos Ativos", value: String(activeModules), helper: modules.length ? "Sessao" : "Sem dados", icon: Puzzle, color: "#06B6D4", bg: "#ECFEFF" },
    { label: "Solicitacoes Pendentes", value: reviewModules ? String(reviewModules) : "-", helper: reviewModules ? "Sessao" : "Sem endpoint", icon: Clock, color: "#64748B", bg: "#F8FAFC" },
  ], [activeModules, modules.length, reviewModules, unitsError, unitsTotal]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>{tenant.name}</span>
          <ChevronRight size={12} />
          <span>Dashboard</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 data-testid="dashboard-title" style={{ color: "#0F172A" }}>Painel Executivo</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
              Dados reais disponiveis por modulo. Indicadores sem API consolidada ficam em branco.
            </p>
          </div>
          <Link
            to="/analytics"
            className="px-3 py-1.5 rounded-lg transition-colors"
            style={{ fontSize: "12px", fontWeight: 600, background: "#6366F1", color: "white", textDecoration: "none" }}
          >
            Abrir Analytics
          </Link>
        </div>
      </div>

      <OnboardingChecklist />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-tour="dashboard-metrics">
        {metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: "#0F172A" }}>Evolucao Financeira</h3>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>Sem serie consolidada conectada a home</p>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <EmptyPanel
              title="Grafico removido"
              description="A home nao possui endpoint financeiro consolidado. Use o modulo Financeiro ou Analytics para consultar dados reais."
              action={<TextLink to="/financial">Abrir Financeiro</TextLink>}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0F172A" }}>Alertas Inteligentes</h3>
            <span className="px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B", fontSize: "11px", fontWeight: 600 }}>0</span>
          </div>
          <EmptyPanel
            title="Sem alertas conectados"
            description="Nenhum alerta real foi carregado para a home. Acompanhe eventos operacionais no NOC e na Central de Acoes."
            action={<TextLink to="/noc">Abrir NOC</TextLink>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0F172A" }}>Unidades</h3>
            <Link to="/units" className="flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ fontSize: "12px", color: "#6366F1", fontWeight: 500 }}>
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {units.length === 0 && (
              <EmptyPanel
                title={unitsError || "Nenhuma unidade carregada"}
                description="A home nao usa mais ranking mockado. Cadastre ou consulte unidades reais no modulo Unidades."
              />
            )}
            {units.map((unit, index) => (
              <div key={unit.id} className="flex items-center gap-4">
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#94A3B8", width: "20px" }}>#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }} className="truncate">{unit.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B" }}>{unitStatusLabel(unit.status)}</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: "#F1F5F9" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: "100%", background: "#CBD5E1" }} />
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "#64748B", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {unit.address_city ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0F172A" }}>Solicitacoes</h3>
            <Link to="/access/requests" className="flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ fontSize: "12px", color: "#6366F1", fontWeight: 500 }}>
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <EmptyPanel
            title="Solicitacoes removidas da home"
            description="Nao ha endpoint real de solicitacoes resumidas para esta tela. A lista oficial fica no modulo Acessos."
          />
        </div>
      </div>
    </div>
  );
}
