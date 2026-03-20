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
function testLogin() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const email = 'pulsewritexsolutions@gmail.com';
        const password = 'EdmalaB@2025';
        const user = yield db_1.default.prototypingUser.findUnique({ where: { email } });
        if (!user) {
            console.log('USER NOT FOUND');
            return;
        }
        console.log('Found user:', user.email, user.role, 'password starts:', (_a = user.password) === null || _a === void 0 ? void 0 : _a.substring(0, 7));
        if (!user.password) {
            console.log('NO PASSWORD SET');
            return;
        }
        const valid = yield bcryptjs_1.default.compare(password, user.password);
        console.log('Password valid:', valid);
        yield db_1.default.$disconnect();
    });
}
testLogin().catch(console.error);
