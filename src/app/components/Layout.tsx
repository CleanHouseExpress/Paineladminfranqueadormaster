import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import {
  Bell, Search, Menu, X, LogOut, HelpCircle,
  ChevronDown, ChevronRight, Layers,
} from 'lucide-react';

import { NAV_MODULES } from '../../services/moduleRegistry';
import { useTenant } from '../../shared/context/TenantContext';
import { useAuth } from '../../shared/context/AuthContext';

// ─── Dynamic icon resolver ─────────────────────────────────────────────────────

function DynIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Icon) return <Icons.Circle {...props} />;
  return <Icon {...props} />;
}

// ─── Sidebar nav ───────────────────────────────────────────────────────────────

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const { isModuleEnabled } = useTenant();
  const [expanded, setExpanded] = useState<string[]>(['financial', 'access']);

  const toggleExpand = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('/:')[0]);
  };

  const mainModules = NAV_MODULES.filter(m => m.nav!.group === 'main');
  const systemModules = NAV_MODULES.filter(m => m.nav!.group === 'system');

  function renderItem(mod: (typeof NAV_MODULES)[number]) {
    const primaryPath = mod.routes?.[0]?.path ?? '#';
    const active = isActive(primaryPath);
    const isExp = expanded.includes(mod.id);
    const enabled = isModuleEnabled(mod.routes?.[0]?.moduleId ?? mod.id);

    const baseStyle: React.CSSProperties = {
      color: active ? '#F1F5F9' : '#94A3B8',
      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
      opacity: enabled ? 1 : 0.55,
    };

    if (mod.nav!.children) {
      return (
        <div key={mod.id}>
          <button
            data-testid={`sidebar-${mod.id}`}
            onClick={() => toggleExpand(mod.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors"
            style={baseStyle}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <DynIcon name={mod.icon} size={16} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{mod.nav!.label ?? mod.name}</span>
                <ChevronDown
                  size={12}
                  className="ml-auto transition-transform"
                  style={{ transform: isExp ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                />
              </>
            )}
          </button>

          {!collapsed && isExp && (
            <div className="ml-4 mb-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '12px' }}>
              {mod.nav!.children!.map(child => {
                const childActive = location.pathname === child.path;
                return (
                  <Link
                    data-testid={`sidebar-${mod.id}-${child.path.split('/').filter(Boolean).pop() ?? 'index'}`}
                    key={child.path}
                    to={child.path}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md mb-0.5 transition-colors"
                    style={{
                      color: childActive ? '#818CF8' : '#64748B',
                      background: childActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                      fontSize: '12px',
                      fontWeight: childActive ? 500 : 400,
                    }}
                    onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
                    onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                  >
                    {child.label}
                    {child.badge ? (
                      <span className="px-1.5 py-0.5 rounded-full text-white" style={{ fontSize: '10px', background: '#EF4444', fontWeight: 600 }}>
                        {child.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        data-testid={`sidebar-${mod.id}`}
        key={mod.id}
        to={primaryPath}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors"
        style={baseStyle}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <DynIcon name={mod.icon} size={16} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span style={{ fontSize: '13px', fontWeight: active ? 500 : 400 }}>{mod.nav!.label ?? mod.name}</span>
            {active && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#818CF8' }} />}
          </>
        )}
      </Link>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2" data-tour="sidebar-nav" data-testid="main-sidebar">
      {mainModules.map(mod => (
        <div key={mod.id} data-tour={`nav-${mod.id}`}>{renderItem(mod)}</div>
      ))}
      {!collapsed && <div className="mx-3 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />}
      {systemModules.map(mod => (
        <div key={mod.id} data-tour={`nav-${mod.id}`}>{renderItem(mod)}</div>
      ))}
    </nav>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const primary = tenant.whiteLabel.primaryColor;
  const secondary = tenant.whiteLabel.secondaryColor;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 flex flex-col h-full transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
        style={{ background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <Layers size={16} color="white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>{tenant.whiteLabel.platformName}</div>
              <div style={{ color: '#64748B', fontSize: '11px' }} className="truncate">{tenant.name}</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded" style={{ color: '#64748B' }}>
            {collapsed ? <ChevronRight size={14} /> : <Menu size={14} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="ml-auto flex lg:hidden items-center justify-center w-6 h-6 rounded" style={{ color: '#64748B' }}>
            <X size={14} />
          </button>
        </div>

        <SidebarNav collapsed={collapsed} />

        {/* Footer */}
        <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div className="px-3 py-2 mb-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ color: '#818CF8', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plano</div>
              <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: 600 }}>{tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}</div>
              <div style={{ color: '#64748B', fontSize: '11px' }}>{tenant.enabledModuleIds.length} módulos ativos</div>
            </div>
          )}
          <button
            data-testid="logout-button"
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              await logout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
            style={{ color: '#64748B', opacity: loggingOut ? 0.6 : 1 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}>
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: '12px' }}>{loggingOut ? 'Saindo...' : 'Sair'}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-3.5 bg-white flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', minHeight: '56px' }}>
          <button onClick={() => setMobileOpen(true)} className="lg:hidden" style={{ color: '#64748B' }}><Menu size={20} /></button>

          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)' }}>
              <Search size={14} style={{ color: '#94A3B8' }} />
              <input placeholder="Buscar unidades, clientes, módulos…" className="bg-transparent flex-1 outline-none" style={{ fontSize: '13px', color: '#64748B' }} />
              <span className="hidden md:block px-1.5 py-0.5 rounded" style={{ background: '#EFF2F7', color: '#94A3B8', fontSize: '10px', fontFamily: 'monospace' }}>⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-lg transition-colors" style={{ color: '#64748B' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors" style={{ color: '#64748B' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <HelpCircle size={18} />
            </button>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, fontSize: '11px', fontWeight: 700 }}>
                {(user?.name ?? 'Usuário').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>{user?.name ?? 'Usuário'}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{user?.email ?? ''}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: '#F8FAFC' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
