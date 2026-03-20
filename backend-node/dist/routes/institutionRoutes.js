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
const express_1 = require("express");
const institutionController_1 = require("../controllers/institutionController");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Public route for signing up an institution
router.post('/register', institutionController_1.registerInstitution);
// Public route — list approved institutions (for login dropdown)
router.get('/list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const institutions = yield db_1.default.institution.findMany({
            where: { status: 'APPROVED' },
            select: { id: true, name: true }
        });
        res.json({ institutions });
    }
    catch (error) {
        console.error('Error fetching institution list:', error);
        res.status(500).json({ error: 'Failed to load institutions' });
    }
}));
exports.default = router;
