const oracledb = require("oracledb");
const mysql = require("mysql2/promise");
const config = require('./env.config');

// Oracle Connection Pool
let oraclePool = null;

async function createOraclePool() {
    try {
        oraclePool = await oracledb.createPool({
            user: config.oracle.user,
            password: config.oracle.password,
            connectString: config.oracle.connectString,
            poolMin: 2,
            poolMax: config.isProduction ? 10 : 5,
            poolIncrement: 1,
            poolTimeout: 60,
            enableStatistics: config.isDevelopment
        });

        const envLabel = config.isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
        console.log(`✅ Oracle connection pool created [${envLabel}]`);

        // Test query only in development
        if (config.isDevelopment) {
            const connection = await oraclePool.getConnection();
            const result = await connection.execute("SELECT * FROM dual");
            console.log("🔹 Oracle Test Query:", result.rows);
            await connection.close();
        }

        return oraclePool;
    } catch (err) {
        console.error(`❌ Oracle pool creation failed:`, err.message);
        if (config.isProduction) {
            throw err;
        }
        return null;
    }
}

// Get Oracle connection from pool
async function getOracleConnection() {
    if (!oraclePool) {
        throw new Error('Oracle pool not initialized');
    }
    return await oraclePool.getConnection();
}

// Close Oracle pool
async function closeOraclePool() {
    if (oraclePool) {
        await oraclePool.close(0);
        console.log('✅ Oracle pool closed');
    }
}

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    waitForConnections: true,
    connectionLimit: config.isProduction ? 20 : 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: false
});

// Test MySQL connection on startup
(async () => {
    try {
        const connection = await mysqlPool.getConnection();
        const envLabel = config.isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
        console.log(`✅ Connected to MySQL server [${envLabel}]`);
        connection.release();
    } catch (err) {
        console.error(`❌ MySQL connection failed:`, err.message);
        if (config.isProduction) {
            process.exit(1);
        }
    }
})();

module.exports = {
    createOraclePool,
    getOracleConnection,
    closeOraclePool,
    mysqlPool,
    // Legacy support
    connectOracle: createOraclePool
};