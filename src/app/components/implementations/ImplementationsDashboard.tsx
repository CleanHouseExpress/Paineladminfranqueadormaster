import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Filter, LayoutGrid, List, RefreshCw, Settings2 } from 'lucide-react';
import type { UnitImplementation } from '../../../types/implementation';
import { IMPLEMENTATION_STATUS_LABELS } from '../../../types/implementation';
import { implementationService } from '../../../services/implementationService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';

type ViewMode = 'table' | 'kanban' | 'timeline';

function statusClass(status: string) {
  if (status === 'completed') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  if (status === 'delayed') return 'border-destructive/30 bg-destructive/10 text-destructive';
  if (status === 'in_progress') return 'border-blue-500/30 bg-blue-500/10 text-blue-700';
  return 'border-muted bg-muted/40 text-muted-foreground';
}

function formatDate(date: string | null | undefined) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

function daysRemaining(date: string | null | undefined) {
  if (!date) return 0;
  const target = new Date(`${date}T12:00:00`);
  return Math.ceil((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function ImplementationsDashboard() {
  const [items, setItems] = useState<UnitImplementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [consultant, setConsultant] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await implementationService.listImplementations());
    } catch (loadError) {
      setError(implementationService.getErrorMessage(loadError, 'Nao foi possivel carregar as implantacoes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const consultants = useMemo(() => Array.from(new Set((items ?? []).map(item => item.consultant).filter(Boolean))), [items]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (items ?? []).filter(item => {
      const matchesTerm = !term
        || item.unitName.toLowerCase().includes(term)
        || item.city.toLowerCase().includes(term)
        || item.brand.toLowerCase().includes(term);
      const matchesStatus = !status || item.status === status;
      const matchesConsultant = !consultant || item.consultant === consultant;
      return matchesTerm && matchesStatus && matchesConsultant;
    });
  }, [consultant, items, search, status]);

  const total = filtered.length;
  const delayed = filtered.filter(item => item.status === 'delayed').length;
  const completed = filtered.filter(item => item.status === 'completed').length;
  const average = total === 0 ? 0 : Math.round(filtered.reduce((sum, item) => sum + item.progress, 0) / total);
  const upcoming = [...filtered]
    .filter(item => item.status !== 'completed')
    .sort((a, b) => a.expectedOpeningDate.localeCompare(b.expectedOpeningDate))
    .slice(0, 4);

  return (
    <div className="space-y-6" data-testid="implementations-dashboard">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Implantacoes</h1>
          <p className="text-sm text-muted-foreground">Visao consolidada do ciclo de abertura das unidades.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/implementations/templates">
              <Settings2 className="size-4" />
              Templates
            </Link>
          </Button>
          <Button type="button" variant="outline" onClick={() => void load()}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {loading ? <div className="rounded-md border p-6 text-sm text-muted-foreground">Carregando implantacoes</div> : null}

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ['Implantacoes ativas', total, Clock],
          ['Atrasadas', delayed, AlertTriangle],
          ['Concluidas', completed, CheckCircle2],
          ['Progresso medio', `${average}%`, CalendarDays],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-md border p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm">{label}</span>
              <Icon className="size-4" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-md border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4" />
          Proximas inauguracoes
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {upcoming.map(item => (
            <Link key={item.id} to={`/units/${item.unitId}?tab=implantacao`} className="rounded-md border p-3 transition hover:bg-muted/40">
              <div className="font-medium">{item.unitName}</div>
              <div className="text-sm text-muted-foreground">{formatDate(item.expectedOpeningDate)}</div>
              <div className="mt-2 text-xs text-muted-foreground">{Math.max(0, daysRemaining(item.expectedOpeningDate))} dia(s) restantes</div>
            </Link>
          ))}
          {upcoming.length === 0 ? <div className="text-sm text-muted-foreground">Nenhuma inauguracao pendente.</div> : null}
        </div>
      </section>

      <section className="grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr_160px_220px_auto]">
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por unidade, cidade ou marca"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">Todos status</option>
          <option value="in_progress">Em andamento</option>
          <option value="delayed">Atrasadas</option>
          <option value="completed">Concluidas</option>
          <option value="paused">Pausadas</option>
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={consultant} onChange={event => setConsultant(event.target.value)}>
          <option value="">Todos consultores</option>
          {consultants.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="flex gap-1">
          <Button type="button" data-testid="implementations-view-table" size="icon" variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')} title="Tabela"><List className="size-4" /></Button>
          <Button type="button" data-testid="implementations-view-kanban" size="icon" variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')} title="Kanban"><LayoutGrid className="size-4" /></Button>
          <Button type="button" data-testid="implementations-view-timeline" size="icon" variant={view === 'timeline' ? 'default' : 'outline'} onClick={() => setView('timeline')} title="Timeline"><CalendarDays className="size-4" /></Button>
        </div>
      </section>

      {!loading && filtered.length === 0 ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">Nenhuma implantacao encontrada.</div>
      ) : null}

      {!loading && filtered.length > 0 && view === 'table' ? (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Unidade</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Fase</th>
                <th className="p-3 font-medium">Consultor</th>
                <th className="p-3 font-medium">Inauguracao</th>
                <th className="p-3 font-medium">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const phase = (item.phases ?? []).find(phaseItem => phaseItem.id === item.currentPhaseId);
                return (
                  <tr key={item.id} className="border-t">
                    <td className="p-3"><Link className="font-medium hover:underline" to={`/units/${item.unitId}?tab=implantacao`}>{item.unitName}</Link><div className="text-xs text-muted-foreground">{item.city} / {item.state}</div></td>
                    <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(item.status)}`}>{IMPLEMENTATION_STATUS_LABELS[item.status]}</span></td>
                    <td className="p-3">{phase?.title ?? '-'}</td>
                    <td className="p-3">{item.consultant}</td>
                    <td className="p-3">{formatDate(item.expectedOpeningDate)}</td>
                    <td className="p-3"><Progress value={item.progress} /><span className="mt-1 block text-xs text-muted-foreground">{item.progress}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && filtered.length > 0 && view === 'kanban' ? (
        <div className="grid gap-3 md:grid-cols-3">
          {(['in_progress', 'delayed', 'completed'] as const).map(column => (
            <div key={column} className="rounded-md border p-3">
              <h3 className="mb-3 text-sm font-semibold">{IMPLEMENTATION_STATUS_LABELS[column]}</h3>
              <div className="space-y-2">
                {filtered.filter(item => item.status === column).map(item => (
                  <Link key={item.id} to={`/units/${item.unitId}?tab=implantacao`} className="block rounded-md border p-3 hover:bg-muted/40">
                    <div className="font-medium">{item.unitName}</div>
                    <div className="text-sm text-muted-foreground">{item.consultant}</div>
                    <Progress className="mt-2" value={item.progress} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 && view === 'timeline' ? (
        <div className="space-y-2 rounded-md border p-3">
          {filtered.map(item => (
            <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[220px_1fr_120px] md:items-center">
              <Link to={`/units/${item.unitId}?tab=implantacao`} className="font-medium hover:underline">{item.unitName}</Link>
              <div className="h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
              </div>
              <span className="text-sm text-muted-foreground">{formatDate(item.expectedOpeningDate)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
