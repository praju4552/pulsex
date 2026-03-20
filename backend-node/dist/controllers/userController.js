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
exports.deleteHistoryItem = exports.clearUserHistory = exports.getUserHistory = exports.getUserDashboard = exports.trackProjectView = exports.saveSearch = void 0;
const db_1 = __importDefault(require("../db"));
const saveSearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { query, projectId } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        yield db_1.default.userSearchHistory.create({
            data: {
                userId,
                query,
                projectId: projectId || null
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Save Search Error:', error);
        res.status(500).json({ error: 'Failed to save search' });
    }
});
exports.saveSearch = saveSearch;
const trackProjectView = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { projectId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        yield db_1.default.userProjectActivity.create({
            data: {
                userId,
                projectId
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Track Project View Error:', error);
        res.status(500).json({ error: 'Failed to track project view' });
    }
});
exports.trackProjectView = trackProjectView;
const getUserDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 1. User Info
        const user = yield db_1.default.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, role: true }
        });
        // 2. Recent Searches (Last 5)
        const recentSearches = yield db_1.default.userSearchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                query: true,
                createdAt: true,
                projectId: true,
                project: { select: { title: true, slug: true } }
            }
        });
        // 3. Recently Viewed Projects
        const recentActivity = yield db_1.default.userProjectActivity.findMany({
            where: { userId },
            orderBy: { viewedAt: 'desc' },
            take: 20,
            include: {
                project: {
                    include: {
                        category: { select: { slug: true } }
                    }
                }
            }
        });
        const uniqueProjectsMap = new Map();
        recentActivity.forEach((activity) => {
            if (!uniqueProjectsMap.has(activity.projectId)) {
                uniqueProjectsMap.set(activity.projectId, activity.project);
            }
        });
        const recentlyViewed = Array.from(uniqueProjectsMap.values()).slice(0, 5);
        // 4. Progress Stats
        const progressStats = yield db_1.default.userProgress.aggregate({
            where: { userId, isCompleted: true },
            _sum: { xpEarned: true },
            _count: { stepId: true }
        });
        // 5. Skill XP Summary
        const skills = yield db_1.default.skillProgress.findMany({
            where: { userId },
            include: { skill: true }
        });
        // 6. Active Projects
        const userProgress = yield db_1.default.userProgress.findMany({
            where: { userId, isCompleted: true },
            include: {
                step: {
                    include: {
                        module: {
                            include: {
                                version: {
                                    include: {
                                        project: {
                                            include: { category: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const activeVersionIds = Array.from(new Set(userProgress.map(p => p.step.module.versionId)));
        const activeProjects = [];
        for (const vId of activeVersionIds) {
            const totalSteps = yield db_1.default.step.count({
                where: { module: { versionId: vId } }
            });
            const completedSteps = yield db_1.default.userProgress.count({
                where: { userId, isCompleted: true, step: { module: { versionId: vId } } }
            });
            if (completedSteps < totalSteps) {
                const version = yield db_1.default.projectVersion.findUnique({
                    where: { id: vId },
                    include: { project: { include: { category: true } } }
                });
                if (version) {
                    activeProjects.push({
                        versionId: vId,
                        projectId: version.projectId,
                        projectSlug: version.project.slug,
                        categorySlug: version.project.category.slug,
                        title: version.project.title,
                        versionName: version.name,
                        completedSteps,
                        totalSteps,
                        progressPercentage: Math.round((completedSteps / totalSteps) * 100)
                    });
                }
            }
        }
        // 7. Project Templates (Enrollments)
        const userEnrollments = yield db_1.default.enrollment.findMany({
            where: { userId },
            include: {
                project: {
                    include: {
                        sections: {
                            include: {
                                lessons: true
                            }
                        }
                    }
                }
            }
        });
        for (const enrollment of userEnrollments) {
            const project = enrollment.project;
            let totalSteps = 0;
            const lessonIds = [];
            project.sections.forEach(section => {
                totalSteps += section.lessons.length;
                section.lessons.forEach(lesson => lessonIds.push(lesson.id));
            });
            const completedSteps = yield db_1.default.lessonProgress.count({
                where: {
                    userId,
                    lessonId: { in: lessonIds },
                    completed: true
                }
            });
            activeProjects.push({
                versionId: project.id, // Using project id here since templates don't have separate versions
                projectId: project.id,
                projectSlug: project.slug,
                categorySlug: 'template', // To hint the frontend on how to route this
                title: project.title,
                versionName: `Template - ${project.level}`,
                completedSteps,
                totalSteps,
                progressPercentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
                isTemplate: true // flag
            });
        }
        res.json({
            user: {
                name: (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email.split('@')[0]),
                email: user === null || user === void 0 ? void 0 : user.email,
                role: user === null || user === void 0 ? void 0 : user.role
            },
            recentSearches,
            recentlyViewed,
            stats: {
                totalXp: ((_b = progressStats === null || progressStats === void 0 ? void 0 : progressStats._sum) === null || _b === void 0 ? void 0 : _b.xpEarned) || 0,
                completedStepsCount: ((_c = progressStats === null || progressStats === void 0 ? void 0 : progressStats._count) === null || _c === void 0 ? void 0 : _c.stepId) || 0
            },
            skills: skills.map((sp) => ({
                name: sp.skill.name,
                category: sp.skill.category,
                xp: sp.xp,
                level: sp.level
            })),
            activeProjects
        });
    }
    catch (error) {
        console.error('Get Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});
exports.getUserDashboard = getUserDashboard;
const getUserHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const searches = yield db_1.default.userSearchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { project: { select: { title: true, slug: true } } }
        });
        const activities = yield db_1.default.userProjectActivity.findMany({
            where: { userId },
            orderBy: { viewedAt: 'desc' },
            include: {
                project: {
                    include: { category: { select: { slug: true } } }
                }
            }
        });
        res.json({ searches, activities });
    }
    catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
exports.getUserHistory = getUserHistory;
const clearUserHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        yield db_1.default.$transaction([
            db_1.default.userSearchHistory.deleteMany({ where: { userId } }),
            db_1.default.userProjectActivity.deleteMany({ where: { userId } })
        ]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Clear History Error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});
exports.clearUserHistory = clearUserHistory;
const deleteHistoryItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const searchRes = yield db_1.default.userSearchHistory.deleteMany({
            where: { id, userId }
        });
        if (searchRes.count === 0) {
            yield db_1.default.userProjectActivity.deleteMany({
                where: { id, userId }
            });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete History Item Error:', error);
        res.status(500).json({ error: 'Failed to delete history item' });
    }
});
exports.deleteHistoryItem = deleteHistoryItem;
