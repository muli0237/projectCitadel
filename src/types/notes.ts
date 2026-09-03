export type NoteCategory = 'DEVOPS' | 'CYBERSEC' | 'DATASCIENCE' | 'SOFTWARE_DEV' | 'GENERAL';

export type BlockType = 
  | 'TEXT_MARKDOWN' 
  | 'CODE_EXECUTABLE' 
  | 'CHECKLIST' 
  | 'CALLOUT_ALERT' 
  | 'DATAFRAME_SNAPSHOT';

export type LanguageEngine = 'python' | 'bash' | 'rust' | 'sql' | 'yaml';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface CodeExecutionOutput {
  execution_id: string;
  execution_time_ms: number;
  stdout?: string;
  stderr?: string;
  payload_type: 'TEXT' | 'DATAFRAME' | 'JSON' | 'SVG';
}

export interface NoteBlock {
  block_id: string;
  block_type: BlockType;
  content: string;
  language?: LanguageEngine;
  checklist_items?: ChecklistItem[];
  last_output?: CodeExecutionOutput;
  metadata?: {
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    collapsed?: boolean;
  };
}

export interface KnowledgeGraphEdge {
  target_note_id: string;
  target_title: string;
  link_type: 'REFERENCES' | 'DEPENDS_ON' | 'MITIGATES' | 'DEPLOYS';
  context_snippet: string;
}

export interface DocumentNote {
  document_id: string;
  slug: string;
  title: string;
  category: NoteCategory;
  subcategory_tags: string[];
  created_at: string;
  updated_at: string;
  pinned: boolean;
  word_count: number;
  backlinks: KnowledgeGraphEdge[];
  forward_links: KnowledgeGraphEdge[];
  blocks: NoteBlock[];
  git_status: {
    disk_path: string;
    sync_state: 'IN_SYNC' | 'DIRTY_UNSAVED' | 'CONFLICT';
    last_commit_hash: string;
  };
}
