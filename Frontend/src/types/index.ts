export interface Comment {
  id: string;
  comment_id: string;
  original_text: string;
  summary?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  created_at?: string;
}

export interface UploadStats {
  total: number;
  processed: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface WordCloudData {
  text: string;
  value: number;
}