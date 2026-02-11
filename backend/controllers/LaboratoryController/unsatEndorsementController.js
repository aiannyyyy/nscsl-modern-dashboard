const oracledb = require('oracledb');
const { database } = require('../../config');
const { sendToAllUsersInDepartment } = require('../../utils/notificationHelper');

/**
 * Lookup lab number from Oracle database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const lookupLabNumber = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { labno } = req.params;
        
        if (!labno) {
            return res.status(400).json({ 
                success: false,
                error: "Lab number is required" 
            });
        }

        console.log(`[Endorsement Lookup] Request received for labno: ${labno}`);

        // Get database connection from app.locals
        const oraclePool = req.app.locals.oracleDb;
        
        if (!oraclePool) {
            return res.status(500).json({
                success: false,
                error: 'Database connection not available',
                message: 'Oracle connection pool is not initialized'
            });
        }

        connection = await oraclePool.getConnection();

        const mergedSql = `
            SELECT DISTINCT
                "LABNO", "LNAME", "FNAME", "DTRECV", "SUBMID",
                "ADRS_TYPE", "FACILITY_NAME", "TEST_RESULT"
            FROM (
                SELECT 
                    SDA."LABNO", SDA."LNAME", SDA."FNAME", SDA."DTRECV", SDA."SUBMID",
                    RPA."ADRS_TYPE", RPA."DESCR1" AS FACILITY_NAME,
                    LDR."DESCR1" AS TEST_RESULT
                FROM
                    "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" SDA
                    JOIN "PHMSDS"."REF_PROVIDER_ADDRESS" RPA ON SDA."SUBMID" = RPA."PROVIDERID"
                    JOIN "PHMSDS"."DISORDER_ARCHIVE" DA ON SDA."LABNO" = DA."LABNO"
                    JOIN "PHMSDS"."LIB_DISORDER_RESULT" LDR ON DA."MNEMONIC" = LDR."MNEMONIC" AND DA."REPTCODE" = LDR."REPTCODE"
                WHERE
                    LDR."MNEMONIC" IN ('DE', 'INS', 'E101', 'E100', 'E102', 'E103', 'E107', 'E109', 'UD', 'ODC', 'NE', 'E108') AND
                    SDA."LABNO" = :labno AND
                    RPA."ADRS_TYPE" = '1'

                UNION

                SELECT 
                    SDM."LABNO", SDM."LNAME", SDM."FNAME", SDM."DTRECV", SDM."SUBMID",
                    RPA."ADRS_TYPE", RPA."DESCR1" AS FACILITY_NAME,
                    LDR."DESCR1" AS TEST_RESULT
                FROM
                    "PHMSDS"."SAMPLE_DEMOG_MASTER" SDM
                    JOIN "PHMSDS"."REF_PROVIDER_ADDRESS" RPA ON SDM."SUBMID" = RPA."PROVIDERID"
                    JOIN "PHMSDS"."DISORDER_MASTER" DM ON SDM."LABNO" = DM."LABNO"
                    JOIN "PHMSDS"."LIB_DISORDER_RESULT" LDR ON DM."MNEMONIC" = LDR."MNEMONIC" AND DM."REPTCODE" = LDR."REPTCODE"
                WHERE
                    LDR."MNEMONIC" IN ('DE', 'INS', 'E101', 'E100', 'E102', 'E103', 'E107', 'E109', 'UD', 'ODC', 'NE', 'E108') AND
                    SDM."LABNO" = :labno AND
                    RPA."ADRS_TYPE" = '1'
            )
            ORDER BY "LABNO" ASC
        `;

        console.log(`[Endorsement Lookup] Executing query for labno: ${labno}`);

        const result = await connection.execute(mergedSql, { labno }, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const executionTime = Date.now() - startTime;

        console.log(`[Endorsement Lookup] Query executed. Rows found: ${result.rows?.length || 0}`);

        if (result.rows && result.rows.length > 0) {
            const data = result.rows[0];
            
            console.log(`[Endorsement Lookup] Success - Lab: ${data.LABNO}, Patient: ${data.FNAME} ${data.LNAME}`);
            
            res.json({
                success: true,
                data: {
                    labNumber: data.LABNO,
                    firstName: data.FNAME,
                    lastName: data.LNAME,
                    facilityCode: data.SUBMID,
                    facilityName: data.FACILITY_NAME,
                    testResult: data.TEST_RESULT,
                    dateReceived: data.DTRECV
                },
                executionTime: `${executionTime}ms`,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`[Endorsement Lookup] Lab number not found: ${labno}`);
            
            res.status(404).json({
                success: false,
                error: 'Lab number not found',
                executionTime: `${executionTime}ms`,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ [Endorsement Lookup] Error:', error);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({ 
            success: false,
            error: 'An error occurred while looking up lab number',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            code: error.code || 'UNKNOWN_ERROR',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Endorsement Lookup] Database connection closed');
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};

// Get all endorsements
const getAllEndorsements = async (req, res) => {
    try {
        const [results] = await database.mysqlPool.query(
            `SELECT 
                id, labno, fname, lname, facility_code, facility_name, 
                test_result, remarks, attachment_path, status,
                endorsed_by, date_endorsed,
                modified_by, date_modified
            FROM test_nscslcom_nscsl_dashboard.endorsement 
            ORDER BY date_endorsed DESC`
        );
        
        console.log(`[Get All Endorsements] Retrieved ${results.length} records`);
        
        res.json(results);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ 
            error: "Database query failed",
            message: err.message 
        });
    }
};

// Create new endorsement
const createEndorsement = async (req, res) => {
    try {
        const {
            labno,
            fname,
            lname,
            facility_code,
            facility_name,
            test_result,
            remarks,
            status
        } = req.body;

        const userName = req.user?.name || req.body.endorsed_by || 'System';
        const filePaths = req.files && req.files.length > 0
            ? req.files.map((file) => "uploads/" + file.filename).join(",")
            : null;

        const now = new Date();

        const sql = `
            INSERT INTO test_nscslcom_nscsl_dashboard.endorsement 
            (labno, fname, lname, facility_code, facility_name, test_result, remarks, attachment_path, endorsed_by, date_endorsed, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await database.mysqlPool.query(sql, [
            labno,
            fname,
            lname,
            facility_code,
            facility_name,
            test_result,
            remarks || 'No remarks',
            filePaths,
            userName,
            now,
            status || 1
        ]);

        // ============================================
        // 🔔 SEND NOTIFICATION TO ALL PROGRAM USERS
        // ============================================
        console.log('📧 Attempting to send notifications to all Program users...');
        try {
            const notificationIds = await sendToAllUsersInDepartment({
                department: 'program',
                type: 'endorsement_added',
                title: 'New Endorsement Added',
                message: `Endorsement for patient ${fname} ${lname} (Lab #${labno}) from ${facility_name} has been added. Test Result: ${test_result}`,
                link: null, // ✅ Changed to null - no navigation
                reference_id: result.insertId,
                reference_type: 'endorsement',
                created_by: userName
            });
            
            console.log(`✅ Sent ${notificationIds.length} notifications to Program department users`);
        } catch (notifError) {
            console.error('⚠️ ========== NOTIFICATION FAILED ==========');
            console.error('Error:', notifError.message);
            console.error('Stack:', notifError.stack);
            console.error('⚠️ ========================================');
        }

        res.json({ 
            message: "Endorsement added successfully", 
            id: result.insertId 
        });
    } catch (err) {
        console.error("Insert error:", err);
        res.status(500).json({ 
            error: "Failed to add endorsement",
            message: err.message 
        });
    }
};

// Update endorsement
const updateEndorsement = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            labno,
            fname,
            lname,
            facility_code,
            facility_name,
            test_result,
            remarks,
            status,
            files_to_keep,
            files_to_delete
        } = req.body;

        // Get user info from session/token
        const userName = req.user?.name || req.body.modified_by || 'System';

        // Get current record to preserve endorsed_by and date_endorsed
        const [currentRecord] = await database.mysqlPool.query(
            "SELECT attachment_path, endorsed_by, date_endorsed FROM test_nscslcom_nscsl_dashboard.endorsement WHERE id = ?",
            [id]
        );

        if (currentRecord.length === 0) {
            return res.status(404).json({ error: "Endorsement not found" });
        }

        const currentAttachmentPath = currentRecord[0].attachment_path;
        const endorsedBy = currentRecord[0].endorsed_by;
        const dateEndorsed = currentRecord[0].date_endorsed;

        // Parse file management data
        let filesToKeep = [];
        let filesToDelete = [];

        try {
            if (files_to_keep) filesToKeep = JSON.parse(files_to_keep);
            if (files_to_delete) filesToDelete = JSON.parse(files_to_delete);
        } catch (error) {
            console.error("Error parsing file management data:", error);
        }

        // Handle new uploads
        let newFilePaths = [];
        if (req.files && req.files.length > 0) {
            newFilePaths = req.files.map((file) => "uploads/" + file.filename);
        }

        // Determine final attachment paths
        let attachmentPathString;

        if (files_to_keep !== undefined || files_to_delete !== undefined || newFilePaths.length > 0) {
            let finalFilePaths = [...filesToKeep, ...newFilePaths];
            attachmentPathString = finalFilePaths.length > 0 ? finalFilePaths.join(",") : null;

            // Delete files marked for deletion
            if (filesToDelete.length > 0) {
                const fs = require('fs');
                const path = require('path');
                filesToDelete.forEach(filePath => {
                    const fullPath = path.join(__dirname, '..', filePath);
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error(`Error deleting file ${filePath}:`, err);
                        } else {
                            console.log(`Successfully deleted file: ${filePath}`);
                        }
                    });
                });
            }
        } else {
            // Preserve existing attachments and add new ones
            let existingPaths = currentAttachmentPath ? currentAttachmentPath.split(',') : [];
            let allPaths = [...existingPaths, ...newFilePaths];
            attachmentPathString = allPaths.length > 0 ? allPaths.join(",") : null;
        }

        // Get current timestamp
        const now = new Date();

        // Update database
        const sql = `
            UPDATE test_nscslcom_nscsl_dashboard.endorsement 
            SET labno=?, fname=?, lname=?, facility_code=?, facility_name=?, test_result=?, remarks=?, 
                attachment_path=?, endorsed_by=?, date_endorsed=?, modified_by=?, date_modified=?, status=?
            WHERE id=?
        `;

        const [result] = await database.mysqlPool.query(sql, [
            labno,
            fname,
            lname,
            facility_code,
            facility_name,
            test_result,
            remarks || 'No remarks',
            attachmentPathString,
            endorsedBy,
            dateEndorsed,
            userName,
            now,
            status || 1,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Endorsement not found" });
        }

        res.json({
            message: "Endorsement updated successfully",
            attachments_updated: attachmentPathString ? attachmentPathString.split(',').length : 0,
            files_deleted: filesToDelete.length
        });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ 
            error: "Failed to update endorsement",
            message: err.message 
        });
    }
};

// Delete endorsement
const deleteEndorsement = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get attachment path before deleting
        const [record] = await database.mysqlPool.query(
            "SELECT attachment_path FROM test_nscslcom_nscsl_dashboard.endorsement WHERE id = ?",
            [id]
        );

        // Delete the record
        const [result] = await database.mysqlPool.query(
            "DELETE FROM test_nscslcom_nscsl_dashboard.endorsement WHERE id=?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Endorsement not found" });
        }

        // Delete associated files
        if (record.length > 0 && record[0].attachment_path) {
            const fs = require('fs');
            const path = require('path');
            const files = record[0].attachment_path.split(',');
            files.forEach(filePath => {
                const fullPath = path.join(__dirname, '..', filePath);
                fs.unlink(fullPath, (err) => {
                    if (err) console.error(`Error deleting file ${filePath}:`, err);
                });
            });
        }

        res.json({ message: "Endorsement deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ 
            error: "Failed to delete endorsement",
            message: err.message 
        });
    }
};

// Update status only
const updateEndorsementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Get user info
        const userName = req.user?.name || req.body.modified_by || 'System';
        const now = new Date();

        const [result] = await database.mysqlPool.query(
            "UPDATE test_nscslcom_nscsl_dashboard.endorsement SET status=?, modified_by=?, date_modified=? WHERE id=?",
            [status, userName, now, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Endorsement not found" });
        }

        res.json({ message: "Status updated successfully" });
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ 
            error: "Failed to update status",
            message: err.message 
        });
    }
};

// Get endorsement by ID
const getEndorsementById = async (req, res) => {
    try {
        const { id } = req.params;

        const [results] = await database.mysqlPool.query(
            "SELECT * FROM test_nscslcom_nscsl_dashboard.endorsement WHERE id = ?",
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({ error: "Endorsement not found" });
        }

        res.json(results[0]);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve endorsement",
            message: err.message 
        });
    }
};

// Get endorsements by lab number
const getEndorsementsByLabNo = async (req, res) => {
    try {
        const { labno } = req.params;

        const [results] = await database.mysqlPool.query(
            "SELECT * FROM test_nscslcom_nscsl_dashboard.endorsement WHERE labno = ? ORDER BY date_endorsed DESC",
            [labno]
        );

        res.json(results);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve endorsements",
            message: err.message 
        });
    }
};

// Get endorsements by facility code
const getEndorsementsByFacility = async (req, res) => {
    try {
        const { facility_code } = req.params;

        const [results] = await database.mysqlPool.query(
            "SELECT * FROM test_nscslcom_nscsl_dashboard.endorsement WHERE facility_code = ? ORDER BY date_endorsed DESC",
            [facility_code]
        );

        res.json(results);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve endorsements",
            message: err.message 
        });
    }
};

// Get endorsements by status
const getEndorsementsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const { startDate, endDate } = req.query;

        let sql = `
            SELECT * FROM test_nscslcom_nscsl_dashboard.endorsement
            WHERE status = ?
        `;

        const params = [status];

        if (startDate && endDate) {
            sql += " AND date_endorsed BETWEEN ? AND ?";
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += " AND date_endorsed >= ?";
            params.push(startDate);
        } else if (endDate) {
            sql += " AND date_endorsed <= ?";
            params.push(endDate);
        }

        sql += " ORDER BY date_endorsed DESC";

        const [results] = await database.mysqlPool.query(sql, params);

        res.json(results);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve endorsements",
            message: err.message 
        });
    }
};

// Get endorsement statistics
const getEndorsementStats = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const defaultFrom = new Date(year, month, 1).toISOString().split("T")[0];
        const defaultTo = new Date(year, month + 1, 0).toISOString().split("T")[0];

        const fromDate = date_from || defaultFrom;
        const toDate = date_to || defaultTo;

        const sql = `
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status = 1 THEN 1 END) AS active,
                COUNT(CASE WHEN status = 0 THEN 1 END) AS inactive
            FROM test_nscslcom_nscsl_dashboard.endorsement
            WHERE date_endorsed BETWEEN ? AND ?
        `;

        const [results] = await database.mysqlPool.query(sql, [fromDate, toDate]);

        // Convert BigInt to regular numbers
        const stats = {
            total: Number(results[0].total),
            active: Number(results[0].active),
            inactive: Number(results[0].inactive)
        };

        res.json(stats);
    } catch (err) {
        console.error("Stats query error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve statistics",
            message: err.message 
        });
    }
};

// Get unique test results for filter dropdown
const getUniqueTestResults = async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT test_result 
            FROM test_nscslcom_nscsl_dashboard.endorsement 
            WHERE test_result IS NOT NULL AND test_result != ''
            ORDER BY test_result ASC
        `;

        const [results] = await database.mysqlPool.query(sql);
        
        const testResults = results.map(row => row.test_result);
        
        res.json(testResults);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ 
            error: "Failed to retrieve test results",
            message: err.message 
        });
    }
};

module.exports = {
    lookupLabNumber,
    getAllEndorsements,
    createEndorsement,
    updateEndorsement,
    deleteEndorsement,
    updateEndorsementStatus,
    getEndorsementById,
    getEndorsementsByLabNo,
    getEndorsementsByFacility,
    getEndorsementsByStatus,
    getEndorsementStats,
    getUniqueTestResults
};