const oracledb = require("oracledb");

// Search for patients
const searchPatients = async (req, res) => {
    let connection;
    
    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        const { labno, labid, fname, lname, submid } = req.query;

        const searchParams = [labno, labid, fname, lname, submid].filter(param => param);

        if (searchParams.length === 0) {
            return res.status(400).json({ 
                error: "Please provide at least one search parameter." 
            });
        }

        const conditions = [];
        const binds = {};

        if (labno) {
            conditions.push(`LOWER(SD."LABNO") = :labno`);
            binds.labno = labno.toLowerCase();
        }
        if (labid) {
            conditions.push(`LOWER(SD."LABID") = :labid`);
            binds.labid = labid.toLowerCase();
        }
        if (fname) {
            conditions.push(`LOWER(SD."FNAME") = :fname`);
            binds.fname = fname.toLowerCase();
        }
        if (lname) {
            conditions.push(`LOWER(SD."LNAME") = :lname`);
            binds.lname = lname.toLowerCase();
        }
        if (submid) {
            conditions.push(`LOWER(SD."SUBMID") = :submid`);
            binds.submid = submid.toLowerCase();
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const queryBase = (tableAlias, tableName) => `
            SELECT
                ${tableAlias}."LABNO",
                MAX(${tableAlias}."LABID") AS "LABID",
                MAX(${tableAlias}."FNAME") AS "FNAME",
                MAX(${tableAlias}."LNAME") AS "LNAME",
                MAX(${tableAlias}."SEX") AS "SEX",
                MAX(${tableAlias}."BIRTHDT") AS "BIRTHDT",
                MAX(${tableAlias}."BIRTHWT") AS "BIRTHWT",
                MAX(${tableAlias}."SUBMID") AS "SUBMID",
                MAX(RPA."DESCR1") AS "DESCR1",
                MAX(SN."NOTES") AS "NOTES"
            FROM
                PHMSDS.${tableName} ${tableAlias}
            LEFT JOIN PHMSDS.REF_PROVIDER_ADDRESS RPA
                ON ${tableAlias}."SUBMID" = RPA."PROVIDERID"
            LEFT JOIN PHMSDS.SAMPLE_NOTES SN
                ON ${tableAlias}."LABNO" = SN."LABNO"
            ${whereClause}
            GROUP BY
                ${tableAlias}."LABNO"
        `;

        const queryArchive = queryBase("SD", "SAMPLE_DEMOG_ARCHIVE");
        const queryMaster = queryBase("SD", "SAMPLE_DEMOG_MASTER");

        console.log("✅ Searching patients with criteria:", binds);

        // Get connection from pool
        connection = await oraclePool.getConnection();

        const resultArchive = await connection.execute(queryArchive, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const resultMaster = await connection.execute(queryMaster, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const combinedResults = [...resultArchive.rows, ...resultMaster.rows];

        console.log(`✅ Found ${combinedResults.length} patients`);

        res.status(200).json(combinedResults);

    } catch (error) {
        console.error("❌ Error searching patients:", error.message);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing Oracle connection:', err);
            }
        }
    }
};

