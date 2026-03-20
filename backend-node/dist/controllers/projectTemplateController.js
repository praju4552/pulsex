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
exports.getProjectProgress = exports.completeLesson = exports.checkEnrollment = exports.enrollUser = exports.getProject = exports.listProjects = void 0;
const db_1 = __importDefault(require("../db"));
// ── List projects (public, with filters) ──────────────────────────────────────
const listProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bundle, stemCategory, level } = req.query;
        const where = { isPublished: true };
        if (bundle)
            where.bundle = bundle;
        if (stemCategory)
            where.stemCategory = stemCategory;
        if (level)
            where.level = level;
        const projects = yield db_1.default.projectTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                bundle: true,
                stemCategory: true,
                level: true,
                shortDescription: true,
                thumbnail: true,
                estimatedTime: true,
                heroVideoUrl: true,
                heroVideoType: true,
                previewSeconds: true,
                contentCredits: true,
                imageCredits: true,
                videoCredits: true,
                totalCredits: true,
                skills: { select: { skillId: true } },
                _count: { select: { enrollments: true } },
            },
        });
        res.json(projects);
    }
    catch (error) {
        console.error('listProjects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
exports.listProjects = listProjects;
// ── Get single project by slug (public) ──────────────────────────────────────
const getProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const project = yield db_1.default.projectTemplate.findUnique({
            where: { slug },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: { orderBy: { order: 'asc' } },
                    },
                },
                skills: { select: { skillId: true } },
                images: { orderBy: { order: 'asc' } },
                _count: { select: { enrollments: true } },
            },
        });
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(project);
    }
    catch (error) {
        console.error('getProject error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
exports.getProject = getProject;
// ── Enroll user ───────────────────────────────────────────────────────────────
const enrollUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { projectId, unlockType = 'ALL' } = req.body;
        if (!projectId) {
            res.status(400).json({ error: 'projectId is required' });
            return;
        }
        const existing = yield db_1.default.enrollment.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });
        if (existing) {
            if (unlockType === 'CONTENT' && existing.contentUnlocked) {
                res.json({ message: 'Already unlocked', enrollment: existing });
                return;
            }
            if (unlockType === 'IMAGE' && existing.imageUnlocked) {
                res.json({ message: 'Already unlocked', enrollment: existing });
                return;
            }
            if (unlockType === 'VIDEO' && existing.videoUnlocked) {
                res.json({ message: 'Already unlocked', enrollment: existing });
                return;
            }
            if (unlockType === 'ALL' && existing.contentUnlocked && existing.imageUnlocked && existing.videoUnlocked) {
                res.json({ message: 'Already unlocked', enrollment: existing });
                return;
            }
        }
        const enrollment = yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield tx.user.findUnique({ where: { id: userId } });
            const project = yield tx.projectTemplate.findUnique({ where: { id: projectId } });
            if (!user)
                throw new Error('User not found');
            if (!project)
                throw new Error('Project not found');
            let cost = 0;
            switch (unlockType) {
                case 'CONTENT':
                    cost = project.contentCredits || 0;
                    break;
                case 'IMAGE':
                    cost = project.imageCredits || 0;
                    break;
                case 'VIDEO':
                    cost = project.videoCredits || 0;
                    break;
                case 'ALL':
                    cost = project.totalCredits || 0;
                    break;
                default: throw new Error('Invalid unlockType');
            }
            if (user.credits < cost) {
                throw new Error(`Insufficient credits. Required: ${cost}, Current: ${user.credits}`);
            }
            // Deduct credits
            yield tx.user.update({
                where: { id: userId },
                data: { credits: { decrement: cost } },
            });
            // Log transaction
            yield tx.projectCreditTransaction.create({
                data: {
                    userId,
                    projectId,
                    amount: cost,
                    type: 'DEDUCTION',
                    reason: `Unlocked ${unlockType} for project: ${project.title}`,
                },
            });
            if (existing) {
                return yield tx.enrollment.update({
                    where: { id: existing.id },
                    data: {
                        contentUnlocked: unlockType === 'CONTENT' || unlockType === 'ALL' ? true : existing.contentUnlocked,
                        imageUnlocked: unlockType === 'IMAGE' || unlockType === 'ALL' ? true : existing.imageUnlocked,
                        videoUnlocked: unlockType === 'VIDEO' || unlockType === 'ALL' ? true : existing.videoUnlocked,
                    },
                });
            }
            else {
                return yield tx.enrollment.create({
                    data: {
                        userId,
                        projectId,
                        contentUnlocked: unlockType === 'CONTENT' || unlockType === 'ALL',
                        imageUnlocked: unlockType === 'IMAGE' || unlockType === 'ALL',
                        videoUnlocked: unlockType === 'VIDEO' || unlockType === 'ALL',
                    },
                });
            }
        }));
        res.status(201).json(enrollment);
    }
    catch (error) {
        console.error('enrollUser error:', error);
        res.status(400).json({ error: error.message || 'Failed to enroll' });
    }
});
exports.enrollUser = enrollUser;
// ── Check enrollment status ───────────────────────────────────────────────────
const checkEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        const enrollment = yield db_1.default.enrollment.findUnique({
            where: { userId_projectId: { userId, projectId } },
        });
        res.json({ enrolled: !!enrollment, enrollment });
    }
    catch (error) {
        console.error('checkEnrollment error:', error);
        res.status(500).json({ error: 'Failed to check enrollment' });
    }
});
exports.checkEnrollment = checkEnrollment;
// ── Mark lesson complete ──────────────────────────────────────────────────────
const completeLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { lessonId } = req.params;
        const progress = yield db_1.default.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: { completed: true },
            create: { userId, lessonId, completed: true },
        });
        res.json(progress);
    }
    catch (error) {
        console.error('completeLesson error:', error);
        res.status(500).json({ error: 'Failed to mark lesson complete' });
    }
});
exports.completeLesson = completeLesson;
// ── Get project progress ──────────────────────────────────────────────────────
const getProjectProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        const project = yield db_1.default.projectTemplate.findUnique({
            where: { id: projectId },
            include: {
                sections: {
                    include: { lessons: { select: { id: true } } },
                },
            },
        });
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        const allLessonIds = project.sections.flatMap((s) => s.lessons.map((l) => l.id));
        const completedCount = yield db_1.default.lessonProgress.count({
            where: { userId, lessonId: { in: allLessonIds }, completed: true },
        });
        const completedLessonIds = yield db_1.default.lessonProgress.findMany({
            where: { userId, lessonId: { in: allLessonIds }, completed: true },
            select: { lessonId: true },
        });
        const total = allLessonIds.length;
        const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        res.json({
            projectId,
            completed: completedCount,
            total,
            percent,
            completedLessonIds: completedLessonIds.map((p) => p.lessonId),
        });
    }
    catch (error) {
        console.error('getProjectProgress error:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
exports.getProjectProgress = getProjectProgress;
