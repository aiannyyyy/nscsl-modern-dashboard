const path = require('path');
const dotenv = require('dotenv');

// Load environment file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development';

const result = dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

if (result.error) {
    console.warn(`⚠️  Could not find ${envFile}, falling back to .env.development`);
    dotenv.config({ path: path.resolve(__dirname, '..', '.env.development') });
}

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

console.log(`🔧 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// Required environment variables
const requiredEnvVars = [
    'ORACLE_USER',
    'ORACLE_PASS',
    'ORACLE_CONN_STRING',
    'HOST_DB',
    'USER_DB',
    'PASS_DB',
    'DATABASE_DB',
    'PORT',
    'FRONTEND_URL'
];

// Validate
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
}

module.exports = {
    // Environment flags
    env: process.env.NODE_ENV || 'development',
    isDevelopment,
    isProduction,
    
    // Oracle Database
    oracle: {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASS,
        connectString: process.env.ORACLE_CONN_STRING
    },
    
    // MySQL Database
    mysql: {
        host: process.env.HOST_DB,
        user: process.env.USER_DB,
        password: process.env.PASS_DB,
        database: process.env.DATABASE_DB
    },
    
    // Server
    server: {
        port: parseInt(process.env.PORT, 10) || 3000,
        host: process.env.SERVER_HOST || '0.0.0.0',
        frontendUrl: process.env.FRONTEND_URL
    },
    
    // Paths - These point to root/uploads and root/public
    paths: {
        uploads: process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads'),
        public: process.env.PUBLIC_PATH || path.join(__dirname, '..', 'public')
    }
};