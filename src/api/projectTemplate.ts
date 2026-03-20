/// <reference types="vite/client" />
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('authToken');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type ProjectBundle = 'STEM' | 'LIFESTYLE';
export type StemCategory = 'BOARDS' | 'PCB_DESIGNING' | 'PRINTING_3D';
export type ProjectLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type VideoType = 'YOUTUBE' | 'FILE';

export interface ProjectTemplate {
    id: string;
    title: string;
    slug: string;
    bundle: ProjectBundle;
    stemCategory: StemCategory | null;
    level: ProjectLevel;
    shortDescription: string;
    fullDescription: string;
    thumbnail: string | null;
    heroVideoUrl: string;
    heroVideoType: VideoType;
    previewSeconds: number | null;
    estimatedTime: string | null;
    isPublished: boolean;
    contentCredits: number;
    imageCredits: number;
    videoCredits: number;
    totalCredits: number;
    createdAt: string;
    sections?: ProjectSection[];
    skills?: { skillId: string }[];
    images?: ProjectImage[];
    _count?: { enrollments: number };
}

export interface ProjectSection {
    id: string;
    title: string;
    order: number;
    lessons: ProjectLesson[];
}

export interface ProjectLesson {
    id: string;
    title: string;
    content: string;
    order: number;
    sectionId: string;
}

export interface ProjectImage {
    id: string;
    projectId: string;
    imageUrl: string;
    order: number;
}

// ── Public API ────────────────────────────────────────────────────────────────
export const ptApi = {
    listProjects: async (filters?: { bundle?: string; stemCategory?: string; level?: string }) => {
        const params = new URLSearchParams();
        if (filters?.bundle) params.set('bundle', filters.bundle);
        if (filters?.stemCategory) params.set('stemCategory', filters.stemCategory);
        if (filters?.level) params.set('level', filters.level);
        const res = await api.get<ProjectTemplate[]>(`/api/project-template?${params}`);
        return res.data;
    },

    getProject: async (slug: string) => {
        const res = await api.get<ProjectTemplate>(`/api/project-template/project/${slug}`);
        return res.data;
    },

    enroll: async (projectId: string, unlockType: 'CONTENT' | 'IMAGE' | 'VIDEO' | 'ALL' = 'ALL') => {
        const res = await api.post('/api/project-template/enroll', { projectId, unlockType });
        return res.data;
    },

    checkEnrollment: async (projectId: string) => {
        const res = await api.get<{ enrolled: boolean, enrollment?: any }>(`/api/project-template/enrollment/${projectId}`);
        return res.data;
    },

    completeLesson: async (lessonId: string) => {
        const res = await api.post(`/api/project-template/progress/${lessonId}`);
        return res.data;
    },

    getProgress: async (projectId: string) => {
        const res = await api.get<{
            projectId: string; completed: number; total: number;
            percent: number; completedLessonIds: string[];
        }>(`/api/project-template/progress/${projectId}`);
        return res.data;
    },

    // ── Admin API ─────────────────────────────────────────────────────────────
    admin: {
        listProjects: async () => {
            const res = await api.get<ProjectTemplate[]>('/api/project-template/admin/projects');
            return res.data;
        },
        getProject: async (id: string) => {
            const res = await api.get<ProjectTemplate>(`/api/project-template/admin/project/${id}`);
            return res.data;
        },
        createProject: async (data: FormData) => {
            const res = await api.post<ProjectTemplate>('/api/project-template/admin/project', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        updateProject: async (id: string, data: FormData) => {
            const res = await api.put<ProjectTemplate>(`/api/project-template/admin/project/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        deleteProject: async (id: string) => {
            await api.delete(`/api/project-template/admin/project/${id}`);
        },

        createSection: async (data: { title: string; projectId: string; order: number }) => {
            const res = await api.post('/api/project-template/admin/section', data);
            return res.data;
        },
        updateSection: async (id: string, data: { title?: string; order?: number }) => {
            const res = await api.put(`/api/project-template/admin/section/${id}`, data);
            return res.data;
        },
        deleteSection: async (id: string) => {
            await api.delete(`/api/project-template/admin/section/${id}`);
        },

        createLesson: async (data: { title: string; sectionId: string; content: string; order: number }) => {
            const res = await api.post('/api/project-template/admin/lesson', data);
            return res.data;
        },
        updateLesson: async (id: string, data: { title?: string; content?: string; order?: number }) => {
            const res = await api.put(`/api/project-template/admin/lesson/${id}`, data);
            return res.data;
        },
        deleteLesson: async (id: string) => {
            await api.delete(`/api/project-template/admin/lesson/${id}`);
        },

        getEnrollmentStats: async () => {
            const res = await api.get('/api/project-template/admin/enrollments');
            return res.data;
        },

        // Images
        uploadImage: async (projectId: string, file: File, order?: number) => {
            const fd = new FormData();
            fd.append('image', file);
            fd.append('projectId', projectId);
            if (order !== undefined) fd.append('order', String(order));
            const res = await api.post<ProjectImage>('/api/project-template/admin/upload-image', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        listImages: async (projectId: string) => {
            const res = await api.get<ProjectImage[]>(`/api/project-template/admin/images/${projectId}`);
            return res.data;
        },
        deleteImage: async (id: string) => {
            await api.delete(`/api/project-template/admin/image/${id}`);
        },
        updateImageOrder: async (id: string, order: number) => {
            const res = await api.patch(`/api/project-template/admin/image/${id}/order`, { order });
            return res.data;
        },
    },
};
