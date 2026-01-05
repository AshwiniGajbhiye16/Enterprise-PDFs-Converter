
export interface TableData {
  id: string;
  headers: string[];
  rows: string[][];
  summary: string;
  pageNumber: number;
}

export interface SectionData {
  id: string;
  title: string;
  content: string;
  pageNumber: number;
  chapter?: string;
}

export interface ImageData {
  id: string;
  description: string;
  pageNumber: number;
  type: 'image' | 'chart';
}

export interface DocumentMetadata {
  title: string;
  summary: string;
  briefSummary: string; // New field for concise previews
  author?: string;
  date?: string;
  category?: string;
  keyPoints: string[];
}

export interface DocumentKnowledge {
  id: string;
  fileName: string;
  fileSize: number;
  metadata: DocumentMetadata;
  sections: SectionData[];
  tables: TableData[];
  images: ImageData[];
  toc: string[];
  processedAt: string;
}

export interface SearchResult {
  docId: string;
  fileName: string;
  type: 'section' | 'table' | 'image';
  title: string;
  snippet: string;
  score: number;
  pageNumber: number;
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  results: SearchResult[];
  timestamp: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SEARCHING = 'SEARCHING',
  VIEWING_DOC = 'VIEWING_DOC'
}
