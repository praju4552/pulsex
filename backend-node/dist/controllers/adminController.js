"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.assignUserCredits = exports.updateOrderStatus = exports.sendUserNotification = exports.getAllOrders = exports.bulkCreateUsers = exports.updateProjectSkills = exports.createSkill = exports.getSkills = exports.resetUserProgress = exports.getUsers = exports.getAnalytics = exports.updateProject = void 0;
const db_1 = __importDefault(require("../db"));
const XLSX = __importStar(require("xlsx"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Update Project Details
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, isPublished } = req.body;
        const project = yield db_1.default.project.update({
            where: { id },
            data: {
                title,
                description,
                isPublished
            }
        });
        res.json(project);
    }
    catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});
exports.updateProject = updateProject;
// Analytics Stats
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [activeUserCount, projectCount, skillProgressCount] = yield Promise.all([
            db_1.default.user.count({
                where: {
                    projectActivity: { some: {} }
                }
            }),
            db_1.default.project.count(),
            db_1.default.skillProgress.count()
        ]);
        res.json({
            users: activeUserCount,
            projects: projectCount,
            completions: 0, // Placeholder
            skillsActive: skillProgressCount
        });
    }
    catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
exports.getAnalytics = getAnalytics;
// Get All Users (Simple list with progress summary)
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield db_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                credits: true,
                _count: {
                    select: {
                        skillProgress: true,
                        progress: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Fetch enrollment counts manually since the relation might not be defined on User model
        const enrollments = yield db_1.default.enrollment.groupBy({
            by: ['userId'],
            _count: {
                projectId: true
            }
        });
        const enrollmentCountMap = new Map();
        enrollments.forEach((e) => enrollmentCountMap.set(e.userId, e._count.projectId));
        // Fetch total credits used (DEDUCTIONS)
        const deductions = yield db_1.default.projectCreditTransaction.groupBy({
            by: ['userId'],
            where: { type: 'DEDUCTION' },
            _sum: {
                amount: true
            }
        });
        const deductionsMap = new Map();
        deductions.forEach((d) => deductionsMap.set(d.userId, d._sum.amount || 0));
        const enrichedUsers = users.map((user) => (Object.assign(Object.assign({}, user), { creditsUsed: deductionsMap.get(user.id) || 0, _count: Object.assign(Object.assign({}, user._count), { enrollments: enrollmentCountMap.get(user.id) || 0 }) })));
        res.json(enrichedUsers);
    }
    catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
exports.getUsers = getUsers;
// Reset User Progress
const resetUserProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const user = yield db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        yield db_1.default.$transaction([
            db_1.default.userProgress.deleteMany({ where: { userId: user.id } }),
            db_1.default.skillProgress.deleteMany({ where: { userId: user.id } }),
            db_1.default.lessonProgress.deleteMany({ where: { userId: user.id } }),
            db_1.default.enrollment.deleteMany({ where: { userId: user.id } }),
            db_1.default.userProjectActivity.deleteMany({ where: { userId: user.id } }),
            db_1.default.userSearchHistory.deleteMany({ where: { userId: user.id } })
        ]);
        res.json({ message: 'User progress reset successfully' });
    }
    catch (error) {
        console.error('Reset User Progress Error:', error);
        res.status(500).json({ error: 'Failed to reset user progress' });
    }
});
exports.resetUserProgress = resetUserProgress;
// --- SKILLS MANAGEMENT ---
// Get All Skills
const getSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skills = yield db_1.default.skill.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(skills);
    }
    catch (error) {
        console.log('Get Skills Error:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});
exports.getSkills = getSkills;
// Create New Skill
const createSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, level, description, category } = req.body;
        if (!name || !level) {
            return res.status(400).json({ error: 'Name and Level are required' });
        }
        const skill = yield db_1.default.skill.create({
            data: {
                name,
                level,
                description,
                category: category || 'General'
            }
        });
        res.json(skill);
    }
    catch (error) {
        console.error('Create Skill Error:', error);
        res.status(500).json({ error: 'Failed to create skill' });
    }
});
exports.createSkill = createSkill;
// Update Project Skills (Assign skills to project)
const updateProjectSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { skillIds } = req.body; // Array of skill IDs
        if (!Array.isArray(skillIds)) {
            return res.status(400).json({ error: 'skillIds must be an array' });
        }
        // Transaction: Clear existing, add new
        yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Delete existing links
            yield tx.projectSkill.deleteMany({
                where: { projectId: id }
            });
            // 2. Create new links
            if (skillIds.length > 0) {
                yield tx.projectSkill.createMany({
                    data: skillIds.map((skillId) => ({
                        projectId: id,
                        skillId: skillId
                    }))
                });
            }
        }));
        res.json({ message: 'Project skills updated' });
    }
    catch (error) {
        console.error('Update Project Skills Error:', error);
        res.status(500).json({ error: 'Failed to update project skills' });
    }
});
exports.updateProjectSkills = updateProjectSkills;
// ─── Bulk User Creation from Excel ──────────────────────────────────────────
const bulkCreateUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!req.file) {
        res.status(400).json({ error: 'No Excel file uploaded.' });
        return;
    }
    try {
        // Parse the uploaded Excel buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to array of row objects (keys come from row 1 headers)
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!rows || rows.length === 0) {
            res.status(400).json({ error: 'Excel sheet is empty or has no rows.' });
            return;
        }
        const SALT_ROUNDS = 10;
        const results = [];
        for (const row of rows) {
            // Normalize column names — support both exact and lowercase keys
            const email = (row['Email'] || row['email'] || '').toString().trim();
            const name = (row['Username'] || row['username'] || row['Name'] || row['name'] || '').toString().trim();
            const rawCredits = (_b = (_a = row['Credits']) !== null && _a !== void 0 ? _a : row['credits']) !== null && _b !== void 0 ? _b : 20;
            const credits = parseInt(String(rawCredits), 10) || 20;
            const rawPassword = (row['Password'] || row['password'] || '').toString().trim();
            if (!email || !rawPassword) {
                results.push({ email: email || '(empty)', status: 'skipped', reason: 'Missing email or password' });
                continue;
            }
            // Check for valid-ish email format
            if (!email.includes('@')) {
                results.push({ email, status: 'skipped', reason: 'Invalid email format' });
                continue;
            }
            try {
                // Check if user already exists
                const existingUser = yield db_1.default.user.findUnique({ where: { email } });
                if (existingUser) {
                    results.push({ email, status: 'skipped', reason: 'Email already registered' });
                    continue;
                }
                const hashedPassword = yield bcryptjs_1.default.hash(rawPassword, SALT_ROUNDS);
                yield db_1.default.user.create({
                    data: {
                        email,
                        name: name || null,
                        password: hashedPassword,
                        credits,
                        role: 'USER',
                    }
                });
                results.push({ email, status: 'created' });
            }
            catch (rowErr) {
                results.push({ email, status: 'skipped', reason: (rowErr === null || rowErr === void 0 ? void 0 : rowErr.message) || 'Database error' });
            }
        }
        const created = results.filter(r => r.status === 'created').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        res.json({
            message: `Bulk upload complete: ${created} created, ${skipped} skipped.`,
            created,
            skipped,
            details: results
        });
    }
    catch (error) {
        console.error('Bulk Create Users Error:', error);
        res.status(500).json({ error: 'Failed to process Excel file.' });
    }
});
exports.bulkCreateUsers = bulkCreateUsers;
// ─── Get All Shop Orders (Admin) ──────────────────────────────────────────────
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield db_1.default.shopOrder.findMany({
            include: {
                items: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        shippingDetails: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ orders });
    }
    catch (error) {
        console.error('Get All Orders Error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
exports.getAllOrders = getAllOrders;
// ─── Send Notification to User (Admin) ─────────────────────────────────────────
const sendUserNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { title, message, type = 'ADMIN_ALERT' } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }
        const notification = yield db_1.default.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                isRead: false
            }
        });
        res.json({ message: 'Notification sent successfully', notification });
    }
    catch (error) {
        console.error('Send Notification Error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});
exports.sendUserNotification = sendUserNotification;
// ─── Update Order Status (Admin) ──────────────────────────────────────────────
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = yield db_1.default.shopOrder.update({
            where: { id: orderId },
            data: { status },
        });
        res.json({ message: 'Order status updated', order });
    }
    catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
exports.updateOrderStatus = updateOrderStatus;
// ─── Assign Credits to User (Admin) ───────────────────────────────────────────
const assignUserCredits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { amount } = req.body;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Valid credit amount is required' });
        }
        // 1. Update User balance
        const updatedUser = yield db_1.default.user.update({
            where: { id: userId },
            data: {
                credits: { increment: amount }
            }
        });
        // 2. Create transaction record
        yield db_1.default.projectCreditTransaction.create({
            data: {
                userId,
                amount,
                type: 'PURCHASE', // Technically an admin grant, but PURCHASE represents positive float
                reason: 'Admin assigned credits',
            }
        });
        // 3. Send Notification
        yield db_1.default.notification.create({
            data: {
                userId,
                title: 'Credits Assigned 🎉',
                message: `Congratulations! An admin has assigned you ${amount} credits.`,
                type: 'SYSTEM',
                isRead: false
            }
        });
        res.json({ message: 'Credits assigned successfully', credits: updatedUser.credits });
    }
    catch (error) {
        console.error('Assign User Credits Error:', error);
        res.status(500).json({ error: 'Failed to assign credits' });
    }
});
exports.assignUserCredits = assignUserCredits;
