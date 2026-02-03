const oracledb = require("oracledb");

/**
 * Get monthly lab number count for a specific province
 * @route GET /api/sample-receive/monthly-labno-count
 * @query {string} from - Start date (YYYY-MM-DD)
 * @query {string} to - End date (YYYY-MM-DD)
 * @query {string} province - Province name
 */
const getMonthlyLabNoCount = async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.oracleDb.getConnection();

        const { from, to, province } = req.query;

        // Validate required parameters
        if (!from || !to || !province) {
            return res.status(400).json({ 
                error: "Missing required parameters: 'from', 'to', or 'province'" 
            });
        }

        // Only "Received" type with spectypes
        const spectypeValues = ["1", "87", "20", "2", "3", "4", "5", "18"];
        
        // Fix province formatting
        let provinceClean = province.trim().toUpperCase();

        // Debugging logs
        console.log("🛠️ Debugging Parameters:");
        console.log("📌 From:", from);
        console.log("📌 To:", to);
        console.log("📌 Province (Raw):", JSON.stringify(province));
        console.log("📌 Province (Trimmed):", JSON.stringify(provinceClean));
        console.log("📌 Spectype Values:", spectypeValues);

        // Create IN clause placeholders for spectypes
        const spectypePlaceholders = spectypeValues.map((_, index) => `:spectype${index}`).join(', ');

        const query = `
            SELECT 
                RPA."COUNTY" AS province, 
                TO_CHAR(SDA."DTRECV", 'YYYY-MM') AS month_year,
                EXTRACT(MONTH FROM SDA."DTRECV") AS month,
                EXTRACT(YEAR FROM SDA."DTRECV") AS year,
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
                AND SDA."DTRECV" BETWEEN TO_DATE(:date_from, 'YYYY-MM-DD') 
                                    AND TO_DATE(:date_to, 'YYYY-MM-DD')
                AND UPPER(RPA."COUNTY") LIKE UPPER(:province || '%') 
            GROUP BY 
                RPA."COUNTY", 
                TO_CHAR(SDA."DTRECV", 'YYYY-MM'),
                EXTRACT(MONTH FROM SDA."DTRECV"),
                EXTRACT(YEAR FROM SDA."DTRECV"),
                SDA."SPECTYPE"
            ORDER BY 
                year, month, RPA."COUNTY", SDA."SPECTYPE"
        `;

        // Build bind parameters object
        const bindParams = {
            date_from: from,
            date_to: to,
            province: provinceClean
        };

        // Add spectype array parameters
        spectypeValues.forEach((value, index) => {
            bindParams[`spectype${index}`] = value;
        });

        console.log("🔹 Executing SQL Query:\n", query);
        console.log("🔹 Query Parameters:", bindParams);

        const result = await connection.execute(
            query, 
            bindParams,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );        

        console.log("✅ Query executed successfully. Rows fetched:", result.rows.length);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: "No data found for the selected province and date range",
                searchCriteria: {
                    province: provinceClean,
                    type: 'Received',
                    spectypes: spectypeValues,
                    dateRange: { from, to }
                }
            });
        }

        // Group results by month for easier consumption
        const monthlyData = result.rows.reduce((acc, row) => {
            const key = `${row.YEAR}-${String(row.MONTH).padStart(2, '0')}`;
            if (!acc[key]) {
                acc[key] = {
                    year: row.YEAR,
                    month: row.MONTH,
                    month_year: row.MONTH_YEAR,
                    province: row.PROVINCE,
                    category: 'Received',
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

        res.json({
            parameters: {
                type: 'Received',
                spectypes: spectypeValues,
                province: provinceClean,
                dateRange: { from, to }
            },
            monthlyData: Object.values(monthlyData),
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

/**
 * Get cumulative data for all provinces (BATANGAS, LAGUNA, CAVITE, RIZAL, QUEZON)
 * @route GET /api/sample-receive/cumulative-all-province
 * @query {string} from - Start date (YYYY-MM-DD)
 * @query {string} to - End date (YYYY-MM-DD)
 */
const getCumulativeAllProvince = async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.oracleDb.getConnection();

        const { from, to } = req.query;

        // Validate required parameters
        if (!from || !to) {
            return res.status(400).json({ 
                error: "Missing required parameters: 'from' and 'to'" 
            });
        }

        // Only "Received" type with spectypes
        const spectypeValues = ["1", "87", "20", "2", "3", "4", "5", "18"];

        // Create IN clause placeholders for spectypes
        const spectypePlaceholders = spectypeValues.map((_, index) => `:spectype${index}`).join(', ');

        // Modified query to aggregate by province only (cumulative across all months)
        const query = `
            SELECT 
                RPA."COUNTY" AS province,
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
                AND RPA."COUNTY" IN ('BATANGAS', 'LAGUNA', 'CAVITE', 'RIZAL', 'QUEZON')
            GROUP BY 
                RPA."COUNTY",
                SDA."SPECTYPE"
            ORDER BY 
                RPA."COUNTY", SDA."SPECTYPE"
        `;

        // Build bind parameters object
        const bindParams = {
            date_from: from,
            date_to: to
        };

        // Add spectype array parameters
        spectypeValues.forEach((value, index) => {
            bindParams[`spectype${index}`] = value;
        });

        console.log("🚀 Executing query with bind params:", bindParams);

        const result = await connection.execute(
            query, 
            bindParams,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );        

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: "No data found for the selected date range",
                searchCriteria: {
                    type: 'Received',
                    spectypes: spectypeValues,
                    dateRange: { from, to }
                }
            });
        }

        // Group results by province only (cumulative)
        const cumulativeData = result.rows.reduce((acc, row) => {
            const key = row.PROVINCE;
            if (!acc[key]) {
                acc[key] = {
                    province: row.PROVINCE,
                    category: 'Received',
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

        console.log(`✅ Successfully retrieved ${result.rows.length} records for Received`);
        console.log("📊 Cumulative Data:", cumulativeData);

        res.json({
            parameters: {
                type: 'Received',
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