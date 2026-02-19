// utils/itJobOrderNotifier.js
const { database } = require('../config');
const { sendNotification } = require('./notificationHelper');

/**
 * Look up a user's department by their user_id.
 * Normalizes variations like 'Administrator' and 'Admin' → 'admin'
 */
async function getUserDept(userId) {
    const [rows] = await database.mysqlPool.query(
        `SELECT dept FROM user WHERE user_id = ?`,
        [userId]
    );
    const raw = rows[0]?.dept || null;
    return normalizeDept(raw);
}

/**
 * Normalize dept values from the DB to match what sendNotification() accepts.
 * DB values          → accepted value
 * Administrator/Admin → admin
 * Program/PDO        → program
 * Laboratory/Lab     → laboratory
 * Follow Up/Followup → followup
 */
function normalizeDept(dept) {
    if (!dept) return null;
    const d = dept.toLowerCase().trim();
    if (d === 'administrator')              return 'administrator';
    if (d === 'admin')                      return 'admin';
    if (d === 'program' || d === 'pdo')     return 'program';
    if (d === 'laboratory' || d === 'lab')  return 'laboratory';
    if (d === 'follow up' || d === 'followup') return 'followup';
    return d;
}

/**
 * Core helper — resolves the target user's department and fires sendNotification().
 */
async function notifyUser({ userId, jobOrderId, workOrderNo, type, title, message, createdBy, dept }) {
    try {
        const department = dept || await getUserDept(userId);

        if (!department) {
            console.warn(`⚠️ [JO NOTIFIER] Could not find department for user ${userId}. Skipping notification.`);
            return;
        }

        await sendNotification({
            department,
            user_id:        userId,
            type,
            title,
            message,
            link:           `/dashboard/it-job-order`,
            reference_id:   jobOrderId,
            reference_type: 'job_order',
            created_by:     createdBy
        });

        console.log(`✅ [JO NOTIFIER] Notified user ${userId} (${department}) — ${type} — ${workOrderNo}`);
    } catch (err) {
        // Log but never crash the caller — notification failures must never
        // roll back a successful job order operation.
        console.error(`❌ [JO NOTIFIER] Failed to notify user ${userId}:`, err.message);
    }
}

// ============================================================================
// Exported event helpers — one per workflow step
// ============================================================================

/**
 * Position constants — mirrors frontend permissions.ts
 * Troubleshooters : Computer Programmer, Mis Officer
 * Approvers       : Program Manager (PDO), Follow Up Head, Laboratory Manager
 */
const APPROVER_POSITIONS      = ['Program Manager', 'Follow Up Head', 'Laboratory Manager'];
const TROUBLESHOOTER_POSITIONS = ['Computer Programmer', 'Mis Officer'];

/**
 * Notify all IT officers (Computer Programmer + Mis Officer) that a new
 * job order has entered the queue and is available for assignment.
 */
async function notifyITOfficersOnQueue({ jobOrderId, workOrderNo, department, createdBy }) {
    try {
        const [officers] = await database.mysqlPool.query(
            `SELECT user_id, dept FROM user WHERE position IN (?)`,
            [TROUBLESHOOTER_POSITIONS]
        );

        if (officers.length === 0) {
            console.warn('Warning: [JO NOTIFIER] No IT officers found to notify.');
            return;
        }

        const promises = officers.map(officer =>
            notifyUser({
                userId:      officer.user_id,
                dept:        normalizeDept(officer.dept),
                jobOrderId,
                workOrderNo,
                type:        'new_job_order',
                title:       'New Work Order in Queue',
                message:     `Work order ${workOrderNo} from ${department} department has been approved and is ready for assignment.`,
                createdBy
            })
        );

        await Promise.allSettled(promises);
        console.log(`OK: [JO NOTIFIER] Notified ${officers.length} IT officer(s) for queued ${workOrderNo}`);
    } catch (err) {
        console.error('Error: [JO NOTIFIER] notifyITOfficersOnQueue failed:', err.message);
    }
}

/**
 * 1. Requester submits a job order → notify the approver of THAT department only
 *    e.g. a PDO request goes to Program Manager, not to all approvers
 */
