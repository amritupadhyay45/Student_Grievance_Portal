const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getRequests,
  getRequest,
  updateRequestStatus,
  assignRequest,
  rateRequest,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getRequests)
  .post(
    authorize('student'),
    upload.array('attachments', 3),
    [
      body('type')
        .isIn(['mess', 'hostel', 'ground', 'medical_aid_centre', 'classroom', 'campus', 'canteen', 'others'])
        .withMessage('Valid request type is required'),
      body('subject').trim().notEmpty().withMessage('Subject is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
    ],
    createRequest
  );

router.get('/:id', getRequest);

// Status update with optional evidence file
router.put(
  '/:id/status',
  authorize('admin', 'staff', 'warden', 'caretaker'),
  upload.single('evidenceFile'),
  updateRequestStatus
);

router.put('/:id/assign', authorize('admin'), assignRequest);

// Student rates resolved request
router.post('/:id/rate', authorize('student'), rateRequest);

module.exports = router;
