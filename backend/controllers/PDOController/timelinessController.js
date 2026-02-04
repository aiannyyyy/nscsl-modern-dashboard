const oracledb = require('oracledb');

exports.getTimelinessData = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        // Validate required parameters
        const { year1, year2, month, province } = req.query;

        if (!year1 || !year2 || !month || !province) {
            return res.status(400).json({
                success: false,
                error: 'Missing required query parameters: year1, year2, month, province'
            });
        }

        // Validate and parse inputs
        const monthInt = parseInt(month, 10);
        const year1Int = parseInt(year1, 10);
        const year2Int = parseInt(year2, 10);

        if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            return res.status(400).json({
                success: false,
                error: 'Invalid month value, must be between 1 and 12'
            });
        }

        if (isNaN(year1Int) || isNaN(year2Int)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid year values'
            });
        }

        // Calculate date ranges
        const monthPadded = monthInt.toString().padStart(2, '0');
        const date_from_year1 = `${year1Int}-${monthPadded}-01`;
        const date_from_year2 = `${year2Int}-${monthPadded}-01`;

        const nextMonth = monthInt === 12 ? 1 : monthInt + 1;
        const nextMonthYear1 = monthInt === 12 ? year1Int + 1 : year1Int;
        const nextMonthYear2 = monthInt === 12 ? year2Int + 1 : year2Int;
        const nextMonthPadded = nextMonth.toString().padStart(2, '0');

        const date_to_year1 = `${nextMonthYear1}-${nextMonthPadded}-01`;
        const date_to_year2 = `${nextMonthYear2}-${nextMonthPadded}-01`;

        // Get database connection from app.locals (set in server.js)
        const oraclePool = req.app.locals.oracleDb;
        
        if (!oraclePool) {
            return res.status(500).json({
                success: false,
                error: 'Database connection not available',
                message: 'Oracle connection pool is not initialized'
            });
        }

        connection = await oraclePool.getConnection();
        /*
        // SQL Query
        const query = `
            SELECT
                p.COUNTY,
                TO_CHAR(r.DTRECV, 'YYYY-MM') AS MONTH_YEAR,
                ROUND(AVG(r.DTRECV - r.DTCOLL), 2)        AS DTCOLL_DTRECV_MEAN,
                ROUND(MEDIAN(r.DTRECV - r.DTCOLL), 2)     AS DTCOLL_DTRECV_MEDIAN,
                ROUND(STATS_MODE(r.DTRECV - r.DTCOLL), 2) AS DTCOLL_DTRECV_MODE,
                ROUND(AVG(r.DTRECV - r.BIRTHDT), 2)        AS AGE_RECEIVED_MEAN,
                ROUND(MEDIAN(r.DTRECV - r.BIRTHDT), 2)     AS AGE_RECEIVED_MEDIAN,
                ROUND(STATS_MODE(r.DTRECV - r.BIRTHDT), 2) AS AGE_RECEIVED_MODE,
                ROUND(AVG(r.DTCOLL - r.BIRTHDT), 2)        AS AGE_COLLECTION_MEAN,
                ROUND(MEDIAN(r.DTCOLL - r.BIRTHDT), 2)     AS AGE_COLLECTION_MEDIAN,
                ROUND(STATS_MODE(r.DTCOLL - r.BIRTHDT), 2) AS AGE_COLLECTION_MODE,
                COUNT(*) AS RECORD_COUNT
            FROM USER1.RESULT_TRACKING_SYSTEM1 r
            JOIN USER1.SAMPLE_TRACKING1 s
              ON r.SUBMID = s.SUBMID
             AND TRUNC(r.DTRECV) = TRUNC(s.TRACKDATE)
            JOIN PHMSDS.REF_PROVIDER_ADDRESS p
              ON s.SUBMID = p.PROVIDERID
            WHERE (
                    (r.DTRECV >= TO_DATE(:date_from_year1, 'YYYY-MM-DD')
                    AND r.DTRECV < TO_DATE(:date_to_year1, 'YYYY-MM-DD'))
                    OR
                    (r.DTRECV >= TO_DATE(:date_from_year2, 'YYYY-MM-DD')
                    AND r.DTRECV < TO_DATE(:date_to_year2, 'YYYY-MM-DD'))
                )
                AND UPPER(p.COUNTY) LIKE UPPER(:province || '%')
                AND p.COUNTY IS NOT NULL
                AND r.BIRTHDT IS NOT NULL
                AND r.DTCOLL IS NOT NULL
                AND (r.DTRECV - r.BIRTHDT) <= 20
            GROUP BY
                p.COUNTY,
                TO_CHAR(r.DTRECV, 'YYYY-MM')
            ORDER BY
                p.COUNTY,
                TO_CHAR(r.DTRECV, 'YYYY-MM')
        `;
        */
       // --- inside your controller ---
    const query = `
        SELECT
            p.COUNTY,
            TO_CHAR(r.DTRECV, 'YYYY-MM') AS MONTH_YEAR,
            ROUND(AVG(r.DTRECV - r.DTCOLL), 2)        AS DTCOLL_DTRECV_MEAN,
            ROUND(MEDIAN(r.DTRECV - r.DTCOLL), 2)     AS DTCOLL_DTRECV_MEDIAN,
            ROUND(STATS_MODE(r.DTRECV - r.DTCOLL), 2) AS DTCOLL_DTRECV_MODE,
            ROUND(AVG(r.DTRECV - r.BIRTHDT), 2)        AS AGE_RECEIVED_MEAN,
            ROUND(MEDIAN(r.DTRECV - r.BIRTHDT), 2)     AS AGE_RECEIVED_MEDIAN,
            ROUND(STATS_MODE(r.DTRECV - r.BIRTHDT), 2) AS AGE_RECEIVED_MODE,
            ROUND(AVG(r.DTCOLL - r.BIRTHDT), 2)        AS AGE_COLLECTION_MEAN,
            ROUND(MEDIAN(r.DTCOLL - r.BIRTHDT), 2)     AS AGE_COLLECTION_MEDIAN,
            ROUND(STATS_MODE(r.DTCOLL - r.BIRTHDT), 2) AS AGE_COLLECTION_MODE,
            COUNT(*) AS RECORD_COUNT
        FROM USER1.RESULT_TRACKING_SYSTEM1 r
        JOIN USER1.SAMPLE_TRACKING1 s
        ON r.SUBMID = s.SUBMID
        AND TRUNC(r.DTRECV) = TRUNC(s.TRACKDATE)
        JOIN PHMSDS.REF_PROVIDER_ADDRESS p
        ON s.SUBMID = p.PROVIDERID
        WHERE (
                (r.DTRECV >= TO_DATE(:date_from_year1, 'YYYY-MM-DD')
                AND r.DTRECV < TO_DATE(:date_to_year1, 'YYYY-MM-DD'))
                OR
                (r.DTRECV >= TO_DATE(:date_from_year2, 'YYYY-MM-DD')
                AND r.DTRECV < TO_DATE(:date_to_year2, 'YYYY-MM-DD'))
            )
        AND UPPER(p.COUNTY) LIKE UPPER(:province || '%')
        AND p.COUNTY IS NOT NULL
        AND r.BIRTHDT IS NOT NULL
        AND r.DTCOLL IS NOT NULL
        AND (r.DTRELEASE - r.BIRTHDT) <= 20          -- @TOTDAYSDOB
        AND (s.DATE_PICKUP - r.DTCOLL) >= 1          -- @DTCOLL-PCKUP
        AND (r.DTRECV - s.DATE_PICKUP) > 0           -- @PCKUP-DTRECV
        GROUP BY
            p.COUNTY,
            TO_CHAR(r.DTRECV, 'YYYY-MM')
        ORDER BY
            p.COUNTY,
            TO_CHAR(r.DTRECV, 'YYYY-MM')
    `;

        const binds = {
            date_from_year1,
            date_to_year1,
            date_from_year2,
            date_to_year2,
            province: province.trim()
        };

        // Execute query
        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchArraySize: 1000,
            maxRows: 0
        });

        const executionTime = Date.now() - startTime;

        // Handle empty results
        if (!result.rows || result.rows.length === 0) {
            return res.json({
                success: true,
                message: "No data found for the specified criteria",
                data: [],
                executionTime: `${executionTime}ms`,
                recordCount: 0
            });
        }

        // Transform the data to match frontend expectations
        // Group by year to separate year1 and year2 data
        const year1Data = result.rows.find(row => row.MONTH_YEAR.startsWith(year1));
        const year2Data = result.rows.find(row => row.MONTH_YEAR.startsWith(year2));

        // Create transformed data structure with Mean, Median, and Mode
        const transformedData = [{
            month: `${monthInt}`,
            
            // Age of Collection (AOC) - Mean, Median, Mode
            aoc_mean_year1: year1Data?.AGE_COLLECTION_MEAN || 0,
            aoc_mean_year2: year2Data?.AGE_COLLECTION_MEAN || 0,
            aoc_median_year1: year1Data?.AGE_COLLECTION_MEDIAN || 0,
            aoc_median_year2: year2Data?.AGE_COLLECTION_MEDIAN || 0,
            aoc_mode_year1: year1Data?.AGE_COLLECTION_MODE || 0,
            aoc_mode_year2: year2Data?.AGE_COLLECTION_MODE || 0,
            
            // Transit Time - Mean, Median, Mode
            transit_mean_year1: year1Data?.DTCOLL_DTRECV_MEAN || 0,
            transit_mean_year2: year2Data?.DTCOLL_DTRECV_MEAN || 0,
            transit_median_year1: year1Data?.DTCOLL_DTRECV_MEDIAN || 0,
            transit_median_year2: year2Data?.DTCOLL_DTRECV_MEDIAN || 0,
            transit_mode_year1: year1Data?.DTCOLL_DTRECV_MODE || 0,
            transit_mode_year2: year2Data?.DTCOLL_DTRECV_MODE || 0,
            
            // Age Upon Receipt (AUR) - Mean, Median, Mode
            aur_mean_year1: year1Data?.AGE_RECEIVED_MEAN || 0,
            aur_mean_year2: year2Data?.AGE_RECEIVED_MEAN || 0,
            aur_median_year1: year1Data?.AGE_RECEIVED_MEDIAN || 0,
            aur_median_year2: year2Data?.AGE_RECEIVED_MEDIAN || 0,
            aur_mode_year1: year1Data?.AGE_RECEIVED_MODE || 0,
            aur_mode_year2: year2Data?.AGE_RECEIVED_MODE || 0,
        }];

        // Return successful response with transformed data
        res.json({
            success: true,
            data: transformedData,
            executionTime: `${executionTime}ms`,
            recordCount: transformedData.length,
            rawDataCount: result.rows.length,
            filters: {
                year1: year1Int,
                year2: year2Int,
                month: monthInt,
                province: province.trim()
            },
            // Include debug info in development
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    year1DataFound: !!year1Data,
                    year2DataFound: !!year2Data,
                    rawRows: result.rows.length
                }
            })
        });

    } catch (err) {
        console.error('❌ Database error:', err);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching timeliness data',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error('❌ Error closing connection:', closeErr);
            }
        }
    }
};

