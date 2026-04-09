const { validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/email');
const { computeSlaDeadline } = require('../utils/sla');

// Helper: notify hostel wardens & caretakers when a hostel complaint/request is created
const notifyHostelStaff = async (subject, itemId, itemType) => {
  try {
    const hostelStaff = await User.find({
      role: { $in: ['warden', 'caretaker'] },
      isActive: true,
    });
    for (const person of hostelStaff) {
      await Notification.create({
        user: person._id,
        title: `New Hostel ${itemType}`,
        message: `A hostel ${itemType.toLowerCase()} was submitted: "${subject}"`,
        type: 'complaint',
        relatedId: itemId,
      });
      try {
        const tpl = emailTemplates.hostelIssueAlert(person.name, person.role, subject, itemType, itemId);
        await sendEmail({ to: person.email, ...tpl });
      } catch (_) {}
    }
  } catch (err) {
    console.error('Hostel staff notify error:', err.message);
  }
};

const createComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category, subject, description, priority } = req.body;
    const isAnonymous = req.body.isAnonymous === 'true' || req.body.isAnonymous === true;

    const complaint = await Complaint.create({
      student: req.user._id,
      category,
      subject,
      description,
      priority: priority || 'medium',
      isAnonymous,
      slaDeadline: computeSlaDeadline(category),
      attachments: req.files
        ? req.files.map((f) => ({ filename: f.originalname, path: f.path }))
        : [],
    });

    // Send email confirmation to student
    try {
      const template = emailTemplates.complaintSubmitted(req.user.name, complaint._id, subject);
      await sendEmail({ to: req.user.email, ...template });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    // If hostel complaint, notify warden/caretaker
    if (category === 'hostel') {
      await notifyHostelStaff(subject, complaint._id, 'Complaint');
    }

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all complaints (filtered by role)
// @route   GET /api/complaints
const getComplaints = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (req.user.role === 'staff') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'parent') {
      if (req.user.linkedStudent) {
        filter.student = req.user.linkedStudent;
      } else {
        return res.json({ success: true, data: [], total: 0 });
      }
    } else if (req.user.role === 'warden' || req.user.role === 'caretaker') {
      // Warden/caretaker see hostel complaints only
      filter.category = 'hostel';
    }
    // admin, hod, bsa, bca, security, others see all

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('student', 'name email rollNumber department')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Mask student identity for anonymous complaints when viewer is not admin
    const viewerRole = req.user.role;
    const viewerId = req.user._id.toString();
    const sanitised = complaints.map((c) => {
      const obj = c.toObject();
      if (obj.isAnonymous && viewerRole !== 'admin' && obj.student?._id?.toString() !== viewerId) {
        obj.student = { name: 'Anonymous', email: '—', rollNumber: '—', department: '—' };
      }
      return obj;
    });

    res.json({
      success: true,
      data: sanitised,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
const getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email rollNumber department')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name role')
      .populate('resolution.resolvedBy', 'name');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Access control
    if (
      req.user.role === 'student' &&
      complaint.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (
      req.user.role === 'staff' &&
      (!complaint.assignedTo || complaint.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (
      req.user.role === 'parent' &&
      (!req.user.linkedStudent ||
        complaint.student._id.toString() !== req.user.linkedStudent.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Warden/caretaker can only see hostel complaints
    if (
      (req.user.role === 'warden' || req.user.role === 'caretaker') &&
      complaint.category !== 'hostel'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Mask student identity for anonymous complaints (non-admin, non-owner)
    const obj = complaint.toObject();
    const isOwner = obj.student?._id?.toString() === req.user._id.toString();
    if (obj.isAnonymous && req.user.role !== 'admin' && !isOwner) {
      obj.student = { name: 'Anonymous', email: '—', rollNumber: '—', department: '—' };
    }

    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update complaint status (Admin/Staff/Warden/Caretaker)
// @route   PUT /api/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('student', 'name email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Warden/caretaker can only update hostel complaints
    if (
      (req.user.role === 'warden' || req.user.role === 'caretaker') &&
      complaint.category !== 'hostel'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to update non-hostel complaints' });
    }

    complaint.status = status;

    if (status === 'resolved') {
      complaint.resolution = {
        note: note || '',
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      };
      // If evidence file was uploaded
      if (req.file) {
        complaint.evidence = {
          filename: req.file.originalname,
          path: req.file.path,
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
        };
      }
      if (req.body.evidenceText) {
        complaint.evidence = complaint.evidence || {};
        complaint.evidence.text = req.body.evidenceText;
        if (!complaint.evidence.uploadedAt) complaint.evidence.uploadedAt = new Date();
        if (!complaint.evidence.uploadedBy) complaint.evidence.uploadedBy = req.user._id;
      }
    }

    await complaint.save();

    // Notify student
    await Notification.create({
      user: complaint.student._id,
      title: 'Complaint Status Updated',
      message: `Your complaint "${complaint.subject}" is now ${status.replace('_', ' ')}`,
      type: 'complaint',
      relatedId: complaint._id,
    });

    // Send email (resolved gets special rating-prompt email)
    try {
      if (status === 'resolved') {
        const template = emailTemplates.resolvedWithRating(
          complaint.student.name, complaint.subject, 'complaint'
        );
        await sendEmail({ to: complaint.student.email, ...template });
      } else {
        const template = emailTemplates.statusUpdate(
          complaint.student.name, 'complaint', complaint.subject, status
        );
        await sendEmail({ to: complaint.student.email, ...template });
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Assign complaint to staff (Admin)
// @route   PUT /api/complaints/:id/assign
const assignComplaint = async (req, res) => {
  try {
    const { staffId } = req.body;

    const staff = await User.findById(staffId);
    if (!staff || !['staff', 'warden', 'caretaker'].includes(staff.role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff member' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedTo = staffId;
    if (complaint.status === 'pending') {
      complaint.status = 'in_progress';
    }
    await complaint.save();

    // Notify staff
    await Notification.create({
      user: staffId,
      title: 'New Complaint Assigned',
      message: `Complaint "${complaint.subject}" has been assigned to you`,
      type: 'assignment',
      relatedId: complaint._id,
    });

    // Email staff
    try {
      const template = emailTemplates.assignedToStaff(staff.name, complaint.subject);
      await sendEmail({ to: staff.email, ...template });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    const updated = await Complaint.findById(req.params.id)
      .populate('student', 'name email rollNumber')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.comments.push({ user: req.user._id, text: text.trim() });
    await complaint.save();

    const updated = await Complaint.findById(req.params.id)
      .populate('comments.user', 'name role');

    res.json({ success: true, data: updated.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Rate a resolved complaint (Student only)
// @route   POST /api/complaints/:id/rate
const rateComplaint = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating score must be between 1 and 5' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the complaint owner can rate' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Can only rate resolved complaints' });
    }

    if (complaint.rating?.score) {
      return res.status(400).json({ success: false, message: 'Already rated' });
    }

    complaint.rating = { score: Number(score), feedback: feedback || '', ratedAt: new Date() };
    await complaint.save();

    res.json({ success: true, data: complaint.rating });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get complaint analytics (Admin)
// @route   GET /api/complaints/analytics
const getAnalytics = async (req, res) => {
  try {
    const [statusStats, categoryStats, monthlyStats, totalComplaints] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Complaint.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { statusStats, categoryStats, monthlyStats, totalComplaints },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  assignComplaint,
  addComment,
  rateComplaint,
  getAnalytics,
};
