const oracledb = require('oracledb');

/**
 * Get Patient Details for Follow-up
 * Returns: patient lab results filtered by date range and optional test code
 */
exports.getPatientDetails = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[Patient Details] Request received');

        // Get query parameters
        const { dateFrom, dateTo, testCode = 'ALL' } = req.query;

        // Validate required parameters
        if (!dateFrom || !dateTo) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'dateFrom and dateTo are required query parameters'
            });
        }

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

        // Build optional test code filter
        let filterCondition = '';
        let binds = {
            StartDate: new Date(dateFrom),
            EndDate: new Date(dateTo)
        };

        if (testCode && testCode !== 'ALL') {
            filterCondition = `AND (:Code = 'ALL' OR daa."TESTCODE" = :Code OR da."MNEMONIC" = :Code)`;
            binds.Code = testCode;
        } else {
            // Still bind Code as 'ALL' so the query doesn't break if filterCondition is dynamic
            binds.Code = 'ALL';
            filterCondition = `AND (:Code = 'ALL' OR daa."TESTCODE" = :Code OR da."MNEMONIC" = :Code)`;
        }

        console.log(`[Patient Details] Date range: ${dateFrom} to ${dateTo}, Test Code: ${testCode}`);

        const query = `
            SELECT
                "LABNO", "LINK", "MNEMONIC", "VALUE", "TESTCODE", "LASTMOD", "DTRECV",
                CURRENT_DTCOLL, LINKED_DTCOLL,
                "BIRTHTM", CURRENT_TMCOLL, LINKED_TMCOLL,
                "LNAME", "FNAME", "PHYSID", "BIRTHDT",
                "BIRTHWT", "SUBMID", "SEX", "GESTAGE", "CLINSTAT", "COUNTY"
            FROM (
                SELECT
                    da."LABNO",
                    sd."LINK",
                    da."MNEMONIC",
                    daa."VALUE",
                    daa."TESTCODE",
                    daa."LASTMOD",
                    sd."DTRECV",
                    sd."DTCOLL"         AS CURRENT_DTCOLL,
                    sd_link."DTCOLL"    AS LINKED_DTCOLL,
                    sd."BIRTHTM",
                    sd."TMCOLL"         AS CURRENT_TMCOLL,
                    sd_link."TMCOLL"    AS LINKED_TMCOLL,
                    sd."LNAME",
                    sd."FNAME",
                    sd."PHYSID",
                    sd."BIRTHDT",
                    sd."BIRTHWT",
                    sd."SUBMID",
                    sd."SEX",
                    sd."GESTAGE",
                    sd."CLINSTAT",
                    rpa."COUNTY",
                    ROW_NUMBER() OVER (
                        PARTITION BY da."LABNO", sd."LINK"
                        ORDER BY sd."DTRECV" DESC
                    ) AS rn
                FROM "PHMSDS"."DISORDER_ARCHIVE"          da
                JOIN "PHMSDS"."DISORDER_AVG_ARCHIVE"      daa
                    ON  da."LABNO"    = daa."LABNO"
                    AND da."REPTCODE" = daa."REPTCODE"
                JOIN "PHMSDS"."SAMPLE_DEMOG_ARCHIVE"      sd
                    ON  da."LABNO"    = sd."LABNO"
                LEFT JOIN "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" sd_link
                    ON  sd."LINK"     = sd_link."LABNO"
                JOIN "PHMSDS"."REF_PROVIDER_ADDRESS"      rpa
                    ON  sd."SUBMID"   = rpa."PROVIDERID"
                WHERE
                    da."MNEMONIC" IN ('OHP1', 'OHP2', 'OHP3')
                    AND sd."LNAME"  <> 'CDC'
                    AND sd."DTRECV" >= :StartDate
                    AND sd."DTRECV"  < :EndDate
                    ${filterCondition}
            ) x
            WHERE rn = 1
            ORDER BY "LABNO", "LINK"
        `;

        console.log('[Patient Details] Executing query...');

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchArraySize: 1000
        });

        const rows = result.rows || [];
        const executionTime = Date.now() - startTime;

        console.log(`[Patient Details] Success - Total records: ${rows.length}, Time: ${executionTime}ms`);

        res.json({
            success: true,
            data: rows,
            meta: {
                totalRecords: rows.length,
                filters: {
                    dateFrom,
                    dateTo,
                    testCode: testCode || 'ALL'
                }
            },
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Patient Details Error:', error);

        const executionTime = Date.now() - startTime;

        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching patient details',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Patient Details] Database connection closed');
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};

/**
 * Get Valid Test Codes
 * Returns the list of all valid test code filter options
 */
exports.getTestCodes = (req, res) => {
    const testCodes = [
        'ALL',
        'BTND1', 'BTND2', 'IRT1', 'IRT2', 'IRT3',
        'OHP1', 'OHP2', 'OHP3',
        '3MCCMS', 'BARTS', 'BKDMS1', 'BKDMS2', 'CITMS1', 'CITMS2',
        'CP1MS1', 'CP1MS2', 'CP2MS1', 'CP2MS2',
        'CUDMS1', 'CUDMS2', 'GA1MS1', 'GA1MS2', 'GA2MS1', 'GA2MS2',
        'HCYMS1', 'HCYMS2', 'IVAMS1', 'IVAMS2', 'LCHMS1', 'LCHMS2',
        'LEUMS1', 'LEUMS2', 'MCAMS1', 'MCAMS2', 'MCDMS1', 'MCDMS2',
        'METMS1', 'METMS2', 'MMAMS1', 'MMAMS2',
        'PHEMS1', 'PHEMS2', 'SAMS1', 'SAMS2', 'TYRMS1', 'TYRMS2',
        'VLCMS1', 'VLCMS2',
        'F', 'FE', 'FEA', 'GC1', 'GC2', 'GC3',
        'GM1', 'GM3', 'GM6', 'GMU', 'GMV',
        'GN1', 'GN2', 'GN3'
    ];

    res.json({
        success: true,
        data: testCodes,
        total: testCodes.length,
        timestamp: new Date().toISOString()
    });
};