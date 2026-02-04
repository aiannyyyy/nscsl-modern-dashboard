const oracledb = require('oracledb');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration for report generation
const REPORT_CONFIG = {
    TIMEOUT: 120000, // 2 minutes
    MAX_BUFFER: 1024 * 1024 * 5, // 5MB buffer
    MIN_PDF_SIZE: 1000, // Minimum expected PDF size
    POSSIBLE_EXE_NAMES: [
        'GenerateReport.exe',
        'CrystalReportExporter.exe',
        'NSFReportGenerator.exe'
    ]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique request ID for tracking
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Find the report generator executable
 */
async function findExecutable() {
    const possiblePaths = await getAllPossiblePaths();
    
    for (const exePath of possiblePaths) {
        if (fs.existsSync(exePath)) {
            return exePath;
        }
    }
    return null;
}

/**
 * Get all possible executable paths
 */
async function getAllPossiblePaths() {
    const baseDirs = [
        path.join(__dirname, '..', 'CrystalReportExporter'),
        path.join(__dirname, '..', 'CrystalReportExporter', 'bin', 'Release'),
        path.join(__dirname, '..', 'CrystalReportExporter', 'bin', 'Debug'),
        path.join(__dirname, '..'),
        process.cwd()
    ];

    const paths = [];
    for (const dir of baseDirs) {
        for (const exeName of REPORT_CONFIG.POSSIBLE_EXE_NAMES) {
            paths.push(path.join(dir, exeName));
        }
    }
    return paths;
}

/**
 * Generate PDF file information
 */
function generatePdfInfo(submid, from, to, exePath) {
    const fromFormatted = from.replace(/-/g, '');
    const toFormatted = to.replace(/-/g, '');
    const fileName = `nsf_performance_${submid}_${fromFormatted}_${toFormatted}.pdf`;
    const reportsDir = path.join(path.dirname(exePath), 'Reports');
    const fullPath = path.join(reportsDir, fileName);
    
    return { fileName, fullPath, reportsDir };
}

/**
 * Clean up existing files
 */
async function cleanupExistingFile(filePath, requestId) {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`[${requestId}] Cleaned up existing PDF file`);
        } catch (err) {
            console.warn(`[${requestId}] Could not remove existing PDF:`, err.message);
        }
    }
}

/**
 * Get error message based on error code
 */
function getErrorMessage(error) {
    switch (error.code) {
        case 'ETIMEDOUT':
            return 'Report generation timed out. The process is taking longer than expected.';
        case 'ENOENT':
            return 'Report generator executable not found or not accessible.';
        case 'EACCES':
            return 'Permission denied when trying to execute report generator.';
        default:
            return 'Error generating report. Please check the logs for details.';
    }
}

/**
 * Serve existing file with test report indication
 */
async function serveExistingFile(filePath, fileName, requestId, res, isTestReport = false) {
    return new Promise((resolve, reject) => {
        if (res.headersSent) {
            console.warn(`[${requestId}] Headers already sent, cannot serve file`);
            return resolve();
        }

        // Get file stats
        fs.stat(filePath, (statErr, stats) => {
            if (statErr) {
                console.error(`[${requestId}] Could not get file stats:`, statErr.message);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        error: 'Could not access generated report',
                        requestId: requestId
                    });
                }
                return reject(statErr);
            }

            const reportType = isTestReport ? 'test report (fallback)' : 'report';
            console.log(`[${requestId}] PDF found and serving: ${fileName} (${stats.size} bytes) - ${reportType}`);
            
            // Check file size
            if (stats.size < REPORT_CONFIG.MIN_PDF_SIZE) {
                console.warn(`[${requestId}] Warning: PDF file is very small (${stats.size} bytes)`);
            }

            // Set response headers
            try {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('X-Request-ID', requestId);
                res.setHeader('X-File-Size', stats.size.toString());
                res.setHeader('X-Report-Type', isTestReport ? 'test-fallback' : 'main-report');

                // Stream the file
                const fileStream = fs.createReadStream(filePath);
                
                fileStream.on('error', (streamError) => {
                    console.error(`[${requestId}] Stream error:`, streamError);
                    if (!res.headersSent) {
                        res.status(500).json({ 
                            error: 'Error reading PDF file',
                            requestId: requestId
                        });
                    }
                    reject(streamError);
                });

                fileStream.on('end', () => {
                    console.log(`[${requestId}] PDF streamed successfully (${reportType})`);
                    resolve();
                });

                fileStream.pipe(res);

            } catch (headerError) {
                console.error(`[${requestId}] Error setting headers:`, headerError);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Error preparing PDF response',
                        requestId: requestId
                    });
                }
                reject(headerError);
            }
        });
    });
}

