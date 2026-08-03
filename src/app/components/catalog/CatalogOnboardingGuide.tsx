import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight, BookOpenCheck, Boxes, Check, CheckCircle2, ClipboardList,
  HelpCircle, Layers3, PackagePlus, RotateCcw, Settings, ShoppingBag, Tags, Warehouse, X,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '../../../services/apiClient';
import { catalogOnboardingService } from '../../../services/catalogOnboardingService';
import type { CatalogOnboardingState, CatalogOnboardingStep } from '../../../types/catalogOnboarding';

const muted = '#64748B';
const dark = '#0F172A';
const border = '#E2E8F0';
const soft = '#F8FAFC';
const primary = '#4F46E5';

const iconWrap: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  background: '#EEF2FF',
  color: primary,
  flex: '0 0 auto',
};

const buttonBase: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: '9px 13px',
  fontSize: 13,
  fontWeight: 750,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  minHeight: 38,
};

interface CatalogOnboardingGuideProps {
  open: boolean;
  mode: 'invite' | 'wizard';
  state: CatalogOnboardingState;
  onClose: () => void;
  onStateChange: (state: CatalogOnboardingState) => void;
}

type StepContent = {
  title: string;
  text: string;
  actionLabel: string;
  secondaryLabel?: string;
  exampleTitle: string;
  exampleLines: string[];
  icon: React.ReactNode;
};

function completedCount(state: CatalogOnboardingState) {
  return state.steps.filter(step => step.completed).length;
}