// Get complete patient details - EXACT QUERY FROM YOUR OLD DASHBOARD
const getCompletePatientDetails = async (req, res) => {
    let connection;
    
    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        const { labno, labid } = req.query;

        if (!labno) {
            return res.status(400).json({ error: "Missing required parameter: labno" });
        }

        let whereClause = 'WHERE DEMOG."LABNO" = :labno';
        const bindParams = { labno };

        if (labid && labid.trim() !== '') {
            whereClause += ' AND DEMOG."LABID" = :labid';
            bindParams.labid = labid;
        }

        // ✅ EXACT QUERY - NO CHANGES
        const fullQuery = `
            SELECT
                DEMOG."LABNO",
                D."NAME" AS DISORDER_NAME,
                MAX(DR."MNEMONIC") AS "MNEMONIC",
                MAX(DR."DESCR1") AS "DESCR1",
                MAX(DR."DISORDERRESULTTEXT") AS "DISORDERRESULTTEXT",
                MAX(DEMOG."LABID") AS "LABID",
                MAX(DEMOG."LNAME") AS "LNAME",
                MAX(DEMOG."FNAME") AS "FNAME",
                MAX(DEMOG."SPECTYPE") AS "SPECTYPE",
                MAX(DEMOG."RELEASEDT") AS "RELEASEDT",
                MAX(DEMOG."PHYSID") AS "PHYSID",
                MAX(DEMOG."BIRTHDT") AS "BIRTHDT",
                MAX(DEMOG."BIRTHTM") AS "BIRTHTM",
                MAX(DEMOG."DTCOLL") AS "DTCOLL",
                MAX(DEMOG."TMCOLL") AS "TMCOLL",
                MAX(DEMOG."BIRTHWT") AS "BIRTHWT",
                MAX(DEMOG."DTRECV") AS "DTRECV",
                MAX(DEMOG."DTRPTD") AS "DTRPTD",
                MAX(DEMOG."SUBMID") AS "SUBMID",
                MAX(DEMOG."SEX") AS "SEX",
                MAX(DEMOG."TRANSFUS") AS "TRANSFUS",
                MAX(DEMOG."MILKTYPE") AS "MILKTYPE",
                MAX(DEMOG."GESTAGE") AS "GESTAGE",
                MAX(DEMOG."AGECOLL") AS "AGECOLL",
                MAX(DEMOG."CLINSTAT") AS "CLINSTAT",
                MAX(DEMOG."BIRTHHOSP") AS "BIRTHHOSP",
                MAX(NOTES."NOTES") AS "NOTES",
                MAX(REF."DESCR1") AS PROVIDER_DESCR1,
                MAX(DG."NAME") AS GROUP_NAME
            FROM (
                SELECT * FROM PHMSDS.RESULT_ARCHIVE
                UNION ALL
                SELECT * FROM PHMSDS.RESULT_MASTER
            ) R
            JOIN PHMSDS.LIB_DISORDER_RESULT DR 
                ON R."MNEMONIC" = DR."MNEMONIC" 
               AND R."REPTCODE" = DR."REPTCODE"
            JOIN PHMSDS.SAMPLE_DEMOG_ARCHIVE DEMOG 
                ON R."LABNO" = DEMOG."LABNO"
            LEFT JOIN PHMSDS.SAMPLE_NOTES NOTES 
                ON DEMOG."LABNO" = NOTES."LABNO"
            JOIN PHMSDS.LIB_DISORDER D 
                ON DR."REPTCODE" = D."REPTCODE"
            JOIN PHMSDS.LIB_DISORDER_GROUP DG 
                ON D."GROUPID" = DG."GROUPID"
            LEFT JOIN PHMSDS.REF_PROVIDER_ADDRESS REF 
                ON DEMOG."SUBMID" = REF."PROVIDERID"
            ${whereClause}
            GROUP BY DEMOG."LABNO", D."NAME"
            ORDER BY DEMOG."LABNO" ASC, DISORDER_NAME ASC
        `;

        console.log("✅ Complete Patient Details Query");
        console.log("✅ Bind params:", bindParams);

        // Get connection from pool
        connection = await oraclePool.getConnection();

        const result = await connection.execute(fullQuery, bindParams, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        console.log(`✅ Query executed. Rows returned: ${result.rows.length}`);

        // Return empty array if no results
        if (!result.rows || result.rows.length === 0) {
            console.log("⚠️ No results found for labno:", labno);
            return res.json([]);
        }

        // Transform to match frontend expectations
        const firstRow = result.rows[0];
        
        const patientData = {
            LABNO: firstRow.LABNO,
            LABID: firstRow.LABID,
            LNAME: firstRow.LNAME,
            FNAME: firstRow.FNAME,
            SEX: firstRow.SEX,
            BIRTHDT: firstRow.BIRTHDT,
            BIRTHTM: firstRow.BIRTHTM,
            BIRTHWT: firstRow.BIRTHWT,
            BIRTHHOSP: firstRow.BIRTHHOSP,
            SPECTYPE: firstRow.SPECTYPE,
            MILKTYPE: firstRow.MILKTYPE,
            DTCOLL: firstRow.DTCOLL,
            TMCOLL: firstRow.TMCOLL,
            DTRECV: firstRow.DTRECV,
            DTRPTD: firstRow.DTRPTD,
            RELEASEDT: firstRow.RELEASEDT,
            GESTAGE: firstRow.GESTAGE,
            AGECOLL: firstRow.AGECOLL,
            TRANSFUS: firstRow.TRANSFUS,
            CLINSTAT: firstRow.CLINSTAT,
            PHYSID: firstRow.PHYSID,
            SUBMID: firstRow.SUBMID,
            PROVIDER_DESCR1: firstRow.PROVIDER_DESCR1,
            NOTES: firstRow.NOTES,
            disorderResults: []
        };

        // Extract all disorder results
        result.rows.forEach(row => {
            if (row.DISORDER_NAME) {
                patientData.disorderResults.push({
                    LABNO: row.LABNO,
                    DISORDER_NAME: row.DISORDER_NAME,
                    MNEMONIC: row.MNEMONIC,
                    DESCR1: row.DESCR1,
                    DISORDERRESULTTEXT: row.DISORDERRESULTTEXT,
                    GROUP_NAME: row.GROUP_NAME
                });
            }
        });

        console.log("✅ Patient data prepared:");
        console.log("   - Demographics: ✓");
        console.log("   - Disorder results:", patientData.disorderResults.length);

        res.json(patientData);

    } catch (error) {
        console.error("❌ Error executing query:", error);
        console.error("❌ Error details:", error.message);
        res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing Oracle connection:', err);
            }
        }
    }
};

