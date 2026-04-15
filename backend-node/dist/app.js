"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const pcbRoutes_1 = __importDefault(require("./routes/pcbRoutes"));
const prototypingOrderRoutes_1 = __importDefault(require("./routes/prototypingOrderRoutes"));
const prototypingAuthRoutes_1 = __importDefault(require("./routes/prototypingAuthRoutes"));
const threeDPrintingRoutes_1 = __importDefault(require("./routes/threeDPrintingRoutes"));
const laserCuttingRoutes_1 = __importDefault(require("./routes/laserCuttingRoutes"));
const serviceInquiryRoutes_1 = __importDefault(require("./routes/serviceInquiryRoutes"));
const cmsAuthRoutes_1 = __importDefault(require("./routes/cmsAuthRoutes"));
const cmsAdminRoutes_1 = __importDefault(require("./routes/cmsAdminRoutes"));
const pricingRoutes_1 = __importDefault(require("./routes/pricingRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
// ✅ Load .env relative to this file's location (dist/app.js → ../.env)
// This works regardless of what directory Hostinger/Passenger uses as cwd.
const envPath = path_1.default.join(__dirname, '..', '.env');
const dotenvResult = dotenv_1.default.config({ path: envPath });
if (dotenvResult.error) {
    // Fallback: try process.cwd() in case .env is placed at domain root
    dotenv_1.default.config();
}
// Startup diagnostic — visible in Hostinger logs (console only, no file I/O)
console.log(`[ENV] RAZORPAY_KEY_ID  = ${process.env.RAZORPAY_KEY_ID || '⚠️  NOT SET'}`);
console.log(`[ENV] KEY_SECRET loaded = ${process.env.RAZORPAY_KEY_SECRET ? `YES (${process.env.RAZORPAY_KEY_SECRET.length} chars)` : '⚠️  NOT SET'}`);
console.log(`[ENV] .env path tried  = ${envPath}`);
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
            frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
            imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "data:"],
        },
    },
}));
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests max per window
    message: { error: 'Too many attempts, try again in 15 minutes.' }
});
// build-inject-point (Do not remove this comment)
const BUILD_INFO = {
    version: '1.0.0',
    deployTime: '2024-04-13T11:30:00Z',
    runId: 'local'
};
// System Health & Diagnostics Endpoint
app.get('/health', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let threeAvailable = false;
    try {
        require.resolve('three');
        threeAvailable = true;
    }
    catch (e) { }
    const potentialLogPaths = [
        path_1.default.join(__dirname, '..', '..', 'public_html', 'error_log.txt'),
        path_1.default.join('/home/u655334071/domains/pulsewritexsolutions.com', 'logs', 'error_log'),
        path_1.default.join('/home/u655334071/domains/pulsewritexsolutions.com', 'passenger.log'),
        path_1.default.join('/home/u655334071/domains/pulsewritexsolutions.com', 'public_html', 'error_log')
    ];
    let recentLogs = "";
    try {
        for (const lp of potentialLogPaths) {
            if (fs_1.default.existsSync(lp)) {
                recentLogs += `\n--- ${lp} ---\n` + fs_1.default.readFileSync(lp, 'utf8').slice(-1500);
            }
        }
        if (!recentLogs)
            recentLogs = "No log files found.";
    }
    catch (e) {
        recentLogs += `\nError reading log: ${e.message}`;
    }
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'PulseX Prototyping Backend',
        build: BUILD_INFO,
        recentLogs: recentLogs,
        diagnostics: {
            threejs: threeAvailable ? 'available' : 'missing',
            node_version: process.version,
            cwd: process.cwd(),
            dirname: __dirname,
            env_path: envPath,
            public_path: publicPath
        }
    });
}));
// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/prototyping-auth', authLimiter);
app.use('/api/cms-auth', authLimiter);
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://pulsewritexsolutions.com',
    'https://www.pulsewritexsolutions.com',
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 🌐 Serve Static Frontend (Fallback for Hostinger Passenger)
// This ensures the main domain works even if Passenger hijacks the root.
const publicPath = (function () {
    const paths = [
        path_1.default.join(__dirname, '..', '..', 'public_html'), // backendnode/dist -> public_html
        path_1.default.join(process.cwd(), 'public_html'), // root -> public_html
        path_1.default.join(__dirname, '..', 'public_html') // backendnode -> public_html
    ];
    return paths.find(p => fs_1.default.existsSync(p)) || paths[0];
})();
console.log(`[BOOT] Serving static files from: ${publicPath}`);
app.use(express_1.default.static(publicPath));
// Static uploads disabled for security - streaming via auth routes now
// Core Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/pcb', pcbRoutes_1.default);
app.use('/api/prototyping-orders', prototypingOrderRoutes_1.default);
app.use('/api/prototyping-auth', prototypingAuthRoutes_1.default);
app.use('/api/three-d-printing', threeDPrintingRoutes_1.default);
app.use('/api/laser-cutting', laserCuttingRoutes_1.default);
app.use('/api/service-inquiry', serviceInquiryRoutes_1.default);
app.use('/api/cms-auth', cmsAuthRoutes_1.default);
app.use('/api/cms-admin', cmsAdminRoutes_1.default);
app.use('/api/pricing', pricingRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
// Fallback route for SPA - send index.html for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        const indexFile = path_1.default.join(publicPath, 'index.html');
        if (fs_1.default.existsSync(indexFile)) {
            res.sendFile(indexFile);
        }
        else {
            res.status(404).send('Frontend not found in public_html');
        }
    }
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
