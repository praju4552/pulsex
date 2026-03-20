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
exports.getUserSkills = void 0;
// import { PrismaClient } from '@prisma/client';
const db_1 = __importDefault(require("../db"));
// const prisma = new PrismaClient();
// Helper to calculate level
const calculateLevel = (xp) => {
    if (xp >= 500)
        return 4;
    if (xp >= 250)
        return 3;
    if (xp >= 100)
        return 2;
    return 1;
};
// Next level threshold
const getNextLevelXp = (level) => {
    if (level >= 4)
        return 0; // Max level
    if (level === 3)
        return 500;
    if (level === 2)
        return 250;
    return 100;
};
// Get all user skills
const getUserSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const skills = yield db_1.default.skillProgress.findMany({
            where: { userId },
            include: { skill: true }
        });
        const formattedSkills = skills.map(sp => ({
            id: sp.skillId,
            name: sp.skill.name,
            category: sp.skill.category,
            xp: sp.xp,
            level: sp.level,
            nextLevelXp: getNextLevelXp(sp.level),
            progressToNext: sp.level >= 4 ? 100 : Math.round((sp.xp % getNextLevelXp(sp.level)) / (getNextLevelXp(sp.level) - (getNextLevelXp(sp.level - 1) || 0)) * 100) // Rough approx for now
        }));
        res.json(formattedSkills);
    }
    catch (error) {
        console.error('Get User Skills Error:', error);
        res.status(500).json({ error: 'Failed to fetch user skills' });
    }
});
exports.getUserSkills = getUserSkills;
