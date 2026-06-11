import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, Clock, Zap, AlertTriangle, Send } from "lucide-react";
import { getModuleByIdOrAlias } from "../../services/moduleRegistry";

const steps = [
  { id: "sent", label: "Solicitação enviada", icon: Send },
  { id: "review", label: "Em análise", icon: Clock },
  { id: "approved", label: "Aprovado", icon: CheckCircle },
  { id: "implementation", label: "Em implantação", icon: Zap },
  { id: "active", label: "Ativo", icon: CheckCircle },
];

export function RequestModuleAccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const module = id ? getModuleByIdOrAlias(id) : undefined;
  const category = module?.marketplace?.category ?? "Sistema";
  const price = module?.marketplace?.price ?? module?.price ?? "Sob consulta";

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    objective: "",
    units: "",
    urgency: "normal",
    notes: "",
    responsible: "Alexandre Rios",
    responsibleEmail: "alexandre@bellavita.com.br",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!module) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <button onClick={() => navigate("/modules")}
          className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
          style={{ fontSize: "13px", color: "#64748B" }}>
          <ArrowLeft size={16} />
          Voltar para MÃ³dulos
        </button>
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h2 style={{ color: "#0F172A", marginBottom: "8px" }}>MÃ³dulo nÃ£o encontrado</h2>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>
            O mÃ³dulo solicitado nÃ£o existe no catÃ¡logo atual da Orchestra.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-[600px] mx-auto">
        <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#ECFDF5" }}>
            <CheckCircle size={32} style={{ color: "#10B981" }} />
          </div>
          <h2 style={{ color: "#0F172A", marginBottom: "8px" }}>Solicitação enviada!</h2>
          <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "32px" }}>
            Sua solicitação para ativar o módulo <strong>{module.name}</strong> foi recebida.
            Nossa equipe analisará em até 2 dias úteis.
          </p>

          {/* Progress tracker */}
          <div className="mb-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === 0;
              const isPast = false;
              return (
                <div key={step.id} className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isActive ? "#EEF2FF" : "#F8FAFC",
                      border: `2px solid ${isActive ? "#6366F1" : "rgba(0,0,0,0.08)"}`
                    }}>
                    <Icon size={14} style={{ color: isActive ? "#6366F1" : "#94A3B8" }} />
                  </div>
                  <div className="flex-1 text-left">
                    <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, color: isActive ? "#0F172A" : "#94A3B8" }}>
                      {step.label}
                    </span>
                    {isActive && <span className="ml-2 px-2 py-0.5 rounded-full text-white" style={{ background: "#6366F1", fontSize: "10px" }}>Atual</span>}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute left-[27px] w-0.5 h-6 -translate-x-1/2" style={{ background: "rgba(0,0,0,0.08)" }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/modules")}
              className="px-5 py-2.5 rounded-xl transition-colors"
              style={{ background: "#F8FAFC", color: "#64748B", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)" }}>
              Ver todos os módulos
            </button>
            <button onClick={() => navigate("/access/requests")}
              className="px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "#6366F1", fontSize: "13px", fontWeight: 500 }}>
              Acompanhar solicitação
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[700px] mx-auto">
      <button onClick={() => navigate(`/modules/${id}`)}
        className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70"
        style={{ fontSize: "13px", color: "#64748B" }}>
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-6">
        <h1 style={{ color: "#0F172A" }}>Solicitar acesso ao módulo</h1>
        <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
          Preencha os campos abaixo para solicitar a ativação de <strong>{module.name}</strong>
        </p>
      </div>

      {/* Module info */}
      <div className="bg-white rounded-xl p-4 mb-6 flex items-center gap-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
          <Zap size={18} style={{ color: "#6366F1" }} />
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>{module.name}</div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>{category} · {price}</div>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full" style={{ background: "#EFF6FF", color: "#3B82F6", fontSize: "12px", fontWeight: 600 }}>
          Disponível
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>Sobre o uso</h3>

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Objetivo de uso *</label>
            <textarea
              required value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}
              rows={3} placeholder="Descreva como sua rede pretende usar este módulo..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5" style={{ color: "#374151" }}>Unidades que utilizarão *</label>
              <input
                required type="number" min="1" max="50"
                value={form.units} onChange={e => setForm({ ...form, units: e.target.value })}
                placeholder="Ex: 5"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}
              />
            </div>
            <div>
              <label className="block mb-1.5" style={{ color: "#374151" }}>Urgência</label>
              <select
                value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}>
                <option value="low">Baixa — sem pressa</option>
                <option value="normal">Normal — próximas semanas</option>
                <option value="high">Alta — preciso logo</option>
                <option value="critical">Crítica — urgente</option>
              </select>
            </div>
          </div>

          {form.urgency === "critical" && (
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
              <AlertTriangle size={16} style={{ color: "#EF4444", marginTop: "1px", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: "#EF4444" }}>
                Solicitações críticas são priorizadas e respondidas em até 4 horas úteis.
                Por favor, explique o motivo da urgência nas observações.
              </p>
            </div>
          )}

          <div>
            <label className="block mb-1.5" style={{ color: "#374151" }}>Observações</label>
            <textarea
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Informações adicionais ou contexto relevante..."
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#0F172A", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "12px" }}>Pessoa responsável</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5" style={{ color: "#374151" }}>Nome *</label>
              <input required value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
            </div>
            <div>
              <label className="block mb-1.5" style={{ color: "#374151" }}>E-mail *</label>
              <input required type="email" value={form.responsibleEmail} onChange={e => setForm({ ...form, responsibleEmail: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(`/modules/${id}`)}
            className="flex-1 py-3 rounded-xl transition-colors"
            style={{ background: "white", color: "#64748B", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(0,0,0,0.08)" }}>
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontSize: "13px", fontWeight: 500 }}>
            <Send size={14} />
            Enviar solicitação
          </button>
        </div>
      </form>
    </div>
  );
}