// Get patient details (DEPRECATED)
const getPatientDetails = async (req, res) => {
    let connection;
    
    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        const { labno } = req.params;

        if (!labno) {
            return res.status(400).json({ error: "Lab number is required" });
        }

        const query = `
            SELECT * FROM (
                SELECT * FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE WHERE "LABNO" = :labno
                UNION ALL
                SELECT * FROM PHMSDS.SAMPLE_DEMOG_MASTER WHERE "LABNO" = :labno
            ) WHERE ROWNUM = 1
        `;

        // Get connection from pool
        connection = await oraclePool.getConnection();

        const result = await connection.execute(query, { labno }, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Patient not found" });
        }

        console.log(`✅ Retrieved patient details for lab number: ${labno}`);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("❌ Error fetching patient details:", error.message);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing Oracle connection:', err);
            }
        }
    }
};

// 🆕 NEW: Get patient notebooks - using EXACT query structure
const getPatientNotebooks = async (req, res) => {
    let connection;
    
    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        const { labno, labid } = req.query;

        if (!labno) {
            return res.status(400).json({ error: "Lab number is required" });
        }

        const conditions = [];
        const binds = {};

        if (labno) {
            conditions.push(`LOWER(sd."LABNO") = :labno`);
            binds.labno = labno.toLowerCase();
        }
        if (labid && labid.trim() !== '') {
            conditions.push(`LOWER(sd."LABID") = :labid`);
            binds.labid = labid.toLowerCase();
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        // Query SAMPLE_NOTES_ARCHIVE (in PHCMS schema) with proper JOIN
        const query = `
            SELECT
                sd."LABNO",
                sd."LABID", 
                sd."LNAME", 
                sd."FNAME",
                sn."NOTES", 
                sn."LASTMOD", 
                sn."USER_ID", 
                sn."CREATE_DT", 
                sn."CREATETIME"
            FROM
                "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" sd
            JOIN
                "PHCMS"."SAMPLE_NOTES_ARCHIVE" sn
            ON
                sd."LABNO" = sn."LABNO"
            ${whereClause}
            ORDER BY sn."CREATE_DT" DESC NULLS LAST, sn."CREATETIME" DESC NULLS LAST
        `;

        console.log("✅ Fetching patient notebooks");
        console.log("✅ Bind params:", binds);

        // Get connection from pool
        connection = await oraclePool.getConnection();

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchInfo: {
                "NOTES": { type: oracledb.STRING }
            }
        });

        console.log(`✅ Found ${result.rows.length} notebook entries`);

        // Map and clean the data - handle Oracle CLOBs and complex types
        const notebookEntries = await Promise.all(result.rows.map(async (row) => {
            const cleanRow = {
                LABNO: row.LABNO || '',
                LABID: row.LABID || '',
                FNAME: row.FNAME || '',
                LNAME: row.LNAME || '',
                NOTES: '',
                LASTMOD: null,
                USER_ID: row.USER_ID || null,
                CREATE_DT: null,
                CREATETIME: row.CREATETIME || null
            };

            // Handle NOTES (might be CLOB or complex object)
            if (row.NOTES !== null && row.NOTES !== undefined) {
                try {
                    if (typeof row.NOTES === 'string') {
                        cleanRow.NOTES = row.NOTES;
                    } else if (Buffer.isBuffer(row.NOTES)) {
                        cleanRow.NOTES = row.NOTES.toString('utf8');
                    } else if (row.NOTES && typeof row.NOTES === 'object') {
                        // Handle Oracle CLOB - try different methods
                        if (typeof row.NOTES.getData === 'function') {
                            cleanRow.NOTES = await row.NOTES.getData();
                        } else if (row.NOTES.val !== undefined) {
                            cleanRow.NOTES = String(row.NOTES.val);
                        } else if (row.NOTES.toString && row.NOTES.toString() !== '[object Object]') {
                            cleanRow.NOTES = row.NOTES.toString();
                        } else {
                            // Last resort - try to stringify
                            try {
                                cleanRow.NOTES = JSON.stringify(row.NOTES);
                            } catch {
                                cleanRow.NOTES = 'Unable to read notes';
                            }
                        }
                    } else {
                        cleanRow.NOTES = String(row.NOTES);
                    }
                } catch (err) {
                    console.error('❌ Error processing NOTES field:', err);
                    cleanRow.NOTES = 'Error reading notes';
                }
            }

            // Handle LASTMOD (Date)
            if (row.LASTMOD instanceof Date) {
                cleanRow.LASTMOD = row.LASTMOD.toISOString();
            } else if (row.LASTMOD) {
                cleanRow.LASTMOD = String(row.LASTMOD);
            }

            // Handle CREATE_DT (Date)
            if (row.CREATE_DT instanceof Date) {
                cleanRow.CREATE_DT = row.CREATE_DT.toISOString();
            } else if (row.CREATE_DT) {
                cleanRow.CREATE_DT = String(row.CREATE_DT);
            }

            return cleanRow;
        }));

        console.log(`✅ Returning ${notebookEntries.length} cleaned notebook entries`);

        res.json({
            data: notebookEntries,
            count: notebookEntries.length
        });

    } catch (error) {
        console.error("❌ Error fetching patient notebooks:", error);
        console.error("❌ Error details:", error.message);
        console.error("❌ Stack:", error.stack);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing Oracle connection:', err);
            }
        }
    }
};

module.exports = {
    searchPatients,
    getCompletePatientDetails,
    getPatientDetails,
    getPatientNotebooks
};