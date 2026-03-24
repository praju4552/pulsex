"use strict";
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
const fs_1 = __importDefault(require("fs"));
const DEBUG_LOG = path_1.default.join(process.cwd(), 'global_debug.log');
fs_1.default.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] Server code (app.ts) initialized\n`);
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
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
// System Health & Diagnostics Endpoint (Audit 6)
app.get('/health', (req, res) => {
    let tracespaceLoaded = false;
    try {
        require('@tracespace/parser');
        tracespaceLoaded = true;
    }
    catch (e) { }
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        tracespace: tracespaceLoaded
    });
});
// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/prototyping-auth', authLimiter);
app.use('/api/cms-auth', authLimiter);
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
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
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
    fs_1.default.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] REQUEST: ${req.method} ${req.url}\n`);
    next();
});
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
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'PulseX Prototyping Backend' });
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
