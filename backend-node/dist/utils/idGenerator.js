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
exports.generateId = generateId;
const db_1 = __importDefault(require("../db"));
/**
 * Generates a formatted ID using an incremental sequence.
 * @param type The prefix type (SO, INV, PID, PCB, 3D)
 * @returns Formatted ID string, e.g., "PWS-SO-00001"
 */
function generateId(type) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sequence = yield db_1.default.sequence.upsert({
                where: { type },
                update: { count: { increment: 1 } },
                create: { type, count: 1 },
            });
            const prefixMap = {
                SO: 'PWS-SO-',
                INV: 'PWS-INV-',
                PID: 'PWS-PID-',
                PCB: 'PWS-PCB-',
                '3D': 'PWS-3D-',
                'LC': 'PWS-LC-',
            };
            const prefix = prefixMap[type];
            const paddedCount = sequence.count.toString().padStart(5, '0');
            return `${prefix}${paddedCount}`;
        }
        catch (error) {
            console.error(`[generateId] Error generating ID for ${type}:`, error);
            throw new Error(`Failed to generate ID for ${type}`);
        }
    });
}
