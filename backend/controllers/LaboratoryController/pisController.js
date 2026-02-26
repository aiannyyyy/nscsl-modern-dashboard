const oracledb = require('oracledb');

/**
 * Patient Information System (PIS) Controller
 * 
 * exports.searchPatients   — Search across SAMPLE_DEMOG_ARCHIVE + SAMPLE_DEMOG_MASTER
 * exports.getPatientDetail — Full detail JOIN for a single LABNO
 */

// ── User ID → Name map ────────────────────────────────────────────────────────
const USER_MAP = {
    148: 'Gretel Yedra',
    86:  'Vivien Marie Wagan',
    87:  'Mia Dimailig',
    222: 'Abigail Morfe',
    228: 'Milyne Macayanan',
    204: 'Mia Garcia',
    129: 'Jay Arr Apelado',
    202: 'Angelica Brutas',
    223: 'Adrianne De Leon',
    145: 'Kresnerfe Sta Rosa-Abueg',
    210: 'Mary Rose Gomez',
};

const resolveUser = (id) => {
    if (id === null || id === undefined) return null;
    return USER_MAP[Number(id)] ?? `User #${id}`;
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

        // ── Extract search parameters ─────────────────────────────────────────
        const {
            labno,
            labid,
            lname,
            fname,
            submid,
            birthdt,
            dtcoll,
            dtrecv,
            dtrptd,
            sex,
            phyid,
            outsideLab,
            formno,
        } = req.query;

        // ── Build dynamic WHERE clause ────────────────────────────────────────
        const conditions = [];
        const binds = {};

        if (labno)      { conditions.push(`LABNO        = :labno`);      binds.labno      = labno.trim();       }
        if (labid)      { conditions.push(`LABID        = :labid`);      binds.labid      = labid.trim();       }
        if (lname)      { conditions.push(`UPPER(LNAME) LIKE UPPER(:lname)`); binds.lname = `%${lname.trim()}%`; }
        if (fname)      { conditions.push(`UPPER(FNAME) LIKE UPPER(:fname)`); binds.fname = `%${fname.trim()}%`; }
        if (submid)     { conditions.push(`SUBMID       = :submid`);     binds.submid     = submid.trim();      }
        if (phyid)      { conditions.push(`PHYID        = :phyid`);      binds.phyid      = phyid.trim();       }
        if (sex)        { conditions.push(`SEX          = :sex`);        binds.sex        = sex.trim();         }
        if (outsideLab) { conditions.push(`OUTLAB       = :outsideLab`); binds.outsideLab = outsideLab.trim();  }
        if (formno)     { conditions.push(`FORMNO       = :formno`);     binds.formno     = formno.trim();      }

        if (birthdt) {
            conditions.push(`TRUNC(BIRTHDT) = TO_DATE(:birthdt, 'YYYY-MM-DD')`);
            binds.birthdt = birthdt.trim();
        }
        if (dtcoll) {
            conditions.push(`TRUNC(DTCOLL) = TO_DATE(:dtcoll, 'YYYY-MM-DD')`);
            binds.dtcoll = dtcoll.trim();
        }
        if (dtrecv) {
            conditions.push(`TRUNC(DTRECV) = TO_DATE(:dtrecv, 'YYYY-MM-DD')`);
            binds.dtrecv = dtrecv.trim();
        }
        if (dtrptd) {
            conditions.push(`TRUNC(DTRPTD) = TO_DATE(:dtrptd, 'YYYY-MM-DD')`);
            binds.dtrptd = dtrptd.trim();
        }

        // Require at least one param to prevent full-table scan
        if (conditions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one search parameter is required',
                message: 'Please provide at least one filter to search'
            });
        }

        const whereClause = conditions.join(' AND ');

        // ── UNION ALL: ARCHIVE + MASTER ───────────────────────────────────────
        const query = `
            SELECT
                LABNO,
                LABID,
                FNAME,
                LNAME,
                SUBMID,
                TO_CHAR(BIRTHDT, 'MM/DD/YYYY') AS BIRTHDT,
                BIRTHTM,
                TO_CHAR(DTCOLL,  'MM/DD/YYYY') AS DTCOLL,
                TMCOLL,
                TO_CHAR(DTRECV,  'MM/DD/YYYY') AS DTRECV,
                TMRECV,
                TO_CHAR(DTRPTD,  'MM/DD/YYYY') AS DTRPTD,
                GESTAGE,
                AGECOLL,
                SEX
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
            WHERE ${whereClause}

            UNION ALL

            SELECT
                LABNO,
                LABID,
                FNAME,
                LNAME,
                SUBMID,
                TO_CHAR(BIRTHDT, 'MM/DD/YYYY') AS BIRTHDT,
                BIRTHTM,
                TO_CHAR(DTCOLL,  'MM/DD/YYYY') AS DTCOLL,
                TMCOLL,
                TO_CHAR(DTRECV,  'MM/DD/YYYY') AS DTRECV,
                TMRECV,
                TO_CHAR(DTRPTD,  'MM/DD/YYYY') AS DTRPTD,
                GESTAGE,
                AGECOLL,
                SEX
            FROM PHMSDS.SAMPLE_DEMOG_MASTER
            WHERE ${whereClause}

            ORDER BY DTRECV DESC, LABNO ASC
        `;

        console.log('[PIS] Executing query with conditions:', conditions);

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const executionTime = Date.now() - startTime;
        console.log(`✅ [PIS] Success — ${result.rows.length} record(s) found`);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            filters: req.query,
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [PIS] Search error:', error);

        const executionTime = Date.now() - startTime;

        res.status(500).json({
            success: false,
            error: 'An error occurred while searching patient records',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[PIS] Database connection closed');
            } catch (closeErr) {
                console.error('❌ [PIS] Error closing connection:', closeErr);
            }
        }
    }
};

