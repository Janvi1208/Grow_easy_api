export type RawCsvRow = Record<string, string>;

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  reason: string;
  source_row: RawCsvRow;
}

export interface ImportSummary {
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  total_batches: number;
  detected_columns: string[];
}

export interface ImportResponse {
  summary: ImportSummary;
  records: CrmRecord[];
  skipped_records: SkippedRecord[];
  parse_warnings: unknown[];
}

export const CRM_FIELD_ORDER: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];
