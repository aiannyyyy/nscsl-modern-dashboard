const oracledb = require('oracledb');

/**
 * Get Cumulative Annual Census Samples
 * Returns: Annual aggregated sample counts with test_6 and enbs breakdown
 */
exports.getCumulativeAnnualCensus = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        console.log('[Cumulative Annual Census] Request received');
        console.log('[Cumulative Annual Census] Query Params:', req.query);

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
        console.log('✅ [Cumulative Annual Census] Database connection successful');
        
        /*
        // Build query with UNION ALL to combine ARCHIVE and MASTER tables
        const query = `
            SELECT 
                year_month,
                SUM(total_samples) AS total_samples,
                SUM(test_6) AS test_6,
                SUM(enbs) AS enbs
            FROM (
                SELECT 
                    TO_CHAR(DTRECV, 'YYYY-MM') AS year_month, 
                    COUNT(labno) AS total_samples,
                    SUM(CASE WHEN SPECTYPE IN ('1', '18', '87', '2', '3', '4', '5') 
                            AND DTRECV BETWEEN TO_DATE('2013-09-24', 'YYYY-MM-DD') 
                                            AND TO_DATE('2018-12-31', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS test_6,
                    SUM(CASE WHEN SPECTYPE IN ('20', '2', '3', '4', '5', '87') 
                            AND DTRECV >= TO_DATE('2018-07-16', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS enbs
                FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
                WHERE SPECTYPE IN ('1', '20', '2', '3', '4', '5', '87', '18')  
                    AND DTRECV IS NOT NULL
                GROUP BY TO_CHAR(DTRECV, 'YYYY-MM')
                
                UNION ALL
                
                SELECT 
                    TO_CHAR(DTRECV, 'YYYY-MM') AS year_month, 
                    COUNT(labno) AS total_samples,
                    SUM(CASE WHEN SPECTYPE IN ('1', '18', '87', '2', '3', '4', '5') 
                            AND DTRECV BETWEEN TO_DATE('2013-09-24', 'YYYY-MM-DD') 
                                            AND TO_DATE('2018-12-31', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS test_6,
                    SUM(CASE WHEN SPECTYPE IN ('20', '2', '3', '4', '5', '87') 
                            AND DTRECV >= TO_DATE('2018-07-16', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS enbs
                FROM PHMSDS.SAMPLE_DEMOG_MASTER
                WHERE SPECTYPE IN ('1', '20', '2', '3', '4', '5', '87', '18')  
                    AND DTRECV IS NOT NULL
                GROUP BY TO_CHAR(DTRECV, 'YYYY-MM')
            )
            GROUP BY year_month
            ORDER BY year_month ASC
        `;
        */
        const query = `
            SELECT 
                year_month,
                SUM(total_samples) AS total_samples,
                SUM(test_6) AS test_6,
                SUM(enbs) AS enbs
            FROM (
                SELECT 
                    TO_CHAR(DTRECV, 'YYYY-MM') AS year_month, 
                    COUNT(labno) AS total_samples,
                    -- Keep SPECTYPE filter for test_6 (older range)
                    SUM(CASE WHEN SPECTYPE IN ('1', '18', '87', '2', '3', '4', '5') 
                            AND DTRECV BETWEEN TO_DATE('2013-09-24', 'YYYY-MM-DD') 
                                            AND TO_DATE('2018-12-31', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS test_6,
                    -- Remove SPECTYPE filter for enbs (2018-07-16 onwards)
                    SUM(CASE WHEN DTRECV >= TO_DATE('2018-07-16', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS enbs
                FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
                WHERE DTRECV IS NOT NULL
                GROUP BY TO_CHAR(DTRECV, 'YYYY-MM')
                
                UNION ALL
                
                SELECT 
                    TO_CHAR(DTRECV, 'YYYY-MM') AS year_month, 
                    COUNT(labno) AS total_samples,
                    SUM(CASE WHEN SPECTYPE IN ('1', '18', '87', '2', '3', '4', '5') 
                            AND DTRECV BETWEEN TO_DATE('2013-09-24', 'YYYY-MM-DD') 
                                            AND TO_DATE('2018-12-31', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS test_6,
                    SUM(CASE WHEN DTRECV >= TO_DATE('2018-07-16', 'YYYY-MM-DD') 
                            THEN 1 ELSE 0 END) AS enbs
                FROM PHMSDS.SAMPLE_DEMOG_MASTER
                WHERE DTRECV IS NOT NULL
                GROUP BY TO_CHAR(DTRECV, 'YYYY-MM')
            )
            GROUP BY year_month
            ORDER BY year_month ASC
        `;

        console.log('[Cumulative Annual Census] Executing Query');

        // Execute query
        const result = await connection.execute(query, [], { 
            outFormat: oracledb.OUT_FORMAT_OBJECT 
        });

        const executionTime = Date.now() - startTime;

        console.log(`✅ [Cumulative Annual Census] Success - Retrieved ${result.rows.length} records`);

        // Send JSON Response
        res.json({
            success: true,
            data: result.rows,
            filters: {
                spectypes: ['1', '20', '2', '3', '4', '5', '87', '18'],
                dateRanges: {
                    test_6: '2013-09-24 to 2018-12-31',
                    enbs: '2018-07-16 onwards'
                }
            },
            count: result.rows.length,
            executionTime: `${executionTime}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [Cumulative Annual Census] Error:', error);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching cumulative annual census data',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('[Cumulative Annual Census] Database connection closed');
            } catch (closeErr) {
                console.error('❌ [Cumulative Annual Census] Error closing connection:', closeErr);
            }
        }
    }
};