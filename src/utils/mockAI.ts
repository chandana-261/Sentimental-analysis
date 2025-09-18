import { Comment, WordCloudData } from '../types';

// Mock AI service for demonstration purposes
// In production, this would call Hugging Face API

const sentiments = ['positive', 'negative', 'neutral'] as const;

const positiveWords = ['excellent', 'good', 'great', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'outstanding'];
const negativeWords = ['terrible', 'bad', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'unacceptable'];

export function mockSentimentAnalysis(text: string): 'positive' | 'negative' | 'neutral' {
  const lowercaseText = text.toLowerCase();
  
  const positiveScore = positiveWords.reduce((score, word) => {
    return score + (lowercaseText.includes(word) ? 1 : 0);
  }, 0);
  
  const negativeScore = negativeWords.reduce((score, word) => {
    return score + (lowercaseText.includes(word) ? 1 : 0);
  }, 0);
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

export function mockSummarization(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length <= 2) {
    return text;
  }
  
  // Return first two sentences as summary
  return sentences.slice(0, 2).join('. ') + '.';
}

export async function processCommentsWithAI(comments: Comment[]): Promise<Comment[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return comments.map(comment => ({
    ...comment,
    sentiment: mockSentimentAnalysis(comment.original_text),
    summary: mockSummarization(comment.original_text),
  }));
}

export function generateWordCloud(comments: Comment[]): WordCloudData[] {
  const wordCount = new Map<string, number>();
  
  comments.forEach(comment => {
    const words = comment.original_text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !isStopWord(word));
    
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
  });
  
  return Array.from(wordCount.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50); // Top 50 words
}

const stopWords = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
  'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because',
  'as', 'until', 'while', 'very', 'can', 'will', 'just', 'should', 'now'
]);

function isStopWord(word: string): boolean {
  return stopWords.has(word.toLowerCase());
}