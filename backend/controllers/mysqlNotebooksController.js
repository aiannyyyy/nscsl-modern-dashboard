const path = require("path");
const fs = require("fs");

// POST - Create new notebook entry with multiple file uploads
const addNotebookEntry = async (req, res) => {
    // Get MySQL connection from app.locals
    const mysqlDb = req.app.locals.mysqlDb;

    if (!mysqlDb) {
        return res.status(500).json({ error: "MySQL database is not connected" });
    }

    try {
        console.log("📝 POST /api/notebooks/add-notebook - Adding new notebook entry");
        console.log("📦 Request body:", req.body);
        console.log("📎 Request files:", req.files ? req.files.length : 0);
        
        const { 
            labno,
            labid,
            fname, 
            lname, 
            notes, 
            techCreate,
            username // 🆕 Added username parameter
        } = req.body;

        // ===== VALIDATION =====
        if (!notes || notes.trim() === '') {
            console.error("❌ Validation error: Notes field is required");
            return res.status(400).json({ error: "Notes field is required" });
        }

        if (!labno || !fname || !lname) {
            console.error("❌ Validation error: Missing required patient information");
            return res.status(400).json({ 
                error: "Missing required patient information (labno, fname, lname)" 
            });
        }

        // ✅ FIXED: Use Philippine timezone (GMT+8)
        const currentDateTime = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        const [datePart, timePart] = currentDateTime.split(', ');
        const [month, day, year] = datePart.split('/');
        const formattedDateTime = `${year}-${month}-${day} ${timePart}`;
        
        const uploadedFiles = req.files || [];
        
        // 🆕 Prioritize username, then techCreate, then SYSTEM
        const actualUser = username || techCreate || 'SYSTEM';

        console.log(`📝 Creating notebook entry for patient: ${fname} ${lname} (${labno})`);
        console.log(`👤 User: ${actualUser}`);
        console.log(`🕐 DateTime (PH): ${formattedDateTime}`);
        console.log(`📎 Number of files to upload: ${uploadedFiles.length}`);

        // If there are files, create separate entries for each file
        // Otherwise, create one entry with just notes
        if (uploadedFiles.length > 0) {
            const insertPromises = uploadedFiles.map(file => {
                const notebookData = {
                    labno: labno,
                    labid: labid || '',
                    fname: fname,
                    lname: lname,
                    code: '',
                    facility_name: '',
                    notes: notes.trim(),
                    createDate: formattedDateTime,
                    techCreate: actualUser,
                    modDate: formattedDateTime,
                    techMod: actualUser,
                    attachment_path: file.filename
                };

                const sql = `INSERT INTO test_nscslcom_nscsl_dashboard.pdo_notebook 
                             (labno, labid, fname, lname, code, facility_name, notes, createDate, techCreate, modDate, techMod, attachment_path) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const values = [
                    notebookData.labno,
                    notebookData.labid,
                    notebookData.fname,
                    notebookData.lname,
                    notebookData.code,
                    notebookData.facility_name,
                    notebookData.notes,
                    notebookData.createDate,
                    notebookData.techCreate,
                    notebookData.modDate,
                    notebookData.techMod,
                    notebookData.attachment_path
                ];

                console.log(`📎 Inserting entry with file: ${file.filename}`);
                return mysqlDb.query(sql, values);
            });

            const results = await Promise.all(insertPromises);
            
            console.log(`✅ Successfully created ${uploadedFiles.length} notebook entries with attachments`);
            
            res.status(201).json({ 
                message: `Notebook entry saved successfully with ${uploadedFiles.length} attachment(s)`,
                entries_created: uploadedFiles.length,
                files: uploadedFiles.map(f => f.filename),
                user: actualUser,
                timestamp: formattedDateTime
            });
        } else {
            // No files - create single entry with just notes
            const notebookData = {
                labno: labno,
                labid: labid || '',
                fname: fname,
                lname: lname,
                code: '',
                facility_name: '',
                notes: notes.trim(),
                createDate: formattedDateTime,
                techCreate: actualUser,
                modDate: formattedDateTime,
                techMod: actualUser,
                attachment_path: ''
            };

            const sql = `INSERT INTO test_nscslcom_nscsl_dashboard.pdo_notebook 
                         (labno, labid, fname, lname, code, facility_name, notes, createDate, techCreate, modDate, techMod, attachment_path) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                notebookData.labno,
                notebookData.labid,
                notebookData.fname,
                notebookData.lname,
                notebookData.code,
                notebookData.facility_name,
                notebookData.notes,
                notebookData.createDate,
                notebookData.techCreate,
                notebookData.modDate,
                notebookData.techMod,
                notebookData.attachment_path
            ];

            const [result] = await mysqlDb.query(sql, values);

            console.log(`✅ Notebook entry added successfully, ID: ${result.insertId}`);
            
            res.status(201).json({ 
                message: "Notebook entry saved successfully",
                id: result.insertId,
                data: notebookData,
                user: actualUser,
                timestamp: formattedDateTime
            });
        }

    } catch (err) {
        console.error("❌ Insert error:", err);
        
        // If files were uploaded but DB insert failed, delete the files
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, "..", "uploads", file.filename);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error("⚠️ Failed to delete orphaned file:", unlinkErr);
                    } else {
                        console.log("🗑️ Deleted orphaned file after DB error:", file.filename);
                    }
                });
            });
        }
        
        res.status(500).json({ 
            error: "Failed to add notebook entry", 
            details: err.message,
            sqlError: err.code 
        });
    }
};