/**
 * Find alternative files with enhanced matching for test reports
 */
async function findAlternativeFiles(reportsDir, requestId, submid = null, from = null, to = null) {
    try {
        if (!fs.existsSync(reportsDir)) {
            console.log(`[${requestId}] Reports directory does not exist: ${reportsDir}`);
            return [];
        }

        const files = fs.readdirSync(reportsDir);
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
        
        const fileInfo = pdfFiles.map(file => {
            const filePath = path.join(reportsDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                modified: stats.mtime
            };
        }).sort((a, b) => b.modified - a.modified); // Sort by newest first

        console.log(`[${requestId}] Found ${fileInfo.length} PDF files in Reports directory`);
        
        // If we have submid and dates, prioritize matching files
        if (submid && from && to) {
            const dateFrom = from.replace(/-/g, '');
            const dateTo = to.replace(/-/g, '');
            
            const matchingFiles = fileInfo.filter(file => {
                const fileName = file.name.toLowerCase();
                return (
                    // Test report format
                    fileName.startsWith('test_submid_date_') &&
                    fileName.includes(`_${submid}_`) &&
                    fileName.includes(`_${dateFrom}_`) &&
                    fileName.includes(`_${dateTo}.pdf`)
                ) || (
                    // Main report format  
                    fileName.startsWith('nsf_performance_') &&
                    fileName.includes(`_${submid}_`) &&
                    fileName.includes(`_${dateFrom}_`) &&
                    fileName.includes(`_${dateTo}.pdf`)
                );
            });
            
            if (matchingFiles.length > 0) {
                console.log(`[${requestId}] Found ${matchingFiles.length} matching files for SUBMID ${submid}`);
                return matchingFiles;
            }
        }
        
        return fileInfo;
        
    } catch (error) {
        console.error(`[${requestId}] Could not read Reports directory:`, error.message);
        return [];
    }
}

/**
 * Smart function to find and serve any generated PDF
 */
async function findAndServeGeneratedPDF(pdfInfo, submid, from, to, stdout, stderr, requestId, res) {
    console.log(`[${requestId}] Smart PDF detection - looking for any generated report...`);
    
    // Step 1: Check if main report was generated
    if (fs.existsSync(pdfInfo.fullPath)) {
        console.log(`[${requestId}] Main report found: ${pdfInfo.fileName}`);
        return await serveExistingFile(pdfInfo.fullPath, pdfInfo.fileName, requestId, res, false);
    }

    // Step 2: Get all available PDFs and find the best match
    const alternatives = await findAlternativeFiles(pdfInfo.reportsDir, requestId, submid, from, to);
    
    if (alternatives.length === 0) {
        throw new Error('No PDF files generated');
    }

    // Step 3: Find the most recently generated file that matches our criteria
    const dateFrom = from.replace(/-/g, '');
    const dateTo = to.replace(/-/g, '');
    
    // Look for exact matches first
    const exactMatches = alternatives.filter(alt => {
        const fileName = alt.name.toLowerCase();
        return (
            fileName.includes(`_${submid}_`) &&
            fileName.includes(`_${dateFrom}_`) &&
            fileName.includes(`_${dateTo}.pdf`)
        );
    });

    if (exactMatches.length > 0) {
        // Sort by modification time and take the most recent
        exactMatches.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        const bestMatch = exactMatches[0];
        
        const isTestReport = bestMatch.name.toLowerCase().startsWith('test_');
        console.log(`[${requestId}] Found exact match: ${bestMatch.name} (${isTestReport ? 'test report' : 'main report'})`);
        
        const filePath = path.join(pdfInfo.reportsDir, bestMatch.name);
        return await serveExistingFile(filePath, bestMatch.name, requestId, res, isTestReport);
    }

    // Step 4: If no exact match, take the most recent PDF (fallback)
    const mostRecent = alternatives[0]; // Already sorted by newest first
    const isTestReport = mostRecent.name.toLowerCase().startsWith('test_');
    
    console.log(`[${requestId}] Using most recent PDF as fallback: ${mostRecent.name}`);
    const filePath = path.join(pdfInfo.reportsDir, mostRecent.name);
    return await serveExistingFile(filePath, mostRecent.name, requestId, res, isTestReport);
}

