import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF2FF" }}>
        <Construction size={24} style={{ color: "#6366F1" }} />
      </div>
      <h2 style={{ color: "#0F172A", marginBottom: "8px" }}>{title}</h2>
      <p style={{ fontSize: "13px", color: "#94A3B8", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
        {description || "Este módulo está disponível no seu plano. Acesse Módulos Orchestra para configurar."}
      </p>
    </div>
  );
}
