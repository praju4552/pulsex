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
exports.institutionService = void 0;
const db_1 = __importDefault(require("../../db"));
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../../config/auth");
exports.institutionService = {
    getAllInstitutions() {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.institution.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { users: true, teacherStudents: true }
                    }
                }
            });
        });
    },
    getInstitutionById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.institution.findUnique({
                where: { id },
                include: {
                    users: {
                        select: { id: true, name: true, email: true, role: true, createdAt: true },
                        orderBy: { role: 'asc' }
                    }
                }
            });
        });
    },
    createInstitution(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.institution.create({
                data
            });
        });
    },
    updateInstitution(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.institution.update({
                where: { id },
                data
            });
        });
    },
    approveInstitution(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // 1. Find institution
                const institution = yield tx.institution.findUnique({ where: { id } });
                if (!institution)
                    throw new Error('Institution not found');
                if (institution.status === 'APPROVED')
                    throw new Error('Institution is already approved');
                // 2. Update status to APPROVED and store raw password
                const tempPassword = crypto_1.default.randomBytes(6).toString('hex');
                const updatedInst = yield tx.institution.update({
                    where: { id },
                    data: {
                        status: 'APPROVED',
                        rawAdminPassword: tempPassword
                    }
                });
                // 3. Generate temporary password
                const hashedPassword = yield bcryptjs_1.default.hash(tempPassword, auth_1.SALT_ROUNDS);
                // 4. Create or update user
                const adminUser = yield tx.user.upsert({
                    where: { email: institution.email },
                    update: {
                        role: 'INSTITUTION_ADMIN',
                        institutionId: institution.id,
                        password: hashedPassword,
                        rawPassword: tempPassword
                    },
                    create: {
                        name: 'Admin User',
                        email: institution.email,
                        password: hashedPassword,
                        rawPassword: tempPassword,
                        role: 'INSTITUTION_ADMIN',
                        institutionId: institution.id
                    }
                });
                return {
                    institution: updatedInst,
                    adminEmail: adminUser.email,
                    tempPassword
                };
            }));
        });
    },
    updateAdminPassword(id, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const institution = yield tx.institution.findUnique({ where: { id } });
                if (!institution)
                    throw new Error('Institution not found');
                const hashedPassword = yield bcryptjs_1.default.hash(newPassword, auth_1.SALT_ROUNDS);
                // Update user password
                yield tx.user.updateMany({
                    where: {
                        email: institution.email,
                        role: 'INSTITUTION_ADMIN',
                        institutionId: id
                    },
                    data: {
                        password: hashedPassword,
                        rawPassword: newPassword
                    }
                });
                // Update institution raw password storage
                return yield tx.institution.update({
                    where: { id },
                    data: { rawAdminPassword: newPassword }
                });
            }));
        });
    },
    rejectInstitution(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Find institution
            const institution = yield db_1.default.institution.findUnique({ where: { id } });
            if (!institution)
                throw new Error('Institution not found');
            if (institution.status === 'REJECTED')
                throw new Error('Institution is already rejected');
            // 2. Update status to REJECTED
            const updatedInst = yield db_1.default.institution.update({
                where: { id },
                data: { status: 'REJECTED' }
            });
            // Normally, you would trigger the "Send rejection email" function here
            // e.g. await emailProvider.sendRejection(institution.email);
            return {
                message: 'Institution rejected successfully',
                institution: updatedInst
            };
        });
    },
    deleteInstitution(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Need to ensure all connected users are properly unlinked or deleted depending on architecture.
            // For simplicity and database integrity currently, we use a transaction to delete users tied exclusively to this institution.
            return db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                yield tx.teacherStudent.deleteMany({
                    where: { institutionId: id }
                });
                yield tx.user.deleteMany({
                    where: { institutionId: id, role: { in: ['INSTITUTION_ADMIN', 'TEACHER', 'STUDENT'] } }
                });
                return tx.institution.delete({
                    where: { id }
                });
            }));
        });
    }
};
