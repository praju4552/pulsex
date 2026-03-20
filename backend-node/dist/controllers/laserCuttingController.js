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
exports.getMaterials = exports.createOrder = exports.calculatePriceEndpoint = exports.getFileStatus = exports.uploadDesign = void 0;
const db_1 = __importDefault(require("../db"));
const path_1 = __importDefault(require("path"));
const idGenerator_1 = require("../utils/idGenerator");
// ── Pricing engine ─────────────────────────────────────────────────────────────
const MATERIAL_RATES = {
    // Legacy IDs
    wood_mdf: { basePer_cm2: 2.5, engravingSurcharge: 0.50 },
    wood_plywood: { basePer_cm2: 2.5, engravingSurcharge: 0.50 },
    hardwood: { basePer_cm2: 4.0, engravingSurcharge: 0.50 },
    acrylic_cast: { basePer_cm2: 5.0, engravingSurcharge: 0.30 },
    acrylic_extruded: { basePer_cm2: 4.0, engravingSurcharge: 0.30 },
    leather: { basePer_cm2: 6.0, engravingSurcharge: 0.40 },
    fabric: { basePer_cm2: 3.0, engravingSurcharge: 0.60 },
    cork: { basePer_cm2: 3.0, engravingSurcharge: 0.60 },
    felt: { basePer_cm2: 3.0, engravingSurcharge: 0.60 },
    rubber: { basePer_cm2: 3.5, engravingSurcharge: 0.50 },
    // New material picker IDs
    abs_textured: { basePer_cm2: 4.0, engravingSurcharge: 0.30 },
    acrylic_2mm: { basePer_cm2: 3.5, engravingSurcharge: 0.30 },
    acrylic_3mm: { basePer_cm2: 4.0, engravingSurcharge: 0.30 },
    acrylic_4mm: { basePer_cm2: 4.5, engravingSurcharge: 0.30 },
    acrylic_5mm: { basePer_cm2: 5.0, engravingSurcharge: 0.30 },
    acrylic_6mm: { basePer_cm2: 5.5, engravingSurcharge: 0.30 },
    mdf: { basePer_cm2: 2.5, engravingSurcharge: 0.50 },
    mirror_acrylic: { basePer_cm2: 6.0, engravingSurcharge: 0.25 },
    polycarbonate: { basePer_cm2: 5.5, engravingSurcharge: 0.35 },
};
function calculateLaserPrice(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield db_1.default.pricingConfig.findUnique({ where: { key: 'laser_pricing' } });
        const rates = (config === null || config === void 0 ? void 0 : config.value) || MATERIAL_RATES;
        const rate = rates[params.material];
        if (!rate)
            throw new Error(`Unknown material: ${params.material}`);
        const areaCm2 = (params.width / 10) * (params.height / 10); // mm → cm
        let unitPrice = rate.basePer_cm2 * areaCm2;
        // Engraving surcharge
        if (params.serviceType === 'engraving' || params.serviceType === 'both') {
            unitPrice *= (1 + rate.engravingSurcharge);
        }
        // Thickness surcharge (>10mm)
        if (params.thickness > 10) {
            unitPrice *= 1.5;
        }
        // Minimum order price
        unitPrice = Math.max(unitPrice, 50); // ₹50 minimum per unit
        const subtotal = unitPrice * params.quantity;
        // Rush surcharge
        const rushMultiplier = params.urgency === 'rush_24h' ? 2.0 : 1.0;
        const total = subtotal * rushMultiplier;
        return {
            unitPrice: Math.round(unitPrice * 100), // paise
            subtotal: Math.round(subtotal * 100),
            rushMultiplier,
            total: Math.round(total * 100),
            breakdown: {
                areaCm2: Math.round(areaCm2 * 100) / 100,
                baseRate: rate.basePer_cm2,
                engravingSurcharge: (params.serviceType === 'engraving' || params.serviceType === 'both') ? rate.engravingSurcharge : 0,
                thicknessSurcharge: params.thickness > 10 ? 0.5 : 0,
                rush: params.urgency === 'rush_24h',
            },
        };
    });
}
// ── Upload design file ─────────────────────────────────────────────────────────
const uploadDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const userId = req.body.userId;
        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const dbFile = yield db_1.default.laserCuttingFile.create({
            data: {
                userId: userId || null,
                filePath: file.path,
                fileName: file.originalname,
                fileType: path_1.default.extname(file.originalname).toLowerCase().replace('.', ''),
                fileSize: file.size,
                uploadStatus: 'UPLOADED',
            },
        });
        return res.json({
            success: true,
            message: 'Design file uploaded successfully',
            fileId: dbFile.id,
            fileName: dbFile.fileName,
        });
    }
    catch (error) {
        console.error('[LaserCutting uploadDesign]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.uploadDesign = uploadDesign;
// ── Get file status ────────────────────────────────────────────────────────────
const getFileStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId } = req.params;
        const file = yield db_1.default.laserCuttingFile.findUnique({
            where: { id: fileId },
            include: { config: true },
        });
        if (!file) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }
        return res.json({ success: true, file });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.getFileStatus = getFileStatus;
