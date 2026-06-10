import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { mockDRE } from "../data/mockData";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(Math.abs(v));

const pct = (v: number, base: number) => ((v / base) * 100).toFixed(1);

export function DRE() {
  const revenue = mockDRE.find(r => r.item === "Receita Bruta") ?? { value: 477400, prev: 512000, item: "Receita Bruta", type: "revenue" as const };
  const netResult = mockDRE.find(r => r.item === "Lucro Líquido") ?? { value: 97363, prev: 104141, item: "Lucro Líquido", type: "result" as const };
  const margin = revenue.value !== 0 ? (netResult.value / revenue.value) * 100 : 0;
  const prevMargin = revenue.prev !== 0 ? (netResult.prev / revenue.prev) * 100 : 0;
  const marginChange = margin - prevMargin;

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Financeiro</span>
          <ChevronRight size={12} />
          <span>DRE Gerencial</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>DRE Gerencial</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Demonstração de Resultado · Janeiro 2024</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", color: "#64748B" }}>
              Exportar PDF
            </button>
            <button className="px-3 py-2 rounded-lg"
              style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px", color: "#64748B" }}>
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Receita Bruta", value: revenue.value, prev: revenue.prev, color: "#6366F1" },
          { label: "Lucro Líquido", value: netResult.value, prev: netResult.prev, color: "#10B981" },
          { label: "Margem Líquida", value: `${margin.toFixed(1)}%`, prev: `${prevMargin.toFixed(1)}%`, color: marginChange >= 0 ? "#10B981" : "#EF4444", isPercent: true },
        ].map(s => {
          const change = typeof s.value === "number" ? ((s.value - s.prev) / s.prev) * 100 : marginChange;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
                {typeof s.value === "number" ? fmt(s.value) : s.value}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {change >= 0
                  ? <TrendingUp size={11} style={{ color: "#10B981" }} />
                  : <TrendingDown size={11} style={{ color: "#EF4444" }} />
                }
                <span style={{ fontSize: "11px", color: change >= 0 ? "#10B981" : "#EF4444", fontWeight: 500 }}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs Dez
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DRE table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="px-5 py-3" style={{ background: "#F8FAFC", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="grid grid-cols-4 gap-4">
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Descrição</div>
            <div className="text-right" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jan 2024</div>
            <div className="text-right" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dez 2023</div>
            <div className="text-right" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>% Rec.</div>
          </div>
        </div>
        {mockDRE.map((row, i) => {
          const isSubtotal = row.type === "subtotal" || row.type === "result";
          const isResult = row.type === "result";
          const valueColor = isResult ? (row.value >= 0 ? "#10B981" : "#EF4444")
            : isSubtotal ? "#0F172A"
            : row.value < 0 ? "#EF4444" : "#10B981";

          return (
            <div key={i}
              className="px-5 py-3 grid grid-cols-4 gap-4"
              style={{
                borderBottom: "1px solid rgba(0,0,0,0.04)",
                background: isResult ? "linear-gradient(135deg, #ECFDF5, #F0FDF4)" : isSubtotal ? "#F8FAFC" : "transparent",
              }}>
              <div style={{
                fontSize: isSubtotal ? "13px" : "13px",
                fontWeight: isSubtotal ? 600 : 400,
                color: isSubtotal ? "#0F172A" : "#374151",
                paddingLeft: !isSubtotal && row.type === "deduction" ? "16px" : "0"
              }}>
                {row.item}
              </div>
              <div className="text-right" style={{ fontSize: "13px", fontWeight: isSubtotal ? 700 : 400, color: valueColor, fontFamily: "monospace" }}>
                {row.value < 0 ? `(${fmt(row.value)})` : fmt(row.value)}
              </div>
              <div className="text-right" style={{ fontSize: "13px", color: "#94A3B8", fontFamily: "monospace" }}>
                {row.prev < 0 ? `(${fmt(row.prev)})` : fmt(row.prev)}
              </div>
              <div className="text-right" style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                {Math.abs(parseFloat(pct(row.value, revenue.value)))}%
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4" style={{ fontSize: "11px", color: "#94A3B8", textAlign: "center" }}>
        DRE gerencial simplificado · Dados consolidados de todas as unidades · Valores em R$
      </p>
    </div>
  );
}
