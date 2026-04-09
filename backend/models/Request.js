const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: [true, 'Request type is required'],
      enum: [
        'mess',
        'hostel',
        'department',
        'ground',
        'medical_aid_centre',
        'classroom',
        'campus',
        'canteen',
        'others',
      ],
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
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
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
    // Evidence uploaded by staff when resolving
    evidence: {
      filename: String,
      path: String,
      text: String,
      uploadedAt: Date,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    response: {
      note: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Rating given by student after resolution (1-5)
    rating: {
      score: { type: Number, min: 1, max: 5 },
      feedback: String,
      ratedAt: Date,
    },
    // ── Future Smart Features (stubs) ────────────────────────────
    // upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // slaDeadline: Date,
    // escalatedAt: Date,
    // autoRouted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

requestSchema.index({ student: 1, status: 1 });
requestSchema.index({ type: 1 });

module.exports = mongoose.model('Request', requestSchema);
