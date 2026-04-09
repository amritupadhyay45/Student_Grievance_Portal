const { analyzeComplaint, chatWithBot } = require('../utils/aiService');
const Complaint = require('../models/Complaint');
const Request = require('../models/Request');
const User = require('../models/User');

/**
 * POST /api/ai/analyze
 * Body: { subject, description }
 * Returns AI-suggested category, priority, sentiment, summary, keywords.
 */
exports.analyze = async (req, res) => {
  const { subject = '', description = '' } = req.body;

  if (!description || description.trim().length < 20) {
    return res.status(400).json({
      success: false,
      message: 'Description must be at least 20 characters for AI analysis.',
    });
  }

  try {
    const result = await analyzeComplaint(subject.trim(), description.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[AI Controller]', err);
    res.status(500).json({ success: false, message: 'AI analysis failed. Please try again.' });
  }
};

/**
 * POST /api/ai/chat
 * Body: { message, history: [{ role: 'user'|'bot', text }] }
 * Returns chatbot reply restricted to portal-related queries.
 */
exports.chat = async (req, res) => {
  const { message = '', history = [] } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
  }

  if (message.trim().length > 500) {
    return res.status(400).json({ success: false, message: 'Message too long (max 500 characters).' });
  }

  try {
    // Build context from the authenticated user + live DB data
    const context = {
      userName: req.user.name,
      userRole: req.user.role,
      department: req.user.department || null,
    };

    // Student / parent — fetch their own complaint stats
    if (['student', 'parent'].includes(req.user.role)) {
      const studentId = req.user.role === 'parent' && req.user.linkedStudent
        ? req.user.linkedStudent
        : req.user._id;

      const [total, pending, inProgress, resolved, overdue] = await Promise.all([
        Complaint.countDocuments({ student: studentId }),
        Complaint.countDocuments({ student: studentId, status: 'pending' }),
        Complaint.countDocuments({ student: studentId, status: 'in_progress' }),
        Complaint.countDocuments({ student: studentId, status: 'resolved' }),
        Complaint.countDocuments({
          student: studentId,
          status: { $nin: ['resolved', 'rejected'] },
          slaDeadline: { $lt: new Date() },
        }),
      ]);
      context.complaints = { total, pending, inProgress, resolved, overdue };
    }

    // Staff — how many assigned to them
    if (['staff', 'warden', 'caretaker', 'hod', 'bsa', 'bca', 'security', 'others'].includes(req.user.role)) {
      const [assigned, resolved] = await Promise.all([
        Complaint.countDocuments({ assignedTo: req.user._id, status: { $in: ['pending', 'in_progress'] } }),
        Complaint.countDocuments({ assignedTo: req.user._id, status: 'resolved' }),
      ]);
      context.staffStats = { assigned, resolved };
    }

    // Admin — portal-wide insight (hidden feature)
    if (req.user.role === 'admin') {
      const [total, pending, inProgress, resolved, overdue, totalRequests, pendingRequests, totalUsers] =
        await Promise.all([
          Complaint.countDocuments(),
          Complaint.countDocuments({ status: 'pending' }),
          Complaint.countDocuments({ status: 'in_progress' }),
          Complaint.countDocuments({ status: 'resolved' }),
          Complaint.countDocuments({
            status: { $nin: ['resolved', 'rejected'] },
            slaDeadline: { $lt: new Date() },
          }),
          Request.countDocuments(),
          Request.countDocuments({ status: 'pending' }),
          User.countDocuments({ isActive: true }),
        ]);
      context.adminStats = {
        total, pending, inProgress, resolved, overdue,
        totalRequests, pendingRequests, totalUsers,
      };
    }

    const reply = await chatWithBot(message.trim(), history, context);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('[AI Chat Controller]', err);
    res.status(500).json({ success: false, message: 'Chatbot unavailable. Please try again.' });
  }
};
