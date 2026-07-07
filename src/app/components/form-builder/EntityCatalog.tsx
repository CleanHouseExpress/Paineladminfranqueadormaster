import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ClipboardCheck, Edit, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { checklistManagementService } from '../../../services/checklistManagementService';
import type { ChecklistTemplate } from '../../../types/checklistManagement';

export function EntityCatalog() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    checklistManagementService.listTemplates({ per_page: 100 })
      .then(payload => { if (active) setTemplates(payload.data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Form Builder</h1>
          <p className="text-sm text-muted-foreground">Templates operacionais reais conectados ao Metadata Engine.</p>
        </div>
        <Button asChild><Link to="/settings/form-builder/new"><Plus className="size-4" />Novo template</Link></Button>
      </div>

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
