const oracledb = require('oracledb');

/**
 * Get Common Error Breakdown
 * Returns: detailed breakdown of errors for a specific table column with tech info
 */
exports.getCommonErrorBreakdown = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[Common Error Breakdown] Request received');
        console.log('[Common Error Breakdown] Query params:', req.query);

        // Extract parameters from query
        const { year, month, tableColumn } = req.query;

        if (!year || !month || !tableColumn) {
            console.log('[Common Error Breakdown] Missing parameters:', { year, month, tableColumn });
            return res.status(400).json({
                success: false,
                error: 'Year, month, and tableColumn are required',
                message: 'Please provide year, month, and tableColumn parameters'
            });
        }

        // Get database connection from app.locals
        const oraclePool = req.app.locals.oracleDb;
        
        if (!oraclePool) {
            console.log('[Common Error Breakdown] Oracle pool not available');
            return res.status(500).json({
                success: false,
                error: 'Database connection not available',
                message: 'Oracle connection pool is not initialized'
            });
        }

        connection = await oraclePool.getConnection();

        // Convert month to a two-digit format (e.g., 1 -> 01, 10 -> 10)
        const monthNum = parseInt(month, 10);
        const formattedMonth = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;

        // Create start and end date strings
        const startDate = `${year}-${formattedMonth}-01 00:00:00`;

        // Get the last day of the month
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${year}-${formattedMonth}-${lastDay} 23:59:59`;

        console.log(`[Common Error Breakdown] Date range: ${startDate} to ${endDate}`);
        console.log(`[Common Error Breakdown] Table Column: ${tableColumn}`);

        const query = `
            SELECT
                SAMPLE_DEMOG_ARCHIVE."LABNO",
                SAMPLE_DEMOG_ARCHIVE."LNAME",
                SAMPLE_DEMOG_ARCHIVE."FNAME",
                SAMPLE_DEMOG_ARCHIVE."DTRECV",
                AUDIT_SAMPLE."TABLECOLUMN",
                AUDIT_SAMPLE."OLDDATA",
                AUDIT_SAMPLE."NEWDATA",
                USERS."USERNAME" AS TECH_NAME,
                USERS."USER_ID" AS TECH_ID
            FROM
                "PHMSDS"."SAMPLE_DEMOG_ARCHIVE"
            JOIN
                "PHMSDS"."USERS" USERS ON SAMPLE_DEMOG_ARCHIVE."INIT_TECH" = USERS."USER_ID"
            JOIN
                "PHMSDS"."AUDIT_SAMPLE" AUDIT_SAMPLE ON SAMPLE_DEMOG_ARCHIVE."LABNO" = AUDIT_SAMPLE."LABNO"
            WHERE
                AUDIT_SAMPLE."TABLECOLUMN" = :tableColumn
                AND AUDIT_SAMPLE."OLDDATA" <> 'N'
                AND USERS."USERNAME" IN ('MRGOMEZ', 'JMAPELADO', 'ABBRUTAS', 'AAMORFE')
                AND SAMPLE_DEMOG_ARCHIVE."DTRECV" BETWEEN 
                    TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS') 
                    AND TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS')
            ORDER BY
                SAMPLE_DEMOG_ARCHIVE."DTRECV" DESC, USERS."USERNAME" ASC
        `;

        console.log('[Common Error Breakdown] Executing query...');

        const result = await connection.execute(
            query,
            { tableColumn, startDate, endDate },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const executionTime = Date.now() - startTime;

        // Group by technician for summary
        const techSummary = result.rows.reduce((acc, row) => {
            const tech = row.TECH_NAME || 'Unknown';
            if (!acc[tech]) {
                acc[tech] = {
                    tech_name: tech,
                    tech_id: row.TECH_ID,
                    count: 0,
                    errors: []
                };
            }
            acc[tech].count++;
            acc[tech].errors.push({
                labno: row.LABNO,
                lname: row.LNAME,
                fname: row.FNAME,
                dtrecv: row.DTRECV,
                tableColumn: row.TABLECOLUMN,
                oldData: row.OLDDATA,
                newData: row.NEWDATA
            });
            return acc;
        }, {});

        console.log(`[Common Error Breakdown] Success - Retrieved ${result.rows.length} records`);
        console.log(`[Common Error Breakdown] Tech Summary:`, Object.keys(techSummary).map(tech => `${tech}: ${techSummary[tech].count}`).join(', '));

        // Send JSON Response
        res.json({
            success: true,
            data: {
                detailedRecords: result.rows,
                technicianSummary: Object.values(techSummary),
                totalRecords: result.rows.length
            },
            filters: {
                year,
                month,
                tableColumn,
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            },
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Common Error Breakdown Query Error:', error);
        console.error('❌ Error stack:', error.stack);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching common error breakdown',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Common Error Breakdown] Database connection closed');
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};


/**
 * Get Common Error Data
 * Returns: error counts by table column and technician for specified month
 */
exports.getCommonErrors = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[Common Error] Request received');

        // Extract year and month from query parameters
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                error: 'Year and month are required',
                message: 'Please provide both year and month parameters'
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

        // Convert month to a two-digit format (e.g., 1 -> 01, 10 -> 10)
        const monthNum = parseInt(month, 10);
        const formattedMonth = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;

        // Create start and end date strings
        const startDate = `${year}-${formattedMonth}-01 00:00:00`;

        // Get the last day of the month
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${year}-${formattedMonth}-${lastDay} 23:59:59`;

        console.log(`[Common Error] Date range: ${startDate} to ${endDate}`);

        const query = `
            SELECT
                AUDIT_SAMPLE."TABLECOLUMN",
                TO_CHAR(SAMPLE_DEMOG_ARCHIVE."DTRECV", 'YYYY-MM') AS month,
                COUNT(SAMPLE_DEMOG_ARCHIVE."LABNO") AS "TOTAL_COUNT",
                COUNT(CASE WHEN USERS."USERNAME" = 'MRGOMEZ' THEN SAMPLE_DEMOG_ARCHIVE."LABNO" END) AS "MRGOMEZ_COUNT",
                COUNT(CASE WHEN USERS."USERNAME" = 'JMAPELADO' THEN SAMPLE_DEMOG_ARCHIVE."LABNO" END) AS "JMAPELADO_COUNT",
                COUNT(CASE WHEN USERS."USERNAME" = 'ABBRUTAS' THEN SAMPLE_DEMOG_ARCHIVE."LABNO" END) AS "ABBRUTAS_COUNT",
                COUNT(CASE WHEN USERS."USERNAME" = 'AAMORFE' THEN SAMPLE_DEMOG_ARCHIVE."LABNO" END) AS "AAMORFE_COUNT",
                ROUND(
                    (COUNT(SAMPLE_DEMOG_ARCHIVE."LABNO") * 100.0) / 
                    SUM(COUNT(SAMPLE_DEMOG_ARCHIVE."LABNO")) OVER (),
                    2
                ) AS "PERCENTAGE"
            FROM
                "PHMSDS"."SAMPLE_DEMOG_ARCHIVE"
            JOIN
                "PHMSDS"."USERS" USERS ON SAMPLE_DEMOG_ARCHIVE."INIT_TECH" = USERS."USER_ID"
            JOIN
                "PHMSDS"."AUDIT_SAMPLE" AUDIT_SAMPLE ON SAMPLE_DEMOG_ARCHIVE."LABNO" = AUDIT_SAMPLE."LABNO"
            WHERE
                AUDIT_SAMPLE."TABLECOLUMN" NOT IN (
                    'AGECOLL', 'CMSFLAG', 'FLAG', 'LINK', 'MATCHFLAG', 'MLNAME', 'RFLAG', 'SPECTYPE', 'TWIN'
                )
                AND AUDIT_SAMPLE."OLDDATA" <> 'N'
                AND USERS."USERNAME" IN ('MRGOMEZ', 'JMAPELADO', 'ABBRUTAS', 'AAMORFE')
                AND SAMPLE_DEMOG_ARCHIVE."DTRECV" BETWEEN 
                    TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS') 
                    AND TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS')
            GROUP BY
                AUDIT_SAMPLE."TABLECOLUMN", TO_CHAR(SAMPLE_DEMOG_ARCHIVE."DTRECV", 'YYYY-MM')
            ORDER BY
                AUDIT_SAMPLE."TABLECOLUMN" ASC
        `;

        console.log('[Common Error] Executing query...');

        const result = await connection.execute(
            query,
            { startDate, endDate },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const executionTime = Date.now() - startTime;

        console.log(`[Common Error] Success - Retrieved ${result.rows.length} records`);

        // Send JSON Response
        res.json({
            success: true,
            data: result.rows,
            filters: {
                year,
                month,
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            },
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Common Error Query Error:', error);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching common error data',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Common Error] Database connection closed');
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};