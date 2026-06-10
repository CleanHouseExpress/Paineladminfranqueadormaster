import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Map } from 'lucide-react';
import { useOnboarding } from '../../../shared/hooks/useOnboarding';
import { TOUR_STOPS } from '../../../types/onboarding';

interface Rect { top: number; left: number; width: number; height: number }

const PADDING = 8;

function getTargetRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function tooltipPosition(rect: Rect, position: 'top' | 'right' | 'bottom' | 'left') {
  const TW = 280;
  const TH = 140;
  const GAP = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (position) {
    case 'right':
      top = rect.top + rect.height / 2 - TH / 2;
      left = rect.left + rect.width + GAP;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - TH / 2;
      left = rect.left - TW - GAP;
      break;
    case 'bottom':
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - TW / 2;
      break;
    case 'top':
    default:
      top = rect.top - TH - GAP;
      left = rect.left + rect.width / 2 - TW / 2;
  }

  // Clamp to viewport
  top = Math.max(8, Math.min(top, vh - TH - 8));
  left = Math.max(8, Math.min(left, vw - TW - 8));
  return { top, left, width: TW };
}

export function ProductTour() {
  const { state, advanceTour, completeTour } = useOnboarding();
  const { tourActive, currentTourStop } = state;
  const [rect, setRect] = useState<Rect | null>(null);

  const stop = TOUR_STOPS[currentTourStop];
  const isLast = currentTourStop === TOUR_STOPS.length - 1;

  const refresh = useCallback(() => {
    if (!stop) return;
    setRect(getTargetRect(stop.target));
  }, [stop]);

  useEffect(() => {
    if (!tourActive) return;
    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
    };
  }, [tourActive, refresh]);

  if (!tourActive || !stop) return null;

  const tp = rect ? tooltipPosition(rect, stop.position) : null;

  return createPortal(
    <>
      {/* Dark overlay with spotlight cutout using SVG mask */}
      <svg
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9990, width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left} y={rect.top}
                width={rect.width} height={rect.height}
                rx={10} fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-mask)" />
        {/* Highlight border */}
        {rect && (
          <rect
            x={rect.left} y={rect.top}
            width={rect.width} height={rect.height}
            rx={10} fill="none"
            stroke="#6366F1" strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))' }}
          />
        )}
      </svg>

      {/* Tooltip card */}
      {tp && (
        <div
          className="fixed rounded-2xl shadow-2xl"
          style={{
            zIndex: 9991,
            top: tp.top,
            left: tp.left,
            width: tp.width,
            background: 'white',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {/* Step progress dots */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0">
            <div className="flex gap-1">
              {TOUR_STOPS.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{
                    width: i === currentTourStop ? '16px' : '5px',
                    height: '5px',
                    background: i <= currentTourStop ? '#6366F1' : '#E2E8F0',
                  }} />
              ))}
            </div>
            <button onClick={completeTour} className="p-1 rounded-md" style={{ color: '#CBD5E1' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CBD5E1'}>
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-3">
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {stop.title}
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6 }}>
              {stop.description}
            </p>
          </div>

          <div className="px-4 pb-3 flex items-center justify-between">
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              {currentTourStop + 1} de {TOUR_STOPS.length}
            </span>
            <div className="flex gap-2">
              {currentTourStop > 0 && (
                <button onClick={() => {/* back handled by context */}} className="p-1.5 rounded-lg"
                  style={{ background: '#F1F5F9', color: '#64748B' }}>
                  <ChevronLeft size={14} />
                </button>
              )}
              {isLast ? (
                <button onClick={completeTour}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '12px', fontWeight: 600 }}>
                  Concluir
                </button>
              ) : (
                <button onClick={advanceTour}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                  style={{ background: '#6366F1', fontSize: '12px', fontWeight: 600 }}>
                  Próximo <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No target found fallback — centered card */}
      {!rect && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9991 }}>
          <div className="rounded-2xl shadow-2xl p-6 max-w-sm w-full" style={{ background: 'white' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EEF2FF' }}>
                <Map size={18} style={{ color: '#6366F1' }} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{stop.title}</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '16px' }}>{stop.description}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={completeTour} style={{ fontSize: '12px', color: '#94A3B8', padding: '6px 12px' }}>Encerrar tour</button>
              {!isLast && (
                <button onClick={advanceTour} className="flex items-center gap-1 px-4 py-2 rounded-lg text-white"
                  style={{ background: '#6366F1', fontSize: '12px', fontWeight: 500 }}>
                  Próximo <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

// ─── Trigger button (for restarting tour) ─────────────────────────────────────

export function TourTriggerButton() {
  const { startTour } = useOnboarding();
  return (
    <button
      onClick={startTour}
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
      style={{ background: '#EEF2FF', color: '#6366F1', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(99,102,241,0.2)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#E0E7FF'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#EEF2FF'}
    >
      <Map size={14} /> Fazer tour
    </button>
  );
}
