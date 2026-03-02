const oracledb = require('oracledb');

/**
 * Patient Information System (PIS) Controller
 *
 * exports.searchPatients        — Search across SAMPLE_DEMOG_ARCHIVE + SAMPLE_DEMOG_MASTER
 * exports.getPatientDetail      — Full detail JOIN for a single LABNO
 * exports.getPatientResults     — Lab results for a LABNO
 * exports.getTestSequence       — Test sequence / analytes
 * exports.getPatientFilterCards — All LABNOs for a patient by FNAME + LNAME
 * exports.getAuditTrail         — Audit trail (AUDIT_RESULTS + AUDIT_SAMPLE)
 * exports.fetchImage            — Specimen scan image from file system
 * exports.getNotes              — Sample notes (PHCMS.SAMPLE_NOTES_ARCHIVE + PHSECURE.USERS)
 */

// ── Fetch user names live from phsecure.users ────────────────────────────────
const fetchUserMap = async (oraclePool, userIds) => {
    const ids = [...new Set(
        (userIds || []).filter(id => id !== null && id !== undefined)
    )].map(Number);

    if (ids.length === 0) return {};

    let conn;
    try {
        conn = await oraclePool.getConnection();

        const binds = {};
        ids.forEach((id, i) => { binds[`id${i}`] = id; });
        const inClause = ids.map((_, i) => `:id${i}`).join(', ');

        const result = await conn.execute(
            `SELECT user_id,
                    TRIM(
                        firstname || ' ' ||
                        CASE WHEN middleinit IS NOT NULL AND TRIM(middleinit) != ''
                             THEN TRIM(middleinit) || '. '
                             ELSE '' END ||
                        lastname
                    ) AS full_name
             FROM phsecure.users
             WHERE user_id IN (${inClause})`,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const map = {};
        for (const row of result.rows) {
            map[Number(row.USER_ID)] = row.FULL_NAME;
        }
        return map;
    } catch (err) {
        console.error('[PIS] fetchUserMap error:', err.message);
        return {};
    } finally {
        if (conn) { try { await conn.close(); } catch (e) {} }
    }
};

const resolveUser = (id, userMap) => {
    if (id === null || id === undefined) return null;
    return userMap[Number(id)] ?? `User #${id}`;
};

// ── Controller 1: Search ──────────────────────────────────────────────────────
exports.searchPatients = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[PIS] Search request received');
        console.log('[PIS] Query params:', req.query);

        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({
                success: false,
                error: 'Database connection not available',
                message: 'Oracle connection pool is not initialized'
            });
        }

        connection = await oraclePool.getConnection();
        console.log('✅ [PIS] Database connection successful');

        const {
            labno, labid, lname, fname, submid,
            birthdt, dtcoll, dtrecv, dtrptd,
            sex, phyid, outsideLab, formno,
        } = req.query;

        const conditions = [];
        const binds = {};

        if (labno)      { conditions.push(`LABNO        = :labno`);           binds.labno      = labno.trim();         }
        if (labid)      { conditions.push(`LABID        = :labid`);           binds.labid      = labid.trim();         }
        if (lname)      { conditions.push(`UPPER(LNAME) LIKE UPPER(:lname)`); binds.lname      = `%${lname.trim()}%`; }
        if (fname)      { conditions.push(`UPPER(FNAME) LIKE UPPER(:fname)`); binds.fname      = `%${fname.trim()}%`; }
        if (submid)     { conditions.push(`SUBMID       = :submid`);          binds.submid     = submid.trim();        }
        if (phyid)      { conditions.push(`PHYID        = :phyid`);           binds.phyid      = phyid.trim();         }
        if (sex)        { conditions.push(`SEX          = :sex`);             binds.sex        = sex.trim();           }
        if (outsideLab) { conditions.push(`OUTLAB       = :outsideLab`);      binds.outsideLab = outsideLab.trim();    }
        if (formno)     { conditions.push(`FORMNO       = :formno`);          binds.formno     = formno.trim();        }

        if (birthdt) { conditions.push(`TRUNC(BIRTHDT) = TO_DATE(:birthdt, 'YYYY-MM-DD')`); binds.birthdt = birthdt.trim(); }
        if (dtcoll)  { conditions.push(`TRUNC(DTCOLL)  = TO_DATE(:dtcoll,  'YYYY-MM-DD')`); binds.dtcoll  = dtcoll.trim();  }
        if (dtrecv)  { conditions.push(`TRUNC(DTRECV)  = TO_DATE(:dtrecv,  'YYYY-MM-DD')`); binds.dtrecv  = dtrecv.trim();  }
        if (dtrptd)  { conditions.push(`TRUNC(DTRPTD)  = TO_DATE(:dtrptd,  'YYYY-MM-DD')`); binds.dtrptd  = dtrptd.trim();  }

        if (conditions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one search parameter is required',
                message: 'Please provide at least one filter to search'
            });
        }

        const whereClause = conditions.join(' AND ');

        const query = `
            SELECT LABNO, LABID, FNAME, LNAME, SUBMID,
                TO_CHAR(BIRTHDT, 'MM/DD/YYYY') AS BIRTHDT, BIRTHTM,
                TO_CHAR(DTCOLL,  'MM/DD/YYYY') AS DTCOLL,  TMCOLL,
                TO_CHAR(DTRECV,  'MM/DD/YYYY') AS DTRECV,  TMRECV,
                TO_CHAR(DTRPTD,  'MM/DD/YYYY') AS DTRPTD,
                GESTAGE, AGECOLL, SEX
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE WHERE ${whereClause}
            UNION ALL
            SELECT LABNO, LABID, FNAME, LNAME, SUBMID,
                TO_CHAR(BIRTHDT, 'MM/DD/YYYY') AS BIRTHDT, BIRTHTM,
                TO_CHAR(DTCOLL,  'MM/DD/YYYY') AS DTCOLL,  TMCOLL,
                TO_CHAR(DTRECV,  'MM/DD/YYYY') AS DTRECV,  TMRECV,
                TO_CHAR(DTRPTD,  'MM/DD/YYYY') AS DTRPTD,
                GESTAGE, AGECOLL, SEX
            FROM PHMSDS.SAMPLE_DEMOG_MASTER WHERE ${whereClause}
            ORDER BY DTRECV DESC, LABNO ASC
        `;

        const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const executionTime = Date.now() - startTime;

        res.json({
            success: true, data: result.rows, count: result.rows.length,
            filters: req.query, executionTime: `${executionTime}ms`, timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [PIS] Search error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while searching patient records', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error('❌ [PIS] Error closing connection:', e); } }
    }
};

