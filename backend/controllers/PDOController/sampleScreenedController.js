const oracledb = require("oracledb");

/**
 * Get monthly lab number count for a specific province
 * @route GET /api/sample-screened/monthly-labno-count
 * @query {string} from - Start date (YYYY-MM-DD)
 * @query {string} to - End date (YYYY-MM-DD)
 * @query {string} province - Province name
 */

const getMonthlyLabNoCount = async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.oracleDb.getConnection();

        const { from, to, province } = req.query;

        if (!from || !to || !province) {
            return res.status(400).json({
                error: "Missing required parameters: 'from', 'to', or 'province'"
            });
        }

        const spectypeValues = ["20", "1"];
        let provinceClean = province.trim().toUpperCase();

        const spectypePlaceholders = spectypeValues
            .map((_, index) => `:spectype${index}`)
            .join(', ');

        // ✅ ADDED: LOPEZ_NEARBY logic matching sample-receive controller
        const query = `
        SELECT
            CASE
                WHEN SDA."SUBMID" IN (
                    51,174,267,365,469,488,490,497,503,537,566,576,595,
                    858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                    3978,4305,4459,4468,4477,4705,4710,4781,4801,
                    4802,4810,4880,4890,5638,5686,5958,6074,6282,
                    6390,6399,6472,6519,6915,6976,7120,7293,7339,
                    7887,7972,8306
                )
                THEN 'LOPEZ_NEARBY'
                ELSE RPA."COUNTY"
            END AS province,

            TO_CHAR(SDA."DTRECV", 'YYYY-MM') AS month_year,
            EXTRACT(MONTH FROM SDA."DTRECV") AS month,
            EXTRACT(YEAR FROM SDA."DTRECV") AS year,
            COUNT(SDA."LABNO") AS total_labno,
            COUNT(*) AS total_samples,
            SDA."SPECTYPE"

        FROM "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" SDA
        JOIN "PHMSDS"."REF_PROVIDER_ADDRESS" RPA
            ON SDA."SUBMID" = RPA."PROVIDERID"

        WHERE
            RPA."ADRS_TYPE" = '1'
            AND SDA."SPECTYPE" IN (${spectypePlaceholders})
            AND SDA."DTRECV" BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD')
                                AND TO_DATE(:date_to, 'YYYY-MM-DD')
            AND (
                -- ✅ For LOPEZ_NEARBY, filter by SUBMID list
                (:province = 'LOPEZ_NEARBY' AND SDA."SUBMID" IN (
                    51,174,267,365,469,488,490,497,503,537,566,576,595,
                    858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                    3978,4305,4459,4468,4477,4705,4710,4781,4801,
                    4802,4810,4880,4890,5638,5686,5958,6074,6282,
                    6390,6399,6472,6519,6915,6976,7120,7293,7339,
                    7887,7972,8306
                ))
                -- ✅ For other provinces, filter by county name
                OR (:province != 'LOPEZ_NEARBY' AND UPPER(RPA."COUNTY") LIKE UPPER(:province || '%'))
            )

        GROUP BY
            CASE
                WHEN SDA."SUBMID" IN (
                    51,174,267,365,469,488,490,497,503,537,566,576,595,
                    858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                    3978,4305,4459,4468,4477,4705,4710,4781,4801,
                    4802,4810,4880,4890,5638,5686,5958,6074,6282,
                    6390,6399,6472,6519,6915,6976,7120,7293,7339,
                    7887,7972,8306
                )
                THEN 'LOPEZ_NEARBY'
                ELSE RPA."COUNTY"
            END,
            TO_CHAR(SDA."DTRECV", 'YYYY-MM'),
            EXTRACT(MONTH FROM SDA."DTRECV"),
            EXTRACT(YEAR FROM SDA."DTRECV"),
            SDA."SPECTYPE"

        UNION ALL

        SELECT
            CASE
                WHEN SDM."SUBMID" IN (
                    51,174,267,365,469,488,490,497,503,537,566,576,595,
                    858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                    3978,4305,4459,4468,4477,4705,4710,4781,4801,
                    4802,4810,4880,4890,5638,5686,5958,6074,6282,
                    6390,6399,6472,6519,6915,6976,7120,7293,7339,
                    7887,7972,8306
                )
                THEN 'LOPEZ_NEARBY'
                ELSE RPA."COUNTY"
            END AS province,

            TO_CHAR(SDM."DTRECV", 'YYYY-MM') AS month_year,
            EXTRACT(MONTH FROM SDM."DTRECV") AS month,
            EXTRACT(YEAR FROM SDM."DTRECV") AS year,
            COUNT(SDM."LABNO") AS total_labno,
            COUNT(*) AS total_samples,
            SDM."SPECTYPE"

        FROM "PHMSDS"."SAMPLE_DEMOG_MASTER" SDM
        JOIN "PHMSDS"."REF_PROVIDER_ADDRESS" RPA
            ON SDM."SUBMID" = RPA."PROVIDERID"

        WHERE
            RPA."ADRS_TYPE" = '1'
            AND SDM."SPECTYPE" IN (${spectypePlaceholders})
            AND SDM."DTRECV" BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD')
                                AND TO_DATE(:date_to, 'YYYY-MM-DD')
            AND (
                -- ✅ For LOPEZ_NEARBY, filter by SUBMID list
                (:province = 'LOPEZ_NEARBY' AND SDM."SUBMID" IN (
                    51,174,267,365,469,488,490,497,503,537,566,576,595,
                    858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                    3978,4305,4459,4468,4477,4705,4710,4781,4801,
                    4802,4810,4880,4890,5638,5686,5958,6074,6282,
                    6390,6399,6472,6519,6915,6976,7120,7293,7339,
                    7887,7972,8306
                ))
                -- ✅ For other provinces, filter by county name
                OR (:province != 'LOPEZ_NEARBY' AND UPPER(RPA."COUNTY") LIKE UPPER(:province || '%'))
            )

        GROUP BY
            CASE
                WHEN SDM."SUBMID" IN (
                    51,174,267,365,469,488,490,497,503,537,566,576,595,
                    858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                    3978,4305,4459,4468,4477,4705,4710,4781,4801,
                    4802,4810,4880,4890,5638,5686,5958,6074,6282,
                    6390,6399,6472,6519,6915,6976,7120,7293,7339,
                    7887,7972,8306
                )
                THEN 'LOPEZ_NEARBY'
                ELSE RPA."COUNTY"
            END,
            TO_CHAR(SDM."DTRECV", 'YYYY-MM'),
            EXTRACT(MONTH FROM SDM."DTRECV"),
            EXTRACT(YEAR FROM SDM."DTRECV"),
            SDM."SPECTYPE"

        ORDER BY year, month, province, SPECTYPE
        `;

        const bindParams = {
            date_from: from,
            date_to: to,
            province: provinceClean
        };

        spectypeValues.forEach((v, i) => {
            bindParams[`spectype${i}`] = v;
        });

        console.log("🔍 Executing query with params:", bindParams);

        const result = await connection.execute(
            query,
            bindParams,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log(`✅ Query returned ${result.rows.length} raw rows`);

        // ✅ Return empty data with 200 status instead of 404 error
        if (result.rows.length === 0) {
            return res.json({
                parameters: {
                    type: 'Screened', // or 'Screened' for the screened controller
                    spectypes: spectypeValues,
                    dateRange: { from, to }
                },
                cumulativeData: [], // ✅ Empty array instead of error
                rawData: [],
                summary: {
                    totalRecords: 0,
                    totalSamples: 0,
                    totalLabNo: 0
                }
            });
        }

        console.log("📊 Sample raw rows:", result.rows.slice(0, 5));

        // ✅ FIXED: Added .trim() to province name
        const monthlyData = result.rows.reduce((acc, row) => {
            const key = `${row.YEAR}-${String(row.MONTH).padStart(2, '0')}`;
            if (!acc[key]) {
                acc[key] = {
                    year: row.YEAR,
                    month: row.MONTH,
                    month_year: row.MONTH_YEAR,
                    province: row.PROVINCE.trim(), // ✅ Added .trim()
                    category: 'Screened',
                    total_samples: 0,
                    total_labno: 0,
                    spectypes: []
                };
            }
            acc[key].total_samples += row.TOTAL_SAMPLES;
            acc[key].total_labno += row.TOTAL_LABNO;
            acc[key].spectypes.push({
                spectype: row.SPECTYPE,
                samples: row.TOTAL_SAMPLES,
                labno: row.TOTAL_LABNO
            });
            return acc;
        }, {});

        const monthlyDataArray = Object.values(monthlyData);

        console.log("📊 Monthly data aggregated:", monthlyDataArray);

        const summary = {
            totalRecords: result.rows.length,
            totalSamples: monthlyDataArray.reduce((sum, item) => sum + item.total_samples, 0),
            totalLabNo: monthlyDataArray.reduce((sum, item) => sum + item.total_labno, 0)
        };

        res.json({
            parameters: {
                type: 'Screened',
                spectypes: spectypeValues,
                province: provinceClean,
                dateRange: { from, to }
            },
            monthlyData: monthlyDataArray,
            rawData: result.rows,
            summary: summary
        });

    } catch (err) {
        console.error("❌ Error in getMonthlyLabNoCount:", err);
        res.status(500).json({ 
            error: err.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (connection) await connection.close();
    }
};

/**
 * Get cumulative data for all provinces (BATANGAS, LAGUNA, CAVITE, RIZAL, QUEZON, LOPEZ_NEARBY)
 * @route GET /api/sample-screened/cumulative-all-province
 * @query {string} from - Start date (YYYY-MM-DD)
 * @query {string} to - End date (YYYY-MM-DD)
 */

const getCumulativeAllProvince = async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.oracleDb.getConnection();

        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ 
                error: "Missing required parameters: 'from' and 'to'" 
            });
        }

        const spectypeValues = ["20", "1"];

        const spectypePlaceholders = spectypeValues.map((_, index) => `:spectype${index}`).join(', ');

        // ✅ ADDED: LOPEZ_NEARBY logic matching sample-receive controller
        const query = `
            SELECT 
                CASE
                    WHEN SDA."SUBMID" IN (
                        51,174,267,365,469,488,490,497,503,537,566,576,595,
                        858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                        3978,4305,4459,4468,4477,4705,4710,4781,4801,
                        4802,4810,4880,4890,5638,5686,5958,6074,6282,
                        6390,6399,6472,6519,6915,6976,7120,7293,7339,
                        7887,7972,8306
                    )
                    THEN 'LOPEZ_NEARBY'
                    ELSE RPA."COUNTY"
                END AS province,
                COUNT(SDA."LABNO") AS total_labno,
                COUNT(*) AS total_samples,
                SDA."SPECTYPE"
            FROM 
                "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" SDA
            JOIN 
                "PHMSDS"."REF_PROVIDER_ADDRESS" RPA 
            ON 
                SDA."SUBMID" = RPA."PROVIDERID"
            WHERE 
                RPA."ADRS_TYPE" = '1'
                AND SDA."SPECTYPE" IN (${spectypePlaceholders})
                AND SDA."DTRECV" BETWEEN 
                    TO_DATE(:date_from, 'YYYY-MM-DD') 
                    AND TO_DATE(:date_to, 'YYYY-MM-DD')
                AND (
                    RPA."COUNTY" IN ('BATANGAS', 'LAGUNA', 'CAVITE', 'RIZAL', 'QUEZON')
                    OR SDA."SUBMID" IN (
                        51,174,267,365,469,488,490,497,503,537,566,576,595,
                        858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                        3978,4305,4459,4468,4477,4705,4710,4781,4801,
                        4802,4810,4880,4890,5638,5686,5958,6074,6282,
                        6390,6399,6472,6519,6915,6976,7120,7293,7339,
                        7887,7972,8306
                    )
                )
            GROUP BY 
                CASE
                    WHEN SDA."SUBMID" IN (
                        51,174,267,365,469,488,490,497,503,537,566,576,595,
                        858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                        3978,4305,4459,4468,4477,4705,4710,4781,4801,
                        4802,4810,4880,4890,5638,5686,5958,6074,6282,
                        6390,6399,6472,6519,6915,6976,7120,7293,7339,
                        7887,7972,8306
                    )
                    THEN 'LOPEZ_NEARBY'
                    ELSE RPA."COUNTY"
                END,
                SDA."SPECTYPE"
            
            UNION ALL
            
            SELECT 
                CASE
                    WHEN SDM."SUBMID" IN (
                        51,174,267,365,469,488,490,497,503,537,566,576,595,
                        858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                        3978,4305,4459,4468,4477,4705,4710,4781,4801,
                        4802,4810,4880,4890,5638,5686,5958,6074,6282,
                        6390,6399,6472,6519,6915,6976,7120,7293,7339,
                        7887,7972,8306
                    )
                    THEN 'LOPEZ_NEARBY'
                    ELSE RPA."COUNTY"
                END AS province,
                COUNT(SDM."LABNO") AS total_labno,
                COUNT(*) AS total_samples,
                SDM."SPECTYPE"
            FROM 
                "PHMSDS"."SAMPLE_DEMOG_MASTER" SDM
            JOIN 
                "PHMSDS"."REF_PROVIDER_ADDRESS" RPA 
            ON 
                SDM."SUBMID" = RPA."PROVIDERID"
            WHERE 
                RPA."ADRS_TYPE" = '1'
                AND SDM."SPECTYPE" IN (${spectypePlaceholders})
                AND SDM."DTRECV" BETWEEN 
                    TO_DATE(:date_from, 'YYYY-MM-DD') 
                    AND TO_DATE(:date_to, 'YYYY-MM-DD')
                AND (
                    RPA."COUNTY" IN ('BATANGAS', 'LAGUNA', 'CAVITE', 'RIZAL', 'QUEZON')
                    OR SDM."SUBMID" IN (
                        51,174,267,365,469,488,490,497,503,537,566,576,595,
                        858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                        3978,4305,4459,4468,4477,4705,4710,4781,4801,
                        4802,4810,4880,4890,5638,5686,5958,6074,6282,
                        6390,6399,6472,6519,6915,6976,7120,7293,7339,
                        7887,7972,8306
                    )
                )
            GROUP BY 
                CASE
                    WHEN SDM."SUBMID" IN (
                        51,174,267,365,469,488,490,497,503,537,566,576,595,
                        858,930,1002,1071,1502,2283,2286,3471,3784,3871,
                        3978,4305,4459,4468,4477,4705,4710,4781,4801,
                        4802,4810,4880,4890,5638,5686,5958,6074,6282,
                        6390,6399,6472,6519,6915,6976,7120,7293,7339,
                        7887,7972,8306
                    )
                    THEN 'LOPEZ_NEARBY'
                    ELSE RPA."COUNTY"
                END,
                SDM."SPECTYPE"
            
            ORDER BY 
                province, SPECTYPE
        `;

        const bindParams = {
            date_from: from,
            date_to: to
        };

        spectypeValues.forEach((value, index) => {
            bindParams[`spectype${index}`] = value;
        });

        console.log("🚀 Executing query with bind params:", bindParams);

        const result = await connection.execute(
            query, 
            bindParams,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );        

        // ✅ Return empty data with 200 status instead of 404 error
        if (result.rows.length === 0) {
            return res.json({
                parameters: {
                    type: 'Screened', // or 'Screened' for the screened controller
                    spectypes: spectypeValues,
                    dateRange: { from, to }
                },
                cumulativeData: [], // ✅ Empty array instead of error
                rawData: [],
                summary: {
                    totalRecords: 0,
                    totalSamples: 0,
                    totalLabNo: 0
                }
            });
        }

        // ✅ FIXED: Added .trim() to remove trailing spaces from province names
        const cumulativeData = result.rows.reduce((acc, row) => {
            const key = row.PROVINCE.trim(); // ✅ Added .trim()
            if (!acc[key]) {
                acc[key] = {
                    province: row.PROVINCE.trim(), // ✅ Added .trim()
                    category: 'Screened',
                    total_samples: 0,
                    total_labno: 0,
                    spectypes: []
                };
            }
            acc[key].total_samples += row.TOTAL_SAMPLES;
            acc[key].total_labno += row.TOTAL_LABNO;
            acc[key].spectypes.push({
                spectype: row.SPECTYPE,
                samples: row.TOTAL_SAMPLES,
                labno: row.TOTAL_LABNO
            });
            return acc;
        }, {});

        console.log(`✅ Successfully retrieved ${result.rows.length} records for Screened`);
        console.log("📊 Cumulative Data:", cumulativeData);

        res.json({
            parameters: {
                type: 'Screened',
                spectypes: spectypeValues,
                dateRange: { from, to }
            },
            cumulativeData: Object.values(cumulativeData),
            rawData: result.rows,
            summary: {
                totalRecords: result.rows.length,
                totalSamples: result.rows.reduce((sum, row) => sum + row.TOTAL_SAMPLES, 0),
                totalLabNo: result.rows.reduce((sum, row) => sum + row.TOTAL_LABNO, 0)
            }
        });

    } catch (err) {
        console.error("❌ Database error:", err.message, err);
        res.status(500).json({ 
            error: "Database error", 
            details: err.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Error closing connection:", err);
            }
        }
    }
};

module.exports = {
    getMonthlyLabNoCount,
    getCumulativeAllProvince
};