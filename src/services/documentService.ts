/**
 * Mock document service — localStorage-backed async interface shaped after
 * the real API so the implementation can be swapped without changing callers.
 *
 * Real API contracts:
 *   GET    /api/company/documents                    → Document[]
 *   GET    /api/company/documents/:id                → Document
 *   POST   /api/company/documents                    → Document
 *   PUT    /api/company/documents/:id                → Document
 *   DELETE /api/company/documents/:id                → void
 *   POST   /api/company/documents/:id/archive        → Document
 *   GET    /api/company/documents/categories         → DocumentCategory[]
 *   POST   /api/company/documents/categories         → DocumentCategory
 *   PUT    /api/company/documents/categories/:id     → DocumentCategory
 *   DELETE /api/company/documents/categories/:id     → void
 *   GET    /api/company/documents/stats              → DocumentStats
 */

import type {
  Document,
  DocumentCategory,
  DocumentStats,
  DocumentStatus,
  DocumentVisibility,
  DocumentFileType,
} from '../types/document';
import {
  mockDocuments,
  mockDocumentCategories,
  mockDocumentStats,
} from '../app/data/documentMockData';

const STORAGE_KEY = 'orchestra_documents_v1';
const delay = (ms = 80) => new Promise<void>(r => setTimeout(r, ms));

// ─── Storage shape ─────────────────────────────────────────────────────────────

interface StorageShape {
  documents: Document[];
  categories: DocumentCategory[];
}

function load(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StorageShape>;
      return {
        documents: parsed.documents ?? [...mockDocuments],
        categories: parsed.categories ?? [...mockDocumentCategories],
      };
    }
  } catch {
    // fall through
  }
  return {
    documents: [...mockDocuments],
    categories: [...mockDocumentCategories],
  };
}

function save(state: StorageShape): StorageShape {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Documents ─────────────────────────────────────────────────────────────────

export interface DocumentFilters {
  status?: DocumentStatus;
  categoryId?: string;
  visibility?: DocumentVisibility;
  fileType?: DocumentFileType;
  search?: string;
}

/** GET /api/company/documents */
export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  await delay();
  let { documents } = load();

  if (filters?.status) {
    documents = documents.filter(d => d.status === filters.status);
  }
  if (filters?.categoryId) {
    documents = documents.filter(d => d.categoryId === filters.categoryId);
  }
  if (filters?.visibility) {
    documents = documents.filter(d => d.visibility === filters.visibility);
  }
  if (filters?.fileType) {
    documents = documents.filter(d => d.fileType === filters.fileType);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    documents = documents.filter(
      d =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.tags?.some(tag => tag.toLowerCase().includes(q)),
    );
  }

  return documents;
}

/** GET /api/company/documents/:id */
export async function getDocument(id: string): Promise<Document | null> {
  await delay();
  const { documents } = load();
  return documents.find(d => d.id === id) ?? null;
}

/** POST /api/company/documents */
export async function createDocument(
  data: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>,
): Promise<Document> {
  await delay();
  const state = load();
  const now = new Date().toISOString();
  const document: Document = {
    ...data,
    id: generateId('doc'),
    downloadCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  // increment category documentCount
  const categories = state.categories.map(cat =>
    cat.id === data.categoryId
      ? { ...cat, documentCount: cat.documentCount + 1, updatedAt: now }
      : cat,
  );

  save({ ...state, documents: [...state.documents, document], categories });
  return document;
}

/** PUT /api/company/documents/:id */
export async function updateDocument(
  id: string,
  data: Partial<Omit<Document, 'id' | 'createdAt' | 'createdBy' | 'createdByAvatar'>>,
): Promise<Document> {
  await delay();
  const state = load();
  const index = state.documents.findIndex(d => d.id === id);
  if (index === -1) throw new Error(`Document ${id} not found`);

  const updated: Document = {
    ...state.documents[index],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  const documents = [...state.documents];
  documents[index] = updated;
  save({ ...state, documents });
  return updated;
}

/** DELETE /api/company/documents/:id */
export async function deleteDocument(id: string): Promise<void> {
  await delay();
  const state = load();
  const doc = state.documents.find(d => d.id === id);
  if (!doc) throw new Error(`Document ${id} not found`);

  const now = new Date().toISOString();
  const categories = state.categories.map(cat =>
    cat.id === doc.categoryId && cat.documentCount > 0
      ? { ...cat, documentCount: cat.documentCount - 1, updatedAt: now }
      : cat,
  );

  save({
    ...state,
    documents: state.documents.filter(d => d.id !== id),
    categories,
  });
}

/** POST /api/company/documents/:id/archive */
export async function archiveDocument(id: string): Promise<Document> {
  await delay();
  const state = load();
  const index = state.documents.findIndex(d => d.id === id);
  if (index === -1) throw new Error(`Document ${id} not found`);

  const updated: Document = {
    ...state.documents[index],
    status: 'arquivado',
    updatedAt: new Date().toISOString(),
  };

  const documents = [...state.documents];
  documents[index] = updated;
  save({ ...state, documents });
  return updated;
}

// ─── Categories ────────────────────────────────────────────────────────────────

/** GET /api/company/documents/categories */
export async function getCategories(): Promise<DocumentCategory[]> {
  await delay();
  const { categories } = load();
  return categories;
}

/** POST /api/company/documents/categories */
export async function createCategory(
  data: Omit<DocumentCategory, 'id' | 'documentCount' | 'createdAt' | 'updatedAt'>,
): Promise<DocumentCategory> {
  await delay();
  const state = load();
  const now = new Date().toISOString();
  const category: DocumentCategory = {
    ...data,
    id: generateId('cat'),
    documentCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  save({ ...state, categories: [...state.categories, category] });
  return category;
}

/** PUT /api/company/documents/categories/:id */
export async function updateCategory(
  id: string,
  data: Partial<Omit<DocumentCategory, 'id' | 'createdAt' | 'documentCount'>>,
): Promise<DocumentCategory> {
  await delay();
  const state = load();
  const index = state.categories.findIndex(c => c.id === id);
  if (index === -1) throw new Error(`Category ${id} not found`);

  const updated: DocumentCategory = {
    ...state.categories[index],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  const categories = [...state.categories];
  categories[index] = updated;
  save({ ...state, categories });
  return updated;
}

/** DELETE /api/company/documents/categories/:id */
export async function deleteCategory(id: string): Promise<void> {
  await delay();
  const state = load();
  const hasDocuments = state.documents.some(d => d.categoryId === id);
  if (hasDocuments) {
    throw new Error(`Category ${id} has documents and cannot be deleted`);
  }
  save({ ...state, categories: state.categories.filter(c => c.id !== id) });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

/** GET /api/company/documents/stats */
export async function getStats(): Promise<DocumentStats> {
  await delay();
  const { documents, categories } = load();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const active = documents.filter(d => d.status === 'ativo').length;

  // Sum downloadCounts for documents updated in the last 30 days as a proxy
  // for recent activity (in production this would come from a download log).
  const downloadsLast30Days = documents
    .filter(d => new Date(d.updatedAt) >= thirtyDaysAgo)
    .reduce((sum, d) => sum + d.downloadCount, 0) || mockDocumentStats.downloadsLast30Days;

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const topCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    count: documents.filter(d => d.categoryId === cat.id).length,
    color: cat.color,
  }));

  return {
    total: documents.length,
    active,
    categories: categories.length,
    downloadsLast30Days,
    recentDocuments,
    topCategories,
  };
}
