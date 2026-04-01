const { validationResult } = require('express-validator');
const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/email');

// Helper: notify hostel wardens & caretakers
const notifyHostelStaff = async (subject, itemId, itemType) => {
  try {
    const hostelStaff = await User.find({ role: { $in: ['warden', 'caretaker'] }, isActive: true });
    for (const person of hostelStaff) {
      await Notification.create({
        user: person._id,
        title: `New Hostel ${itemType}`,
        message: `A hostel ${itemType.toLowerCase()} was submitted: "${subject}"`,
        type: 'request',
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

// @desc    Create a request (Student)
// @route   POST /api/requests
const createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, subject, description, location } = req.body;

    const requestData = {
      student: req.user._id,
      type,
      subject,
      description,
      location: location || undefined,
      attachments: req.files
        ? req.files.map((f) => ({ filename: f.originalname, path: f.path }))
        : [],
    };

    const newRequest = await Request.create(requestData);

    // Notify student via email
    try {
      const template = emailTemplates.complaintSubmitted(req.user.name, newRequest._id, subject);
      await sendEmail({ to: req.user.email, ...template });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    // If hostel request, notify warden/caretaker
    if (type === 'hostel') {
      await notifyHostelStaff(subject, newRequest._id, 'Request');
    }

    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all requests
// @route   GET /api/requests
const getRequests = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const filter = {};

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
      filter.type = 'hostel';
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Request.countDocuments(filter);
    const requests = await Request.find(filter)
      .populate('student', 'name email rollNumber department')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('student', 'name email rollNumber department')
      .populate('assignedTo', 'name email')
      .populate('response.respondedBy', 'name');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Access control
    if (
      req.user.role === 'student' &&
      request.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update request status (Admin/Staff/Warden/Caretaker)
// @route   PUT /api/requests/:id/status
const updateRequestStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await Request.findById(req.params.id).populate('student', 'name email');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Warden/caretaker can only update hostel requests
    if (
      (req.user.role === 'warden' || req.user.role === 'caretaker') &&
      request.type !== 'hostel'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = status;

    if (status === 'resolved') {
      request.response = {
        note: note || '',
        respondedAt: new Date(),
        respondedBy: req.user._id,
      };
      // Evidence file upload
      if (req.file) {
        request.evidence = {
          filename: req.file.originalname,
          path: req.file.path,
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
        };
      }
      if (req.body.evidenceText) {
        request.evidence = request.evidence || {};
        request.evidence.text = req.body.evidenceText;
        if (!request.evidence.uploadedAt) request.evidence.uploadedAt = new Date();
        if (!request.evidence.uploadedBy) request.evidence.uploadedBy = req.user._id;
      }
    }

    await request.save();

    // Notify student
    await Notification.create({
      user: request.student._id,
      title: 'Request Status Updated',
      message: `Your request "${request.subject}" is now ${status.replace('_', ' ')}`,
      type: 'request',
      relatedId: request._id,
    });

    // Send email
    try {
      if (status === 'resolved') {
        const template = emailTemplates.resolvedWithRating(
          request.student.name, request.subject, 'request'
        );
        await sendEmail({ to: request.student.email, ...template });
      } else {
        const template = emailTemplates.statusUpdate(
          request.student.name, 'request', request.subject, status
        );
        await sendEmail({ to: request.student.email, ...template });
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Assign request to staff (Admin)
// @route   PUT /api/requests/:id/assign
const assignRequest = async (req, res) => {
  try {
    const { staffId } = req.body;

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.assignedTo = staffId;
    if (request.status === 'pending') {
      request.status = 'in_progress';
    }
    await request.save();

    const updated = await Request.findById(req.params.id)
      .populate('student', 'name email rollNumber')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Rate a resolved request (Student only)
// @route   POST /api/requests/:id/rate
const rateRequest = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating score must be between 1 and 5' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the request owner can rate' });
    }
    if (request.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Can only rate resolved requests' });
    }
    if (request.rating?.score) {
      return res.status(400).json({ success: false, message: 'Already rated' });
    }

    request.rating = { score: Number(score), feedback: feedback || '', ratedAt: new Date() };
    await request.save();

    res.json({ success: true, data: request.rating });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequest,
  updateRequestStatus,
  assignRequest,
  rateRequest,
};