// ── Controller 2: Detail ──────────────────────────────────────────────────────
exports.getPatientDetail = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { labno } = req.query;
        if (!labno || !labno.trim()) return res.status(400).json({ success: false, error: 'Missing required parameter', message: 'Lab number (labno) is required' });

        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) return res.status(500).json({ success: false, error: 'Database connection not available' });

        connection = await oraclePool.getConnection();

        const query = `
            SELECT DISTINCT s.LABNO, s.LABID, s.LNAME, s.FNAME,
                TO_CHAR(s.BIRTHDT,   'MM/DD/YYYY') AS BIRTHDT, s.BIRTHTM,
                TO_CHAR(s.DTCOLL,    'MM/DD/YYYY') AS DTCOLL,  s.TMCOLL,
                s.SPECTYPE, s.MILKTYPE, s.SEX, s.BIRTHWT, s.TWIN, s.TRANSFUS,
                TO_CHAR(s.DTXFUS,    'MM/DD/YYYY') AS DTXFUS,
                s.GESTAGE, (TRUNC(s.DTRECV) - TRUNC(s.DTCOLL)) AS SPECIMEN_AGE_DAYS, s.AGECOLL,
                TO_CHAR(s.DTRECV,    'MM/DD/YYYY') AS DTRECV,  s.TMRECV,
                TO_CHAR(s.DTRPTD,    'MM/DD/YYYY') AS DTRPTD,
                s.CLINSTAT, s.DEMCODE, s.PHYSID, s.BIRTHHOSP,
                TO_CHAR(s.RELEASEDT, 'MM/DD/YYYY') AS RELEASEDT,
                s.INIT_TECH, s.VER_TECH,
                r.PROVIDERID, r.DESCR1, r.STREET1, r.STREET2, r.CITY, r.COUNTY,
                r.PHONE, r.FAX, r.DESCR7, r.EMAIL, r.DESCR4, r.DESCR5, r.DESCR6,
                c.DISPOSITION, TO_CHAR(c.DISPDATE, 'MM/DD/YYYY') AS DISPDATE, c.USER_ID
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE s
            LEFT JOIN PHMSDS.REF_PROVIDER_ADDRESS r ON s.SUBMID = r.PROVIDERID
            LEFT JOIN PHCMS.CASE_DEMOG_ARCHIVE    c ON s.LABNO  = c.PATNO
            WHERE s.LABNO = :labno
            UNION ALL
            SELECT DISTINCT s.LABNO, s.LABID, s.LNAME, s.FNAME,
                TO_CHAR(s.BIRTHDT,   'MM/DD/YYYY') AS BIRTHDT, s.BIRTHTM,
                TO_CHAR(s.DTCOLL,    'MM/DD/YYYY') AS DTCOLL,  s.TMCOLL,
                s.SPECTYPE, s.MILKTYPE, s.SEX, s.BIRTHWT, s.TWIN, s.TRANSFUS,
                TO_CHAR(s.DTXFUS,    'MM/DD/YYYY') AS DTXFUS,
                s.GESTAGE, (TRUNC(s.DTRECV) - TRUNC(s.DTCOLL)) AS SPECIMEN_AGE_DAYS, s.AGECOLL,
                TO_CHAR(s.DTRECV,    'MM/DD/YYYY') AS DTRECV,  s.TMRECV,
                TO_CHAR(s.DTRPTD,    'MM/DD/YYYY') AS DTRPTD,
                s.CLINSTAT, s.DEMCODE, s.PHYSID, s.BIRTHHOSP,
                TO_CHAR(s.RELEASEDT, 'MM/DD/YYYY') AS RELEASEDT,
                s.INIT_TECH, s.VER_TECH,
                r.PROVIDERID, r.DESCR1, r.STREET1, r.STREET2, r.CITY, r.COUNTY,
                r.PHONE, r.FAX, r.DESCR7, r.EMAIL, r.DESCR4, r.DESCR5, r.DESCR6,
                c.DISPOSITION, TO_CHAR(c.DISPDATE, 'MM/DD/YYYY') AS DISPDATE, c.USER_ID
            FROM PHMSDS.SAMPLE_DEMOG_MASTER s
            LEFT JOIN PHMSDS.REF_PROVIDER_ADDRESS r ON s.SUBMID = r.PROVIDERID
            LEFT JOIN PHCMS.CASE_DEMOG_MASTER     c ON s.LABNO  = c.PATNO
            WHERE s.LABNO = :labno
            ORDER BY LABNO ASC
        `;

        const result = await connection.execute(query, { labno: labno.trim() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        const allUserIds = result.rows.flatMap(row => [row.INIT_TECH, row.VER_TECH, row.USER_ID]);
        const userMap = await fetchUserMap(req.app.locals.oracleDb, allUserIds);

        const grouped = {};
        for (const row of result.rows) {
            const key = row.LABNO;
            const resolved = {
                ...row,
                INIT_TECH_NAME: resolveUser(row.INIT_TECH, userMap),
                VER_TECH_NAME:  resolveUser(row.VER_TECH,  userMap),
                CLOSED_BY_NAME: resolveUser(row.USER_ID,   userMap),
            };
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(resolved);
        }

        const executionTime = Date.now() - startTime;
        if (Object.keys(grouped).length === 0) return res.status(404).json({ success: false, error: 'No records found', message: `No patient records found for Lab No: ${labno}`, executionTime: `${executionTime}ms` });

        res.json({ success: true, data: grouped, count: result.rows.length, labno: labno.trim(), executionTime: `${executionTime}ms`, timestamp: new Date().toISOString() });

    } catch (error) {
        console.error('❌ [PIS-Detail] Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching patient detail', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) {} }
    }
};

