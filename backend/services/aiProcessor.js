import fetch from 'node-fetch';

class AIProcessor {
  constructor() {
    this.hfApiKey = process.env.HUGGING_FACE_API_KEY;
    this.sentimentModel = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
    this.summarizationModel = 'facebook/bart-large-cnn';
    this.baseUrl = 'https://api-inference.huggingface.co/models';
  }

  async analyzeSentiment(text) {
    try {
      const response = await fetch(`${this.baseUrl}/${this.sentimentModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Sentiment analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result.length > 0) {
        // Find the highest scoring sentiment
        const topSentiment = result[0].reduce((prev, current) => 
          (prev.score > current.score) ? prev : current
        );
        
        // Map labels to our format
        let sentiment = 'neutral';
        let confidence = topSentiment.score;
        
        if (topSentiment.label === 'LABEL_0') sentiment = 'negative';
        else if (topSentiment.label === 'LABEL_1') sentiment = 'neutral';
        else if (topSentiment.label === 'LABEL_2') sentiment = 'positive';
        
        return { sentiment, confidence };
      }
      
      return { sentiment: 'neutral', confidence: 0 };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Fallback to basic sentiment analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  async summarizeText(text) {
    try {
      // Skip summarization for very short texts
      if (text.length < 100) {
        return text;
      }

      const response = await fetch(`${this.baseUrl}/${this.summarizationModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 150,
            min_length: 30,
            do_sample: false
          },
          options: {
            wait_for_model: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Summarization failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result.length > 0 && result[0].summary_text) {
        return result[0].summary_text;
      }
      
      return this.fallbackSummarization(text);
    } catch (error) {
      console.error('Summarization error:', error);
      // Fallback to basic summarization
      return this.fallbackSummarization(text);
    }
  }

  async processComment(commentText) {
    try {
      const [sentimentResult, summary] = await Promise.all([
        this.analyzeSentiment(commentText),
        this.summarizeText(commentText)
      ]);

      return {
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        summary: summary,
        processed: true
      };
    } catch (error) {
      console.error('Error processing comment:', error);
      return {
        sentiment: 'neutral',
        confidence: 0,
        summary: commentText,
        processed: false
      };
    }
  }

  // Fallback methods for when API fails
  fallbackSentimentAnalysis(text) {
    const positiveWords = ['excellent', 'good', 'great', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'outstanding', 'satisfied', 'happy'];
    const negativeWords = ['terrible', 'bad', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'unacceptable', 'frustrated', 'angry'];
    
    const lowercaseText = text.toLowerCase();
    
    const positiveScore = positiveWords.reduce((score, word) => {
      return score + (lowercaseText.includes(word) ? 1 : 0);
    }, 0);
    
    const negativeScore = negativeWords.reduce((score, word) => {
      return score + (lowercaseText.includes(word) ? 1 : 0);
    }, 0);
    
    let sentiment = 'neutral';
    let confidence = 0.5;
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive';
      confidence = Math.min(0.8, 0.5 + (positiveScore * 0.1));
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      confidence = Math.min(0.8, 0.5 + (negativeScore * 0.1));
    }
    
    return { sentiment, confidence };
  }

  fallbackSummarization(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return text;
    }
    
    // Return first two sentences as summary
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }

  generateWordCloud(comments) {
    const wordCount = new Map();
    
    comments.forEach(comment => {
      const words = comment.originalText
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !this.isStopWord(word));
      
      words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });
    });
    
    return Array.from(wordCount.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // Top 50 words
  }

  isStopWord(word) {
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
    
    return stopWords.has(word.toLowerCase());
  }
}

export default AIProcessor;