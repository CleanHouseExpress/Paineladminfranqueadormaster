import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight, Boxes, Building2, Check, CheckCircle2, ClipboardCheck,
  ListChecks, MapPin, PackagePlus, RotateCcw, Settings, Warehouse, X,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '../../../services/apiClient';
import { inventoryOnboardingService } from '../../../services/inventoryOnboardingService';
import type { InventoryOnboardingState, InventoryOnboardingStep } from '../../../types/inventoryOnboarding';

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

interface InventoryNetworkOnboardingWizardProps {
  open: boolean;
  mode: 'invite' | 'wizard';
  state: InventoryOnboardingState;
  onClose: () => void;
  onStateChange: (state: InventoryOnboardingState) => void;
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

function completedCount(state: InventoryOnboardingState) {
  return state.steps.filter(step => step.completed).length;
}

function stepContent(step: InventoryOnboardingStep): StepContent {
  const map: Record<string, StepContent> = {
    welcome: {
      title: 'Vamos organizar o estoque da sua rede',
      text: 'Voce vai definir o que as unidades controlam e como o estoque sera atualizado.',
      actionLabel: 'Comecar configuracao',
      exampleTitle: 'Fluxo simples',
      exampleLines: ['Itens', 'Unidades', 'Locais', 'Saldos', 'Operacao'],
      icon: <Boxes size={19} />,
    },
    enable_inventory: {
      title: 'Ative o estoque para a rede',
      text: 'Quando o Estoque esta ativo, as unidades podem registrar entradas, saidas, producao e inventarios.',
      actionLabel: 'Abrir configuracoes',
      exampleTitle: 'O que muda',
      exampleLines: ['Telas de estoque liberadas', 'Movimentos oficiais', 'Saldos por unidade'],
      icon: <Settings size={19} />,
    },
    inventory_mode: {
      title: 'Escolha o nivel de uso',
      text: 'Comece simples e evolua quando a operacao precisar de mais controles.',
      actionLabel: 'Abrir configuracoes',
      secondaryLabel: 'Manter por enquanto',
      exampleTitle: 'Modos',
      exampleLines: ['Simples: entradas, saidas e saldos', 'Intermediario: locais e contagens', 'Avancado: integracoes e custos'],
      icon: <Settings size={19} />,
    },
    inventory_items: {
      title: 'Crie o primeiro item',
      text: 'Um item e algo que voce deseja controlar, como morango, leite ou embalagem.',
      actionLabel: 'Criar primeiro item',
      exampleTitle: 'Exemplos',
      exampleLines: ['Morango - kg', 'Leite - litro', 'Embalagem 1 litro - unidade'],
      icon: <PackagePlus size={19} />,
    },
    stock_locations: {
      title: 'Crie o primeiro local',
      text: 'Um local mostra onde os itens ficam guardados dentro da unidade.',
      actionLabel: 'Criar primeiro local',
      exampleTitle: 'Locais comuns',
      exampleLines: ['Estoque principal', 'Freezer', 'Cozinha', 'Deposito'],
      icon: <MapPin size={19} />,
    },
    unit_items: {
      title: 'Associe itens as unidades',
      text: 'A rede cria o item. Depois escolhe quais unidades podem utiliza-lo.',
      actionLabel: 'Configurar unidades',
      exampleTitle: 'Morango',
      exampleLines: ['Unidade Centro: habilitado', 'Unidade Norte: desabilitado'],
      icon: <Building2 size={19} />,
    },
    first_entry: {
      title: 'Registre o saldo inicial',
      text: 'Informe quanto existe hoje para comecar com o saldo correto.',
      actionLabel: 'Registrar saldo inicial',
      exampleTitle: 'Entrada inicial',
      exampleLines: ['Morango: 20 kg', 'Local: Estoque principal', 'O saldo inicial vira uma entrada'],
      icon: <Warehouse size={19} />,
    },
    balances: {
      title: 'Entenda seus saldos',
      text: 'Depois da entrada, o saldo mostra quanto existe por item, unidade e local.',
      actionLabel: 'Ver meus saldos',
      exampleTitle: 'Saldo demonstrativo',
      exampleLines: ['Em maos: 20 kg', 'Disponivel: 20 kg'],
      icon: <ClipboardCheck size={19} />,
    },
    recipes_intro: {
      title: 'Voce produz algo usando varios itens?',
      text: 'A ficha tecnica mostra quais itens sao usados para produzir ou executar uma rotina.',
      actionLabel: 'Criar ficha tecnica',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Sorvete de morango',
      exampleLines: ['Usa morango', 'Usa leite', 'Usa acucar e embalagem'],
      icon: <ListChecks size={19} />,
    },
    stock_counts: {
      title: 'Confira com inventario fisico',
      text: 'O inventario fisico compara o sistema com o que realmente existe.',
      actionLabel: 'Ver inventario fisico',
      secondaryLabel: 'Pular por enquanto',
      exampleTitle: 'Conferencia',
      exampleLines: ['Sistema: 20 kg', 'Encontrado: 19 kg', 'Diferenca: 1 kg'],
      icon: <ClipboardCheck size={19} />,
    },
    finish: {
      title: 'Seu estoque esta pronto para comecar',
      text: 'Revise o checklist e siga para o painel quando quiser operar.',
      actionLabel: 'Ir para o painel de Estoque',
      secondaryLabel: 'Configurar outro item',
      exampleTitle: 'Resumo',
      exampleLines: ['Cadastrar item', 'Movimentar', 'Consultar saldo', 'Contar e corrigir'],
      icon: <CheckCircle2 size={19} />,
    },
  };

  return map[step.id] ?? {
    title: step.title,
    text: 'Siga para a tela indicada para continuar a configuracao do estoque.',
    actionLabel: 'Abrir etapa',
    exampleTitle: 'Proximo passo',
    exampleLines: [step.title],
    icon: <Boxes size={19} />,
  };
}

function nextVisibleStep(state: InventoryOnboardingState) {
  return state.steps.find(step => step.id === state.current_step)
    ?? state.steps.find(step => !step.completed && !step.skipped)
    ?? state.steps[state.steps.length - 1];
}

function InventoryWizardProgress({ state }: { state: InventoryOnboardingState }) {
  const completed = completedCount(state);
  const total = state.steps.length;

  return (
    <div aria-live="polite">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: muted, fontSize: 12, fontWeight: 700 }}>
        <span>Configuracao do Estoque - {state.progress.percent}%</span>
        <span>{completed} de {total} etapas concluidas</span>
      </div>
      <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ width: `${state.progress.percent}%`, height: '100%', background: primary, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function InventoryWizardExample({ content }: { content: StepContent }) {
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

function InventoryWizardChecklist({ state }: { state: InventoryOnboardingState }) {
  return (
    <div style={{ display: 'grid', gap: 8 }} data-testid="inventory-onboarding-checklist">
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

export function InventoryNetworkOnboardingWizard({
  open,
  mode,
  state,
  onClose,
  onStateChange,
}: InventoryNetworkOnboardingWizardProps) {
  const navigate = useNavigate();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stepId, setStepId] = useState<string | null>(state.current_step);
  const [internalMode, setInternalMode] = useState(mode);
  const step = useMemo(() => state.steps.find(item => item.id === stepId) ?? nextVisibleStep(state), [state, stepId]);
  const stepIndex = Math.max(0, state.steps.findIndex(item => item.id === step?.id));
  const content = step ? stepContent(step) : null;

  useEffect(() => {
    if (open) {
      setInternalMode(mode);
      window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    }
  }, [open, mode]);

  useEffect(() => {
    if (open) {
      setStepId(state.current_step);
    }
  }, [open, state.current_step]);

  if (!open) return null;

  const refresh = async () => {
    onStateChange(await inventoryOnboardingService.getProgress('network'));
  };

  const update = async (payload: Parameters<typeof inventoryOnboardingService.updateProgress>[0]) => {
    setSaving(true);
    setError('');
    try {
      const next = await inventoryOnboardingService.updateProgress({ context: 'network', ...payload });
      onStateChange(next);
      setStepId(next.current_step);
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
      onStateChange(await inventoryOnboardingService.dismiss('network'));
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
      const next = await inventoryOnboardingService.reset('network');
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

  const goToPath = async (target: InventoryOnboardingStep) => {
    await update({ current_step: target.id });
    onClose();
    navigate(target.path);
  };

  const continueStep = async () => {
    if (!step) return;
    if (step.id === 'welcome') {
      await update({ completed_step: step.id });
      return;
    }
    if (step.id === 'finish') {
      const next = await update({ completed: true });
      if (next?.completed) {
        onClose();
        navigate('/inventory');
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
      <div role="dialog" aria-modal="true" aria-labelledby="inventory-onboarding-invite-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.40)', zIndex: 1100, display: 'grid', placeItems: 'center', padding: 18 }}>
        <div style={{ width: 'min(520px,100%)', background: '#fff', borderRadius: 8, border: `1px solid ${border}`, boxShadow: '0 24px 70px rgba(15,23,42,.22)', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={iconWrap}><Boxes size={19} /></span>
            <button ref={closeButtonRef} type="button" aria-label="Fechar convite" onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: muted }}><X size={18} /></button>
          </div>
          <h2 id="inventory-onboarding-invite-title" style={{ margin: '16px 0 6px', color: dark, fontSize: 22 }}>Vamos preparar o estoque da sua rede?</h2>
          <p style={{ margin: 0, color: muted, lineHeight: 1.55, fontSize: 14 }}>O Orchestra pode guiar voce pelos primeiros passos usando as telas que ja existem.</p>
          {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
            <button type="button" disabled={saving} onClick={() => void update({ completed_step: 'welcome' }).then(next => { if (next) setInternalMode('wizard'); })} style={{ ...buttonBase, background: primary, color: '#fff' }} data-testid="inventory-onboarding-start">Comecar agora <ArrowRight size={15} /></button>
            <button type="button" onClick={onClose} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}` }}>Fazer depois</button>
            <button type="button" disabled={saving} onClick={() => void dismiss()} style={{ ...buttonBase, background: soft, color: muted }}>Nao mostrar novamente</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="inventory-onboarding-title" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 1100, display: 'grid', placeItems: 'center', padding: 14 }}>
      <div style={{ width: 'min(980px,100%)', maxHeight: '94vh', overflow: 'auto', background: '#fff', borderRadius: 8, border: `1px solid ${border}`, boxShadow: '0 24px 80px rgba(15,23,42,.25)' }} data-testid="inventory-network-onboarding-wizard">
        <header style={{ padding: 18, borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <InventoryWizardProgress state={state} />
          </div>
          <button ref={closeButtonRef} type="button" aria-label="Fechar guia" onClick={async () => { if (step) await update({ current_step: step.id }); onClose(); }} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: muted }}><X size={18} /></button>
        </header>
        {content && step ? (
          <main style={{ padding: 18, display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(260px,.85fr)', gap: 18 }}>
            <section style={{ minWidth: 0 }}>
              <span style={{ color: muted, fontSize: 12, fontWeight: 800 }}>Etapa {stepIndex + 1} de {state.steps.length}</span>
              <h2 id="inventory-onboarding-title" style={{ margin: '8px 0', color: dark, fontSize: 24 }}>{content.title}</h2>
              <p style={{ margin: '0 0 16px', color: muted, lineHeight: 1.58, fontSize: 14 }}>{content.text}</p>
              {step.completed && <p style={{ color: '#15803D', fontSize: 13, fontWeight: 800 }}>Esta etapa ja esta concluida pelos dados da sua rede.</p>}
              {step.skipped && <p style={{ color: '#A16207', fontSize: 13, fontWeight: 800 }}>Esta etapa foi pulada. Voce pode voltar nela quando quiser.</p>}
              {state.steps.length === 1 && step.id === 'enable_inventory' && (
                <p style={{ color: muted, fontSize: 13, lineHeight: 1.55 }}>Se voce nao puder alterar essa configuracao, ela e controlada pela administracao da rede.</p>
              )}
              {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 13 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
                <button type="button" disabled={saving} onClick={() => void continueStep()} style={{ ...buttonBase, background: primary, color: '#fff' }} data-testid="inventory-onboarding-primary-action">{content.actionLabel}<ArrowRight size={15} /></button>
                {step.id === 'finish' && <button type="button" onClick={() => { onClose(); navigate('/inventory/items/new'); }} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}` }}>{content.secondaryLabel}</button>}
                {step.optional && step.id !== 'finish' && <button type="button" disabled={saving} onClick={() => void skipStep()} style={{ ...buttonBase, background: '#fff', color: muted, border: `1px solid ${border}` }}>{content.secondaryLabel ?? 'Pular por enquanto'}</button>}
                <button type="button" disabled={saving} onClick={() => void refresh()} style={{ ...buttonBase, background: soft, color: muted }}>Atualizar progresso</button>
              </div>
            </section>
            <aside style={{ display: 'grid', gap: 12, minWidth: 0 }}>
              <InventoryWizardExample content={content} />
              {step.id === 'finish' && <InventoryWizardChecklist state={state} />}
            </aside>
          </main>
        ) : (
          <main style={{ padding: 18 }}><p style={{ color: muted }}>Nenhuma etapa disponivel para este usuario.</p></main>
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
          [data-testid="inventory-network-onboarding-wizard"] main {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
