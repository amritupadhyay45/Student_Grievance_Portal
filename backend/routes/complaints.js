const express = require('express');
const { body } = require('express-validator');
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  assignComplaint,
  addComment,
  rateComplaint,
  getAnalytics,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Analytics - must be before /:id route
router.get('/analytics', authorize('admin'), getAnalytics);

router
  .route('/')
  .get(getComplaints)
  .post(
    authorize('student'),
    upload.array('attachments', 3),
    [
      body('category')
        .isIn(['mess', 'classroom', 'hostel', 'campus', 'ground', 'medical_aid_centre'])
        .withMessage('Valid category is required'),
      body('subject').trim().notEmpty().withMessage('Subject is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
    ],
    createComplaint
  );

router.get('/:id', getComplaint);

// Status update with optional evidence file
router.put(
  '/:id/status',
  authorize('admin', 'staff', 'warden', 'caretaker'),
  upload.single('evidenceFile'),
  updateComplaintStatus
);

router.put('/:id/assign', authorize('admin'), assignComplaint);

router.post('/:id/comments', addComment);

// Student rates resolved complaint
router.post('/:id/rate', authorize('student'), rateComplaint);

module.exports = router;
