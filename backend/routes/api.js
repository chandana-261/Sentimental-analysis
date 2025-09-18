import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import Comment from '../models/Comment.js';
import AIProcessor from '../services/aiProcessor.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const aiProcessor = new AIProcessor();

// Upload and process CSV file
router.post('/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const uploadSession = Date.now().toString();
    const comments = [];
    
    // Parse CSV data
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({
          mapHeaders: ({ header }) => header.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
        }))
        .on('data', (row) => {
          // Try different possible header variations
          const commentId = row.comment_id || row.commentid || row.id || '';
          const commentText = row.comment_text || row.commenttext || row.text || row.comment || '';
          
          if (commentText && commentText.trim() !== '') {
            comments.push({
              commentId: commentId || `comment_${comments.length + 1}`,
              originalText: commentText.trim(),
              uploadSession: uploadSession
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (comments.length === 0) {
      return res.status(400).json({ error: 'No valid comments found in CSV file' });
    }

    // Save raw comments to database
    const savedComments = await Comment.insertMany(comments);

    res.json({
      success: true,
      message: `Successfully uploaded ${savedComments.length} comments`,
      uploadSession: uploadSession,
      totalComments: savedComments.length
    });

    // Process comments with AI in background
    processCommentsInBackground(uploadSession);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload and process CSV file' });
  }
});

// Process comments with AI
router.post('/process/:uploadSession', async (req, res) => {
  try {
    const { uploadSession } = req.params;
    
    const unprocessedComments = await Comment.find({
      uploadSession: uploadSession,
      processed: false
    });

    if (unprocessedComments.length === 0) {
      return res.json({ message: 'No comments to process or all comments already processed' });
    }

    let processedCount = 0;
    const batchSize = 5; // Process in small batches to avoid overwhelming the API

    for (let i = 0; i < unprocessedComments.length; i += batchSize) {
      const batch = unprocessedComments.slice(i, i + batchSize);
      
      const processingPromises = batch.map(async (comment) => {
        try {
          const result = await aiProcessor.processComment(comment.originalText);
          
          await Comment.findByIdAndUpdate(comment._id, {
            sentiment: result.sentiment,
            confidence: result.confidence,
            summary: result.summary,
            processed: true
          });
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing comment ${comment._id}:`, error);
        }
      });

      await Promise.all(processingPromises);
      
      // Small delay between batches to respect API rate limits
      if (i + batchSize < unprocessedComments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      message: `Processed ${processedCount} comments`,
      processedCount: processedCount
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Failed to process comments with AI' });
  }
});

// Get comments with pagination and filtering
router.get('/comments/:uploadSession', async (req, res) => {
  try {
    const { uploadSession } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sentiment, 
      search 
    } = req.query;

    const query = { uploadSession: uploadSession };
    
    if (sentiment && sentiment !== 'all') {
      query.sentiment = sentiment;
    }
    
    if (search) {
      query.$or = [
        { originalText: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [comments, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Comment.countDocuments(query)
    ]);

    res.json({
      success: true,
      comments: comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// Get statistics for upload session
router.get('/statistics/:uploadSession', async (req, res) => {
  try {
    const { uploadSession } = req.params;

    const [total, processed, sentimentStats] = await Promise.all([
      Comment.countDocuments({ uploadSession: uploadSession }),
      Comment.countDocuments({ uploadSession: uploadSession, processed: true }),
      Comment.aggregate([
        { $match: { uploadSession: uploadSession, processed: true } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      total: total,
      processed: processed,
      positive: 0,
      negative: 0,
      neutral: 0
    };

    sentimentStats.forEach(stat => {
      if (stat._id === 'positive') stats.positive = stat.count;
      else if (stat._id === 'negative') stats.negative = stat.count;
      else if (stat._id === 'neutral') stats.neutral = stat.count;
    });

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// Get word cloud data
router.get('/wordcloud/:uploadSession', async (req, res) => {
  try {
    const { uploadSession } = req.params;

    const comments = await Comment.find({
      uploadSession: uploadSession,
      processed: true
    }).lean();

    const wordCloudData = aiProcessor.generateWordCloud(comments);

    res.json({
      success: true,
      wordCloudData: wordCloudData
    });

  } catch (error) {
    console.error('Get word cloud error:', error);
    res.status(500).json({ error: 'Failed to generate word cloud data' });
  }
});

// Get processing status
router.get('/status/:uploadSession', async (req, res) => {
  try {
    const { uploadSession } = req.params;

    const [total, processed] = await Promise.all([
      Comment.countDocuments({ uploadSession: uploadSession }),
      Comment.countDocuments({ uploadSession: uploadSession, processed: true })
    ]);

    const isComplete = total > 0 && total === processed;

    res.json({
      success: true,
      status: {
        total: total,
        processed: processed,
        isComplete: isComplete,
        progress: total > 0 ? Math.round((processed / total) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to retrieve processing status' });
  }
});

// Background processing function
async function processCommentsInBackground(uploadSession) {
  try {
    console.log(`Starting background processing for session: ${uploadSession}`);
    
    const unprocessedComments = await Comment.find({
      uploadSession: uploadSession,
      processed: false
    });

    const batchSize = 3; // Smaller batch size for background processing
    let processedCount = 0;

    for (let i = 0; i < unprocessedComments.length; i += batchSize) {
      const batch = unprocessedComments.slice(i, i + batchSize);
      
      const processingPromises = batch.map(async (comment) => {
        try {
          const result = await aiProcessor.processComment(comment.originalText);
          
          await Comment.findByIdAndUpdate(comment._id, {
            sentiment: result.sentiment,
            confidence: result.confidence,
            summary: result.summary,
            processed: true
          });
          
          processedCount++;
          console.log(`Processed comment ${processedCount}/${unprocessedComments.length}`);
        } catch (error) {
          console.error(`Error processing comment ${comment._id}:`, error);
        }
      });

      await Promise.all(processingPromises);
      
      // Delay between batches to respect API rate limits
      if (i + batchSize < unprocessedComments.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Background processing completed for session: ${uploadSession}. Processed: ${processedCount} comments`);
  } catch (error) {
    console.error('Background processing error:', error);
  }
}

export default router;