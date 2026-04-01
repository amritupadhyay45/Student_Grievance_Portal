const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Request = require('../models/Request');

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create user (Admin - for staff/admin accounts)
// @route   POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, role, phone, department });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Toggle user active status (Admin)
// @route   PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalStaff,
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      totalRequests,
      pendingRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'staff' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalStaff,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        inProgressComplaints: totalComplaints - pendingComplaints - resolvedComplaints,
        totalRequests,
        pendingRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get staff members (for assignment dropdowns)
// @route   GET /api/admin/staff
const getStaffList = async (req, res) => {
  try {
    const staff = await User.find(
      { role: { $in: ['staff', 'warden', 'caretaker'] }, isActive: true },
      'name email department role hostelBlock'
    );
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getUsers, createUser, toggleUserStatus, getDashboardStats, getStaffList };