exports.getTimelinessDataNoCounty = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        // Validate required parameters
        const { year1, year2, month } = req.query;

        if (!year1 || !year2 || !month) {
            return res.status(400).json({
                success: false,
                error: 'Missing required query parameters: year1, year2, month'
            });
        }

        // Validate and parse inputs
        const monthInt = parseInt(month, 10);
        const year1Int = parseInt(year1, 10);
        const year2Int = parseInt(year2, 10);

        if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            return res.status(400).json({
                success: false,
                error: 'Invalid month value, must be between 1 and 12'
            });
        }

        if (isNaN(year1Int) || isNaN(year2Int)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid year values'
            });
        }

        // Calculate date ranges
        const monthPadded = monthInt.toString().padStart(2, '0');
        const date_from_year1 = `${year1Int}-${monthPadded}-01`;
        const date_from_year2 = `${year2Int}-${monthPadded}-01`;

        const nextMonth = monthInt === 12 ? 1 : monthInt + 1;
        const nextMonthYear1 = monthInt === 12 ? year1Int + 1 : year1Int;
        const nextMonthYear2 = monthInt === 12 ? year2Int + 1 : year2Int;
        const nextMonthPadded = nextMonth.toString().padStart(2, '0');

        const date_to_year1 = `${nextMonthYear1}-${nextMonthPadded}-01`;
        const date_to_year2 = `${nextMonthYear2}-${nextMonthPadded}-01`;

        // Get database connection from app.locals (set in server.js)
        const oraclePool = req.app.locals.oracleDb;
        if (!oraclePool) {
            return res.status(500).json({
                success: false,
                error: 'Database connection not available',
                message: 'Oracle connection pool is not initialized'
            });
        }

        connection = await oraclePool.getConnection();

        // SQL Query (no COUNTY)
        const query = `
            SELECT
                TO_CHAR(r.DTRECV, 'YYYY-MM') AS MONTH_YEAR,
                ROUND(AVG(r.DTRECV - r.DTCOLL), 2)        AS DTCOLL_DTRECV_MEAN,
                ROUND(MEDIAN(r.DTRECV - r.DTCOLL), 2)     AS DTCOLL_DTRECV_MEDIAN,
                ROUND(STATS_MODE(r.DTRECV - r.DTCOLL), 2) AS DTCOLL_DTRECV_MODE,
                ROUND(AVG(r.DTRECV - r.BIRTHDT), 2)        AS AGE_RECEIVED_MEAN,
                ROUND(MEDIAN(r.DTRECV - r.BIRTHDT), 2)     AS AGE_RECEIVED_MEDIAN,
                ROUND(STATS_MODE(r.DTRECV - r.BIRTHDT), 2) AS AGE_RECEIVED_MODE,
                ROUND(AVG(r.DTCOLL - r.BIRTHDT), 2)        AS AGE_COLLECTION_MEAN,
                ROUND(MEDIAN(r.DTCOLL - r.BIRTHDT), 2)     AS AGE_COLLECTION_MEDIAN,
                ROUND(STATS_MODE(r.DTCOLL - r.BIRTHDT), 2) AS AGE_COLLECTION_MODE,
                COUNT(*) AS RECORD_COUNT
            FROM USER1.RESULT_TRACKING_SYSTEM1 r
            JOIN USER1.SAMPLE_TRACKING1 s
              ON r.SUBMID = s.SUBMID
             AND TRUNC(r.DTRECV) = TRUNC(s.TRACKDATE)
            WHERE (
                    (r.DTRECV >= TO_DATE(:date_from_year1, 'YYYY-MM-DD')
                     AND r.DTRECV < TO_DATE(:date_to_year1, 'YYYY-MM-DD'))
                    OR
                    (r.DTRECV >= TO_DATE(:date_from_year2, 'YYYY-MM-DD')
                     AND r.DTRECV < TO_DATE(:date_to_year2, 'YYYY-MM-DD'))
                  )
              AND r.BIRTHDT IS NOT NULL
              AND r.DTCOLL IS NOT NULL
              AND (r.DTRELEASE - r.BIRTHDT) <= 20          -- @TOTDAYSDOB
              AND (s.DATE_PICKUP - r.DTCOLL) >= 1          -- @DTCOLL-PCKUP
              AND (r.DTRECV - s.DATE_PICKUP) > 0           -- @PCKUP-DTRECV
            GROUP BY
                TO_CHAR(r.DTRECV, 'YYYY-MM')
            ORDER BY
                TO_CHAR(r.DTRECV, 'YYYY-MM')
        `;

        const binds = {
            date_from_year1,
            date_to_year1,
            date_from_year2,
            date_to_year2
        };

        // Execute query
        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchArraySize: 1000,
            maxRows: 0
        });

        const executionTime = Date.now() - startTime;

        if (!result.rows || result.rows.length === 0) {
            return res.json({
                success: true,
                message: "No data found for the specified criteria",
                data: [],
                executionTime: `${executionTime}ms`,
                recordCount: 0
            });
        }

        // Transform data for frontend
        const year1Data = result.rows.find(row => row.MONTH_YEAR.startsWith(year1));
        const year2Data = result.rows.find(row => row.MONTH_YEAR.startsWith(year2));

        const transformedData = [{
            month: `${monthInt}`,

            // Age of Collection
            aoc_mean_year1: year1Data?.AGE_COLLECTION_MEAN || 0,
            aoc_mean_year2: year2Data?.AGE_COLLECTION_MEAN || 0,
            aoc_median_year1: year1Data?.AGE_COLLECTION_MEDIAN || 0,
            aoc_median_year2: year2Data?.AGE_COLLECTION_MEDIAN || 0,
            aoc_mode_year1: year1Data?.AGE_COLLECTION_MODE || 0,
            aoc_mode_year2: year2Data?.AGE_COLLECTION_MODE || 0,

            // Transit Time
            transit_mean_year1: year1Data?.DTCOLL_DTRECV_MEAN || 0,
            transit_mean_year2: year2Data?.DTCOLL_DTRECV_MEAN || 0,
            transit_median_year1: year1Data?.DTCOLL_DTRECV_MEDIAN || 0,
            transit_median_year2: year2Data?.DTCOLL_DTRECV_MEDIAN || 0,
            transit_mode_year1: year1Data?.DTCOLL_DTRECV_MODE || 0,
            transit_mode_year2: year2Data?.DTCOLL_DTRECV_MODE || 0,

            // Age Upon Receipt
            aur_mean_year1: year1Data?.AGE_RECEIVED_MEAN || 0,
            aur_mean_year2: year2Data?.AGE_RECEIVED_MEAN || 0,
            aur_median_year1: year1Data?.AGE_RECEIVED_MEDIAN || 0,
            aur_median_year2: year2Data?.AGE_RECEIVED_MEDIAN || 0,
            aur_mode_year1: year1Data?.AGE_RECEIVED_MODE || 0,
            aur_mode_year2: year2Data?.AGE_RECEIVED_MODE || 0,
        }];

        res.json({
            success: true,
            data: transformedData,
            executionTime: `${executionTime}ms`,
            recordCount: transformedData.length,
            rawDataCount: result.rows.length,
            filters: {
                year1: year1Int,
                year2: year2Int,
                month: monthInt
            },
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    year1DataFound: !!year1Data,
                    year2DataFound: !!year2Data,
                    rawRows: result.rows.length
                }
            })
        });

    } catch (err) {
        console.error('❌ Database error:', err);
        const executionTime = Date.now() - startTime;
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching timeliness data',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            executionTime: `${executionTime}ms`
        });
    } finally {
        if (connection) {
            try { await connection.close(); } 
            catch (closeErr) { console.error('❌ Error closing connection:', closeErr); }
        }
    }
};
