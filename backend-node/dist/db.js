"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = require("./utils/logger");
let prismaInstance = null;
const prisma = new Proxy({}, {
    get: (target, prop) => {
        if (!prismaInstance) {
            (0, logger_1.deepLog)('[PRISMA] Initializing new PrismaClient instance...');
            prismaInstance = new client_1.PrismaClient();
        }
        const val = prismaInstance[prop];
        return typeof val === 'function' ? val.bind(prismaInstance) : val;
    }
});
exports.default = prisma;
