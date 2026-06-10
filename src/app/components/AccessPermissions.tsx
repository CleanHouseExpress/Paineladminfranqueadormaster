import { useState } from "react";
import { ChevronRight, Plus, Search, CheckCircle, XCircle, Shield, Users, UserPlus } from "lucide-react";
import { mockUsers, permissionMatrix, roles } from "../data/mockData";

const tabs = ["Usuários", "Perfis", "Matriz de Permissões"] as const;
type Tab = typeof tabs[number];

const permCols = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "del", label: "Excluir" },
  { key: "approve", label: "Aprovar" },
  { key: "export", label: "Exportar" },
  { key: "configure", label: "Configurar" },
] as const;

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="w-2 h-2 rounded-full inline-block" style={{ background: active ? "#10B981" : "#E2E8F0" }} />
  );
}

function PermIcon({ value }: { value: boolean }) {
  return value
    ? <CheckCircle size={15} style={{ color: "#10B981" }} />
    : <XCircle size={15} style={{ color: "#E2E8F0" }} />;
}

export function AccessPermissions() {
  const [tab, setTab] = useState<Tab>("Usuários");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("master");

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ fontSize: "12px", color: "#94A3B8" }}>
          <span>Bella Vita Franchising</span>
          <ChevronRight size={12} />
          <span>Acessos</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ color: "#0F172A" }}>Acessos & Permissões</h1>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Gerencie usuários, perfis e permissões por módulo</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white"
            style={{ background: "#6366F1", fontSize: "13px", fontWeight: 500 }}>
            <UserPlus size={14} />
            Convidar usuário
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Usuários ativos", value: mockUsers.filter(u => u.status === "active").length, color: "#10B981", bg: "#ECFDF5" },
          { label: "Convites pendentes", value: 2, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Perfis configurados", value: roles.length, color: "#6366F1", bg: "#EEF2FF" },
          { label: "Módulos com permissão", value: permissionMatrix.length, color: "#3B82F6", bg: "#EFF6FF" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#F1F5F9" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              fontSize: "13px", fontWeight: 500,
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#0F172A" : "#64748B",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none"
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "Usuários" && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-xs"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Search size={14} style={{ color: "#94A3B8" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuários..." className="bg-transparent outline-none flex-1"
                style={{ fontSize: "13px", color: "#0F172A" }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  {["Usuário", "Perfil", "Unidade", "Status", "Último acesso", "Ações"].map(h => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontSize: "11px", fontWeight: 700 }}>
                          {user.avatar}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>{user.name}</div>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg" style={{ background: "#EEF2FF", color: "#6366F1", fontSize: "12px", fontWeight: 500 }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "13px", color: "#64748B" }}>{user.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot active={user.status === "active"} />
                        <span style={{ fontSize: "12px", color: user.status === "active" ? "#10B981" : user.status === "pending" ? "#F59E0B" : "#94A3B8", fontWeight: 500 }}>
                          {user.status === "active" ? "Ativo" : user.status === "pending" ? "Pendente" : "Inativo"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "monospace" }}>
                      {user.lastAccess}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg transition-colors"
                          style={{ fontSize: "12px", color: "#6366F1", background: "#EEF2FF" }}>
                          Editar
                        </button>
                        <button className="px-3 py-1.5 rounded-lg transition-colors"
                          style={{ fontSize: "12px", color: "#64748B", background: "#F8FAFC" }}>
                          Permissões
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles tab */}
      {tab === "Perfis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              onClick={() => setSelectedRole(role.id)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${role.color}15` }}>
                  <Shield size={18} style={{ color: role.color }} />
                </div>
                <span className="px-2 py-1 rounded-full"
                  style={{ background: "#F8FAFC", color: "#64748B", fontSize: "12px" }}>
                  {role.users} {role.users === 1 ? "usuário" : "usuários"}
                </span>
              </div>
              <h4 style={{ color: "#0F172A", marginBottom: "4px" }}>{role.name}</h4>
              <p style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>{role.description}</p>
              <button className="mt-4 w-full py-2 rounded-lg transition-colors"
                style={{ fontSize: "12px", color: role.color, background: `${role.color}10`, fontWeight: 500 }}>
                Ver permissões
              </button>
            </div>
          ))}
          <div className="bg-white rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{ border: "2px dashed rgba(0,0,0,0.1)", minHeight: "180px" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#6366F1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.1)"}>
            <Plus size={24} style={{ color: "#94A3B8", marginBottom: "8px" }} />
            <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>Criar novo perfil</span>
          </div>
        </div>
      )}

      {/* Permissions matrix */}
      {tab === "Matriz de Permissões" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ fontSize: "13px", color: "#64748B" }}>Perfil selecionado:</span>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
              className="px-3 py-2 rounded-lg outline-none"
              style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.08)", fontSize: "13px", color: "#0F172A" }}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: "#F8FAFC" }}>
                    <th className="px-4 py-3 text-left" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: "180px" }}>
                      Módulo
                    </th>
                    {permCols.map(col => (
                      <th key={col.key} className="px-3 py-3 text-center" style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionMatrix.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F8FAFC"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td className="px-4 py-3" style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>
                        {row.module}
                      </td>
                      {permCols.map(col => (
                        <td key={col.key} className="px-3 py-3 text-center">
                          <PermIcon value={row[col.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