/**
 * Execute report generation with better waiting strategy
 */
async function executeReportGeneration(exePath, submid, from, to, pdfInfo, requestId, res) {
    return new Promise((resolve, reject) => {
        console.log(`[${requestId}] Executing: ${path.basename(exePath)} [${submid}, ${from}, ${to}]`);

        const startTime = Date.now();
        let responseHandled = false; // Flag to prevent multiple responses

        const child = execFile(exePath, [submid, from, to], { 
            timeout: REPORT_CONFIG.TIMEOUT,
            cwd: path.dirname(exePath),
            maxBuffer: REPORT_CONFIG.MAX_BUFFER
        }, async (error, stdout, stderr) => {
            if (responseHandled) {
                console.log(`[${requestId}] Response already handled, skipping callback`);
                return;
            }

            const duration = Date.now() - startTime;
            console.log(`[${requestId}] Execution completed in ${duration}ms`);
            console.log(`[${requestId}] STDOUT:`, stdout);
            if (stderr) console.log(`[${requestId}] STDERR:`, stderr);

            responseHandled = true;

            if (error && error.code !== 0) {
                console.error(`[${requestId}] Execution error:`, error.message);
                
                if (!res.headersSent) {
                    const errorResponse = {
                        error: getErrorMessage(error),
                        details: {
                            code: error.code,
                            signal: error.signal,
                            stdout: stdout || '',
                            stderr: stderr || '',
                            duration: duration
                        },
                        requestId: requestId
                    };
                    
                    res.status(500).json(errorResponse);
                }
                return reject(error);
            }

            // Process completed successfully - now look for ANY generated PDF
            console.log(`[${requestId}] Process completed successfully, searching for generated PDFs...`);
            
            try {
                await findAndServeGeneratedPDF(pdfInfo, submid, from, to, stdout, stderr, requestId, res);
                resolve();
            } catch (err) {
                if (!res.headersSent) {
                    res.status(500).json({
                        error: 'Error processing generated file',
                        details: err.message,
                        requestId: requestId
                    });
                }
                reject(err);
            }
        });

        // Handle process events
        child.on('spawn', () => {
            console.log(`[${requestId}] Process spawned successfully`);
        });

        child.on('error', (err) => {
            console.error(`[${requestId}] Process error:`, err);
            if (!responseHandled && !res.headersSent) {
                responseHandled = true;
                res.status(500).json({
                    error: 'Process execution failed',
                    details: err.message,
                    requestId: requestId
                });
                reject(err);
            }
        });
    });
}

// ============================================================================
// CONTROLLER METHODS - DATA QUERIES
// ============================================================================

/**
 * Get NSF Performance data by county and date range
 */
