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
exports.registerInstitution = void 0;
const db_1 = __importDefault(require("../db"));
const registerInstitution = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { institutionName, email, referenceName, phone, address } = req.body;
        // 1. Validate required fields
        if (!institutionName || !email || !referenceName || !phone || !address) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        // Check if institution already exists with this email
        const existingInst = yield db_1.default.institution.findFirst({ where: { email } });
        if (existingInst) {
            return res.status(400).json({ success: false, message: 'Institution email is already registered.' });
        }
        // Create Institution record
        const institution = yield db_1.default.institution.create({
            data: {
                name: institutionName,
                email,
                contactNo: phone,
                address,
                status: 'PENDING'
            }
        });
        // Return success response
        return res.status(201).json({
            success: true,
            message: 'Institution registered successfully',
            institutionId: institution.id
        });
    }
    catch (error) {
        console.error('Institution Registration Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to register institution', error: error.message });
    }
});
exports.registerInstitution = registerInstitution;
