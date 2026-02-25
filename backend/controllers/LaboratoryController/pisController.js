const oracledb = require('oracledb');

/**
 * Patient Information System (PIS) Controller
 * Searches SAMPLE_DEMOG_ARCHIVE + SAMPLE_DEMOG_MASTER
 * All parameters are optional — only provided fields are added to the WHERE clause
 */
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