// ── Controller 3: Patient Results ────────────────────────────────────────────
exports.getPatientResults = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { labno } = req.query;
        if (!labno || !labno.trim()) return res.status(400).json({ success: false, error: 'Missing required parameter', message: 'Lab number (labno) is required' });
        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) return res.status(500).json({ success: false, error: 'Database connection not available' });
        connection = await oraclePool.getConnection();

        const query = `
            SELECT ABBREV, VALUE, TESTCODE, EXPECTED, MNEMONIC, INSTRUCT, DISORDERRESULTTEXT
            FROM (
                SELECT ltc.ABBREV, sda.LABNO, ra.VALUE, ltc.DESCR1, ltc.TESTCODE, ltc.EXPECTED,
                       ldr.MNEMONIC, ldr.INSTRUCT, ldr.DISORDERRESULTTEXT,
                       ROW_NUMBER() OVER (PARTITION BY sda.LABNO, ltc.TESTCODE, ldr.MNEMONIC ORDER BY ra.LABNO) rn
                FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE sda
                JOIN PHMSDS.RESULT_ARCHIVE        ra  ON sda.LABNO   = ra.LABNO
                JOIN PHMSDS.LIB_TESTCODE          ltc ON ra.TESTCODE = ltc.TESTCODE
                JOIN PHMSDS.LIB_DISORDER_RESULT   ldr ON ra.MNEMONIC = ldr.MNEMONIC AND ra.REPTCODE = ldr.REPTCODE
                WHERE sda.LABNO = :labno
            ) WHERE rn = 1
            UNION ALL
            SELECT ABBREV, VALUE, TESTCODE, EXPECTED, MNEMONIC, INSTRUCT, DISORDERRESULTTEXT
            FROM (
                SELECT ltc.ABBREV, sda.LABNO, ra.VALUE, ltc.DESCR1, ltc.TESTCODE, ltc.EXPECTED,
                       ldr.MNEMONIC, ldr.INSTRUCT, ldr.DISORDERRESULTTEXT,
                       ROW_NUMBER() OVER (PARTITION BY sda.LABNO, ltc.TESTCODE, ldr.MNEMONIC ORDER BY ra.LABNO) rn
                FROM PHMSDS.SAMPLE_DEMOG_MASTER  sda
                JOIN PHMSDS.RESULT_MASTER         ra  ON sda.LABNO   = ra.LABNO
                JOIN PHMSDS.LIB_TESTCODE          ltc ON ra.TESTCODE = ltc.TESTCODE
                JOIN PHMSDS.LIB_DISORDER_RESULT   ldr ON ra.MNEMONIC = ldr.MNEMONIC AND ra.REPTCODE = ldr.REPTCODE
                WHERE sda.LABNO = :labno
            ) WHERE rn = 1
            ORDER BY ABBREV ASC
        `;

        const result = await connection.execute(query, { labno: labno.trim() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ success: true, data: result.rows, count: result.rows.length, labno: labno.trim(), executionTime: `${Date.now() - startTime}ms`, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('❌ [PIS-Results] Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching patient results', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
    }
};

// ── Controller 4: Test Sequence ───────────────────────────────────────────────
exports.getTestSequence = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { labno } = req.query;
        if (!labno || !labno.trim()) return res.status(400).json({ success: false, error: 'Missing required parameter', message: 'Lab number (labno) is required' });
        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) return res.status(500).json({ success: false, error: 'Database connection not available' });
        connection = await oraclePool.getConnection();

        const query = `
            SELECT sda.LABNO, ra.TESTSEQ, ra.MNEMONIC, ra.VALUE, ra.RFLAG, ltc.ABBREV
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE sda
            JOIN PHMSDS.RESULT_ARCHIVE       ra  ON sda.LABNO   = ra.LABNO
            JOIN PHMSDS.LIB_TESTCODE         ltc ON ra.TESTCODE = ltc.TESTCODE
            WHERE sda.LABNO = :labno
            UNION ALL
            SELECT sda.LABNO, ra.TESTSEQ, ra.MNEMONIC, ra.VALUE, ra.RFLAG, ltc.ABBREV
            FROM PHMSDS.SAMPLE_DEMOG_MASTER  sda
            JOIN PHMSDS.RESULT_MASTER        ra  ON sda.LABNO   = ra.LABNO
            JOIN PHMSDS.LIB_TESTCODE         ltc ON ra.TESTCODE = ltc.TESTCODE
            WHERE sda.LABNO = :labno
            ORDER BY ABBREV ASC
        `;

        const result = await connection.execute(query, { labno: labno.trim() }, { outFormat: require('oracledb').OUT_FORMAT_OBJECT });
        res.json({ success: true, data: result.rows, count: result.rows.length, labno: labno.trim(), executionTime: `${Date.now() - startTime}ms`, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('❌ [PIS-TestSeq] Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching test sequence', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error('❌ [PIS-TestSeq] Error closing connection:', e); } }
    }
};

