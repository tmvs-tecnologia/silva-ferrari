export interface JurisprudenciaDecision {
  process_number: string;
  process_type: string;
  rapporteur: string;
  adjudicating_body: string;
  publication_date: string;
  trial_date: string;
  excerpt: string;
  url: string;
  court?: string;
}

export interface JurisprudenciaCourt {
  id: string;
  name: string;
  abbreviation: string;
  decisions_count: number;
}

export interface JurisprudenciaSearchResponse {
  success: boolean;
  data: JurisprudenciaDecision[];
  meta: {
    page: number;
    per_page: number;
    has_next_page: boolean;
  };
  error?: string;
}
