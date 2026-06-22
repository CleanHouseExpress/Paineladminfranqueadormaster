import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle, Circle, ChevronDown, ChevronRight, Rocket, Map } from 'lucide-react';
import { useOnboarding } from '../../../shared/hooks/useOnboarding';
import { TourTriggerButton } from './ProductTour';
import { ONBOARDING_REALITY_CHANGED_EVENT } from '../../../services/onboardingService';

export function OnboardingChecklist() {
  const { state, checklistProgress, startTour } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new Event(ONBOARDING_REALITY_CHANGED_EVENT));
  }, []);

  // Hide checklist once everything is done
  const allDone = state.checklist.every(i => i.completed);

  if (allDone) return null;

  const completed = state.checklist.filter(i => i.completed).length;
  const total = state.checklist.length;

  return (
    <div className="bg-white rounded-xl overflow-hidden mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
            <Rocket size={18} style={{ color: '#6366F1' }} />
          </div>
          <div className="text-left">
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Checklist de implantação</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>{completed} de {total} etapas concluídas</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#F1F5F9" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#6366F1" strokeWidth="3"
                strokeDasharray={`${(checklistProgress / 100) * 94.25} 94.25`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center"
              style={{ fontSize: '10px', fontWeight: 700, color: '#6366F1' }}>
              {checklistProgress}%
            </span>
          </div>
          {collapsed ? <ChevronRight size={16} style={{ color: '#94A3B8' }} /> : <ChevronDown size={16} style={{ color: '#94A3B8' }} />}
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-5 pb-0" style={{ display: collapsed ? 'none' : undefined }}>
        <div className="w-full h-1.5 rounded-full" style={{ background: '#F1F5F9' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${checklistProgress}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="px-5 py-4">
          <div className="space-y-2">
            {state.checklist.map((item, i) => {
              const isTourItem = item.id === 'tour';
              return (
                <div key={item.id} className="flex items-center gap-3 group">
                  {item.completed ? (
                    <CheckCircle size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                  ) : (
                    <Circle size={18} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span style={{
                      fontSize: '13px',
                      color: item.completed ? '#94A3B8' : '#0F172A',
                      textDecoration: item.completed ? 'line-through' : 'none',
                      fontWeight: item.completed ? 400 : 500,
                    }}>
                      {item.label}
                    </span>
                    {!item.completed && (
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.description}</div>
                    )}
                  </div>
                  {!item.completed && (
                    isTourItem ? (
                      <button onClick={startTour}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-lg"
                        style={{ background: '#EEF2FF', color: '#6366F1', fontSize: '11px', fontWeight: 500 }}>
                        <Map size={11} /> Iniciar
                      </button>
                    ) : (
                      <Link to={item.path}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-lg"
                        style={{ background: '#EEF2FF', color: '#6366F1', fontSize: '11px', fontWeight: 500 }}>
                        Acessar <ChevronRight size={11} />
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <TourTriggerButton />
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              O checklist desaparece quando todas as etapas forem concluídas
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