async function notifyApproversOnCreate({ jobOrderId, workOrderNo, requesterName, createdBy, department }) {
    try {
        // Map the job order's department to the correct approver position
        const deptToPosition = {
            'Program':    'Program Manager',
            'Follow Up':  'Follow Up Head',
            'Laboratory': 'Laboratory Manager',
        };

        const targetPosition = deptToPosition[department];

        let approvers;

        if (targetPosition) {
            // Notify only the approver responsible for this department
            const [rows] = await database.mysqlPool.query(
                `SELECT user_id, dept FROM user WHERE position = ?`,
                [targetPosition]
            );
            approvers = rows;
        } else {
            // Fallback: department has no mapped approver — notify all approvers
            console.warn(`⚠️ [JO NOTIFIER] No approver mapped for department "${department}". Notifying all approvers.`);
            const [rows] = await database.mysqlPool.query(
                `SELECT user_id, dept FROM user WHERE position IN (?)`,
                [APPROVER_POSITIONS]
            );
            approvers = rows;
        }

        if (approvers.length === 0) {
            console.warn('⚠️ [JO NOTIFIER] No approvers found to notify on job order creation.');
            return;
        }

        const promises = approvers.map(approver =>
            notifyUser({
                userId:      approver.user_id,
                dept:        normalizeDept(approver.dept),
                jobOrderId,
                workOrderNo,
                type:        'new_job_order',
                title:       'New Work Order Submitted',
                message:     `${requesterName} submitted work order ${workOrderNo} and is awaiting your approval.`,
                createdBy
            })
        );

        await Promise.allSettled(promises);
        console.log(`✅ [JO NOTIFIER] Notified ${approvers.length} approver(s) for ${workOrderNo}`);
    } catch (err) {
        console.error('❌ [JO NOTIFIER] notifyApproversOnCreate failed:', err.message);
    }
}

/**
 * 2. Approver approves → notify requester
 */
async function notifyRequesterOnApprove({ requesterId, jobOrderId, workOrderNo, createdBy }) {
    await notifyUser({
        userId:     requesterId,
        jobOrderId,
        workOrderNo,
        type:       'approved',
        title:      'Work Order Approved',
        message:    `Your work order ${workOrderNo} has been approved and added to the queue.`,
        createdBy
    });
}

/**
 * 3. Approver rejects -> notify requester
 */
async function notifyRequesterOnReject({ requesterId, jobOrderId, workOrderNo, reason, createdBy }) {
    await notifyUser({
        userId:     requesterId,
        jobOrderId,
        workOrderNo,
        type:       'rejected',
        title:      'Work Order Rejected',
        message:    `Your work order ${workOrderNo} was rejected. Reason: ${reason}`,
        createdBy
    });
}

/**
 * 4. Job order assigned -> notify the tech
 */
async function notifyTechOnAssign({ techId, jobOrderId, workOrderNo, createdBy }) {
    await notifyUser({
        userId:     techId,
        jobOrderId,
        workOrderNo,
        type:       'assigned',
        title:      'New Work Order Assigned',
        message:    `Work order ${workOrderNo} has been assigned to you. Please check the details.`,
        createdBy
    });
}

/**
 * 5. Tech resolves -> notify requester
 */
async function notifyRequesterOnResolve({ requesterId, jobOrderId, workOrderNo, createdBy }) {
    await notifyUser({
        userId:     requesterId,
        jobOrderId,
        workOrderNo,
        type:       'resolved',
        title:      'Work Order Resolved',
        message:    `Your work order ${workOrderNo} has been resolved. Please verify and close it if satisfied.`,
        createdBy
    });
}

/**
 * 6. Any status update → notify requester
 */
async function notifyRequesterOnStatusUpdate({ requesterId, jobOrderId, workOrderNo, newStatus, createdBy }) {
    const statusLabels = {
        in_progress: 'is now in progress. Your IT Officer has started working on it.',
        on_hold:     'has been put on hold.',
        closed:      'has been closed.',
        cancelled:   'has been cancelled.',
        queued:      'is queued and waiting to be assigned to an IT Officer.',
        assigned:    'has been assigned to an IT Officer.',
    };

    const label = statusLabels[newStatus] || `status updated to: ${newStatus}`;

    await notifyUser({
        userId:     requesterId,
        jobOrderId,
        workOrderNo,
        type:       'status_update',
        title:      'Work Order Updated',
        message:    `Your work order ${workOrderNo} ${label}.`,
        createdBy
    });
}

module.exports = {
    notifyApproversOnCreate,
    notifyITOfficersOnQueue,
    notifyRequesterOnApprove,
    notifyRequesterOnReject,
    notifyTechOnAssign,
    notifyRequesterOnResolve,
    notifyRequesterOnStatusUpdate
};