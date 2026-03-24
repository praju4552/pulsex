import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import pcbRoutes from './routes/pcbRoutes';
import prototypingOrderRoutes from './routes/prototypingOrderRoutes';
import prototypingAuthRoutes from './routes/prototypingAuthRoutes';
import threeDPrintingRoutes from './routes/threeDPrintingRoutes';
import laserCuttingRoutes from './routes/laserCuttingRoutes';
import serviceInquiryRoutes from './routes/serviceInquiryRoutes';
import cmsAuthRoutes from './routes/cmsAuthRoutes';
import cmsAdminRoutes from './routes/cmsAdminRoutes';
import pricingRoutes from './routes/pricingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import fs from 'fs';

const DEBUG_LOG = path.join(process.cwd(), 'global_debug.log');
fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] Server code (app.ts) initialized\n`);

dotenv.config();

const app = express();

app.use(helmet());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
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
    } catch(e) {}
    
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
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] REQUEST: ${req.method} ${req.url}\n`);
    next();
});

// Static uploads disabled for security - streaming via auth routes now

// Core Routes
app.use('/api/auth', authRoutes);
app.use('/api/pcb', pcbRoutes);
app.use('/api/prototyping-orders', prototypingOrderRoutes);
app.use('/api/prototyping-auth', prototypingAuthRoutes);
app.use('/api/three-d-printing', threeDPrintingRoutes);
app.use('/api/laser-cutting', laserCuttingRoutes);
app.use('/api/service-inquiry', serviceInquiryRoutes);
app.use('/api/cms-auth', cmsAuthRoutes);
app.use('/api/cms-admin', cmsAdminRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'PulseX Prototyping Backend' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
