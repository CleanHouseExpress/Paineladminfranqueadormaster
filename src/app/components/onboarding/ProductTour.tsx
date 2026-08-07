import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Map } from 'lucide-react';
import { useOnboarding } from '../../../shared/hooks/useOnboarding';
import { TOUR_STOPS } from '../../../types/onboarding';

interface Rect { top: number; left: number; width: number; height: number }

const PADDING = 12;
const MIN_TOOLTIP_WIDTH = 280;
const MAX_TOOLTIP_WIDTH = 360;

function getTargetRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const element = el as HTMLElement;
  element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
  const r = element.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

function chooseTooltipPosition(rect: Rect, preferred: 'top' | 'right' | 'bottom' | 'left') {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const TW = Math.min(MAX_TOOLTIP_WIDTH, Math.max(MIN_TOOLTIP_WIDTH, vw - 40));
  const TH = 190;
  const GAP = 20;

  const attempts: Array<'top' | 'right' | 'bottom' | 'left'> =
    preferred === 'top' ? ['top', 'right', 'bottom', 'left'] :
    preferred === 'bottom' ? ['bottom', 'right', 'top', 'left'] :
    preferred === 'left' ? ['left', 'top', 'bottom', 'right'] :
    ['right', 'top', 'bottom', 'left'];

  for (const position of attempts) {
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

    const fitsVertically = top >= 8 && top + TH + 8 <= vh;
    const fitsHorizontally = left >= 8 && left + TW + 8 <= vw;
    if (fitsVertically && fitsHorizontally) {
      return { top, left, width: TW };
    }
  }

  const top = Math.max(8, Math.min(rect.top + rect.height + GAP, vh - TH - 8));
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - TW / 2, vw - TW - 8));
  return { top, left, width: TW };
}

export function ProductTour() {
  const { state, advanceTour, previousTour, completeTour } = useOnboarding();
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

  const tp = rect ? chooseTooltipPosition(rect, stop.position) : null;

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
          className="fixed rounded-[28px] shadow-[0_16px_48px_rgba(15,23,42,0.18)]"
          style={{
            zIndex: 9991,
            top: tp.top,
            left: tp.left,
            width: tp.width,
            maxWidth: MAX_TOOLTIP_WIDTH,
            background: 'rgba(255,255,255,0.98)',
            border: '1px solid rgba(148,163,184,0.18)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="rounded-t-[28px] px-4 py-3" style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Tour pela plataforma
                </div>
                <div style={{ fontSize: '12px', color: '#0F172A', marginTop: '2px' }}>
                  Etapa {currentTourStop + 1} de {TOUR_STOPS.length}
                </div>
              </div>
              <button onClick={completeTour} className="p-2 rounded-full" style={{ color: '#475569' }}>
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 h-2 w-full rounded-full" style={{ background: '#E2E8F0' }}>
              <div className="h-full rounded-full" style={{ width: `${((currentTourStop + 1) / TOUR_STOPS.length) * 100}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
            </div>
          </div>
          {/* Step content */}
          <div className="px-4 py-4">
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              {stop.title}
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.75, marginBottom: '14px' }}>
              {stop.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1" style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 700 }}>
                {stop.target}
              </span>
              <span className="rounded-full px-3 py-1" style={{ background: '#EEF2FF', color: '#334155', fontSize: '11px' }}>
                {isLast ? 'Último passo' : 'Avançar para próximo tópico'}
              </span>
            </div>
          </div>

          <div className="px-4 pb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={previousTour}
              disabled={currentTourStop === 0}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: currentTourStop === 0 ? '#F1F5F9' : '#F8FAFC',
                color: currentTourStop === 0 ? '#94A3B8' : '#0F172A',
                border: currentTourStop === 0 ? '1px solid rgba(226,232,240,0.8)' : '1px solid rgba(148,163,184,0.3)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <ChevronLeft size={14} /> Voltar
            </button>
            {isLast ? (
              <button onClick={completeTour}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontSize: '12px', fontWeight: 700 }}>
                Concluir tour
              </button>
            ) : (
              <button onClick={advanceTour}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white"
                style={{ background: '#4338CA', fontSize: '12px', fontWeight: 700 }}>
                Próximo <ChevronRight size={14} />
              </button>
            )}
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
