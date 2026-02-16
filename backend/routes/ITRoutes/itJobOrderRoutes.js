const express = require('express');
const router = express.Router();
const itJobOrderController = require('../../controllers/ITController/itJobOrderController');

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const authenticate = require('../../middleware/authMiddleware');
router.use(authenticate);

// ============================================================================
// IMPORTANT: Specific routes MUST come BEFORE parameterized routes like /:id
// ============================================================================

// ============================================================================
// STATISTICS (MUST BE BEFORE /:id)
// ============================================================================

/**
 * @route   GET /api/it-job-order/stats
 * @desc    Get job order statistics
 * @access  Authenticated users
 */
router.get('/stats', itJobOrderController.getStatistics);

// ============================================================================
// MY ACTIVE ORDERS (MUST BE BEFORE /:id)
// ============================================================================

/**
 * @route   GET /api/it-job-order/my-active
 * @desc    Get current user's active job orders (for floating tracker)
 * @access  Authenticated users
 */
router.get('/my-active', itJobOrderController.getMyActiveJobOrders);

// ============================================================================
// QUEUE MANAGEMENT (MUST BE BEFORE /:id)
// ============================================================================

/**
 * @route   GET /api/it-job-order/queue/status
 * @desc    Get queue status
 * @access  IT Staff
 */
router.get('/queue/status', itJobOrderController.getQueue);

/**
 * @route   POST /api/it-job-order/queue/next
 * @desc    Get next job order from queue for current tech
 * @access  IT Tech
 */
router.post('/queue/next', itJobOrderController.getNextFromQueue);

/**
 * @route   POST /api/it-job-order/queue/reorder
 * @desc    Reorder queue based on priority
 * @access  IT Manager
 */
router.post('/queue/reorder', itJobOrderController.reorderQueue);

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * @route   POST /api/it-job-order
 * @desc    Create new job order
 * @access  Authenticated users
 */
router.post('/', itJobOrderController.createJobOrder);

/**
 * @route   GET /api/it-job-order
 * @desc    Get all job orders with filters
 * @access  Authenticated users
 * @query   status, priority, department, tech_id, requester_id, search, page, limit
 */
router.get('/', itJobOrderController.getAllJobOrders);

/**
 * @route   GET /api/it-job-order/:id
 * @desc    Get single job order by ID
 * @access  Authenticated users
 * NOTE: This MUST come after all specific routes
 */
router.get('/:id', itJobOrderController.getJobOrderById);

/**
 * @route   PUT /api/it-job-order/:id
 * @desc    Update job order
 * @access  Authenticated users (with permissions)
 */
router.put('/:id', itJobOrderController.updateJobOrder);

/**
 * @route   DELETE /api/it-job-order/:id
 * @desc    Cancel job order
 * @access  Requester or Admin
 */
router.delete('/:id', itJobOrderController.deleteJobOrder);

// ============================================================================
// APPROVAL & WORKFLOW (These can be after /:id since they have more segments)
// ============================================================================

/**
 * @route   POST /api/it-job-order/:id/approve
 * @desc    Approve job order
 * @access  Department heads
 */
router.post('/:id/approve', itJobOrderController.approveJobOrder);

/**
 * @route   POST /api/it-job-order/:id/reject
 * @desc    Reject job order
 * @access  Department heads
 */
router.post('/:id/reject', itJobOrderController.rejectJobOrder);

/**
 * @route   POST /api/it-job-order/:id/assign
 * @desc    Assign job order to tech
 * @access  IT Manager/Admin
 */
router.post('/:id/assign', itJobOrderController.assignJobOrder);

/**
 * @route   POST /api/it-job-order/:id/start
 * @desc    Start working on job order
 * @access  Assigned tech
 */
router.post('/:id/start', itJobOrderController.startJobOrder);

/**
 * @route   POST /api/it-job-order/:id/resolve
 * @desc    Mark job order as resolved
 * @access  Assigned tech
 */
router.post('/:id/resolve', itJobOrderController.resolveJobOrder);

/**
 * @route   POST /api/it-job-order/:id/close
 * @desc    Close job order (after verification)
 * @access  Requester or Admin
 */
router.post('/:id/close', itJobOrderController.closeJobOrder);

// ============================================================================
// ATTACHMENTS
// ============================================================================

/**
 * @route   POST /api/it-job-order/:id/attachments
 * @desc    Upload attachment to job order
 * @access  Authenticated users
 */
router.post('/:id/attachments', itJobOrderController.uploadAttachment);

/**
 * @route   DELETE /api/it-job-order/attachments/:attachment_id
 * @desc    Delete attachment
 * @access  File uploader or admin
 */
router.delete('/attachments/:attachment_id', itJobOrderController.deleteAttachment);

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * @route   POST /api/it-job-order/:id/comments
 * @desc    Add comment to job order
 * @access  Authenticated users
 */
router.post('/:id/comments', itJobOrderController.addComment);

module.exports = router;