const { mysqlPool } = require('../../config/database');
const upload = require('../../config/multer');
const path = require('path');
const fs = require('fs').promises;

/**
 * IT Job Order Controller
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function generateWorkOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `JOR-${year}-${month}`;
    const [rows] = await mysqlPool.query(
        `SELECT work_order_no FROM it_job_order WHERE work_order_no LIKE ? ORDER BY work_order_no DESC LIMIT 1`,
        [`${prefix}-%`]
    );
    let nextNumber = 1;
    if (rows.length > 0) {
        const lastNumber = parseInt(rows[0].work_order_no.split('-').pop());
        nextNumber = lastNumber + 1;
    }
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Log activity — uses caller's connection to stay inside the transaction
 */
async function logHistory(db, jobOrderId, userId, action, fieldChanged = null, oldValue = null, newValue = null) {
    await db.query(
        `INSERT INTO job_order_history (job_order_id, user_id, action, field_changed, old_value, new_value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [jobOrderId, userId, action, fieldChanged, oldValue, newValue]
    );
}

/**
 * ✅ FIX: createNotification now accepts `db` as first param so it runs inside
 * the caller's transaction — previously used mysqlPool directly → lock wait timeout
 */
async function createNotification(db, userId, jobOrderId, type, title, message) {
    await db.query(
        `INSERT INTO job_order_notifications (user_id, job_order_id, type, title, message)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, jobOrderId, type, title, message]
    );
}

// ============================================================================
// JOB ORDER CRUD OPERATIONS
// ============================================================================

exports.createJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { title, description, type, category, priority = 'medium', department, location, asset_id, estimated_hours, tags } = req.body;
        const requesterId = req.user?.user_id;
        console.log('🔍 [CREATE JOB ORDER] Auth user:', req.user);
        console.log('🔍 [CREATE JOB ORDER] Requester ID:', requesterId);
        console.log('🔍 [CREATE JOB ORDER] Request body:', req.body);
        if (!requesterId) {
            await connection.rollback();
            connection.release();
            return res.status(401).json({ success: false, message: 'User not authenticated. Please log in.' });
        }
        if (!title || !description || !department) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: 'Missing required fields: title, description, department' });
        }
        const workOrderNo = await generateWorkOrderNumber();
        console.log('🔍 [CREATE JOB ORDER] Generated work order no:', workOrderNo);
        const [result] = await connection.query(
            `INSERT INTO it_job_order (work_order_no, title, description, type, category, priority, requester_id, department, location, asset_id, estimated_hours, tags, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval')`,
            [workOrderNo, title, description, type, category, priority, requesterId, department, location, asset_id, estimated_hours, tags]
        );
        const jobOrderId = result.insertId;
        console.log('🔍 [CREATE JOB ORDER] Inserted job order ID:', jobOrderId);
        await logHistory(connection, jobOrderId, requesterId, 'created', 'status', null, 'pending_approval');
        await connection.commit();
        console.log('✅ [CREATE JOB ORDER] Successfully created:', workOrderNo);
        res.status(201).json({ success: true, message: 'Job order created successfully', data: { id: jobOrderId, work_order_no: workOrderNo, status: 'pending_approval' } });
    } catch (error) {
        await connection.rollback();
        console.error('❌ [CREATE JOB ORDER] Error:', error);
        console.error('❌ [CREATE JOB ORDER] Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to create job order', error: error.message });
    } finally {
        connection.release();
        console.log('🔍 [CREATE JOB ORDER] Connection released');
    }
};

