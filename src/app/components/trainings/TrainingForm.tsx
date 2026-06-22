import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CheckCircle, ChevronRight, Clock, FileText, GraduationCap, Lock, Save, Users, X } from 'lucide-react';

import { TRAINING_CATEGORY_CONFIG, TRAINING_STATUS_CONFIG } from '../../../types/training';
import type { TrainingCategory, TrainingDocument, TrainingStatus } from '../../../types/training';
import {
  createTraining,
  getDocumentOptions,
  getTraining,
  updateTraining,
} from '../../../services/trainingService';
import type { ApiOption } from '../../../services/trainingService';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }}>
        <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
        {label}{required ? <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span> : null}
      </label>
      {children}
      {hint ? <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94A3B8' }}>{hint}</p> : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(0,0,0,0.12)',
  fontSize: '13px',
  color: '#0F172A',
  background: '#F8FAFC',
  outline: 'none',
  boxSizing: 'border-box',
};

function formatDurationHint(minutes: number) {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function docType(name: string): TrainingDocument['fileType'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pptx')) return 'pptx';
  if (lower.endsWith('.mp4')) return 'mp4';
  if (lower.endsWith('.docx')) return 'docx';
  return 'pdf';
}

export function TrainingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TrainingCategory>('operacional');
  const [status, setStatus] = useState<TrainingStatus>('draft');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mandatory, setMandatory] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [documents, setDocuments] = useState<ApiOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const documentOptions = await getDocumentOptions();
      setDocuments(documentOptions);

      if (id) {
        const training = await getTraining(id);
        if (training) {
          setTitle(training.title);
          setDescription(training.description ?? '');
          setCategory(training.category);
          setStatus(training.status);
          setDurationMinutes(training.durationMinutes || 60);
          setMandatory(training.mandatory);
          setDocumentId(training.documentId ?? '');
        }
      }
    }

    void load();
  }, [id]);

  const selectedDocument = useMemo(() => documents.find(option => String(option.value) === documentId), [documents, documentId]);
  const categoryConfig = TRAINING_CATEGORY_CONFIG[category];

  async function handleSave(nextStatus?: TrainingStatus) {
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        status: nextStatus ?? status,
        durationMinutes,
        mandatory,
        documentId,
      };

      if (id) {
        await updateTraining(id, payload);
      } else {
        await createTraining(payload);
      }

      navigate('/trainings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          <Link to="/trainings" style={{ color: '#6366F1', fontWeight: 600, textDecoration: 'none' }}>Treinamentos</Link>
          <ChevronRight size={12} />
          <span style={{ color: '#64748B' }}>{isEdit ? 'Editar Treinamento' : 'Novo Treinamento'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{isEdit ? 'Editar Treinamento' : 'Novo Treinamento'}</h1>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>Configure conteudo, obrigatoriedade e material de apoio.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/trainings')} style={headerButton('#64748B', 'transparent', '1px solid rgba(0,0,0,0.12)')}><X size={14} /> Cancelar</button>
            <button disabled={saving} onClick={() => void handleSave('draft')} style={headerButton('#6366F1', 'transparent', '1px solid rgba(99,102,241,0.3)')}><Save size={14} /> Salvar Rascunho</button>
            <button disabled={saving} onClick={() => void handleSave('published')} style={headerButton('#fff', 'linear-gradient(135deg, #6366F1, #8B5CF6)', 'none')}><CheckCircle size={14} /> Publicar Treinamento</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '16px', alignItems: 'start' }}>
        <div>
          <SectionCard title="Informacoes Basicas">
            <FormField label="Titulo" required>
              <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Nome do treinamento..." style={{ ...inputStyle, fontSize: '15px', fontWeight: 600 }} />
            </FormField>
            <FormField label="Descricao">
              <textarea value={description} onChange={event => setDescription(event.target.value)} rows={4} placeholder="Descreva o conteudo e objetivos deste treinamento..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </FormField>
            <FormField label="Categoria">
              <select value={category} onChange={event => setCategory(event.target.value as TrainingCategory)} style={inputStyle}>
                {(Object.keys(TRAINING_CATEGORY_CONFIG) as TrainingCategory[]).map(key => <option key={key} value={key}>{TRAINING_CATEGORY_CONFIG[key].label}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select value={status} onChange={event => setStatus(event.target.value as TrainingStatus)} style={inputStyle}>
                {(Object.keys(TRAINING_STATUS_CONFIG) as TrainingStatus[]).map(key => <option key={key} value={key}>{TRAINING_STATUS_CONFIG[key].label}</option>)}
              </select>
            </FormField>
          </SectionCard>

          <SectionCard title="Configuracoes">
            <FormField label="Duracao">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" min={1} max={9999} value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))} style={{ ...inputStyle, maxWidth: '160px' }} />
                <span style={{ fontSize: '13px', color: '#64748B' }}>minutos</span>
              </div>
              {durationMinutes > 0 ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '5px 12px', background: '#F1F5F9', borderRadius: '8px', fontSize: '12px', color: '#64748B' }}><Clock size={12} /> Duracao: <strong style={{ color: '#0F172A' }}>{formatDurationHint(durationMinutes)}</strong></div> : null}
            </FormField>

            <FormField label="Obrigatorio">
              <button type="button" onClick={() => setMandatory(value => !value)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: mandatory ? '#10B981' : '#E2E8F0', border: 'none', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '3px', left: mandatory ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </button>
              <span style={{ marginLeft: '12px', fontSize: '13px', color: mandatory ? '#065F46' : '#64748B', fontWeight: mandatory ? 600 : 400 }}>{mandatory ? 'Obrigatorio para atribuicoes' : 'Treinamento opcional'}</span>
              {mandatory ? <div style={{ marginTop: '10px', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>Este treinamento sera destacado como obrigatorio para usuarios atribuidos.</div> : null}
            </FormField>
          </SectionCard>

          <SectionCard title="Material de Apoio">
            <FormField label="Documento vinculado">
              <select value={documentId} onChange={event => setDocumentId(event.target.value)} style={inputStyle}>
                <option value="">Nenhum material vinculado</option>
                {documents.map(option => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
              </select>
            </FormField>
            {selectedDocument ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: docType(String(selectedDocument.label)) === 'pptx' ? '#D97706' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: 800 }}>{docType(String(selectedDocument.label)).toUpperCase()}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{selectedDocument.label}</div>
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Atribuicoes">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 12px', textAlign: 'center' }}>
              <Users size={28} color="#CBD5E1" />
              <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>Atribuicoes sao gerenciadas na tela de detalhe.</p>
              {isEdit && id ? <Link to={`/trainings/${id}`} style={{ marginTop: '8px', color: '#6366F1', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Gerenciar Atribuicoes</Link> : null}
            </div>
          </SectionCard>

          <SectionCard title="Futuras Funcionalidades">
            {['Player de Video', 'Quiz Interativo', 'Certificado', 'Trilhas de Aprendizado', 'Notificacoes automaticas', 'Portal Franqueado'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}><Lock size={13} /> {item}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>Em breve</span>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function headerButton(color: string, background: string, border: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    border,
    background,
    fontSize: '13px',
    fontWeight: 600,
    color,
    cursor: 'pointer',
  };
}
