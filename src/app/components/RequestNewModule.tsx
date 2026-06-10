import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Lightbulb, Send, CheckCircle, Sparkles } from "lucide-react";

export function RequestNewModule() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    problem: "",
    currentProcess: "",
    users: "",
    impact: "",
    priority: "medium",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-[600px] mx-auto">
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)" }}>
            <Sparkles size={28} style={{ color: "#6366F1" }} />
          </div>
          <h2 style={{ color: "#0F172A", marginBottom: "8px" }}>Ideia recebida!</h2>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "8px" }}>
            Obrigado por compartilhar sua ideia para o módulo <strong>{form.name}</strong>.
          </p>
          <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, marginBottom: "32px" }}>
            A Orchestra evolui junto com a sua rede. Nossa equipe de produto analisará a proposta
            e entrará em contato em até 5 dias úteis com um retorno sobre viabilidade e prazo.
          </p>
          <div className="p-4 rounded-xl mb-6" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>Próximos passos</div>
            <div className="space-y-2">
              {["Análise de viabilidade pela equipe de produto", "Retorno com estimativa de prazo e custo", "Aprovação e priorização no roadmap", "Desenvolvimento e implantação"].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EEF2FF", color: "#6366F1", fontSize: "10px", fontWeight: 700 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/modules")}
              className="px-5 py-2.5 rounded-xl transition-colors"
              style={{ background: "#F8FAFC", color: "#64748B", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)" }}>
              Ver módulos
            </button>
            <button onClick={() => { setSubmitted(false); setForm({ name: "", problem: "", currentProcess: "", users: "", impact: "", priority: "medium", notes: "" }); }}
              className="px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "#6366F1", fontSize: "13px", fontWeight: 500 }}>
              Nova sugestão
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[700px] mx-auto">
      <button onClick={() => navigate("/modules")}
        className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
        style={{ fontSize: "13px", color: "#64748B" }}>
        <ArrowLeft size={16} />
        Voltar para Módulos
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)" }}>
            <Lightbulb size={18} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <h1 style={{ color: "#0F172A" }}>Solicitar novo módulo</h1>
          </div>
        </div>
        <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6, marginTop: "8px", padding: "12px 16px", borderRadius: "12px", background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)", borderLeft: "3px solid #6366F1" }}>
          A Orchestra foi construída para crescer com a sua rede. Se você identifica uma necessidade
          não atendida, compartilhe sua ideia — sua sugestão pode se tornar um módulo para toda a plataforma.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>Sobre o módulo</h3>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Nome sugerido para o módulo *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Agenda de Serviços, Controle de Estoque..."
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
          </div>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Qual problema você quer resolver? *</label>
            <textarea required value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })}
              rows={3} placeholder="Descreva o problema atual que motiva essa solicitação..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
          </div>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Como você resolve isso hoje?</label>
            <textarea value={form.currentProcess} onChange={e => setForm({ ...form, currentProcess: e.target.value })}
              rows={2} placeholder="Excel, processo manual, outro sistema..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>Impacto e usuários</h3>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Quem usaria este módulo? *</label>
            <input required value={form.users} onChange={e => setForm({ ...form, users: e.target.value })}
              placeholder="Ex: Gestores de unidade, franqueador, operadores..."
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
          </div>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Qual o impacto esperado? *</label>
            <textarea required value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })}
              rows={3} placeholder="Redução de tempo, aumento de receita, menos erros..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
          </div>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Prioridade</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "low", label: "Baixa", color: "#94A3B8", bg: "#F8FAFC" },
                { value: "medium", label: "Média", color: "#F59E0B", bg: "#FFFBEB" },
                { value: "high", label: "Alta", color: "#EF4444", bg: "#FEF2F2" },
              ].map(p => (
                <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                  className="py-2.5 rounded-xl transition-colors"
                  style={{
                    fontSize: "13px", fontWeight: 500,
                    background: form.priority === p.value ? p.bg : "white",
                    color: form.priority === p.value ? p.color : "#94A3B8",
                    border: `2px solid ${form.priority === p.value ? p.color : "rgba(0,0,0,0.08)"}`,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Observações adicionais</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Exemplos de outros sistemas, referências, detalhes técnicos..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate("/modules")}
            className="flex-1 py-3 rounded-xl transition-colors"
            style={{ background: "white", color: "#64748B", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)" }}>
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontSize: "13px", fontWeight: 500 }}>
            <Send size={14} />
            Enviar sugestão
          </button>
        </div>
      </form>
    </div>
  );
}