exports.getAllJobOrders = async (req, res) => {
    try {
        console.log('📥 [GET ALL JOB ORDERS] Request received');
        console.log('📥 Query params:', req.query);
        console.log('📥 User:', req.user);
        const { status, priority, department, tech_id, requester_id, search, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
        const allowedSortColumns = ['created_at', 'updated_at', 'priority', 'status', 'work_order_no', 'id'];
        const safeSort = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status)       { whereClause += ' AND jo.status = ?';       params.push(status); }
        if (priority)     { whereClause += ' AND jo.priority = ?';     params.push(priority); }
        if (department)   { whereClause += ' AND jo.department = ?';   params.push(department); }
        if (tech_id)      { whereClause += ' AND jo.tech_id = ?';      params.push(tech_id); }
        if (requester_id) { whereClause += ' AND jo.requester_id = ?'; params.push(requester_id); }
        if (search) {
            whereClause += ' AND (jo.title LIKE ? OR jo.description LIKE ? OR jo.work_order_no LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }
        const joinClause = `FROM it_job_order jo LEFT JOIN user req ON jo.requester_id = req.user_id LEFT JOIN user tech ON jo.tech_id = tech.user_id LEFT JOIN user approved ON jo.approved_by_id = approved.user_id`;
        const [countResult] = await mysqlPool.query(`SELECT COUNT(*) as total ${joinClause} ${whereClause}`, params);
        const total = countResult && countResult[0] ? countResult[0].total : 0;
        console.log('📥 [GET ALL JOB ORDERS] Total count:', total);
        const offset = (page - 1) * limit;
        const [rows] = await mysqlPool.query(
            `SELECT jo.*, req.name as requester_name, req.dept as requester_dept, tech.name as tech_name, tech.username as tech_username, approved.name as approved_by_name
             ${joinClause} ${whereClause} ORDER BY jo.${safeSort} ${safeSortOrder} LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );
        console.log('✅ [GET ALL JOB ORDERS] Found', rows.length, 'job orders');
        res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error('❌ [GET ALL JOB ORDERS] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch job orders', error: error.message, sqlMessage: error.sqlMessage || 'No SQL error message', details: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
};

exports.getMyActiveJobOrders = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const [rows] = await mysqlPool.query(
            `SELECT jo.*, tech.name as tech_name, tech.username as tech_username
             FROM it_job_order jo LEFT JOIN user tech ON jo.tech_id = tech.user_id
             WHERE jo.requester_id = ? AND jo.status IN ('pending_approval','approved','queued','assigned','in_progress','on_hold')
             ORDER BY CASE jo.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, jo.created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('❌ [MY ACTIVE] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active job orders', error: error.message });
    }
};

exports.getJobOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await mysqlPool.query(
            `SELECT jo.*, 
                    req.name as requester_name, req.dept as requester_dept, 
                    tech.name as tech_name, tech.username as tech_username, 
                    approved.name as approved_by_name
             FROM it_job_order jo 
             LEFT JOIN user req      ON jo.requester_id   = req.user_id 
             LEFT JOIN user tech     ON jo.tech_id         = tech.user_id 
             LEFT JOIN user approved ON jo.approved_by_id  = approved.user_id
             WHERE jo.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job order not found' });
        }

        const [attachmentsRaw] = await mysqlPool.query(
            `SELECT a.*, u.name as uploaded_by_name 
             FROM job_order_attachments a 
             LEFT JOIN user u ON a.uploaded_by = u.user_id 
             WHERE a.job_order_id = ?`,
            [id]
        );

        const [comments] = await mysqlPool.query(
            `SELECT c.*, u.name as author_name 
             FROM job_order_comments c 
             LEFT JOIN user u ON c.user_id = u.user_id 
             WHERE c.job_order_id = ? 
             ORDER BY c.created_at DESC`,
            [id]
        );

        const [history] = await mysqlPool.query(
            `SELECT h.*, u.name as user_name 
             FROM job_order_history h 
             LEFT JOIN user u ON h.user_id = u.user_id 
             WHERE h.job_order_id = ? 
             ORDER BY h.created_at DESC`,
            [id]
        );

        // ✅ Build full URL for each attachment so the frontend can display/download them
        const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
        const attachments = attachmentsRaw.map((a) => ({
            ...a,
            file_url: `${BASE_URL}/uploads/${a.file_path}`,
        }));

        res.json({
            success: true,
            data: { ...rows[0], attachments, comments, history },
        });

    } catch (error) {
        console.error('Error fetching job order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job order',
            error: error.message,
        });
    }
};

exports.updateJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const [currentRows] = await connection.query('SELECT * FROM it_job_order WHERE id = ?', [id]);
        if (currentRows.length === 0) return res.status(404).json({ success: false, message: 'Job order not found' });
        const current = currentRows[0];
        const allowedFields = ['title','description','type','category','priority','status','tech_id','action_taken','reason','resolution_notes','estimated_hours','actual_hours','tags','location','asset_id','due_date'];
        const updates = [], params = [];
        for (const [key, value] of Object.entries(req.body)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = ?`);
                params.push(value);
                if (current[key] !== value) await logHistory(connection, id, userId, 'updated', key, String(current[key]), String(value));
            }
        }
        if (updates.length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update' });
        params.push(id);
        await connection.query(`UPDATE it_job_order SET ${updates.join(', ')} WHERE id = ?`, params);
        await connection.commit();
        res.json({ success: true, message: 'Job order updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating job order:', error);
        res.status(500).json({ success: false, message: 'Failed to update job order', error: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const userId = req.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const [rows] = await connection.query('SELECT * FROM it_job_order WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Job order not found' });
        await connection.query(`UPDATE it_job_order SET status = 'cancelled' WHERE id = ?`, [id]);
        await logHistory(connection, id, userId, 'cancelled', 'status', rows[0].status, 'cancelled');
        await connection.commit();
        res.json({ success: true, message: 'Job order cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting job order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel job order', error: error.message });
    } finally {
        connection.release();
    }
};

// ============================================================================
// APPROVAL & WORKFLOW
// ============================================================================

exports.approveJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const approverId = req.user?.user_id;
        const [rows] = await connection.query('SELECT * FROM it_job_order WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Job order not found' });
        const jobOrder = rows[0];
        if (jobOrder.status !== 'pending_approval') {
            return res.status(400).json({ success: false, message: `Cannot approve. Current status: ${jobOrder.status}` });
        }
        await connection.query(
            `UPDATE it_job_order SET status = 'queued', approved_by_id = ?, approved_at = NOW() WHERE id = ?`,
            [approverId, id]
        );
        await logHistory(connection, id, approverId, 'approved', 'status', 'pending_approval', 'queued');
        // ✅ FIX: pass connection — was using mysqlPool directly → lock wait timeout
        await createNotification(connection, jobOrder.requester_id, id, 'approved', 'Work Order Approved', `Your work order ${jobOrder.work_order_no} has been approved and queued`);
        await connection.commit();
        res.json({ success: true, message: 'Job order approved and queued successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error approving job order:', error);
        res.status(500).json({ success: false, message: 'Failed to approve job order', error: error.message });
    } finally {
        connection.release();
    }
};