// ── Controller 5: Patient Filter Cards ───────────────────────────────────────
exports.getPatientFilterCards = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { fname, lname } = req.query;
        if (!fname?.trim() || !lname?.trim()) return res.status(400).json({ success: false, error: 'Missing required parameters', message: 'Both fname and lname are required' });
        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) return res.status(500).json({ success: false, error: 'Database connection not available' });
        connection = await oraclePool.getConnection();

        const query = `
            SELECT sda.LABNO, sda.LNAME, sda.FNAME, TO_CHAR(sda.DTRPTD, 'MM/DD/YYYY') AS DTRPTD
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE sda
            WHERE UPPER(sda.FNAME) = UPPER(:fname) AND UPPER(sda.LNAME) = UPPER(:lname)
            UNION ALL
            SELECT sda.LABNO, sda.LNAME, sda.FNAME, TO_CHAR(sda.DTRPTD, 'MM/DD/YYYY') AS DTRPTD
            FROM PHMSDS.SAMPLE_DEMOG_MASTER sda
            WHERE UPPER(sda.FNAME) = UPPER(:fname) AND UPPER(sda.LNAME) = UPPER(:lname)
            ORDER BY LABNO ASC
        `;

        const result = await connection.execute(query, { fname: fname.trim(), lname: lname.trim() }, { outFormat: require('oracledb').OUT_FORMAT_OBJECT });
        res.json({ success: true, data: result.rows, count: result.rows.length, fname: fname.trim(), lname: lname.trim(), executionTime: `${Date.now() - startTime}ms`, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('❌ [PIS-FilterCards] Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching patient filter cards', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error('❌ [PIS-FilterCards] Error closing connection:', e); } }
    }
};

