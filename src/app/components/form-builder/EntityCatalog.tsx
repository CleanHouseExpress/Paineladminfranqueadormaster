import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ClipboardCheck, Edit, Library, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { checklistManagementService } from '../../../services/checklistManagementService';
import type { ChecklistTemplate, ChecklistTemplateLibraryItem } from '../../../types/checklistManagement';

export function EntityCatalog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [library, setLibrary] = useState<ChecklistTemplateLibraryItem[]>([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    checklistManagementService.listTemplates({ per_page: 100 })
      .then(payload => { if (active) setTemplates(payload.data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLibraryLoading(true);
    checklistManagementService.listTemplateLibrary(category ? { category } : {})
      .then(payload => { if (active) setLibrary(payload.data); })
      .finally(() => { if (active) setLibraryLoading(false); });
    return () => { active = false; };
  }, [category]);

  const categories = Array.from(new Set(library.map(item => item.category))).sort();

  async function importTemplate(item: ChecklistTemplateLibraryItem) {
    setImportingId(item.id);
    try {
      const template = await checklistManagementService.importTemplateLibraryItem(item.id);
      navigate(`/settings/form-builder/${template.id}`);
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Form Builder</h1>
          <p className="text-sm text-muted-foreground">Templates operacionais reais conectados ao Metadata Engine.</p>
        </div>
        <Button asChild><Link to="/settings/form-builder/new"><Plus className="size-4" />Novo template</Link></Button>
      </div>

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Biblioteca de templates</h2>
            <p className="text-sm text-muted-foreground">Modelos oficiais importados como rascunhos editaveis.</p>
          </div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filtrar categoria da biblioteca"
          >
            <option value="">Todas as categorias</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Template oficial</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Campos</th>
                <th className="p-3">Automacoes</th>
                <th className="p-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {libraryLoading ? (
                <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}><RefreshCw className="mx-auto mb-2 size-5 animate-spin" />Carregando biblioteca...</td></tr>
              ) : library.length === 0 ? (
                <tr><td className="p-8 text-center text-muted-foreground" colSpan={5}><Library className="mx-auto mb-2 size-8 opacity-50" />Nenhum template oficial encontrado.</td></tr>
              ) : library.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">{item.fields_count}</td>
                  <td className="p-3">{item.automations_count}</td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => importTemplate(item)} disabled={importingId === item.id}>
                        {importingId === item.id ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Usar template
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Template</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}><RefreshCw className="mx-auto mb-2 size-5 animate-spin" />Carregando templates...</td></tr>
            ) : templates.length === 0 ? (
              <tr><td className="p-8 text-center text-muted-foreground" colSpan={4}><ClipboardCheck className="mx-auto mb-2 size-8 opacity-50" />Nenhum template configurado.</td></tr>
            ) : templates.map(template => (
              <tr key={template.id} className="border-t">
                <td className="p-3 font-medium">{template.name}</td>
                <td className="p-3">{template.category ?? '-'}</td>
                <td className="p-3">{template.status ?? (template.active ? 'active' : 'inactive')}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline"><Link to={`/settings/form-builder/${template.id}`}><Edit className="size-4" />Editar</Link></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