exports.rejectJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { reason } = req.body;
        const approverId = req.user?.user_id;
        if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        const [rows] = await connection.query('SELECT * FROM it_job_order WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Job order not found' });
        const jobOrder = rows[0];
        await connection.query(
            `UPDATE it_job_order SET status = 'rejected', approved_by_id = ?, approved_at = NOW(), reason = ? WHERE id = ?`,
            [approverId, reason, id]
        );
        await logHistory(connection, id, approverId, 'rejected', 'status', jobOrder.status, 'rejected');
        // ✅ FIX: pass connection
        await createNotification(connection, jobOrder.requester_id, id, 'rejected', 'Work Order Rejected', `Your work order ${jobOrder.work_order_no} was rejected. Reason: ${reason}`);
        await connection.commit();
        res.json({ success: true, message: 'Job order rejected successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error rejecting job order:', error);
        res.status(500).json({ success: false, message: 'Failed to reject job order', error: error.message });
    } finally {
        connection.release();
    }
};

exports.assignJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { tech_id } = req.body;
        const assignerId = req.user?.user_id;
        if (!tech_id) return res.status(400).json({ success: false, message: 'tech_id is required' });
        const [techRows] = await connection.query('SELECT * FROM user WHERE user_id = ?', [tech_id]);
        if (techRows.length === 0) return res.status(404).json({ success: false, message: 'Tech not found' });
        await connection.query(
            `UPDATE it_job_order SET status = 'assigned', tech_id = ?, assigned_at = NOW() WHERE id = ?`,
            [tech_id, id]
        );
        await logHistory(connection, id, assignerId, 'assigned', 'tech_id', null, String(tech_id));
        const [jobOrder] = await connection.query('SELECT * FROM it_job_order WHERE id = ?', [id]);
        // ✅ FIX: pass connection
        await createNotification(connection, tech_id, id, 'assigned', 'New Work Order Assigned', `Work order ${jobOrder[0].work_order_no} has been assigned to you`);
        await connection.commit();
        res.json({ success: true, message: 'Job order assigned successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error assigning job order:', error);
        res.status(500).json({ success: false, message: 'Failed to assign job order', error: error.message });
    } finally {
        connection.release();
    }
};

