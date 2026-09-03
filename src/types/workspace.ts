export type SectionModule = 'DATA_LAB' | 'NOTES_RUNBOOKS';
export type DomainCategory = 'DEVOPS' | 'CYBERSEC' | 'DATASCIENCE' | 'SOFTWARE_DEV' | 'GENERAL';
export type ItemType = 'NOTE' | 'RUNBOOK' | 'DATASET' | 'QUERY_SCRIPT';

export interface CodeBlock {
  language: 'bash' | 'python' | 'sql' | 'rust';
  code: string;
}

export interface DataTable {
  headers: string[];
  rows: (string | number)[][];
}

export interface WorkspaceItem {
  id: string;
  title: string;
  section: SectionModule;
  category: DomainCategory;
  type: ItemType;
  tags: string[];
  updated_at: string;
  content: string;
  code_block?: CodeBlock;
  data_table?: DataTable;
}