// GET - Fetch notebook entries from MySQL (not Oracle)
const getNotebookEntriesFromMySQL = async (req, res) => {
    const mysqlDb = req.app.locals.mysqlDb;

    if (!mysqlDb) {
        return res.status(500).json({ error: "MySQL database is not connected" });
    }

    try {
        const { fname, lname, labno } = req.query;

        console.log("📊 GET /api/notebooks/mysql-entries - Fetching MySQL notebook entries", { fname, lname, labno });

        let sql = "SELECT * FROM test_nscslcom_nscsl_dashboard.pdo_notebook";
        const params = [];
        const conditions = [];

        if (fname) {
            conditions.push("fname = ?");
            params.push(fname);
        }
        if (lname) {
            conditions.push("lname = ?");
            params.push(lname);
        }
        if (labno) {
            conditions.push("labno = ?");
            params.push(labno);
        }

        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY createDate DESC";

        const [results] = await mysqlDb.query(sql, params);

        console.log(`✅ Found ${results.length} MySQL notebook entries`);
        res.json({
            data: results,
            count: results.length
        });

    } catch (err) {
        console.error("❌ Database query error:", err);
        res.status(500).json({ 
            error: "Database query failed", 
            details: err.message 
        });
    }
};

/**
 * Get recent notebook entries (last 10 from MySQL)
 */
const getRecentNotebooks = async (req, res) => {
    const mysqlDb = req.app.locals.mysqlDb;

    if (!mysqlDb) {
        return res.status(500).json({ error: "MySQL database is not connected" });
    }

    try {
        console.log("📊 GET /api/notebooks/recent - Fetching recent notebook entries");

        const query = `
            SELECT 
                labno,
                labid,
                fname,
                lname,
                notes,
                techCreate,
                createDate,
                modDate,
                attachment_path
            FROM test_nscslcom_nscsl_dashboard.pdo_notebook
            ORDER BY createDate DESC
            LIMIT 10
        `;

        const [results] = await mysqlDb.query(query);

        console.log(`✅ Found ${results.length} recent notebook entries`);

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error('❌ Error fetching recent notebooks:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch recent notebooks',
            message: error.message
        });
    }
};

// GET - Fetch patient image from network share
const fetchImage = async (req, res) => {
    let { labno } = req.query;

    if (!labno) {
        return res.status(400).json({ error: "Missing required parameter: labno" });
    }

    try {
        console.log("📸 Raw labno received:", labno);

        // Remove suffixes like :1, :0
        labno = labno.split(":")[0].trim();
        console.log("📸 Cleaned labno:", labno);

        // Extract year from labno (first 4 digits)
        const year = labno.substring(0, 4);

        const extensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
        let filePath = null;

        for (const ext of extensions) {
            const tryPath = `\\\\nscsl-data\\Digital-Archive\\${year}\\Images\\${labno}${ext}`;
            console.log("Trying path:", tryPath);

            if (fs.existsSync(tryPath)) {
                filePath = tryPath;
                console.log("✅ Image found:", filePath);
                break;
            }
        }

        if (!filePath) {
            return res.status(404).json({
                error: "Picture not found",
                labno,
                year
            });
        }

        const imageBuffer = fs.readFileSync(filePath);

        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.send(imageBuffer);

    } catch (error) {
        console.error("❌ Error fetching image:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

module.exports = {
    addNotebookEntry,
    getNotebookEntriesFromMySQL,
    getRecentNotebooks,
    fetchImage
};