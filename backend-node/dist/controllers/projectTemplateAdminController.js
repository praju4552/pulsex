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
exports.getEnrollmentStats = exports.deleteLesson = exports.updateLesson = exports.createLesson = exports.deleteSection = exports.updateSection = exports.createSection = exports.getProjectById = exports.deleteProject = exports.updateProject = exports.createProject = exports.listAllProjects = void 0;
const db_1 = __importDefault(require("../db"));
const API_URL = process.env.API_URL || 'http://localhost:3001';
// ── Helper ────────────────────────────────────────────────────────────────────
const videoUrl = (req) => req.file ? `${API_URL}/uploads/project-templates/${req.file.filename}` : null;
// ══ PROJECT CRUD ══════════════════════════════════════════════════════════════
const listAllProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.user.userId;
        const projects = yield db_1.default.projectTemplate.findMany({
            where: { createdByAdminId: adminId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, title: true, slug: true, bundle: true,
                stemCategory: true, level: true, isPublished: true,
                estimatedTime: true, thumbnail: true, createdAt: true,
                _count: { select: { enrollments: true, sections: true } },
            },
        });
        res.json(projects);
    }
    catch (err) {
        console.error('listAllProjects error:', err);
        res.status(500).json({ error: 'Failed to list projects' });
    }
});
exports.listAllProjects = listAllProjects;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const body = req.body;
        const adminId = req.user.userId;
        // Type coercions from FormData strings
        const isPublished = body.isPublished === 'true';
        const previewSeconds = body.previewSeconds ? (parseInt(body.previewSeconds, 10) || null) : null;
        const heroVideoUrl = body.heroVideoType === 'FILE'
            ? (videoUrl(req) || body.heroVideoUrl || '')
            : (body.heroVideoUrl || '');
        const required = ['title', 'slug', 'bundle', 'level', 'shortDescription', 'fullDescription'];
        for (const f of required) {
            if (!((_a = body[f]) === null || _a === void 0 ? void 0 : _a.trim())) {
                res.status(400).json({ error: `Field '${f}' is required` });
                return;
            }
        }
        if (body.bundle === 'STEM' && !body.stemCategory) {
            res.status(400).json({ error: 'stemCategory is required for STEM projects' });
            return;
        }
        const project = yield db_1.default.projectTemplate.create({
            data: {
                title: body.title.trim(),
                slug: body.slug.trim(),
                bundle: body.bundle,
                stemCategory: body.bundle === 'STEM' ? body.stemCategory : null,
                level: body.level,
                shortDescription: body.shortDescription.trim(),
                fullDescription: body.fullDescription.trim(),
                thumbnail: body.thumbnail || null,
                heroVideoUrl,
                heroVideoType: body.heroVideoType || 'YOUTUBE',
                previewSeconds,
                estimatedTime: ((_b = body.estimatedTime) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                isPublished,
                createdByAdminId: adminId,
                contentCredits: parseInt(body.contentCredits || '0', 10),
                imageCredits: parseInt(body.imageCredits || '0', 10),
                videoCredits: parseInt(body.videoCredits || '0', 10),
                totalCredits: (parseInt(body.contentCredits || '0', 10) + parseInt(body.imageCredits || '0', 10) + parseInt(body.videoCredits || '0', 10)),
            },
        });
        // Handle skills array (comma-separated or JSON array)
        if (body.skillIds) {
            const ids = Array.isArray(body.skillIds)
                ? body.skillIds
                : typeof body.skillIds === 'string'
                    ? body.skillIds.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];
            if (ids.length > 0) {
                yield db_1.default.pTSkill.createMany({
                    data: ids.map((sid) => ({ projectId: project.id, skillId: sid })),
                    skipDuplicates: true,
                });
            }
        }
        res.status(201).json(project);
    }
    catch (err) {
        console.error('createProject error:', err);
        if (err.code === 'P2002') {
            res.status(409).json({ error: 'A project with this slug already exists' });
        }
        else {
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
});
exports.createProject = createProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { id } = req.params;
        const body = req.body;
        const adminId = req.user.userId;
        const existing = yield db_1.default.projectTemplate.findUnique({ where: { id } });
        if (!existing || existing.createdByAdminId !== adminId) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }
        const isPublished = body.isPublished !== undefined ? body.isPublished === 'true' : existing.isPublished;
        const previewSeconds = body.previewSeconds !== undefined
            ? (parseInt(body.previewSeconds, 10) || null)
            : existing.previewSeconds;
        const heroVideoUrl = body.heroVideoType === 'FILE'
            ? (videoUrl(req) || existing.heroVideoUrl)
            : (body.heroVideoUrl || existing.heroVideoUrl);
        const updated = yield db_1.default.projectTemplate.update({
            where: { id },
            data: {
                title: ((_a = body.title) === null || _a === void 0 ? void 0 : _a.trim()) || existing.title,
                slug: ((_b = body.slug) === null || _b === void 0 ? void 0 : _b.trim()) || existing.slug,
                bundle: body.bundle || existing.bundle,
                stemCategory: body.bundle === 'STEM' ? (body.stemCategory || existing.stemCategory) : null,
                level: body.level || existing.level,
                shortDescription: ((_c = body.shortDescription) === null || _c === void 0 ? void 0 : _c.trim()) || existing.shortDescription,
                fullDescription: ((_d = body.fullDescription) === null || _d === void 0 ? void 0 : _d.trim()) || existing.fullDescription,
                thumbnail: body.thumbnail || existing.thumbnail,
                heroVideoUrl,
                heroVideoType: body.heroVideoType || existing.heroVideoType,
                previewSeconds,
                estimatedTime: ((_e = body.estimatedTime) === null || _e === void 0 ? void 0 : _e.trim()) || existing.estimatedTime,
                isPublished,
                contentCredits: body.contentCredits !== undefined ? parseInt(body.contentCredits, 10) : existing.contentCredits,
                imageCredits: body.imageCredits !== undefined ? parseInt(body.imageCredits, 10) : existing.imageCredits,
                videoCredits: body.videoCredits !== undefined ? parseInt(body.videoCredits, 10) : existing.videoCredits,
                totalCredits: ((body.contentCredits !== undefined ? parseInt(body.contentCredits, 10) : existing.contentCredits) +
                    (body.imageCredits !== undefined ? parseInt(body.imageCredits, 10) : existing.imageCredits) +
                    (body.videoCredits !== undefined ? parseInt(body.videoCredits, 10) : existing.videoCredits)),
            },
        });
        // Sync skills
        if (body.skillIds !== undefined) {
            const ids = Array.isArray(body.skillIds)
                ? body.skillIds
                : typeof body.skillIds === 'string'
                    ? body.skillIds.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];
            yield db_1.default.pTSkill.deleteMany({ where: { projectId: id } });
            if (ids.length > 0) {
                yield db_1.default.pTSkill.createMany({
                    data: ids.map((sid) => ({ projectId: id, skillId: sid })),
                    skipDuplicates: true,
                });
            }
        }
        res.json(updated);
    }
    catch (err) {
        console.error('updateProject error:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});
exports.updateProject = updateProject;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const existing = yield db_1.default.projectTemplate.findUnique({ where: { id } });
        if (!existing || existing.createdByAdminId !== adminId) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }
        yield db_1.default.projectTemplate.delete({ where: { id } });
        res.json({ message: 'Project deleted' });
    }
    catch (err) {
        console.error('deleteProject error:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
exports.deleteProject = deleteProject;
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project = yield db_1.default.projectTemplate.findUnique({
            where: { id },
            include: {
                sections: {
                    orderBy: { order: 'asc' },
                    include: { lessons: { orderBy: { order: 'asc' } } },
                },
                skills: { select: { skillId: true } },
            },
        });
        const adminId = req.user.userId;
        if (!project || project.createdByAdminId !== adminId) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }
        res.json(project);
    }
    catch (err) {
        console.error('getProjectById error:', err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
exports.getProjectById = getProjectById;
// ══ SECTION CRUD ══════════════════════════════════════════════════════════════
const createSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, projectId, order } = req.body;
        if (!(title === null || title === void 0 ? void 0 : title.trim()) || !projectId) {
            res.status(400).json({ error: 'title and projectId are required' });
            return;
        }
        const adminId = req.user.userId;
        const project = yield db_1.default.projectTemplate.findUnique({ where: { id: projectId } });
        if (!project || project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const section = yield db_1.default.projectSection.create({
            data: { title: title.trim(), projectId, order: order !== null && order !== void 0 ? order : 0 },
        });
        res.status(201).json(section);
    }
    catch (err) {
        console.error('createSection error:', err);
        res.status(500).json({ error: 'Failed to create section' });
    }
});
exports.createSection = createSection;
const updateSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, order } = req.body;
        const adminId = req.user.userId;
        const existingSection = yield db_1.default.projectSection.findUnique({ where: { id }, include: { project: true } });
        if (!existingSection || existingSection.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const updated = yield db_1.default.projectSection.update({
            where: { id },
            data: Object.assign(Object.assign({}, (title !== undefined && { title: title.trim() })), (order !== undefined && { order: Number(order) })),
        });
        res.json(updated);
    }
    catch (err) {
        console.error('updateSection error:', err);
        res.status(500).json({ error: 'Failed to update section' });
    }
});
exports.updateSection = updateSection;
const deleteSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const existingSection = yield db_1.default.projectSection.findUnique({ where: { id }, include: { project: true } });
        if (!existingSection || existingSection.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        yield db_1.default.projectSection.delete({ where: { id } });
        res.json({ message: 'Section deleted' });
    }
    catch (err) {
        console.error('deleteSection error:', err);
        res.status(500).json({ error: 'Failed to delete section' });
    }
});
exports.deleteSection = deleteSection;
// ══ LESSON CRUD ═══════════════════════════════════════════════════════════════
const createLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, sectionId, content, order } = req.body;
        if (!(title === null || title === void 0 ? void 0 : title.trim()) || !sectionId) {
            res.status(400).json({ error: 'title and sectionId are required' });
            return;
        }
        const adminId = req.user.userId;
        const section = yield db_1.default.projectSection.findUnique({ where: { id: sectionId }, include: { project: true } });
        if (!section || section.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const lesson = yield db_1.default.projectLesson.create({
            data: {
                title: title.trim(),
                sectionId,
                content: (content === null || content === void 0 ? void 0 : content.trim()) || '',
                order: order !== null && order !== void 0 ? order : 0,
            },
        });
        res.status(201).json(lesson);
    }
    catch (err) {
        console.error('createLesson error:', err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});
