import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

// ✅ Load .env relative to this file's location (dist/app.js → ../.env)
// This works regardless of what directory Hostinger/Passenger uses as cwd.
const envPath = path.join(__dirname, '..', '.env');
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
  // Fallback: try process.cwd() in case .env is placed at domain root
  dotenv.config();
}

// Startup diagnostic — visible in Hostinger logs (console only, no file I/O)
console.log(`[ENV] RAZORPAY_KEY_ID  = ${process.env.RAZORPAY_KEY_ID   || '⚠️  NOT SET'}`);
console.log(`[ENV] KEY_SECRET loaded = ${process.env.RAZORPAY_KEY_SECRET ? `YES (${process.env.RAZORPAY_KEY_SECRET.length} chars)` : '⚠️  NOT SET'}`);
console.log(`[ENV] .env path tried  = ${envPath}`);

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
        frameSrc:    ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
        connectSrc:  ["'self'", "https://api.razorpay.com"],
        imgSrc:      ["'self'", "data:", "https://lh3.googleusercontent.com"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        fontSrc:     ["'self'", "data:"],
      },
    },
  })
);

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

// System Health & Diagnostics Endpoint
app.get('/health', (_req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'PulseX Prototyping Backend'
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
    'https://pulsewritexsolutions.com',
    'https://www.pulsewritexsolutions.com',
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🌐 Serve Static Frontend (Fallback for Hostinger Passenger)
// This ensures the main domain works even if Passenger hijacks the root.
const publicPath = path.join(__dirname, '..', '..', 'public_html');
app.use(express.static(publicPath));

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
// Fallback route for SPA - send index.html for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        const indexFile = path.join(publicPath, 'index.html');
        if (fs.existsSync(indexFile)) {
            res.sendFile(indexFile);
        } else {
            res.status(404).send('Frontend not found in public_html');
        }
    }
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
