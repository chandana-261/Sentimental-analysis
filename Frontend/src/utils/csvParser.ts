import Papa from 'papaparse';
import { Comment } from '../types';

export interface CSVRow {
  comment_id: string;
  comment_text: string;
}

export function parseCSV(file: File): Promise<Comment[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers
        return header.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      },
      complete: (results) => {
        try {
          const comments: Comment[] = results.data
            .map((row: any, index: number) => {
              // Try different possible header variations
              const commentId = row.comment_id || row.commentid || row.id || `comment_${index + 1}`;
              const commentText = row.comment_text || row.commenttext || row.text || row.comment || '';
              
              if (!commentText || commentText.trim() === '') {
                return null;
              }

              return {
                id: `${Date.now()}_${index}`,
                comment_id: String(commentId),
                original_text: String(commentText).trim(),
                created_at: new Date().toISOString(),
              };
            })
            .filter(Boolean) as Comment[];

          if (comments.length === 0) {
            reject(new Error('No valid comments found in CSV file'));
            return;
          }

          resolve(comments);
        } catch (error) {
          reject(new Error('Error parsing CSV file: ' + (error as Error).message));
        }
      },
      error: (error) => {
        reject(new Error('CSV parsing error: ' + error.message));
      }
    });
  });
}