// ── Controller 6: Audit Trail ─────────────────────────────────────────────────
exports.getAuditTrail = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { labno } = req.query;
        if (!labno || !labno.trim()) return res.status(400).json({ success: false, error: 'Missing required parameter', message: 'Lab number (labno) is required' });
        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) return res.status(500).json({ success: false, error: 'Database connection not available' });
        connection = await oraclePool.getConnection();

        const query = `
            SELECT ar.LABNO, ar.TABLECOLUMN, ar.OLDDATA, ar.NEWDATA,
                TO_CHAR(ar.AUDIT_DATE, 'MM/DD/YYYY HH12:MI:SS AM') AS AUDIT_DATE,
                ar.AUDIT_USER,
                TO_CHAR(ar.LASTMOD,    'MM/DD/YYYY HH12:MI:SS AM') AS LASTMOD,
                u.USER_ID, u.FIRSTNAME, u.LASTNAME,
                TRIM(u.FIRSTNAME || ' ' || CASE WHEN u.MIDDLEINIT IS NOT NULL AND TRIM(u.MIDDLEINIT) != '' THEN TRIM(u.MIDDLEINIT) || '. ' ELSE '' END || u.LASTNAME) AS FULL_NAME,
                'AUDIT_RESULTS' AS SOURCE_TABLE
            FROM PHMSDS.AUDIT_RESULTS ar
            JOIN PHSECURE.USERS u ON ar.USER_ID = u.USER_ID
            WHERE ar.LABNO = :labno
            UNION ALL
            SELECT asmp.LABNO, asmp.TABLECOLUMN, asmp.OLDDATA, asmp.NEWDATA,
                TO_CHAR(asmp.AUDIT_DATE, 'MM/DD/YYYY HH12:MI:SS AM') AS AUDIT_DATE,
                asmp.AUDIT_USER,
                TO_CHAR(asmp.LASTMOD,    'MM/DD/YYYY HH12:MI:SS AM') AS LASTMOD,
                u.USER_ID, u.FIRSTNAME, u.LASTNAME,
                TRIM(u.FIRSTNAME || ' ' || CASE WHEN u.MIDDLEINIT IS NOT NULL AND TRIM(u.MIDDLEINIT) != '' THEN TRIM(u.MIDDLEINIT) || '. ' ELSE '' END || u.LASTNAME) AS FULL_NAME,
                'AUDIT_SAMPLE' AS SOURCE_TABLE
            FROM PHMSDS.AUDIT_SAMPLE asmp
            LEFT JOIN PHSECURE.USERS u ON asmp.USER_ID = u.USER_ID
            WHERE asmp.LABNO = :labno
            ORDER BY AUDIT_DATE DESC
        `;

        const result = await connection.execute(query, { labno: labno.trim() }, { outFormat: require('oracledb').OUT_FORMAT_OBJECT });
        res.json({ success: true, data: result.rows, count: result.rows.length, labno: labno.trim(), executionTime: `${Date.now() - startTime}ms`, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('❌ [PIS-Audit] Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while fetching audit trail', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error('❌ [PIS-Audit] Error closing connection:', e); } }
    }
};