function stepContent(step: CatalogOnboardingStep, state: CatalogOnboardingState): StepContent {
  const map: Record<string, StepContent> = {
    welcome: {
      title: 'Tudo comeca aqui',
      text: 'O Catalogo e a lista oficial da rede: Catalogo -> Estoque -> Producao -> Compras -> Financeiro.',
      actionLabel: 'Comecar guia',
      exampleTitle: 'Fluxo ideal',
      exampleLines: ['Catalogo define o item', 'Estoque controla onde ele esta', 'Producao usa os insumos', 'Compras e Financeiro reutilizam os dados'],
      icon: <BookOpenCheck size={19} />,
    },
    item_types: {
      title: 'Entenda qual tipo usar',
      text: 'Produto e produto acabado podem ser vendidos. Insumo, material, embalagem e semiacabado ajudam a controlar operacao.',
      actionLabel: 'Entendi os tipos',
      exampleTitle: 'Melten',
      exampleLines: ['Sorvete de morango: produto vendido', 'Leite e morango: insumos', 'Pote 500ml: embalagem', 'Treinamento: servico'],
      icon: <Layers3 size={19} />,
    },
    first_category: {
      title: 'Organize por grupos quando precisar',
      text: 'Use campos e nomenclaturas para facilitar filtro, busca e padronizacao da rede.',
      actionLabel: 'Abrir configuracoes',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Grupos simples',
      exampleLines: ['Produtos vendidos', 'Ingredientes', 'Embalagens', 'Servicos'],
      icon: <Tags size={19} />,
    },
    first_item: {
      title: 'Crie o primeiro item real',
      text: 'Comece com um item que a operacao realmente usa. O item nasce aqui e sera reaproveitado nos outros modulos.',
      actionLabel: 'Criar item',
      exampleTitle: 'Melten',
      exampleLines: ['Sorvete de Morango', 'SKU SOR-MOR-500', 'Unidade un', 'Preco de venda quando aplicavel'],
      icon: <PackagePlus size={19} />,
    },
    stock_control: {
      title: 'Marque quando o item deve aparecer no Estoque',
      text: 'Ao ativar o controle de estoque em um item estocavel, o perfil operacional e criado automaticamente no Estoque.',
      actionLabel: 'Criar item com estoque',
      exampleTitle: 'Quando marcar',
      exampleLines: ['Controla quantidade fisica', 'Tem unidade de medida', 'Pode entrar, sair ou ser consumido'],
      icon: <Warehouse size={19} />,
    },
    internal_supply: {
      title: 'Fluxo Melten: tudo nasce no Catalogo',
      text: 'Sorvete, morango, leite, acucar, embalagem e casquinha nascem no Catalogo; depois cada modulo usa o que precisa.',
      actionLabel: 'Criar insumo',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Sorvete de morango',
      exampleLines: ['Sorvete: produto vendido', 'Morango e leite: insumos', 'Acucar: material', 'Embalagem e casquinha: itens controlados'],
      icon: <Boxes size={19} />,
    },
    service_item: {
      title: 'Inclua servicos quando fizer parte do negocio',
      text: 'Servicos ficam no Catalogo, mas normalmente nao entram em saldo fisico.',
      actionLabel: 'Criar servico',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Exemplos',
      exampleLines: ['Treinamento de loja', 'Consultoria operacional', 'Procedimento agendado'],
      icon: <ShoppingBag size={19} />,
    },
    additional_fields: {
      title: 'Ajuste campos extras com cuidado',
      text: 'Campos extras devem ajudar a operacao a pesquisar e padronizar itens, sem duplicar dados que ja existem.',
      actionLabel: 'Abrir campos',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Bons campos',
      exampleLines: ['Categoria interna', 'Linha de produto', 'Sabor', 'Observacoes operacionais'],
      icon: <ClipboardList size={19} />,
    },
    governance: {
      title: 'Revise o que as unidades podem fazer',
      text: 'Defina se unidades podem sugerir itens, editar precos locais e quais mudancas exigem aprovacao.',
      actionLabel: 'Abrir governanca',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Decisoes comuns',
      exampleLines: ['Item local exige aprovacao', 'Preco local liberado', 'Categorias seguem padrao da rede'],
      icon: <Settings size={19} />,
    },
    inventory_integration: {
      title: 'Continue no Estoque quando houver item controlado',
      text: 'O Estoque usa o item do Catalogo como origem. Nele voce define unidades, locais, saldos e movimentos.',
      actionLabel: state.suggested_next_module?.label ?? 'Abrir Estoque',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Proximo modulo',
      exampleLines: ['Itens controlados', 'Itens por unidade', 'Saldos', 'Entradas e saidas'],
      icon: <Warehouse size={19} />,
    },
    finish: {
      title: 'Catalogo pronto para operar',
      text: 'Revise o checklist. Voce pode voltar a este guia sempre que precisar orientar outra pessoa da rede.',
      actionLabel: 'Concluir guia',
      secondaryLabel: 'Criar outro item',
      exampleTitle: 'Resumo',
      exampleLines: ['Tipos compreendidos', 'Primeiro item criado', 'Estoque conectado quando necessario'],
      icon: <CheckCircle2 size={19} />,
    },
    unit_welcome: {
      title: 'Veja os itens liberados para a unidade',
      text: 'A unidade consulta o Catalogo e trabalha com o que a rede liberou.',
      actionLabel: 'Comecar guia',
      exampleTitle: 'Uso da unidade',
      exampleLines: ['Buscar itens', 'Conferir preco', 'Sugerir item local se permitido'],
      icon: <BookOpenCheck size={19} />,
    },
  };

  return map[step.id] ?? {
    title: step.title,
    text: 'Siga para a tela indicada para continuar a configuracao do Catalogo.',
    actionLabel: 'Abrir etapa',
    exampleTitle: 'Proximo passo',
    exampleLines: [step.title],
    icon: <BookOpenCheck size={19} />,
  };
}

function nextVisibleStep(state: CatalogOnboardingState) {
  const current = state.steps.find(step => step.id === state.current_step);

  if (current && !current.completed && !current.skipped) {
    return current;
  }

  return state.steps.find(step => !step.completed && !step.skipped)
    ?? state.steps[state.steps.length - 1];
}

