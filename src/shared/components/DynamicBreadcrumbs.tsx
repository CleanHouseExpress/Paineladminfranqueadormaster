import { Link, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { resolveBreadcrumb } from '../../services/moduleRegistry';

export function DynamicBreadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = resolveBreadcrumb(pathname);

  if (crumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: '#94A3B8' }}>
      <span>Orchestra</span>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight size={12} />
          {i < crumbs.length - 1 ? (
            <Link to={crumb.path} className="hover:text-indigo-400 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span style={{ color: '#64748B' }}>{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
