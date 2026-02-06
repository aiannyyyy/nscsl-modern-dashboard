const oracledb = require("oracledb");

/**
 * Get speed monitoring data for entry or verification
 * @route GET /api/speed-monitoring
 * @query {string} year - Year (e.g., "2025")
 * @query {string} month - Month (e.g., "1" or "01")
 * @query {string} type - Type ("entry" or "verification")
 */
const getSpeedMonitoring = async (req, res) => {
    let connection;

    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        const { year, month, type } = req.query;

        // Validate required parameters
        if (!year || !month || !type) {
            return res.status(400).json({ 
                error: "Missing required query parameters: year, month, and type" 
            });
        }

        // Prepare date range
        const monthNum = parseInt(month, 10);
        const startDate = `${year}-${month.padStart(2, '0')}-01 00:00:00`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${year}-${month.padStart(2, '0')}-${lastDay} 23:59:59`;

        // Column mapping for entry vs verification
        const columnMap = {
            entry: {
                techColumn: `"INIT_TECH"`,
                startColumn: `"INIT_START"`,
                endColumn: `"INIT_END"`
            },
            verification: {
                techColumn: `"VER_TECH"`,
                startColumn: `"VER_START"`,
                endColumn: `"VER_END"`
            }
        };

        const cols = columnMap[type.toLowerCase()];
        if (!cols) {
            return res.status(400).json({ 
                error: "Invalid type. Use 'entry' or 'verification'." 
            });
        }

        // Build query
        const query = `
            WITH combined_data AS (
                SELECT 
                    u."FIRSTNAME",
                    TO_CHAR(sa."DTRECV", 'YYYY-MM') AS month,
                    ROUND(AVG((sa.${cols.endColumn} - sa.${cols.startColumn}) * 86400)) AS avg_seconds,
                    COUNT(sa."LABNO") AS sample_count
                FROM 
                    "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" sa
                JOIN 
                    "PHSECURE"."USERS" u ON sa.${cols.techColumn} = u."USER_ID"
                WHERE 
                    sa."DTRECV" >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS') AND
                    sa."DTRECV" <= TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS') AND
                    u."FIRSTNAME" IN ('ABIGAIL', 'ANGELICA', 'JAY ARR', 'Mary Rose')
                GROUP BY 
                    u."FIRSTNAME", TO_CHAR(sa."DTRECV", 'YYYY-MM')

                UNION ALL

                SELECT 
                    u."FIRSTNAME",
                    TO_CHAR(sm."DTRECV", 'YYYY-MM') AS month,
                    ROUND(AVG((sm.${cols.endColumn} - sm.${cols.startColumn}) * 86400)) AS avg_seconds,
                    COUNT(sm."LABNO") AS sample_count
                FROM 
                    "PHMSDS"."SAMPLE_DEMOG_MASTER" sm
                JOIN 
                    "PHSECURE"."USERS" u ON sm.${cols.techColumn} = u."USER_ID"
                WHERE 
                    sm."DTRECV" >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS') AND
                    sm."DTRECV" <= TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS') AND
                    u."FIRSTNAME" IN ('ABIGAIL', 'ANGELICA', 'JAY ARR', 'Mary Rose')
                GROUP BY 
                    u."FIRSTNAME", TO_CHAR(sm."DTRECV", 'YYYY-MM')
            )
            SELECT 
                FIRSTNAME,
                month,
                ROUND(SUM(avg_seconds * sample_count) / NULLIF(SUM(sample_count), 0)) AS monthly_avg_init_time_seconds,
                SUM(sample_count) AS total_samples
            FROM 
                combined_data
            GROUP BY 
                FIRSTNAME, month
            ORDER BY 
                FIRSTNAME, month
        `;

        // Get connection from pool
        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            query,
            { startDate, endDate },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Return results
        res.json({ 
            success: true,
            data: result.rows,
            meta: {
                year,
                month,
                type,
                count: result.rows.length
            }
        });

    } catch (error) {
        console.error("Database query error:", error);
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
    getSpeedMonitoring
};