// ── Calculate price ────────────────────────────────────────────────────────────
const calculatePriceEndpoint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceType, material, thickness, width, height, quantity, urgency } = req.body;
        if (!serviceType || !material || !thickness || !width || !height) {
            return res.status(400).json({ success: false, error: 'Missing required fields: serviceType, material, thickness, width, height' });
        }
        const pricing = yield calculateLaserPrice({
            serviceType,
            material,
            thickness: parseFloat(thickness),
            width: parseFloat(width),
            height: parseFloat(height),
            quantity: parseInt(quantity) || 1,
            urgency: urgency || 'standard',
        });
        return res.json({ success: true, pricing, materials: Object.keys(MATERIAL_RATES) });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
});
exports.calculatePriceEndpoint = calculatePriceEndpoint;
// ── Create order ───────────────────────────────────────────────────────────────
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, fileId, config, price, quantity, customerInfo, shippingInfo } = req.body;
        // Validate
        if (!fileId || !config || !customerInfo || !shippingInfo) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        // 1. Create config
        const dbConfig = yield db_1.default.laserCuttingConfig.create({
            data: {
                fileId,
                serviceType: config.serviceType,
                material: config.material,
                thickness: parseFloat(config.thickness),
                width: parseFloat(config.width),
                height: parseFloat(config.height),
                quantity: parseInt(config.quantity) || 1,
                finish: config.finish || 'standard',
                urgency: config.urgency || 'standard',
            },
        });
        // 2. Create laser-specific order
        const laserOrder = yield db_1.default.laserCuttingOrder.create({
            data: {
                userId: userId || null,
                fileId,
                configId: dbConfig.id,
                price,
                quantity: quantity || 1,
                status: 'PENDING',
            },
        });
        // 3. Generate IDs for unified order
        const salesOrderId = yield (0, idGenerator_1.generateId)('SO');
        const invoiceId = yield (0, idGenerator_1.generateId)('INV');
        const projectId = yield (0, idGenerator_1.generateId)('PID');
        const jobId = yield (0, idGenerator_1.generateId)('LC');
        // 4. Create unified PrototypingOrder entry (visible in admin dashboard)
        const protoOrder = yield db_1.default.prototypingOrder.create({
            data: {
                firstName: customerInfo.firstName,
                lastName: customerInfo.lastName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                streetAddress: shippingInfo.streetAddress,
                apartment: shippingInfo.apartment,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zip: shippingInfo.zip,
                country: shippingInfo.country,
                serviceType: 'Laser Cutting',
                specifications: Object.assign(Object.assign({ laserOrderId: laserOrder.id, fileId }, config), { quantity: quantity || 1 }),
                specSummary: `Laser ${config.serviceType}: ${config.material}, ${config.width}×${config.height}mm, ${config.thickness}mm thick`,
                shippingMethod: shippingInfo.method || 'Standard',
                shippingCost: Math.round(shippingInfo.cost || 0),
                pcbPrice: price,
                totalAmount: price + Math.round(shippingInfo.cost || 0),
                orderStatus: 'PENDING',
                paymentStatus: 'UNPAID',
                userId: userId || null,
                salesOrderId,
                invoiceId,
                projectId,
                jobId,
            },
        });
        return res.json({
            success: true,
            orderId: protoOrder.id,
            orderRef: protoOrder.orderRef,
            laserOrderId: laserOrder.id,
        });
    }
    catch (error) {
        console.error('[LaserCutting createOrder]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.createOrder = createOrder;
// ── Get available materials (for frontend dropdown) ────────────────────────────
const getMaterials = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield db_1.default.pricingConfig.findUnique({ where: { key: 'laser_pricing' } });
        const rates = (config === null || config === void 0 ? void 0 : config.value) || MATERIAL_RATES;
        const materials = Object.entries(rates).map(([key, val]) => ({
            id: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            basePer_cm2: val.basePer_cm2,
            engravingSurcharge: val.engravingSurcharge,
        }));
        return res.json({ success: true, materials });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch materials.' });
    }
});
exports.getMaterials = getMaterials;
