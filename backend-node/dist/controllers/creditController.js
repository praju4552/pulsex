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
exports.getHistory = exports.addCredits = exports.getBalance = void 0;
const db_1 = __importDefault(require("../db"));
const getBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield db_1.default.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });
        res.json({ balance: (user === null || user === void 0 ? void 0 : user.credits) || 0 });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});
exports.getBalance = getBalance;
const addCredits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        const result = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield tx.user.update({
                where: { id: userId },
                data: { credits: { increment: amount } },
                select: { credits: true }
            });
            yield tx.projectCreditTransaction.create({
                data: {
                    userId,
                    amount,
                    type: 'PURCHASE',
                    reason: 'Bought credits',
                }
            });
            return user;
        }));
        res.json({ message: 'Credits added successfully', balance: result.credits });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add credits' });
    }
});
exports.addCredits = addCredits;
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const history = yield db_1.default.projectCreditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { project: { select: { title: true } } }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
exports.getHistory = getHistory;