function CatalogGuideProgress({ state }: { state: CatalogOnboardingState }) {
  const completed = completedCount(state);
  const total = state.steps.length;

  return (
    <div aria-live="polite" data-testid="catalog-guide-progress">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: muted, fontSize: 12, fontWeight: 700 }}>
        <span>Configuracao do Catalogo - {state.progress.percent}%</span>
        <span>{completed} de {total} etapas concluidas</span>
      </div>
      <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ width: `${state.progress.percent}%`, height: '100%', background: primary, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function CatalogGuideExample({ content }: { content: StepContent }) {
  return (
    <div style={{ border: `1px solid ${border}`, background: soft, borderRadius: 8, padding: 14, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={iconWrap}>{content.icon}</span>
        <strong style={{ color: dark, fontSize: 14 }}>{content.exampleTitle}</strong>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {content.exampleLines.map((line, index) => (
          <div key={`${line}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: dark, fontSize: 13 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', background: '#FFFFFF', color: primary, border: `1px solid ${border}`, fontSize: 11, fontWeight: 800 }}>{index + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogGuideChecklist({ state }: { state: CatalogOnboardingState }) {
  return (
    <div style={{ display: 'grid', gap: 8 }} data-testid="catalog-guide-checklist">
      {state.steps.map(step => (
        <div key={step.id} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 9, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${border}` }}>
          <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 99, display: 'grid', placeItems: 'center', background: step.completed ? '#DCFCE7' : step.skipped ? '#FEF3C7' : '#F1F5F9', color: step.completed ? '#15803D' : step.skipped ? '#A16207' : muted }}>
            {step.completed ? <Check size={14} /> : step.skipped ? '-' : ''}
          </span>
          <span style={{ color: dark, fontSize: 13, fontWeight: 700 }}>{step.title}</span>
          <span style={{ color: step.completed ? '#15803D' : step.skipped ? '#A16207' : muted, fontSize: 11, fontWeight: 800 }}>
            {step.completed ? 'Concluido' : step.skipped ? 'Pulado' : step.optional ? 'Opcional' : 'Pendente'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CatalogOnboardingGuide({
  open,
  mode,
  state,
  onClose,
  onStateChange,
}: CatalogOnboardingGuideProps) {
  const navigate = useNavigate();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stepId, setStepId] = useState<string | null>(state.current_step);
  const [internalMode, setInternalMode] = useState(mode);
  const step = useMemo(() => state.steps.find(item => item.id === stepId) ?? nextVisibleStep(state), [state, stepId]);
  const stepIndex = Math.max(0, state.steps.findIndex(item => item.id === step?.id));
  const content = step ? stepContent(step, state) : null;

  useEffect(() => {
    if (open) {
      setInternalMode(mode);
      window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    }
  }, [open, mode]);

  useEffect(() => {
    if (open) {
      setStepId(nextVisibleStep(state)?.id ?? state.current_step);
    }
  }, [open, state.current_step]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const refresh = async () => {
    const next = await catalogOnboardingService.getProgress(state.context);
    onStateChange(next);
    setStepId(nextVisibleStep(next)?.id ?? next.current_step);
  };

  const update = async (payload: Parameters<typeof catalogOnboardingService.updateProgress>[0]) => {
    setSaving(true);
    setError('');
    try {
      const next = await catalogOnboardingService.updateProgress({ context: state.context, ...payload });
      onStateChange(next);
      setStepId(nextVisibleStep(next)?.id ?? next.current_step);
      return next;
    } catch (apiError) {
      const message = getApiErrorMessage(apiError, 'Nao foi possivel salvar o progresso.');
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const dismiss = async () => {
    setSaving(true);
    setError('');
    try {
      onStateChange(await catalogOnboardingService.dismiss(state.context));
      onClose();
    } catch (apiError) {
      const message = getApiErrorMessage(apiError, 'Nao foi possivel ocultar o guia.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    setError('');
    try {
      const next = await catalogOnboardingService.reset(state.context);
      onStateChange(next);
      setStepId(next.current_step);
    } catch (apiError) {
      const message = getApiErrorMessage(apiError, 'Nao foi possivel reiniciar o guia.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const goToPath = async (target: CatalogOnboardingStep) => {
    await update({ current_step: target.id });
    onClose();
    navigate(target.id === 'inventory_integration' && state.suggested_next_module?.path ? state.suggested_next_module.path : target.path);
  };

  const continueStep = async () => {
    if (!step) return;
    if (step.id === 'welcome' || step.id === 'item_types' || step.id === 'unit_welcome') {
      await update({ completed_step: step.id });
      return;
    }
    if (step.id === 'finish' || step.id === 'unit_finish') {
      const next = await update({ completed: true });
      if (next?.completed) {
        onClose();
        navigate(step.path);
      }
      return;
    }
    await goToPath(step);
  };

  const skipStep = async () => {
    if (!step) return;
    await update({ skipped_step: step.id });
  };

  const previous = () => {
    const previousStep = state.steps[Math.max(0, stepIndex - 1)];
    setStepId(previousStep?.id ?? step?.id ?? null);
  };

  const next = () => {
    const nextStep = state.steps[Math.min(state.steps.length - 1, stepIndex + 1)];
    setStepId(nextStep?.id ?? step?.id ?? null);
  };

  if (internalMode === 'invite') {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="catalog-onboarding-invite-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.40)', zIndex: 1100, display: 'grid', placeItems: 'center', padding: 18 }} data-testid="catalog-onboarding-invite">
        <div style={{ width: 'min(520px,100%)', background: '#fff', borderRadius: 8, border: `1px solid ${border}`, boxShadow: '0 24px 70px rgba(15,23,42,.22)', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={iconWrap}><BookOpenCheck size={19} /></span>
            <button ref={closeButtonRef} type="button" aria-label="Fechar convite" onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: muted }}><X size={18} /></button>
          </div>
          <h2 id="catalog-onboarding-invite-title" style={{ margin: '16px 0 6px', color: dark, fontSize: 22 }}>Vamos montar o Catalogo?</h2>
          <p style={{ margin: 0, color: muted, lineHeight: 1.55, fontSize: 14 }}>O Orchestra pode guiar voce pelos primeiros itens usando as telas reais do Catalogo. O Catalogo define o item; o Estoque controla onde ele esta.</p>
          {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
            <button type="button" disabled={saving} onClick={() => void update({ completed_step: 'welcome' }).then(next => { if (next) setInternalMode('wizard'); })} style={{ ...buttonBase, background: primary, color: '#fff' }} data-testid="catalog-onboarding-start">Comecar agora <ArrowRight size={15} /></button>
            <button type="button" onClick={onClose} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}` }}>Fazer depois</button>
            <button type="button" disabled={saving} onClick={() => void dismiss()} style={{ ...buttonBase, background: soft, color: muted }}>Nao mostrar novamente</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="catalog-onboarding-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 1100, display: 'grid', placeItems: 'center', padding: 14 }}>
      <div style={{ width: 'min(980px,100%)', maxHeight: '94vh', overflow: 'auto', background: '#fff', borderRadius: 8, border: `1px solid ${border}`, boxShadow: '0 24px 80px rgba(15,23,42,.25)' }} data-testid="catalog-onboarding-guide">
        <header style={{ padding: 18, borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <CatalogGuideProgress state={state} />
          </div>
          <button ref={closeButtonRef} type="button" aria-label="Fechar guia" onClick={async () => { if (step) await update({ current_step: step.id }); onClose(); }} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: muted }} data-testid="catalog-guide-close"><X size={18} /></button>
        </header>
        {content && step ? (
          <main style={{ padding: 18, display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(260px,.85fr)', gap: 18 }}>
            <section style={{ minWidth: 0 }}>
              <span style={{ color: muted, fontSize: 12, fontWeight: 800 }}>Etapa {stepIndex + 1} de {state.steps.length}</span>
              <h2 id="catalog-onboarding-title" style={{ margin: '8px 0', color: dark, fontSize: 24 }}>{content.title}</h2>
              <p style={{ margin: '0 0 8px', color: primary, fontSize: 13, fontWeight: 800 }}>Catalogo define o item. Estoque controla onde ele esta.</p>
              <p style={{ margin: '0 0 16px', color: muted, lineHeight: 1.58, fontSize: 14 }}>{content.text}</p>
              {step.completed && <p style={{ color: '#15803D', fontSize: 13, fontWeight: 800 }}>Esta etapa ja esta concluida pelos dados da sua rede.</p>}
              {step.skipped && <p style={{ color: '#A16207', fontSize: 13, fontWeight: 800 }}>Esta etapa foi pulada. Voce pode voltar nela quando quiser.</p>}
              {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
                <button type="button" disabled={saving} onClick={() => void continueStep()} style={{ ...buttonBase, background: primary, color: '#fff' }} data-testid="catalog-onboarding-primary-action">{content.actionLabel}<ArrowRight size={15} /></button>
                {(step.id === 'finish' || step.id === 'unit_finish') && <button type="button" onClick={() => { onClose(); navigate('/catalog/new'); }} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}` }}>{content.secondaryLabel}</button>}
                {step.optional && !['finish', 'unit_finish'].includes(step.id) && <button type="button" disabled={saving} onClick={() => void skipStep()} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}` }}>{content.secondaryLabel ?? 'Pular por enquanto'}</button>}
                <button type="button" disabled={saving} onClick={() => void refresh()} style={{ ...buttonBase, background: soft, color: muted }}>Atualizar progresso</button>
              </div>
            </section>
            <aside style={{ display: 'grid', gap: 12, minWidth: 0 }}>
              <CatalogGuideExample content={content} />
              {(step.id === 'finish' || state.progress.percent > 0) && <CatalogGuideChecklist state={state} />}
            </aside>
          </main>
        ) : (
          <main style={{ padding: 18 }}>
            <p style={{ color: muted }}>Nenhuma etapa disponivel para este usuario.</p>
          </main>
        )}
        <footer style={{ padding: 18, borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={previous} disabled={stepIndex === 0} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}`, opacity: stepIndex === 0 ? .55 : 1 }}>Voltar</button>
            <button type="button" onClick={next} disabled={stepIndex >= state.steps.length - 1} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}`, opacity: stepIndex >= state.steps.length - 1 ? .55 : 1 }}>Continuar</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={saving} onClick={() => void reset()} style={{ ...buttonBase, background: soft, color: muted }}><RotateCcw size={14} /> Reiniciar guia</button>
            <button type="button" disabled={saving} onClick={() => void dismiss()} style={{ ...buttonBase, background: soft, color: muted }}>Nao mostrar novamente</button>
          </div>
        </footer>
      </div>
      <style>{`
        @media (max-width: 760px) {
          [data-testid="catalog-onboarding-guide"] main {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export function CatalogGuideMiniCard({
  state,
  onOpen,
}: {
  state: CatalogOnboardingState;
  onOpen: () => void;
}) {
  if (state.completed || state.dismissed) return null;

  return (
    <div style={{ border: `1px solid ${border}`, background: '#fff', borderRadius: 8, padding: 14, marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} data-testid="catalog-onboarding-resume-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={iconWrap}><HelpCircle size={18} /></span>
        <div>
          <strong style={{ display: 'block', color: dark, fontSize: 14 }}>Guia do Catalogo</strong>
          <span style={{ color: muted, fontSize: 12 }}>{state.progress.percent}% concluido. Os dados ja criados contam automaticamente.</span>
        </div>
      </div>
      <button type="button" onClick={onOpen} style={{ ...buttonBase, background: primary, color: '#fff' }}>
        Continuar
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
