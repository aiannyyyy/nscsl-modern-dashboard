const config = require('./env.config');

const corsOptions = {
    origin: function (origin, callback) {
        console.log('🌐 CORS request from:', origin || 'no-origin');
        
        // Always allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) {
            return callback(null, true);
        }

        const allowedOrigins = [config.server.frontendUrl];

        // In development, allow additional local origins
        if (config.isDevelopment) {
            allowedOrigins.push(
                'http://localhost:5173',      // Vite default
                'http://localhost:3000',      // React default
                'http://127.0.0.1:5173',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5501',      // Live Server
                'http://localhost:5501',
                'http://10.1.1.151:3000',     // Your server
                'http://10.1.1.151:5173'
            );
            
            // Allow any localhost port in development
            if (origin.match(/^http:\/\/localhost:\d+$/) || 
                origin.match(/^http:\/\/127\.0\.0\.1:\d+$/) ||
                origin.match(/^http:\/\/10\.1\.1\.\d{1,3}:\d+$/)) {
                return callback(null, true);
            }
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // ✅ FIXED: Added Cache-Control and Pragma headers
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Cache-Control',  // ← This fixes your CORS error!
        'Pragma'          // ← This too!
    ]
};

module.exports = corsOptions;