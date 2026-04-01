const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['mess', 'classroom', 'hostel', 'campus', 'ground', 'medical_aid_centre'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        filename: String,
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    resolution: {
      note: String,
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Evidence uploaded by staff when resolving
    evidence: {
      filename: String,
      path: String,
      text: String,
      uploadedAt: Date,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    // Rating given by student after resolution (1-5)
    rating: {
      score: { type: Number, min: 1, max: 5 },
      feedback: String,
      ratedAt: Date,
    },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // ── Future Smart Features (stubs) ────────────────────────────
    // upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // slaDeadline: Date,
    // escalatedAt: Date,
    // autoRouted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster queries
complaintSchema.index({ student: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ category: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