// ── Controller 7: Fetch Specimen Image ───────────────────────────────────────
exports.fetchImage = async (req, res) => {
    let { labno } = req.query;
    if (!labno) return res.status(400).json({ error: 'Missing required parameter: labno' });

    try {
        const fs = require('fs');
        labno = labno.split(':')[0].trim();
        const year = labno.substring(0, 4);
        const extensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
        let filePath = null;

        for (const ext of extensions) {
            const tryPath = `\\\\nscsl-data\\Digital-Archive\\${year}\\Images\\${labno}${ext}`;
            if (fs.existsSync(tryPath)) { filePath = tryPath; break; }
        }

        if (!filePath) return res.status(404).json({ error: 'Picture not found', labno, year });

        const imageBuffer = fs.readFileSync(filePath);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);
    } catch (error) {
        console.error('❌ Error fetching image:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// ── Controller 8: Get Sample Notes ───────────────────────────────────────────
// Query from commented block in original controller:
//
//   SELECT SAMPLE_NOTES_ARCHIVE.LABNO, NOTES, LASTMOD, USER_ID, NOTEPRIORITY,
//          ERROR, CREATE_DT, CREATE_USER_ID, USERS.FIRSTNAME, USERS.LASTNAME
//   FROM PHCMS.SAMPLE_NOTES_ARCHIVE, PHSECURE.USERS
//   WHERE SAMPLE_NOTES_ARCHIVE.USER_ID = USERS.USER_ID
//     AND SAMPLE_NOTES_ARCHIVE.LABNO = '20260350259'
//   ORDER BY CREATE_DT DESC
//
// Enhanced: uses explicit JOIN syntax, adds second LEFT JOIN for CREATE_USER_ID,
// and resolves full names (FIRSTNAME + MIDDLEINIT + LASTNAME) for both users.
exports.getNotes = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[PIS-Notes] Request received');
        const { labno } = req.query;

        if (!labno || !labno.trim()) {
            return res.status(400).json({
                success: false,
                error:   'Missing required parameter',
                message: 'Lab number (labno) is required',
            });
        }

        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) {
            return res.status(500).json({ success: false, error: 'Database connection not available' });
        }

        connection = await oraclePool.getConnection();
        console.log('✅ [PIS-Notes] Database connection successful');

        const query = `
            SELECT
                n.LABNO,
                n.NOTES,
                n.STATUS,
                n.NOTEID,
                n.LASTMOD,
                n.USER_ID,
                n.NOTEPRIORITY,
                n.ERROR,
                n.PHONECALL,
                n.CREATE_DT,
                n.CREATE_USER_ID,
                n.CREATETIME,
                u1.FIRSTNAME AS USER_FIRSTNAME,
                u1.LASTNAME  AS USER_LASTNAME,
                u2.FIRSTNAME AS CREATE_FIRSTNAME,
                u2.LASTNAME  AS CREATE_LASTNAME
            FROM PHCMS.SAMPLE_NOTES_ARCHIVE n
            LEFT JOIN PHSECURE.USERS u1 ON n.USER_ID        = u1.USER_ID
            LEFT JOIN PHSECURE.USERS u2 ON n.CREATE_USER_ID = u2.USER_ID
            WHERE n.LABNO = :labno
            ORDER BY n.CREATE_DT DESC NULLS LAST
        `;

        const result = await connection.execute(
            query,
            { labno: labno.trim() },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                fetchInfo: {
                    'NOTES': { type: oracledb.STRING }, // force CLOB → plain string
                },
            }
        );

        const executionTime = Date.now() - startTime;
        console.log(`✅ [PIS-Notes] ${result.rows.length} note(s) in ${executionTime}ms`);

        // Manually clean each row — handles CLOB, Date, and any Oracle special types
        const safeRows = await Promise.all(result.rows.map(async (row) => {
            const clean = {
                LABNO:            row.LABNO            || '',
                NOTES:            '',
                STATUS:           row.STATUS           ?? null,
                NOTEID:           row.NOTEID           ?? null,
                LASTMOD:          null,
                USER_ID:          row.USER_ID          ?? null,
                NOTEPRIORITY:     row.NOTEPRIORITY     ?? null,
                ERROR:            row.ERROR            ?? null,
                PHONECALL:        row.PHONECALL        ?? null,
                CREATE_DT:        null,
                CREATE_USER_ID:   row.CREATE_USER_ID   ?? null,
                CREATETIME:       null,
                USER_FIRSTNAME:   row.USER_FIRSTNAME   ?? null,
                USER_LASTNAME:    row.USER_LASTNAME    ?? null,
                CREATE_FIRSTNAME: row.CREATE_FIRSTNAME ?? null,
                CREATE_LASTNAME:  row.CREATE_LASTNAME  ?? null,
            };

            // ── NOTES (CLOB) ──────────────────────────────────────────────
            if (row.NOTES !== null && row.NOTES !== undefined) {
                if (typeof row.NOTES === 'string') {
                    clean.NOTES = row.NOTES;
                } else if (Buffer.isBuffer(row.NOTES)) {
                    clean.NOTES = row.NOTES.toString('utf8');
                } else if (typeof row.NOTES === 'object') {
                    if (typeof row.NOTES.getData === 'function') {
                        clean.NOTES = await row.NOTES.getData();
                    } else if (row.NOTES.val !== undefined) {
                        clean.NOTES = String(row.NOTES.val);
                    } else if (row.NOTES.toString() !== '[object Object]') {
                        clean.NOTES = row.NOTES.toString();
                    } else {
                        clean.NOTES = 'Unable to read notes';
                    }
                } else {
                    clean.NOTES = String(row.NOTES);
                }
            }

            // ── LASTMOD (Date) ────────────────────────────────────────────
            if (row.LASTMOD instanceof Date) {
                clean.LASTMOD = row.LASTMOD.toISOString();
            } else if (row.LASTMOD) {
                clean.LASTMOD = String(row.LASTMOD);
            }

            // ── CREATE_DT (Date) ──────────────────────────────────────────
            if (row.CREATE_DT instanceof Date) {
                clean.CREATE_DT = row.CREATE_DT.toISOString();
            } else if (row.CREATE_DT) {
                clean.CREATE_DT = String(row.CREATE_DT);
            }

            // ── CREATETIME (Date) ─────────────────────────────────────────
            if (row.CREATETIME instanceof Date) {
                clean.CREATETIME = row.CREATETIME.toISOString();
            } else if (row.CREATETIME) {
                clean.CREATETIME = String(row.CREATETIME);
            }

            return clean;
        }));

        res.json({
            success:       true,
            data:          safeRows,
            count:         safeRows.length,
            labno:         labno.trim(),
            executionTime: `${executionTime}ms`,
            timestamp:     new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ [PIS-Notes] Error message:', error.message);
        console.error('❌ [PIS-Notes] ORA code:',     error.errorNum);
        console.error('❌ [PIS-Notes] Stack:',        error.stack);
        res.status(500).json({
            success:  false,
            error:    String(error.message  ?? 'Unknown error'),
            errorNum: error.errorNum        ?? null,
        });
    } finally {
        if (connection) {
            try { await connection.close(); }
            catch (e) { console.error('❌ [PIS-Notes] Error closing connection:', e); }
        }
    }
};

