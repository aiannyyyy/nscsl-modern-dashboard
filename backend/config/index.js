const path = require('path');
const dotenv = require('dotenv');

// 🔒 Ensure NODE_ENV exists BEFORE anything else
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Choose env file
const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development';

// Load dotenv ONCE
dotenv.config({
    path: path.resolve(__dirname, '..', envFile)
});

console.log(`🔧 Environment: ${process.env.NODE_ENV.toUpperCase()}`);

const database = require('./database');
const config = require('./env.config');
const corsOptions = require('./cors');
const upload = require('./multer');

module.exports = {
    database,
    config,
    corsOptions,
    upload
};