exports.startJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const techId = req.user?.user_id;
        const [activeRows] = await connection.query(`SELECT * FROM it_job_order WHERE tech_id = ? AND status = 'in_progress'`, [techId]);
        if (activeRows.length > 0) {
            return res.status(400).json({ success: false, message: 'You already have an active work order. Please complete it first.', active_order: activeRows[0].work_order_no });
        }
        await connection.query(`UPDATE it_job_order SET status = 'in_progress', started_at = NOW() WHERE id = ? AND tech_id = ?`, [id, techId]);
        await logHistory(connection, id, techId, 'started', 'status', 'assigned', 'in_progress');
        await connection.commit();
        res.json({ success: true, message: 'Started working on job order' });
    } catch (error) {
        await connection.rollback();
        console.error('Error starting job order:', error);
        res.status(500).json({ success: false, message: 'Failed to start job order', error: error.message });
    } finally {
        connection.release();
    }
};

exports.resolveJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { action_taken, resolution_notes } = req.body;
        const techId = req.user?.user_id;
        if (!action_taken) return res.status(400).json({ success: false, message: 'action_taken is required' });

        // ✅ Auto-calculate actual_hours from started_at → NOW()
        const [startRows] = await connection.query('SELECT started_at FROM it_job_order WHERE id = ?', [id]);
        let actual_hours = null;
        if (startRows[0]?.started_at) {
            const startedAt = new Date(startRows[0].started_at);
            actual_hours = parseFloat(((Date.now() - startedAt.getTime()) / (1000 * 60 * 60)).toFixed(2));
        }

        await connection.query(
            `UPDATE it_job_order SET status = 'resolved', resolved_at = NOW(), action_taken = ?, resolution_notes = ?, actual_hours = ? WHERE id = ? AND tech_id = ?`,
            [action_taken, resolution_notes, actual_hours, id, techId]
        );
        await logHistory(connection, id, techId, 'resolved', 'status', 'in_progress', 'resolved');
        const [jobOrder] = await connection.query('SELECT * FROM it_job_order WHERE id = ?', [id]);
        // ✅ FIX: pass connection
        await createNotification(connection, jobOrder[0].requester_id, id, 'resolved', 'Work Order Resolved', `Your work order ${jobOrder[0].work_order_no} has been resolved`);
        await connection.commit();
        res.json({ success: true, message: 'Job order marked as resolved' });
    } catch (error) {
        await connection.rollback();
        console.error('Error resolving job order:', error);
        res.status(500).json({ success: false, message: 'Failed to resolve job order', error: error.message });
    } finally {
        connection.release();
    }
};

exports.closeJobOrder = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const userId = req.user?.user_id;
        await connection.query(`UPDATE it_job_order SET status = 'closed', closed_at = NOW(), closed_by_id = ? WHERE id = ?`, [userId, id]);
        await logHistory(connection, id, userId, 'closed', 'status', 'resolved', 'closed');
        await connection.commit();
        res.json({ success: true, message: 'Job order closed successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error closing job order:', error);
        res.status(500).json({ success: false, message: 'Failed to close job order', error: error.message });
    } finally {
        connection.release();
    }
};

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

