const { database } = require('../config');

// Get all notifications for a user's department
const getNotifications = async (req, res) => {
    try {
        const userDept = req.user?.dept;
        const userId = req.user?.user_id ?? null; 
        const { limit = 50, offset = 0 } = req.query;

        console.log('==========================================');
        console.log('🔍 GETTING NOTIFICATIONS FOR:');
        console.log('User ID:', userId);
        console.log('User Dept:', userDept);
        console.log('User Name:', req.user?.name);
        console.log('==========================================');

        if (!userDept) {
            return res.status(400).json({ 
                error: "User department not found" 
            });
        }

        // Use LOWER() for case-insensitive comparison
        const sql = `
            SELECT 
                id,
                department,
                user_id,
                type,
                title,
                message,
                link,
                reference_id,
                reference_type,
                is_read,
                created_by,
                created_at,
                read_at
            FROM test_nscslcom_nscsl_dashboard.notifications
            WHERE LOWER(department) = LOWER(?)
                AND is_deleted = FALSE
                AND (user_id IS NULL OR user_id = ?)
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        console.log('📝 Query params:', [userDept, userId, parseInt(limit), parseInt(offset)]);

        const [results] = await database.mysqlPool.query(sql, [
            userDept,
            userId, 
            parseInt(limit), 
            parseInt(offset)
        ]);

        console.log('📊 Results:', results.length, 'notifications found');

        res.json(results);
    } catch (err) {
        console.error("❌ Get notifications error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve notifications",
            message: err.message 
        });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const userDept = req.user?.dept;
        const userId = req.user?.user_id ?? null; 

        if (!userDept) {
            return res.status(400).json({ 
                error: "User department not found" 
            });
        }

        const sql = `
            SELECT COUNT(*) as count
            FROM test_nscslcom_nscsl_dashboard.notifications
            WHERE LOWER(department) = LOWER(?)
                AND is_deleted = FALSE
                AND is_read = FALSE
                AND (user_id IS NULL OR user_id = ?)
        `;

        const [results] = await database.mysqlPool.query(sql, [
            userDept,
            userId
        ]);

        res.json({ 
            count: Number(results[0].count) 
        });
    } catch (err) {
        console.error("Get unread count error:", err);
        res.status(500).json({ 
            error: "Failed to get unread count",
            message: err.message 
        });
    }
};

// Create a new notification
const createNotification = async (req, res) => {
    try {
        const {
            department,
            user_id,
            type,
            title,
            message,
            link,
            reference_id,
            reference_type
        } = req.body;

        const userName = req.user?.name || 'System';
        const now = new Date();

        if (!department || !type || !title || !message) {
            return res.status(400).json({ 
                error: "Missing required fields",
                required: ['department', 'type', 'title', 'message']
            });
        }

        const validDepartments = ['admin', 'administrator', 'program', 'laboratory', 'followup'];
        if (!validDepartments.includes(department.toLowerCase())) {
            return res.status(400).json({ 
                error: "Invalid department",
                valid: validDepartments
            });
        }

        // Capitalize first letter
        const capitalizeFirstLetter = (str) => {
            if (!str) return str;
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        };

        const sql = `
            INSERT INTO test_nscslcom_nscsl_dashboard.notifications 
            (department, user_id, type, title, message, link, reference_id, reference_type, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await database.mysqlPool.query(sql, [
            capitalizeFirstLetter(department),
            user_id || null,
            type,
            title,
            message,
            link || null,
            reference_id || null,
            reference_type || null,
            userName,
            now
        ]);

        res.json({ 
            message: "Notification created successfully", 
            id: result.insertId 
        });
    } catch (err) {
        console.error("Create notification error:", err);
        res.status(500).json({ 
            error: "Failed to create notification",
            message: err.message 
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const now = new Date();

        const sql = `
            UPDATE test_nscslcom_nscsl_dashboard.notifications 
            SET is_read = TRUE, read_at = ?
            WHERE id = ?
        `;

        const [result] = await database.mysqlPool.query(sql, [now, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: "Notification not found" 
            });
        }

        res.json({ 
            message: "Notification marked as read" 
        });
    } catch (err) {
        console.error("Mark as read error:", err);
        res.status(500).json({ 
            error: "Failed to mark notification as read",
            message: err.message 
        });
    }
};

// Mark all notifications as read for user's department
const markAllAsRead = async (req, res) => {
    try {
        const userDept = req.user?.dept;
        const userId = req.user?.user_id ?? null; 
        const now = new Date();

        if (!userDept) {
            return res.status(400).json({ 
                error: "User department not found" 
            });
        }

        const sql = `
            UPDATE test_nscslcom_nscsl_dashboard.notifications 
            SET is_read = TRUE, read_at = ?
            WHERE LOWER(department) = LOWER(?)
                AND is_deleted = FALSE
                AND is_read = FALSE
                AND (user_id IS NULL OR user_id = ?)
        `;

        const [result] = await database.mysqlPool.query(sql, [
            now, 
            userDept,
            userId
        ]);

        res.json({ 
            message: "All notifications marked as read",
            updated: result.affectedRows
        });
    } catch (err) {
        console.error("Mark all as read error:", err);
        res.status(500).json({ 
            error: "Failed to mark all notifications as read",
            message: err.message 
        });
    }
};

// Delete notification (soft delete)
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const now = new Date();

        const sql = `
            UPDATE test_nscslcom_nscsl_dashboard.notifications 
            SET is_deleted = TRUE, deleted_at = ?
            WHERE id = ?
        `;

        const [result] = await database.mysqlPool.query(sql, [now, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: "Notification not found" 
            });
        }

        res.json({ 
            message: "Notification deleted successfully" 
        });
    } catch (err) {
        console.error("Delete notification error:", err);
        res.status(500).json({ 
            error: "Failed to delete notification",
            message: err.message 
        });
    }
};

// Delete all notifications for user's department
const deleteAllNotifications = async (req, res) => {
    try {
        const userDept = req.user?.dept;
        const userId = req.user?.user_id ?? null; 
        const now = new Date();

        if (!userDept) {
            return res.status(400).json({ 
                error: "User department not found" 
            });
        }

        const sql = `
            UPDATE test_nscslcom_nscsl_dashboard.notifications 
            SET is_deleted = TRUE, deleted_at = ?
            WHERE LOWER(department) = LOWER(?)
                AND is_deleted = FALSE
                AND (user_id IS NULL OR user_id = ?)
        `;

        const [result] = await database.mysqlPool.query(sql, [
            now, 
            userDept,
            userId
        ]);

        res.json({ 
            message: "All notifications deleted successfully",
            deleted: result.affectedRows
        });
    } catch (err) {
        console.error("Delete all notifications error:", err);
        res.status(500).json({ 
            error: "Failed to delete all notifications",
            message: err.message 
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};