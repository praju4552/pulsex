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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const SALT_ROUNDS = 10;
const ADMINS = [
    { email: 'pulsewritexsolutions@gmail.com', password: 'EdmalaB@2025', name: 'Pulse X Admin' },
    { email: 'pulsewritex@gmail.com', password: 'prototyping@2026', name: 'Pulse X Admin 2' },
];
function seedAdmins() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding admin users...');
        for (const admin of ADMINS) {
            const hashed = yield bcryptjs_1.default.hash(admin.password, SALT_ROUNDS);
            const existing = yield db_1.default.prototypingUser.findUnique({ where: { email: admin.email } });
            if (existing) {
                yield db_1.default.prototypingUser.update({
                    where: { email: admin.email },
                    data: { role: 'SUPER_ADMIN', password: hashed, name: admin.name },
                });
                console.log(`  Updated: ${admin.email} → SUPER_ADMIN`);
            }
            else {
                yield db_1.default.prototypingUser.create({
                    data: {
                        email: admin.email,
                        name: admin.name,
                        password: hashed,
                        role: 'SUPER_ADMIN',
                    },
                });
                console.log(`  Created: ${admin.email} → SUPER_ADMIN`);
            }
        }
        console.log('Done!');
        process.exit(0);
    });
}
seedAdmins().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