exports.getQueue = async (req, res) => {
    try {
        const [rows] = await mysqlPool.query(`SELECT * FROM vw_queue_status`);
        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch queue', error: error.message });
    }
};

exports.getNextFromQueue = async (req, res) => {
    try {
        const techId = req.user?.user_id;
        const [rows] = await mysqlPool.query('CALL sp_get_next_work_order(?)', [techId]);
        if (rows[0].length === 0) return res.json({ success: true, message: 'No work orders in queue', data: null });
        res.json({ success: true, data: rows[0][0] });
    } catch (error) {
        console.error('Error getting next from queue:', error);
        res.status(500).json({ success: false, message: 'Failed to get next work order', error: error.message });
    }
};

exports.reorderQueue = async (req, res) => {
    try {
        await mysqlPool.query('CALL sp_reorder_queue()');
        res.json({ success: true, message: 'Queue reordered successfully' });
    } catch (error) {
        console.error('Error reordering queue:', error);
        res.status(500).json({ success: false, message: 'Failed to reorder queue', error: error.message });
    }
};

// ============================================================================
// ATTACHMENTS
// ============================================================================

exports.uploadAttachment = [
    upload.single('file'),
    async (req, res) => {
        const connection = await mysqlPool.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const userId = req.user?.user_id;
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const [result] = await connection.query(
                `INSERT INTO job_order_attachments (job_order_id, file_name, file_path, file_size, mime_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, userId]
            );
            await logHistory(connection, id, userId, 'attachment_added', 'attachments', null, req.file.originalname);
            await connection.commit();
            res.json({ success: true, message: 'File uploaded successfully', data: { id: result.insertId, file_name: req.file.originalname, file_size: req.file.size, mime_type: req.file.mimetype } });
        } catch (error) {
            await connection.rollback();
            if (req.file) await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
            console.error('Error uploading attachment:', error);
            res.status(500).json({ success: false, message: 'Failed to upload attachment', error: error.message });
        } finally {
            connection.release();
        }
    }
];

exports.deleteAttachment = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { attachment_id } = req.params;
        const userId = req.user?.user_id;
        const [rows] = await connection.query('SELECT * FROM job_order_attachments WHERE id = ?', [attachment_id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Attachment not found' });
        const attachment = rows[0];
        const filePath = path.join(__dirname, '../../uploads', attachment.file_path);
        await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));
        await connection.query('DELETE FROM job_order_attachments WHERE id = ?', [attachment_id]);
        await logHistory(connection, attachment.job_order_id, userId, 'attachment_deleted', 'attachments', attachment.file_name, null);
        await connection.commit();
        res.json({ success: true, message: 'Attachment deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting attachment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete attachment', error: error.message });
    } finally {
        connection.release();
    }
};

// ============================================================================
// COMMENTS
// ============================================================================

exports.addComment = async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { comment, is_internal = 0 } = req.body;
        const userId = req.user?.user_id;
        if (!comment) return res.status(400).json({ success: false, message: 'Comment is required' });
        const [result] = await connection.query(
            `INSERT INTO job_order_comments (job_order_id, user_id, comment, is_internal) VALUES (?, ?, ?, ?)`,
            [id, userId, comment, is_internal]
        );
        await logHistory(connection, id, userId, 'comment_added', 'comments', null, comment.substring(0, 100));
        await connection.commit();
        res.json({ success: true, message: 'Comment added successfully', data: { id: result.insertId } });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
    } finally {
        connection.release();
    }
};

// ============================================================================
// STATISTICS
// ============================================================================

exports.getStatistics = async (req, res) => {
    try {
        const [rows] = await mysqlPool.query('CALL sp_get_work_order_stats()');
        res.json({ success: true, data: rows[0][0] });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
};