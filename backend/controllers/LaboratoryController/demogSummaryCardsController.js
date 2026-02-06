const oracledb = require('oracledb');

// Get data entry statistics for the current month
const getDataEntryStats = async (req, res) => {
    let connection;
    
    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        // Get connection from pool
        connection = await oraclePool.getConnection();

        // ✅ SQL Templates
        const queryTemplateArchive = (column) => `
            SELECT
                u."FIRSTNAME",
                COUNT(DISTINCT sa."LABNO") AS total_labno_count
            FROM
                "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" sa
            JOIN
                "PHSECURE"."USERS" u ON sa."${column}" = u."USER_ID"
            WHERE
                sa."DTRECV" BETWEEN TRUNC(SYSDATE, 'MM') AND LAST_DAY(SYSDATE)
                AND u."FIRSTNAME" IN ('ABIGAIL', 'ANGELICA', 'JAY ARR', 'Mary Rose')
            GROUP BY
                u."FIRSTNAME"
        `;

        const queryTemplateMaster = (column) => `
            SELECT
                u."FIRSTNAME",
                COUNT(DISTINCT sm."LABNO") AS total_labno_count
            FROM
                "PHMSDS"."SAMPLE_DEMOG_MASTER" sm
            JOIN
                "PHSECURE"."USERS" u ON sm."${column}" = u."USER_ID"
            WHERE
                sm."DTRECV" BETWEEN TRUNC(SYSDATE, 'MM') AND LAST_DAY(SYSDATE)
                AND u."FIRSTNAME" IN ('ABIGAIL', 'ANGELICA', 'JAY ARR', 'Mary Rose')
            GROUP BY
                u."FIRSTNAME"
        `;

        // ✅ Execute all four queries
        const [
            archiveEntryResult,
            archiveVerificationResult,
            masterEntryResult,
            masterVerificationResult
        ] = await Promise.all([
            connection.execute(queryTemplateArchive("INIT_TECH"), [], { outFormat: oracledb.OUT_FORMAT_ARRAY }),
            connection.execute(queryTemplateArchive("VER_TECH"), [], { outFormat: oracledb.OUT_FORMAT_ARRAY }),
            connection.execute(queryTemplateMaster("INIT_TECH"), [], { outFormat: oracledb.OUT_FORMAT_ARRAY }),
            connection.execute(queryTemplateMaster("VER_TECH"), [], { outFormat: oracledb.OUT_FORMAT_ARRAY })
        ]);

        // ✅ Map and merge results
        const mapResults = (rows) =>
            rows.reduce((acc, [firstname, count]) => {
                acc[firstname] = (acc[firstname] || 0) + Number(count);
                return acc;
            }, {});

        // ✅ Sum counts from both sources
        const sumMaps = (map1, map2) => {
            const result = {};
            const keys = new Set([...Object.keys(map1), ...Object.keys(map2)]);
            for (const key of keys) {
                result[key] = (map1[key] || 0) + (map2[key] || 0);
            }
            return result;
        };

        const totalEntry = sumMaps(
            mapResults(archiveEntryResult.rows),
            mapResults(masterEntryResult.rows)
        );

        const totalVerification = sumMaps(
            mapResults(archiveVerificationResult.rows),
            mapResults(masterVerificationResult.rows)
        );

        // ✅ Build final response
        res.json({
            entry: {
                "Jay Arr Apelado": totalEntry["JAY ARR"] || 0,
                "Angelica Brutas": totalEntry["ANGELICA"] || 0,
                "Mary Rose Gomez": totalEntry["Mary Rose"] || 0,
                "Abigail Morfe": totalEntry["ABIGAIL"] || 0
            },
            verification: {
                "Apelado Jay Arr": totalVerification["JAY ARR"] || 0,
                "Brutas Angelica": totalVerification["ANGELICA"] || 0,
                "Gomez Mary Rose": totalVerification["Mary Rose"] || 0,
                "Morfe Abigail": totalVerification["ABIGAIL"] || 0
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

// Get data entry statistics with custom date range (optional feature)
const getDataEntryStatsByDateRange = async (req, res) => {
    let connection;
    
    try {
        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({ error: "Oracle connection pool is not initialized" });
        }

        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: "Both startDate and endDate are required",
                example: "?startDate=2024-01-01&endDate=2024-01-31"
            });
        }

        // Get connection from pool
        connection = await oraclePool.getConnection();

        // ✅ SQL Templates with date parameters
        const queryTemplateArchive = (column) => `
            SELECT
                u."FIRSTNAME",
                COUNT(DISTINCT sa."LABNO") AS total_labno_count
            FROM
                "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" sa
            JOIN
                "PHSECURE"."USERS" u ON sa."${column}" = u."USER_ID"
            WHERE
                sa."DTRECV" BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
                AND u."FIRSTNAME" IN ('ABIGAIL', 'ANGELICA', 'JAY ARR', 'Mary Rose')
            GROUP BY
                u."FIRSTNAME"
        `;

        const queryTemplateMaster = (column) => `
            SELECT
                u."FIRSTNAME",
                COUNT(DISTINCT sm."LABNO") AS total_labno_count
            FROM
                "PHMSDS"."SAMPLE_DEMOG_MASTER" sm
            JOIN
                "PHSECURE"."USERS" u ON sm."${column}" = u."USER_ID"
            WHERE
                sm."DTRECV" BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
                AND u."FIRSTNAME" IN ('ABIGAIL', 'ANGELICA', 'JAY ARR', 'Mary Rose')
            GROUP BY
                u."FIRSTNAME"
        `;

        const bindParams = { startDate, endDate };

        // ✅ Execute all four queries
        const [
            archiveEntryResult,
            archiveVerificationResult,
            masterEntryResult,
            masterVerificationResult
        ] = await Promise.all([
            connection.execute(queryTemplateArchive("INIT_TECH"), bindParams, { outFormat: oracledb.OUT_FORMAT_ARRAY }),
            connection.execute(queryTemplateArchive("VER_TECH"), bindParams, { outFormat: oracledb.OUT_FORMAT_ARRAY }),
            connection.execute(queryTemplateMaster("INIT_TECH"), bindParams, { outFormat: oracledb.OUT_FORMAT_ARRAY }),
            connection.execute(queryTemplateMaster("VER_TECH"), bindParams, { outFormat: oracledb.OUT_FORMAT_ARRAY })
        ]);

        // ✅ Map and merge results
        const mapResults = (rows) =>
            rows.reduce((acc, [firstname, count]) => {
                acc[firstname] = (acc[firstname] || 0) + Number(count);
                return acc;
            }, {});

        // ✅ Sum counts from both sources
        const sumMaps = (map1, map2) => {
            const result = {};
            const keys = new Set([...Object.keys(map1), ...Object.keys(map2)]);
            for (const key of keys) {
                result[key] = (map1[key] || 0) + (map2[key] || 0);
            }
            return result;
        };

        const totalEntry = sumMaps(
            mapResults(archiveEntryResult.rows),
            mapResults(masterEntryResult.rows)
        );

        const totalVerification = sumMaps(
            mapResults(archiveVerificationResult.rows),
            mapResults(masterVerificationResult.rows)
        );

        // ✅ Build final response
        res.json({
            dateRange: {
                startDate,
                endDate
            },
            entry: {
                "Jay Arr Apelado": totalEntry["JAY ARR"] || 0,
                "Angelica Brutas": totalEntry["ANGELICA"] || 0,
                "Mary Rose Gomez": totalEntry["Mary Rose"] || 0,
                "Abigail Morfe": totalEntry["ABIGAIL"] || 0
            },
            verification: {
                "Apelado Jay Arr": totalVerification["JAY ARR"] || 0,
                "Brutas Angelica": totalVerification["ANGELICA"] || 0,
                "Gomez Mary Rose": totalVerification["Mary Rose"] || 0,
                "Morfe Abigail": totalVerification["ABIGAIL"] || 0
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
    getDataEntryStats,
    getDataEntryStatsByDateRange
};