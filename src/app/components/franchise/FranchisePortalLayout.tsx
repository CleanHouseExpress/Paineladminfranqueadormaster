import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  BarChart3, BookOpen, CheckSquare, DollarSign, FileText, GraduationCap,
  ListTodo, LogOut, Menu, Receipt, ShoppingCart, TrendingDown, X,
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useFranchisePortal } from '../../../shared/context/FranchisePortalContext';
import { ModuleStateView } from '../../../shared/components/ModuleStateView';

const items = [
  ['/franchise/dashboard', 'Dashboard', BarChart3, 'tenant.franchise_portal.dashboard'],
  ['/franchise/sales', 'Vendas', ShoppingCart, 'tenant.franchise_portal.sales.view'],
  ['/franchise/financial', 'Financeiro', DollarSign, 'tenant.franchise_portal.financial.view'],
  ['/franchise/dre', 'DRE', TrendingDown, 'tenant.franchise_portal.dre.view'],
  ['/franchise/royalties', 'Royalties', Receipt, 'tenant.franchise_portal.royalties.view'],
  ['/franchise/cmv', 'CMV', BarChart3, 'tenant.franchise_portal.cmv.view'],
  ['/franchise/checklists', 'Checklists', CheckSquare, 'tenant.franchise_portal.checklists.view'],
  ['/franchise/trainings', 'Treinamentos', GraduationCap, 'tenant.franchise_portal.trainings.view'],
  ['/franchise/documents', 'Documentos', FileText, 'tenant.franchise_portal.documents.view'],
  ['/franchise/contracts', 'Contratos', BookOpen, 'tenant.franchise_portal.contracts.view'],
  ['/franchise/tasks', 'Tarefas', ListTodo, 'tenant.tasks.view'],
] as const;

export function FranchisePortalLayout({ children }: { children: React.ReactNode }) {
  const { data, loading, error, refresh, hasPermission } = useFranchisePortal();
  const { logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (loading) return <ModuleStateView state="loading" />;
  if (error || !data) return <ModuleStateView state="error" errorMessage={error} onRetry={() => void refresh()} />;

  return <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
    {open && <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setOpen(false)} />}
    <aside className={`fixed lg:relative z-50 h-full w-[230px] flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ background: '#172554' }}>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#fff', fontSize: 14 }}>Portal Franqueado</strong><button className="lg:hidden" onClick={() => setOpen(false)}><X size={17} color="#fff" /></button></div>
        <div style={{ color: '#93C5FD', fontSize: 12, marginTop: 5 }}>{data.unit.name}</div>
      </div>
      <nav style={{ padding: 10, flex: 1, overflow: 'auto' }}>
        {items.filter(item => hasPermission(item[3])).map(([path, label, Icon]) => {
          const active = location.pathname === path || (path.endsWith('/dashboard') && location.pathname === '/franchise');
          return <Link key={path} to={path} onClick={() => setOpen(false)} style={{
            display: 'flex', gap: 9, alignItems: 'center', padding: '9px 11px', borderRadius: 8,
            color: active ? '#fff' : '#93A4C3', background: active ? 'rgba(59,130,246,.22)' : 'transparent',
            textDecoration: 'none', fontSize: 13, marginBottom: 3,
          }}><Icon size={15} />{label}</Link>;
        })}
      </nav>
      <button onClick={() => void logout()} style={{ margin: 10, padding: 10, border: 0, borderTop: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: '#93A4C3', display: 'flex', gap: 8, cursor: 'pointer' }}><LogOut size={15} /> Sair</button>
    </aside>
    <div className="flex-1 flex flex-col min-w-0">
      <header style={{ height: 58, background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12 }}>
        <button className="lg:hidden" onClick={() => setOpen(true)}><Menu size={20} /></button>
        <div><strong style={{ color: '#0F172A', fontSize: 13 }}>{data.unit.name}</strong><span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 8 }}>Visão exclusiva da sua unidade</span></div>
        <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>{data.user.name}</span>
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  </div>;
}