exports.getNsfPerformance = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        // Validate required parameters
        const { county, dateFrom, dateTo } = req.query;

        if (!county || !dateFrom || !dateTo) {
            return res.status(400).json({
                success: false,
                error: 'Missing required query parameters: county, dateFrom, dateTo'
            });
        }

        const countyUpper = county.toUpperCase().trim();

        console.log('[NSF Performance Request]', { county: countyUpper, dateFrom, dateTo });

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

        // SQL Query
        const query = `WITH filtered_sda AS (
                    SELECT *
                    FROM PHMSDS.SAMPLE_DEMOG_ARCHIVE
                    WHERE DTRECV >= TO_DATE(:dateFrom, 'YYYY-MM-DD')
                    AND DTRECV < TO_DATE(:dateTo, 'YYYY-MM-DD') + 1
                    AND LABNO NOT LIKE '_______8%'
                ),
                filtered_rpa AS (
                    SELECT *
                    FROM PHMSDS.REF_PROVIDER_ADDRESS
                    WHERE ADRS_TYPE = '1'
                    AND TRIM(COUNTY) = :county
                ),
                unsat_results AS (
                    SELECT DISTINCT LABNO, MNEMONIC
                    FROM PHMSDS.RESULT_ARCHIVE
                    WHERE MNEMONIC IN ('E100', 'E102', 'E108', 'E109', 'DE')
                ),
                full_results AS (
                    SELECT ra.LABNO, ra.MNEMONIC
                    FROM PHMSDS.RESULT_ARCHIVE ra
                ),
                joined_data AS (
                    SELECT
                        sda.SUBMID,
                        rpa.DESCR1 AS FACILITY_NAME,
                        sda.LABNO,
                        sda.BIRTHHOSP,
                        sda.SPECTYPE,
                        sda.AGECOLL,
                        sda.DTCOLL,
                        sda.DTRECV,
                        ur.MNEMONIC AS UNSAT_MNEMONIC,
                        fr.MNEMONIC AS ALL_MNEMONIC
                    FROM filtered_sda sda
                    JOIN filtered_rpa rpa ON rpa.PROVIDERID = sda.SUBMID
                    LEFT JOIN unsat_results ur ON sda.LABNO = ur.LABNO
                    LEFT JOIN full_results fr ON sda.LABNO = fr.LABNO
                )
                SELECT
                    SUBMID,
                    FACILITY_NAME,
                    COUNT(DISTINCT LABNO) AS TOTAL_SAMPLE_COUNT,
                    COUNT(DISTINCT CASE WHEN BIRTHHOSP = SUBMID THEN LABNO END) AS TOTAL_INBORN,
                    COUNT(DISTINCT CASE WHEN BIRTHHOSP = 'HOME' THEN LABNO END) AS TOTAL_HOMEBIRTH,
                    COUNT(DISTINCT CASE WHEN BIRTHHOSP NOT IN ('HOME', 'UNK') AND BIRTHHOSP <> SUBMID THEN LABNO END) AS TOTAL_HOB,
                    COUNT(DISTINCT CASE WHEN BIRTHHOSP = 'UNK' THEN LABNO END) AS TOTAL_UNKNOWN,

                    COUNT(DISTINCT CASE WHEN BIRTHHOSP IN ('HOME', 'UNK') OR (BIRTHHOSP NOT IN ('HOME', 'UNK') AND BIRTHHOSP <> SUBMID) THEN LABNO END) AS OUTBORN_TOTAL,

                    COUNT(DISTINCT CASE WHEN ALL_MNEMONIC = 'E100' THEN LABNO END) AS MISSING_INFORMATION,
                    COUNT(DISTINCT CASE WHEN ALL_MNEMONIC = 'E102' THEN LABNO END) AS LESS_THAN_24_HOURS,
                    COUNT(DISTINCT CASE WHEN ALL_MNEMONIC = 'E108' THEN LABNO END) AS INSUFFICIENT,
                    COUNT(DISTINCT CASE WHEN ALL_MNEMONIC = 'E109' THEN LABNO END) AS CONTAMINATED,
                    COUNT(DISTINCT CASE WHEN ALL_MNEMONIC = 'DE' THEN LABNO END) AS DATA_ERASURES,

                    COUNT(DISTINCT CASE WHEN UNSAT_MNEMONIC IS NOT NULL THEN LABNO END) AS TOTAL_UNSAT_COUNT,

                    ROUND(
                        COUNT(DISTINCT CASE WHEN UNSAT_MNEMONIC IS NOT NULL THEN LABNO END) * 100.0
                        / NULLIF(COUNT(DISTINCT LABNO), 0),
                        2
                    ) AS TOTAL_UNSAT_RATE,

                    ROUND(AVG(CASE WHEN SPECTYPE IN (20, 87) THEN AGECOLL / 24 END), 2) AS AVE_AOC,
                    ROUND(AVG(DTRECV - DTCOLL), 2) AS TRANSIT_TIME,
                    ROUND(AVG(CASE WHEN BIRTHHOSP = SUBMID AND SPECTYPE IN (20, 87) THEN AGECOLL / 24 END), 2) AS INBORN_AVERAGE,
                    ROUND(AVG(CASE WHEN BIRTHHOSP <> SUBMID AND SPECTYPE IN (20, 87) THEN AGECOLL / 24 END), 2) AS OUTBORN_AVERAGE

                FROM joined_data
                GROUP BY SUBMID, FACILITY_NAME
                ORDER BY SUBMID, FACILITY_NAME`;

        const binds = {
            county: countyUpper,
            dateFrom,
            dateTo
        };

        console.log('[Bind Variables]', binds);

        // Execute query
        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchArraySize: 1000,
            maxRows: 0
        });

        const executionTime = Date.now() - startTime;

        // Handle empty results
        if (!result.rows || result.rows.length === 0) {
            console.warn('[No Results Found]', binds);
            return res.json({
                success: true,
                message: "No data found for the specified criteria",
                data: [],
                executionTime: `${executionTime}ms`,
                recordCount: 0,
                filters: {
                    county: countyUpper,
                    dateFrom,
                    dateTo
                }
            });
        }

        console.log(`[Query Result] Returned ${result.rows.length} rows`);

        // Return successful response
        res.json({
            success: true,
            data: result.rows,
            executionTime: `${executionTime}ms`,
            recordCount: result.rows.length,
            filters: {
                county: countyUpper,
                dateFrom,
                dateTo
            }
        });

    } catch (err) {
        console.error('❌ Database error:', err);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching NSF performance data',
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

/**
 * Get NSF Performance Lab Details by submid and date range
 */
exports.getNsfPerformanceLabDetails = async (req, res) => {
    let connection;
    const startTime = Date.now();

    try {
        // Validate required parameters
        const { submid, dateFrom, dateTo } = req.query;

        if (!submid || !dateFrom || !dateTo) {
            return res.status(400).json({
                success: false,
                error: 'Missing required query parameters: submid, dateFrom, dateTo'
            });
        }

        console.log('[Lab Details Request]', { submid, dateFrom, dateTo });

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

        // SQL Query
        const query = `
       WITH COMBINED AS (
        SELECT /*+ MATERIALIZE */
        S."LABNO" AS LABNO,
        S."SUBMID" AS SUBMID,
        S."FNAME" AS FNAME,
        S."LNAME" AS LNAME,
        S."SPECTYPE" AS SPECTYPE,
        S."BIRTHHOSP" AS BIRTHHOSP,
        D."MNEMONIC" AS MNEMONIC,
        'DISORDER' AS SOURCE_TABLE
        FROM
        "PHMSDS"."DISORDER_ARCHIVE" D
        JOIN "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" S
        ON D."LABNO" = S."LABNO"
        WHERE
        S."SUBMID" = :submid
        AND S."DTRECV" >= TO_DATE(:dateFrom, 'YYYY-MM-DD')
        AND S."DTRECV" < TO_DATE(:dateTo, 'YYYY-MM-DD') + 1
        AND S."LABNO" NOT LIKE '_______8%'
        UNION ALL
        SELECT /*+ MATERIALIZE */
        S."LABNO" AS LABNO,
        S."SUBMID" AS SUBMID,
        S."FNAME" AS FNAME,
        S."LNAME" AS LNAME,
        S."SPECTYPE" AS SPECTYPE,
        S."BIRTHHOSP" AS BIRTHHOSP,
        RSLT."MNEMONIC" AS MNEMONIC,
        'RESULT' AS SOURCE_TABLE
        FROM
        "PHMSDS"."RESULT_ARCHIVE" RSLT
        JOIN "PHMSDS"."SAMPLE_DEMOG_ARCHIVE" S
        ON RSLT."LABNO" = S."LABNO"
        WHERE
        S."SUBMID" = :submid
        AND S."DTRECV" >= TO_DATE(:dateFrom, 'YYYY-MM-DD')
        AND S."DTRECV" < TO_DATE(:dateTo, 'YYYY-MM-DD') + 1
        AND S."LABNO" NOT LIKE '_______8%'
        )
        SELECT
        LABNO,
        MAX(SUBMID) AS SUBMID,
        MAX(FNAME) AS FNAME,
        MAX(LNAME) AS LNAME,
        MAX(SPECTYPE) AS SPECTYPE,
        CASE 
        WHEN MAX(SPECTYPE) = 20 THEN 'Initial'
        WHEN MAX(SPECTYPE) IN (2, 3, 4) THEN 'Repeat'
        WHEN MAX(SPECTYPE) = 5 THEN 'Monitoring'
        WHEN MAX(SPECTYPE) = 87 THEN 'Unfit'
        ELSE 'Other'
        END AS SPECTYPE_LABEL,
        MAX(BIRTHHOSP) AS BIRTHHOSP,
        CASE 
        WHEN MAX(BIRTHHOSP) = TO_CHAR(MAX(SUBMID)) THEN 'INBORN'
        WHEN MAX(BIRTHHOSP) = 'HOME' THEN 'HOMEBIRTH'
        WHEN MAX(BIRTHHOSP) = 'UNK' THEN 'UNKNOWN'
        WHEN MAX(BIRTHHOSP) NOT IN ('HOME', 'UNK') 
        AND MAX(BIRTHHOSP) <> TO_CHAR(MAX(SUBMID)) THEN 'HOB'
        ELSE 'OTHER'
        END AS BIRTH_CATEGORY,
        CASE 
        WHEN MAX(CASE WHEN MNEMONIC NOT IN ('FA', '*FA', 'NFT', 'E106', 'NFTR', 'ABN') THEN 1 ELSE 0 END) = 0 
        THEN 'NORMAL'
        ELSE MAX(CASE 
        WHEN MNEMONIC = 'E100' THEN 'MISSING_INFORMATION'
        WHEN MNEMONIC = 'E102' THEN 'LESS_THAN_24_HOURS'
        WHEN MNEMONIC = 'E108' THEN 'INSUFFICIENT'
        WHEN MNEMONIC = 'E109' THEN 'CONTAMINATED'
        WHEN MNEMONIC = 'DE' THEN 'DATA_ERASURES'
        WHEN MNEMONIC = 'PRT' THEN 'PRETERM'
        ELSE NULL
        END)
        END AS ISSUE_DESCRIPTION
        FROM COMBINED
        GROUP BY LABNO
         ORDER BY LABNO ASC`;

        const binds = {
            submid,
            dateFrom,
            dateTo
        };

        // Execute query
        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchArraySize: 1000,
            maxRows: 0
        });

        const executionTime = Date.now() - startTime;

        console.log(`[Lab Details] Query returned ${result.rows.length} rows`);

        // Log first row to verify structure
        if (result.rows.length > 0) {
            console.log('[Lab Details] Sample row:', result.rows[0]);
        }

        // Handle empty results
        if (!result.rows || result.rows.length === 0) {
            return res.json({
                success: true,
                message: "No lab details found for the specified criteria",
                data: [],
                executionTime: `${executionTime}ms`,
                recordCount: 0,
                filters: {
                    submid,
                    dateFrom,
                    dateTo
                }
            });
        }

        // Return successful response
        res.json({
            success: true,
            data: result.rows,
            executionTime: `${executionTime}ms`,
            recordCount: result.rows.length,
            filters: {
                submid,
                dateFrom,
                dateTo
            }
        });

    } catch (err) {
        console.error('❌ Database error:', err);
        
        const executionTime = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching lab details',
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

// ============================================================================
// CONTROLLER METHODS - REPORT GENERATION
// ============================================================================

/**
 * Generate NSF Performance Report (PDF)
 */
exports.generateNsfReport = async (req, res) => {
    const { submid, dateFrom, dateTo } = req.query;
    const requestId = generateRequestId();
    
    console.log(`[${requestId}] Starting report generation request`);

    // Validate required parameters
    if (!submid || !dateFrom || !dateTo) {
        console.log(`[${requestId}] Missing parameters:`, { submid, dateFrom, dateTo });
        return res.status(400).json({ 
            error: 'Missing required parameters: submid, dateFrom, dateTo',
            requestId: requestId
        });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
        console.log(`[${requestId}] Invalid date format:`, { dateFrom, dateTo });
        return res.status(400).json({ 
            error: 'Invalid date format. Use YYYY-MM-DD format.',
            requestId: requestId
        });
    }

    // Validate date range
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    if (fromDate > toDate) {
        console.log(`[${requestId}] Invalid date range:`, { dateFrom, dateTo });
        return res.status(400).json({ 
            error: 'Start date cannot be after end date.',
            requestId: requestId
        });
    }

    try {
        // Find executable
        const exePath = await findExecutable();
        if (!exePath) {
            console.error(`[${requestId}] No executable found`);
            return res.status(500).json({ 
                error: 'Report generator executable not found',
                searchedPaths: await getAllPossiblePaths(),
                requestId: requestId
            });
        }

        console.log(`[${requestId}] Using executable: ${exePath}`);

        // Generate expected PDF path
        const pdfInfo = generatePdfInfo(submid, dateFrom, dateTo, exePath);
        console.log(`[${requestId}] Expected PDF: ${pdfInfo.fileName}`);

        // Clean up existing file
        await cleanupExistingFile(pdfInfo.fullPath, requestId);

        // Execute report generation
        await executeReportGeneration(exePath, submid, dateFrom, dateTo, pdfInfo, requestId, res);

    } catch (error) {
        console.error(`[${requestId}] Unexpected error:`, error);
        // Only send response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Internal server error',
                details: error.message,
                requestId: requestId
            });
        }
    }
};

