const oracledb = require('oracledb');

/**
 * Get Lab Tracking Statistics
 * Calculates average, median, and mode for:
 * - Collection to Receipt time (DTCOLL to DTRECV)
 * - Receipt to Report time (DTRECV to DTRPTD)
 * @returns Statistics for both ARCHIVE and MASTER tables combined
 */
exports.getLabTrackingStats = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        // Extract and validate query parameters
        let { year, month } = req.query;

        // Default to current year and month if not provided
        const currentDate = new Date();
        year = parseInt(year) || currentDate.getFullYear();
        month = parseInt(month) || (currentDate.getMonth() + 1);

        console.log('[Lab Tracking Stats] Request received:', { year, month });

        // Validate year and month
        if (year < 2000 || year > 2100) {
            return res.status(400).json({
                success: false,
                error: 'Invalid year. Must be between 2000 and 2100.'
            });
        }

        if (month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                error: 'Invalid month. Must be between 1 and 12.'
            });
        }

        // Build date range for the given month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00.00`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay} 23:59:59.00`;

        // Get database connection
        const oraclePool = req.app.locals.oracleDb;
        
        if (!oraclePool) {
            return res.status(500).json({
                success: false,
                error: 'Database connection not available',
                message: 'Oracle connection pool is not initialized'
            });
        }

        connection = await oraclePool.getConnection();

        // Query combining ARCHIVE and MASTER tables
        const query = `
            SELECT
                AVG(time_diff_coll_recv) AS AVE,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_diff_coll_recv) AS MED,
                PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY time_diff_coll_recv) AS MOD,
                AVG(time_diff_recv_rptd) AS AVE_RPTD,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_diff_recv_rptd) AS MED_RPTD,
                PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY time_diff_recv_rptd) AS MOD_RPTD
            FROM (
                SELECT
                    (DTRECV - DTCOLL) AS time_diff_coll_recv,
                    (DTRPTD - DTRECV) AS time_diff_recv_rptd
                FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
                WHERE DTRECV >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS.FF')
                AND DTRECV <= TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS.FF')
                AND DTCOLL IS NOT NULL
                AND DTRPTD IS NOT NULL

                UNION ALL

                SELECT
                    (DTRECV - DTCOLL) AS time_diff_coll_recv,
                    (DTRPTD - DTRECV) AS time_diff_recv_rptd
                FROM PHMSDS.SAMPLE_DEMOG_MASTER
                WHERE DTRECV >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS.FF')
                AND DTRECV <= TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS.FF')
                AND DTCOLL IS NOT NULL
                AND DTRPTD IS NOT NULL
            )
        `;

        console.log('[Lab Tracking Stats] Executing query...');

        const result = await connection.execute(query, { startDate, endDate }, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const executionTime = Date.now() - startTime;

        if (!result.rows || result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    dtcoll_to_dtrecv: {
                        average: 0,
                        median: 0,
                        mode: 0,
                    },
                    dtrecv_to_dtrptd: {
                        average: 0,
                        median: 0,
                        mode: 0,
                    }
                },
                filters: { year, month, startDate, endDate },
                executionTime: `${executionTime}ms`,
                timestamp: new Date().toISOString()
            });
        }

        const row = result.rows[0];

        const labeledResponse = {
            dtcoll_to_dtrecv: {
                average: row.AVE || 0,
                median: row.MED || 0,
                mode: row.MOD || 0,
            },
            dtrecv_to_dtrptd: {
                average: row.AVE_RPTD || 0,
                median: row.MED_RPTD || 0,
                mode: row.MOD_RPTD || 0,
            }
        };

        console.log(`[Lab Tracking Stats] Query completed successfully`);

        res.json({
            success: true,
            data: labeledResponse,
            filters: { year, month, startDate, endDate },
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Lab Tracking Stats Error:', error);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching lab tracking statistics',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Lab Tracking Stats] Database connection closed');
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};