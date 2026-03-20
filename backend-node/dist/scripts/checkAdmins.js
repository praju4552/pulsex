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
const db_1 = __importDefault(require("../db"));
function check() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield db_1.default.prototypingUser.findMany({
            where: { role: 'SUPER_ADMIN' },
            select: { email: true, role: true, password: true }
        });
        users.forEach(u => console.log(u.email, u.role, u.password ? u.password.substring(0, 10) + '...' : 'NO_PASSWORD'));
        yield db_1.default.$disconnect();
    });
}
check().catch(console.error);