// ── Controller 2: Detail ──────────────────────────────────────────────────────
exports.getPatientDetail = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[PIS-Detail] Request received');
        console.log('[PIS-Detail] Query params:', req.query);

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
            return res.status(500).json({
                success: false,
                error:   'Database connection not available',
                message: 'Oracle connection pool is not initialized',
            });
        }

        connection = await oraclePool.getConnection();
        console.log('✅ [PIS-Detail] Database connection successful');

        const query = `
            -- ── ARCHIVE ──────────────────────────────────────────────────────
            SELECT DISTINCT
                -- Patient Identification
                s.LABNO,                                        -- Lab No
                s.LABID,                                        -- Form No
                s.LNAME,                                        -- Last Name
                s.FNAME,                                        -- First Name

                -- Birth Info
                TO_CHAR(s.BIRTHDT,   'MM/DD/YYYY')  AS BIRTHDT, -- Birth Date
                s.BIRTHTM,                                       -- Birth Time

                -- Collection Info
                TO_CHAR(s.DTCOLL,    'MM/DD/YYYY')  AS DTCOLL,  -- Date Collection
                s.TMCOLL,                                        -- Time Collection
                s.SPECTYPE,                                      -- Spec Type
                s.MILKTYPE,                                      -- Milk Type

                -- Demographics
                s.SEX,                                           -- Sex
                s.BIRTHWT,                                       -- Birth Weight
                s.TWIN,                                          -- Birth Order
                s.TRANSFUS,                                      -- Blood Transfused
                TO_CHAR(s.DTXFUS,    'MM/DD/YYYY')  AS DTXFUS,  -- Transfused Date
                s.GESTAGE,                                       -- Gestation Age
                (TRUNC(s.DTRECV) - TRUNC(s.DTCOLL)) AS SPECIMEN_AGE_DAYS, -- Specimen Age (DTRECV - DTCOLL)
                s.AGECOLL,                                       -- Age at Collection

                -- Received / Reported
                TO_CHAR(s.DTRECV,    'MM/DD/YYYY')  AS DTRECV,  -- Date Received
                s.TMRECV,                                        -- Time Received
                TO_CHAR(s.DTRPTD,    'MM/DD/YYYY')  AS DTRPTD,  -- Date Reported

                -- Status / Codes
                s.CLINSTAT,                                      -- Clinic Stat
                s.DEMCODE,                                       -- Demog Acceptable
                s.PHYSID,                                        -- Physician ID
                s.BIRTHHOSP,                                     -- Birth Hospital ID
                TO_CHAR(s.RELEASEDT, 'MM/DD/YYYY')  AS RELEASEDT, -- Demog Release

                -- Entry Technicians
                -- Resolved to names via USER_MAP: see INIT_TECH_NAME / VER_TECH_NAME in response
                s.INIT_TECH,                                     -- Initial Entry (user ID)
                s.VER_TECH,                                      -- Verification Entry (user ID)

                -- Facility / Provider (joined from REF_PROVIDER_ADDRESS)
                r.PROVIDERID,                                    -- Facility Code
                r.DESCR1,                                        -- Birth Hospital Name & Facility Name
                r.STREET1,                                       -- Address 1
                r.STREET2,                                       -- Address 2
                r.CITY,                                          -- City
                r.COUNTY,                                        -- Province
                r.PHONE,                                         -- Phone
                r.FAX,                                           -- Fax
                r.DESCR7,                                        -- Mobile
                r.EMAIL,                                         -- Email
                r.DESCR4,                                        -- Coordinator (part 1)
                r.DESCR5,                                        -- Coordinator (part 2)
                r.DESCR6,                                        -- Coordinator (part 3)

                -- Disposition / Case (joined from CASE_DEMOG_ARCHIVE)
                c.DISPOSITION,                                   -- Disposition
                TO_CHAR(c.DISPDATE,  'MM/DD/YYYY')  AS DISPDATE, -- Disposition Date
                c.USER_ID                                         -- Closed By (user ID) — resolved to CLOSED_BY_NAME in response

            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE s
            LEFT JOIN PHMSDS.REF_PROVIDER_ADDRESS r ON s.SUBMID = r.PROVIDERID
            LEFT JOIN PHCMS.CASE_DEMOG_ARCHIVE    c ON s.LABNO  = c.PATNO
            WHERE s.LABNO = :labno

            UNION ALL

            -- ── MASTER ───────────────────────────────────────────────────────
            SELECT DISTINCT
                -- Patient Identification
                s.LABNO,                                        -- Lab No
                s.LABID,                                        -- Form No
                s.LNAME,                                        -- Last Name
                s.FNAME,                                        -- First Name

                -- Birth Info
                TO_CHAR(s.BIRTHDT,   'MM/DD/YYYY')  AS BIRTHDT, -- Birth Date
                s.BIRTHTM,                                       -- Birth Time

                -- Collection Info
                TO_CHAR(s.DTCOLL,    'MM/DD/YYYY')  AS DTCOLL,  -- Date Collection
                s.TMCOLL,                                        -- Time Collection
                s.SPECTYPE,                                      -- Spec Type
                s.MILKTYPE,                                      -- Milk Type

                -- Demographics
                s.SEX,                                           -- Sex
                s.BIRTHWT,                                       -- Birth Weight
                s.TWIN,                                          -- Birth Order
                s.TRANSFUS,                                      -- Blood Transfused
                TO_CHAR(s.DTXFUS,    'MM/DD/YYYY')  AS DTXFUS,  -- Transfused Date
                s.GESTAGE,                                       -- Gestation Age
                (TRUNC(s.DTRECV) - TRUNC(s.DTCOLL)) AS SPECIMEN_AGE_DAYS, -- Specimen Age (DTRECV - DTCOLL)
                s.AGECOLL,                                       -- Age at Collection

                -- Received / Reported
                TO_CHAR(s.DTRECV,    'MM/DD/YYYY')  AS DTRECV,  -- Date Received
                s.TMRECV,                                        -- Time Received
                TO_CHAR(s.DTRPTD,    'MM/DD/YYYY')  AS DTRPTD,  -- Date Reported

                -- Status / Codes
                s.CLINSTAT,                                      -- Clinic Stat
                s.DEMCODE,                                       -- Demog Acceptable
                s.PHYSID,                                        -- Physician ID
                s.BIRTHHOSP,                                     -- Birth Hospital ID
                TO_CHAR(s.RELEASEDT, 'MM/DD/YYYY')  AS RELEASEDT, -- Demog Release

                -- Entry Technicians
                -- Resolved to names via USER_MAP: see INIT_TECH_NAME / VER_TECH_NAME in response
                s.INIT_TECH,                                     -- Initial Entry (user ID)
                s.VER_TECH,                                      -- Verification Entry (user ID)

                -- Facility / Provider (joined from REF_PROVIDER_ADDRESS)
                r.PROVIDERID,                                    -- Facility Code
                r.DESCR1,                                        -- Birth Hospital Name & Facility Name
                r.STREET1,                                       -- Address 1
                r.STREET2,                                       -- Address 2
                r.CITY,                                          -- City
                r.COUNTY,                                        -- Province
                r.PHONE,                                         -- Phone
                r.FAX,                                           -- Fax
                r.DESCR7,                                        -- Mobile
                r.EMAIL,                                         -- Email
                r.DESCR4,                                        -- Coordinator (part 1)
                r.DESCR5,                                        -- Coordinator (part 2)
                r.DESCR6,                                        -- Coordinator (part 3)

                -- Disposition / Case (joined from CASE_DEMOG_MASTER)
                c.DISPOSITION,                                   -- Disposition
                TO_CHAR(c.DISPDATE,  'MM/DD/YYYY')  AS DISPDATE, -- Disposition Date
                c.USER_ID                                         -- Closed By (user ID) — resolved to CLOSED_BY_NAME in response

            FROM PHMSDS.SAMPLE_DEMOG_MASTER s
            LEFT JOIN PHMSDS.REF_PROVIDER_ADDRESS r ON s.SUBMID = r.PROVIDERID
            LEFT JOIN PHCMS.CASE_DEMOG_MASTER     c ON s.LABNO  = c.PATNO
            WHERE s.LABNO = :labno

            ORDER BY LABNO ASC
        `;

        const result = await connection.execute(
            query,
            { labno: labno.trim() },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // ── Resolve user IDs + group by LABNO ────────────────────────────────
        const grouped = {};

        for (const row of result.rows) {
            const key = row.LABNO;

            const resolved = {
                ...row,
                INIT_TECH_NAME: resolveUser(row.INIT_TECH),
                VER_TECH_NAME:  resolveUser(row.VER_TECH),
                CLOSED_BY_NAME: resolveUser(row.USER_ID),
            };

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(resolved);
        }

        const executionTime = Date.now() - startTime;
        console.log(`✅ [PIS-Detail] Success — ${result.rows.length} record(s) found in ${executionTime}ms`);

        if (Object.keys(grouped).length === 0) {
            return res.status(404).json({
                success:       false,
                error:         'No records found',
                message:       `No patient records found for Lab No: ${labno}`,
                executionTime: `${executionTime}ms`,
            });
        }

        res.json({
            success:       true,
            data:          grouped,
            count:         result.rows.length,
            labno:         labno.trim(),
            executionTime: `${executionTime}ms`,
            timestamp:     new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ [PIS-Detail] Error:', error);

        const executionTime = Date.now() - startTime;

        res.status(500).json({
            success:       false,
            error:         'An error occurred while fetching patient detail',
            message:       process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`,
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[PIS-Detail] Database connection closed');
            } catch (closeErr) {
                console.error('❌ [PIS-Detail] Error closing connection:', closeErr);
            }
        }
    }
};

// ── Controller 3: Patient Results ────────────────────────────────────────────
exports.getPatientResults = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        const { labno } = req.query;
        if (!labno || !labno.trim()) {
            return res.status(400).json({ success: false, error: 'Missing required parameter', message: 'Lab number (labno) is required' });
        }
        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) {
            return res.status(500).json({ success: false, error: 'Database connection not available' });
        }
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
        const executionTime = Date.now() - startTime;

        res.json({
            success: true, data: result.rows, count: result.rows.length,
            labno: labno.trim(), executionTime: `${executionTime}ms`, timestamp: new Date().toISOString(),
        });
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
        console.log('[PIS-TestSeq] Request received');
        console.log('[PIS-TestSeq] Query params:', req.query);

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
            return res.status(500).json({
                success: false,
                error:   'Database connection not available',
                message: 'Oracle connection pool is not initialized',
            });
        }

        connection = await oraclePool.getConnection();
        console.log('✅ [PIS-TestSeq] Database connection successful');

        const query = `
            -- ── ARCHIVE ──────────────────────────────────────────────────────
            SELECT
                sda.LABNO,
                ra.TESTSEQ,    -- Test Sequence (SEQ)
                ra.MNEMONIC,   -- Mnemonic (MNC)
                ra.VALUE,      -- Value
                ra.RFLAG,      -- Reference Flag (RFLAG)
                ltc.ABBREV     -- Test Abbreviation
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE sda
            JOIN PHMSDS.RESULT_ARCHIVE       ra  ON sda.LABNO   = ra.LABNO
            JOIN PHMSDS.LIB_TESTCODE         ltc ON ra.TESTCODE = ltc.TESTCODE
            WHERE sda.LABNO = :labno

            UNION ALL

            -- ── MASTER ───────────────────────────────────────────────────────
            SELECT
                sda.LABNO,
                ra.TESTSEQ,
                ra.MNEMONIC,
                ra.VALUE,
                ra.RFLAG,
                ltc.ABBREV
            FROM PHMSDS.SAMPLE_DEMOG_MASTER  sda
            JOIN PHMSDS.RESULT_MASTER        ra  ON sda.LABNO   = ra.LABNO
            JOIN PHMSDS.LIB_TESTCODE         ltc ON ra.TESTCODE = ltc.TESTCODE
            WHERE sda.LABNO = :labno

            ORDER BY ABBREV ASC
        `;

        const result = await connection.execute(
            query,
            { labno: labno.trim() },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        const executionTime = Date.now() - startTime;
        console.log(`✅ [PIS-TestSeq] Success — ${result.rows.length} record(s) in ${executionTime}ms`);

        res.json({
            success:       true,
            data:          result.rows,
            count:         result.rows.length,
            labno:         labno.trim(),
            executionTime: `${executionTime}ms`,
            timestamp:     new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ [PIS-TestSeq] Error:', error);
        const executionTime = Date.now() - startTime;
        res.status(500).json({
            success:       false,
            error:         'An error occurred while fetching test sequence',
            message:       process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`,
        });
    } finally {
        if (connection) {
            try { await connection.close(); }
            catch (e) { console.error('❌ [PIS-TestSeq] Error closing connection:', e); }
        }
    }
};

// ── Controller 5: Patient Filter Cards ───────────────────────────────────────
// Fetches all LABNOs for a patient by FNAME + LNAME
// Used in the modal Patient Filter Cards section
exports.getPatientFilterCards = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[PIS-FilterCards] Request received');
        console.log('[PIS-FilterCards] Query params:', req.query);

        const { fname, lname } = req.query;

        if (!fname?.trim() || !lname?.trim()) {
            return res.status(400).json({
                success: false,
                error:   'Missing required parameters',
                message: 'Both fname and lname are required',
            });
        }

        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) {
            return res.status(500).json({ success: false, error: 'Database connection not available' });
        }

        connection = await oraclePool.getConnection();
        console.log('✅ [PIS-FilterCards] Database connection successful');

        const query = `
            -- ── ARCHIVE ──────────────────────────────────────────────────────
            SELECT
                sda.LABNO,
                sda.LNAME,
                sda.FNAME,
                TO_CHAR(sda.DTRPTD, 'MM/DD/YYYY') AS DTRPTD
            FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE sda
            WHERE UPPER(sda.FNAME) = UPPER(:fname)
              AND UPPER(sda.LNAME) = UPPER(:lname)

            UNION ALL

            -- ── MASTER ───────────────────────────────────────────────────────
            SELECT
                sda.LABNO,
                sda.LNAME,
                sda.FNAME,
                TO_CHAR(sda.DTRPTD, 'MM/DD/YYYY') AS DTRPTD
            FROM PHMSDS.SAMPLE_DEMOG_MASTER sda
            WHERE UPPER(sda.FNAME) = UPPER(:fname)
              AND UPPER(sda.LNAME) = UPPER(:lname)

            ORDER BY LABNO ASC
        `;

        const result = await connection.execute(
            query,
            { fname: fname.trim(), lname: lname.trim() },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        const executionTime = Date.now() - startTime;
        console.log(`✅ [PIS-FilterCards] Success — ${result.rows.length} record(s) in ${executionTime}ms`);

        res.json({
            success:       true,
            data:          result.rows,
            count:         result.rows.length,
            fname:         fname.trim(),
            lname:         lname.trim(),
            executionTime: `${executionTime}ms`,
            timestamp:     new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ [PIS-FilterCards] Error:', error);
        const executionTime = Date.now() - startTime;
        res.status(500).json({
            success:       false,
            error:         'An error occurred while fetching patient filter cards',
            message:       process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`,
        });
    } finally {
        if (connection) {
            try { await connection.close(); }
            catch (e) { console.error('❌ [PIS-FilterCards] Error closing connection:', e); }
        }
    }
};