// ── Controller 9: Fetch Letters List ─────────────────────────────────────────
// Files live at: \\nscsl-data\Digital-Archive\Documents\
// Filename pattern: 20260580130_2026058_041656PM.jpg
// Match rule: filename starts with labno (first segment before underscore)
exports.fetchLetters = async (req, res) => {
    let { labno } = req.query;
    if (!labno) return res.status(400).json({ error: 'Missing required parameter: labno' });

    try {
        const fs   = require('fs');
        const path = require('path');

        labno = labno.split(':')[0].trim();

        const folder = `\\\\nscsl-data\\Digital-Archive\\Documents`;
        const extensions = new Set(['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']);

        // Folder must exist
        if (!fs.existsSync(folder)) {
            return res.status(404).json({ error: 'Documents folder not found', labno });
        }

        const allFiles = fs.readdirSync(folder);

        // Keep only files whose name (before first underscore) matches labno exactly
        const matched = allFiles.filter(file => {
            const ext = path.extname(file);
            if (!extensions.has(ext)) return false;
            const nameOnly = path.basename(file, ext);          // e.g. "20260580130_2026058_041656PM"
            const prefix   = nameOnly.split('_')[0];            // e.g. "20260580130"
            return prefix === labno;
        });

        if (matched.length === 0) {
            return res.status(404).json({ error: 'No letters found', labno });
        }

        // Return the list of filenames so frontend can request each one
        res.json({
            success:  true,
            labno,
            count:    matched.length,
            files:    matched,          // array of filenames
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ [PIS-Letters] Error listing letters:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// ── Controller 10: Fetch Single Letter Image ──────────────────────────────────
// GET /api/laboratory/pis/letter-image?labno=:labno&filename=:filename
exports.fetchLetterImage = async (req, res) => {
    let { labno, filename } = req.query;
    if (!labno || !filename) {
        return res.status(400).json({ error: 'Missing required parameters: labno and filename' });
    }

    try {
        const fs   = require('fs');
        const path = require('path');

        labno    = labno.split(':')[0].trim();
        filename = path.basename(filename); // strip any path traversal

        // Validate: filename must start with labno
        const nameOnly = path.basename(filename, path.extname(filename));
        const prefix   = nameOnly.split('_')[0];
        if (prefix !== labno) {
            return res.status(403).json({ error: 'Filename does not match labno' });
        }

        const filePath = `\\\\nscsl-data\\Digital-Archive\\Documents\\${filename}`;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Letter image not found', filename });
        }

        const ext      = path.extname(filename).toLowerCase();
        const mimeMap  = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
        const mimeType = mimeMap[ext] || 'image/jpeg';

        const imageBuffer = fs.readFileSync(filePath);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(imageBuffer);

    } catch (error) {
        console.error('❌ [PIS-LetterImage] Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};