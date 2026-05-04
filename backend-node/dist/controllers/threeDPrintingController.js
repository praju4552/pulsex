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
exports.downloadFile = exports.createOrder = exports.getFileStatus = exports.uploadAndProcess = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const threeDService_1 = require("../services/threeDService");
const db_1 = __importDefault(require("../db"));
const logger_1 = require("../utils/logger");
const uploadAndProcess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const userId = req.body.userId; // Optional, for logged in users
        if (!file) {
            (0, logger_1.deepLog)('[UPLOAD] FAILED: No file uploaded');
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        (0, logger_1.deepLog)(`[UPLOAD] Starting process for ${file.originalname} (${file.size} bytes)`);
        // 1. Create file record in DB
        (0, logger_1.deepLog)(`[UPLOAD] Creating DB record...`);
        const dbFile = yield db_1.default.threeDFile.create({
            data: {
                userId: userId || null,
                filePath: file.path,
                fileType: path_1.default.extname(file.originalname).toLowerCase(),
                fileSize: file.size,
                uploadStatus: 'PROCESSING',
            },
        });
        (0, logger_1.deepLog)(`[UPLOAD] DB record created: ${dbFile.id}`);
        // 2. Trigger asynchronous processing
        (0, logger_1.deepLog)(`[UPLOAD] Triggering background processing for ${dbFile.id}...`);
        processMeshInBackground(dbFile.id, file.path, dbFile.fileType);
        (0, logger_1.deepLog)(`[UPLOAD] Returning success to client.`);
        return res.json({
            success: true,
            message: 'File uploaded and processing started',
            fileId: dbFile.id,
        });
    }
    catch (error) {
        (0, logger_1.deepLog)(`[UPLOAD] ERROR: ${error.message}`);
        console.error('3D Upload Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.uploadAndProcess = uploadAndProcess;
const processMeshInBackground = (fileId, filePath, fileType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const absolutePath = path_1.default.isAbsolute(filePath) ? filePath : path_1.default.join(process.cwd(), filePath);
        (0, logger_1.deepLog)(`[BACKGROUND] Starting for ${fileId} at ${absolutePath}`);
        const metadata = yield threeDService_1.ThreeDService.getMetadata(absolutePath, fileType);
        (0, logger_1.deepLog)(`[BACKGROUND] Metadata extracted for ${fileId}`);
        yield db_1.default.threeDMetadata.create({
            data: {
                fileId,
                volume: metadata.volume,
                surfaceArea: metadata.surfaceArea,
                width: metadata.width,
                height: metadata.height,
                depth: metadata.depth,
                triangleCount: metadata.triangleCount,
                estimatedPrintTime: metadata.estimatedPrintTime,
            },
        });
        yield db_1.default.threeDFile.update({
            where: { id: fileId },
            data: { uploadStatus: 'COMPLETED' },
        });
        console.log(`Processing completed for file: ${fileId}`);
    }
    catch (error) {
        console.error(`Background processing failed for ${fileId}:`, error);
        yield db_1.default.threeDFile.update({
            where: { id: fileId },
            data: { uploadStatus: 'FAILED' },
        });
    }
});
const getFileStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId } = req.params;
        const file = yield db_1.default.threeDFile.findUnique({
            where: { id: fileId },
            include: { metadata: true },
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
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, fileId, config, price, quantity, customerInfo, shippingInfo } = req.body;
        // 1. Create or Update Config (idempotent for retries)
        const dbConfig = yield db_1.default.threeDPrintConfig.upsert({
            where: { fileId },
            create: {
                fileId,
                material: config.material,
                infill: config.infill,
                scale: config.scale || 1.0,
                layerHeight: config.layerHeight,
                finish: config.finish,
                color: config.color,
            },
            update: {
                material: config.material,
                infill: config.infill,
                scale: config.scale || 1.0,
                layerHeight: config.layerHeight,
                finish: config.finish,
                color: config.color,
            }
        });
        // 2. Create or Update 3D specific order (idempotent for retries)
        const threeDOrder = yield db_1.default.threeDOrder.upsert({
            where: { fileId },
            create: {
                userId: userId || null,
                fileId,
                configId: dbConfig.id,
                price,
                quantity: quantity || 1,
                status: 'PENDING',
            },
            update: {
                price,
                quantity: quantity || 1,
                status: 'PENDING',
            }
        });
        // 3. Integrate with the GENERAL PrototypingOrder table (as requested: "Orders must automatically map to SuperAdmin")
        // This ensures it shows up in the existing admin dashboard which polls `prototyping-orders`
        const orderRef = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const protoOrder = yield db_1.default.prototypingOrder.create({
            data: {
                orderRef,
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
                serviceType: '3D Printing',
                specifications: Object.assign(Object.assign({ threeDOrderId: threeDOrder.id, fileId: fileId }, config), { quantity: quantity || 1 }),
                specSummary: `3D Print: ${config.material}, ${config.infill}% infill, ${config.finish} finish`,
                shippingMethod: shippingInfo.method,
                shippingCost: shippingInfo.cost,
                pcbPrice: price, // Reusing field for base price
                totalAmount: price + shippingInfo.cost,
                orderStatus: 'PENDING',
                paymentStatus: 'UNPAID',
                userId: userId || null,
            },
        });
        return res.json({ success: true, orderId: protoOrder.id, orderRef: protoOrder.orderRef });
    }
    catch (error) {
        console.error('Order Creation Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.createOrder = createOrder;
const downloadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId } = req.params;
        const file = yield db_1.default.threeDFile.findUnique({
            where: { id: fileId },
        });
        if (!file || !fs_1.default.existsSync(file.filePath)) {
            return res.status(404).json({ success: false, error: 'File not found on server' });
        }
        const fileName = path_1.default.basename(file.filePath);
        res.download(file.filePath, fileName);
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
exports.downloadFile = downloadFile;
