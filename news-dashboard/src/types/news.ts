export interface Article {
  id: number;
  title: string;
  url?: string;
  content?: string;
  publisher?: string;
  published_at?: string;
  summary?: string;
  sentiment_label?: 'POSITIVE' | 'NEGATIVE';
  sentiment_score?: number;
  category?: string;
}

export interface SentimentStats {
  total_articles: number;
  positive_count: number;
  negative_count: number;
  unprocessed_count: number;
  category_stats?: Record<string, number>;
}