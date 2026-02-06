const oracledb = require('oracledb');

/**
 * Get Laboratory Summary Card Data
 * Returns: received, screened, and unsatisfactory sample counts for specified date range
 */
exports.getCardSummary = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[Laboratory Card Summary] Request received');

        // Get date range from query parameters (optional)
        const { dateFrom, dateTo } = req.query;

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

        // Build date filter based on parameters
        let dateFilter;
        let binds = {};

        if (dateFrom && dateTo) {
            // Use custom date range
            dateFilter = `DTRECV BETWEEN TO_DATE(:dateFrom, 'YYYY-MM-DD') AND TO_DATE(:dateTo, 'YYYY-MM-DD') + 1`;
            binds = { dateFrom, dateTo };
            console.log(`[Laboratory Card Summary] Custom date range: ${dateFrom} to ${dateTo}`);
        } else {
            // Default to current month
            dateFilter = `DTRECV BETWEEN TRUNC(SYSDATE, 'MM') AND LAST_DAY(SYSDATE)`;
            console.log(`[Laboratory Card Summary] Using current month date range`);
        }

        // Queries for Each Category (ARCHIVE + MASTER tables combined)
        const queries = {
            received: `
                SELECT COUNT(*) AS TOTAL_RECEIVED
                FROM (
                    SELECT LABNO
                    FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
                    WHERE SPECTYPE IN ('5', '4', '3', '20', '2', '87')
                    AND ${dateFilter}
                    UNION ALL
                    SELECT LABNO
                    FROM PHMSDS.SAMPLE_DEMOG_MASTER
                    WHERE SPECTYPE IN ('5', '4', '3', '20', '2', '87')
                    AND ${dateFilter}
                )
            `,
            screened: `
                SELECT COUNT(*) AS TOTAL_SCREENED
                FROM (
                    SELECT LABNO
                    FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
                    WHERE SPECTYPE IN ('4', '3', '20', '2', '87')
                    AND ${dateFilter}
                    UNION ALL
                    SELECT LABNO
                    FROM PHMSDS.SAMPLE_DEMOG_MASTER
                    WHERE SPECTYPE IN ('4', '3', '20', '2', '87')
                    AND ${dateFilter}
                )
            `,
            unsatisfactory: `
                SELECT COUNT(DISTINCT LABNO) AS TOTAL_UNSAT
                FROM (
                    SELECT DISTINCT sda.LABNO
                    FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE sda
                    JOIN PHMSDS.RESULT_ARCHIVE ra ON sda.LABNO = ra.LABNO
                    WHERE ra.MNEMONIC IN ('DE', 'INS', 'E101', 'E100', 'E102', 'E103', 'E107', 'E109', 'UD', 'ODC', 'NDE', 'NE', 'E108')
                    AND sda.${dateFilter}
                    UNION ALL
                    SELECT DISTINCT sda.LABNO
                    FROM PHMSDS.SAMPLE_DEMOG_MASTER sda
                    JOIN PHMSDS.RESULT_MASTER ra ON sda.LABNO = ra.LABNO
                    WHERE ra.MNEMONIC IN ('DE', 'INS', 'E101', 'E100', 'E102', 'E103', 'E107', 'E109', 'UD', 'ODC', 'NDE', 'NE', 'E108')
                    AND sda.${dateFilter}
                )
            `
        };

        // Execute Queries
        console.log('[Laboratory Card Summary] Executing queries...');
        
        const [receivedResult, screenedResult, unsatResult] = await Promise.all([
            connection.execute(queries.received, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(queries.screened, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(queries.unsatisfactory, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT })
        ]);

        // Get Values
        const totalReceived = receivedResult.rows[0]?.TOTAL_RECEIVED || 0;
        const totalScreened = screenedResult.rows[0]?.TOTAL_SCREENED || 0;
        const totalUnsat = unsatResult.rows[0]?.TOTAL_UNSAT || 0;

        const executionTime = Date.now() - startTime;

        console.log(`[Laboratory Card Summary] Success - Received: ${totalReceived}, Screened: ${totalScreened}, Unsat: ${totalUnsat}`);

        // Send JSON Response
        res.json({
            success: true,
            data: {
                received: totalReceived,
                screened: totalScreened,
                unsat: totalUnsat
            },
            filters: dateFrom && dateTo ? {
                dateFrom,
                dateTo,
                type: 'custom'
            } : {
                type: 'current_month'
            },
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Laboratory Card Summary Error:', error);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching laboratory summary data',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Laboratory Card Summary] Database connection closed');
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};