import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    required: true,
    index: true
  },
  originalText: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  confidence: {
    type: Number,
    default: 0
  },
  processed: {
    type: Boolean,
    default: false
  },
  uploadSession: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for better query performance
commentSchema.index({ uploadSession: 1, sentiment: 1 });
commentSchema.index({ uploadSession: 1, processed: 1 });

export default mongoose.model('Comment', commentSchema);