exports.createLesson = createLesson;
const updateLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content, order } = req.body;
        const adminId = req.user.userId;
        const lesson = yield db_1.default.projectLesson.findUnique({ where: { id }, include: { section: { include: { project: true } } } });
        if (!lesson || lesson.section.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const updated = yield db_1.default.projectLesson.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (title !== undefined && { title: title.trim() })), (content !== undefined && { content: content.trim() })), (order !== undefined && { order: Number(order) })),
        });
        res.json(updated);
    }
    catch (err) {
        console.error('updateLesson error:', err);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});
exports.updateLesson = updateLesson;
const deleteLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const lesson = yield db_1.default.projectLesson.findUnique({ where: { id }, include: { section: { include: { project: true } } } });
        if (!lesson || lesson.section.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        yield db_1.default.projectLesson.delete({ where: { id } });
        res.json({ message: 'Lesson deleted' });
    }
    catch (err) {
        console.error('deleteLesson error:', err);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});
exports.deleteLesson = deleteLesson;
// ══ ADMIN USERS VIEW ══════════════════════════════════════════════════════════
const getEnrollmentStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.user.userId;
        const enrollments = yield db_1.default.enrollment.findMany({
            where: { project: { createdByAdminId: adminId } },
            include: {
                project: {
                    select: {
                        id: true, title: true,
                        sections: { include: { lessons: { select: { id: true } } } },
                    },
                },
            },
        });
        const result = yield Promise.all(enrollments.map((e) => __awaiter(void 0, void 0, void 0, function* () {
            const allLessonIds = e.project.sections.flatMap((s) => s.lessons.map((l) => l.id));
            const completed = yield db_1.default.lessonProgress.count({
                where: { userId: e.userId, lessonId: { in: allLessonIds }, completed: true },
            });
            const total = allLessonIds.length;
            return {
                userId: e.userId,
                projectTitle: e.project.title,
                projectId: e.project.id,
                enrolledAt: e.enrolledAt,
                completedLessons: completed,
                totalLessons: total,
                percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
        })));
        res.json(result);
    }
    catch (err) {
        console.error('getEnrollmentStats error:', err);
        res.status(500).json({ error: 'Failed to fetch enrollment stats' });
    }
});
exports.getEnrollmentStats = getEnrollmentStats;
