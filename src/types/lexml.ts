export interface LexmlDocument {
  id: string;
  urn: string;
  title: string;
  description?: string;
  date?: string;
  source?: string;
  type?: string;
  url: string;
}

export interface LexmlSearchResponse {
  success: boolean;
  totalResults: number;
  results: LexmlDocument[];
  error?: string;
}

export interface LexmlMetadata {
  urn: string;
  title?: string;
  description?: string;
  datePublished?: string;
  author?: string;
  publisher?: string;
  keywords?: string[];
  format?: string;
  language?: string;
  rawJsonLd?: any;
}
