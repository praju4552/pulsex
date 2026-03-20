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
exports.getStudents = exports.getTeachers = exports.assignTeacher = exports.createStudent = exports.createTeacher = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../config/auth");
const createTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { name, email, password } = req.body;
        console.log("Admin Role:", (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        console.log("Institution:", (_b = req.user) === null || _b === void 0 ? void 0 : _b.institutionId);
        const institutionId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        const existingUser = yield db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already taken' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, auth_1.SALT_ROUNDS || 10);
        const teacher = yield db_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                rawPassword: password,
                role: 'TEACHER',
                institutionId
            }
        });
        res.status(201).json({
            success: true,
            user: { id: teacher.id, name: teacher.name, email: teacher.email }
        });
    }
    catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({ success: false, message: 'Failed to create teacher' });
    }
});
exports.createTeacher = createTeacher;
const createStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { name, email, password } = req.body;
        console.log("Admin Role:", (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        console.log("Institution:", (_b = req.user) === null || _b === void 0 ? void 0 : _b.institutionId);
        const institutionId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        const existingUser = yield db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already taken' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, auth_1.SALT_ROUNDS || 10);
        const student = yield db_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                rawPassword: password,
                role: 'STUDENT',
                institutionId
            }
        });
        res.status(201).json({
            success: true,
            user: { id: student.id, name: student.name, email: student.email }
        });
    }
    catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ success: false, message: 'Failed to create student' });
    }
});
exports.createStudent = createStudent;
const assignTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { teacherId, studentId } = req.body;
        const institutionId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        // Output check to verify both belong to user's institution
        const teacher = yield db_1.default.user.findUnique({ where: { id: teacherId } });
        const student = yield db_1.default.user.findUnique({ where: { id: studentId } });
        if (!teacher || teacher.role !== 'TEACHER' || teacher.institutionId !== institutionId) {
            return res.status(400).json({ error: 'Invalid or unauthorized teacher access' });
        }
        if (!student || student.role !== 'STUDENT' || student.institutionId !== institutionId) {
            return res.status(400).json({ error: 'Invalid or unauthorized student access' });
        }
        const assignment = yield db_1.default.teacherStudent.create({
            data: {
                teacherId,
                studentId,
                institutionId
            }
        });
        res.status(201).json({ message: 'Teacher assigned to student successfully', assignment });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Teacher to student assignment already exists' });
        }
        console.error('Error assigning teacher:', error);
        res.status(500).json({ error: 'Failed to assign teacher' });
    }
});
exports.assignTeacher = assignTeacher;
const getTeachers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const institutionId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        const teachers = yield db_1.default.user.findMany({
            where: {
                role: 'TEACHER',
                institutionId
            },
            select: { id: true, name: true, email: true, rawPassword: true, createdAt: true }
        });
        res.json({ teachers });
    }
    catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});
exports.getTeachers = getTeachers;
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const institutionId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.institutionId;
        if (!institutionId) {
            return res.status(403).json({ error: 'Institution access required' });
        }
        const students = yield db_1.default.user.findMany({
            where: {
                role: 'STUDENT',
                institutionId
            },
            select: {
                id: true,
                name: true,
                email: true,
                rawPassword: true,
                createdAt: true,
                studentTeachers: {
                    include: {
                        teacher: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
        res.json({ students });
    }
    catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});
exports.getStudents = getStudents;