/**
 * List available report files
 */
exports.listReports = async (req, res) => {
    try {
        const exePath = await findExecutable();
        if (!exePath) {
            return res.status(404).json({ error: 'Executable not found' });
        }
        
        const reportsDir = path.join(path.dirname(exePath), 'Reports');
        
        if (!fs.existsSync(reportsDir)) {
            return res.status(404).json({ 
                error: 'Reports directory not found',
                expectedPath: reportsDir
            });
        }
        
        const files = fs.readdirSync(reportsDir);
        const fileDetails = files
            .filter(file => file.endsWith('.pdf'))
            .map(file => {
                const filePath = path.join(reportsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified);
        
        res.json({
            reportsDirectory: reportsDir,
            totalFiles: fileDetails.length,
            files: fileDetails,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Serve a specific report file
 */
exports.serveReport = async (req, res) => {
    const requestId = generateRequestId();
    const fileName = req.params.filename;
    
    console.log(`[${requestId}] Serving specific report: ${fileName}`);
    
    try {
        // Find executable to locate reports directory
        const exePath = await findExecutable();
        if (!exePath) {
            return res.status(404).json({ 
                error: 'Report system not available',
                requestId: requestId
            });
        }
        
        const reportsDir = path.join(path.dirname(exePath), 'Reports');
        const filePath = path.join(reportsDir, fileName);
        
        // Security check: ensure file is within reports directory
        const resolvedPath = path.resolve(filePath);
        const resolvedReportsDir = path.resolve(reportsDir);
        
        if (!resolvedPath.startsWith(resolvedReportsDir)) {
            console.warn(`[${requestId}] Security violation: path outside reports directory`);
            return res.status(403).json({
                error: 'Access denied',
                requestId: requestId
            });
        }
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.warn(`[${requestId}] File not found: ${filePath}`);
            return res.status(404).json({
                error: 'Report file not found',
                filename: fileName,
                requestId: requestId
            });
        }
        
        // Check if it's a PDF file
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            console.warn(`[${requestId}] Non-PDF file requested: ${fileName}`);
            return res.status(400).json({
                error: 'Only PDF files can be served',
                requestId: requestId
            });
        }
        
        // Serve the file
        await serveExistingFile(filePath, fileName, requestId, res, false);
        
    } catch (error) {
        console.error(`[${requestId}] Error serving report:`, error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Internal server error',
                details: error.message,
                requestId: requestId
            });
        }
    }
};

/**
 * Health check for report generation system
 */
exports.reportSystemHealth = async (req, res) => {
    try {
        const exePath = await findExecutable();
        const allPaths = await getAllPossiblePaths();
        
        const executableStatus = {};
        for (const path of allPaths) {
            const exists = fs.existsSync(path);
            executableStatus[path] = exists;
        }
        
        const reportsDir = exePath ? path.join(path.dirname(exePath), 'Reports') : null;
        const reportsExists = reportsDir ? fs.existsSync(reportsDir) : false;
        
        // Check for recent PDF files
        let recentFiles = [];
        if (reportsExists) {
            try {
                const files = fs.readdirSync(reportsDir);
                const pdfFiles = files.filter(f => f.endsWith('.pdf'));
                recentFiles = pdfFiles.slice(0, 5); // Show last 5 PDF files
            } catch (err) {
                console.warn('Could not read reports directory:', err.message);
            }
        }
        
        const health = {
            status: exePath && reportsExists ? 'ok' : 'error',
            foundExecutable: exePath,
            executableStatus: executableStatus,
            reportsDirectory: {
                path: reportsDir,
                exists: reportsExists,
                recentFiles: recentFiles
            },
            configuration: REPORT_CONFIG,
            timestamp: new Date().toISOString()
        };
        
        const statusCode = health.status === 'ok' ? 200 : 500;
        res.status(statusCode).json(health);
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};