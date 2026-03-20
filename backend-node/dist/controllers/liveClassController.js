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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLiveClass = exports.toggleLiveStatus = exports.createLiveClass = exports.getAllLiveClasses = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllLiveClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classes = yield prisma.liveClass.findMany({
            orderBy: { startTime: 'desc' }
        });
        res.json({ classes });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching live classes" });
    }
});
exports.getAllLiveClasses = getAllLiveClasses;
const createLiveClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topic, description, professorName, professorBio, professorAvatar, startTime, streamUrl } = req.body;
        const newClass = yield prisma.liveClass.create({
            data: {
                topic,
                description,
                professorName,
                professorBio,
                professorAvatar,
                startTime: new Date(startTime),
                streamUrl,
                isLive: false
            }
        });
        // Auto-notify all users about the new class
        const users = yield prisma.user.findMany({ select: { id: true } });
        const notifications = users.map(u => ({
            userId: u.id,
            title: "New Live Class Scheduled!",
            message: `Topic: ${topic} with Prof. ${professorName}`,
            type: "LIVE_CLASS",
            link: "/live-classes"
        }));
        yield prisma.notification.createMany({
            data: notifications
        });
        res.status(201).json({ message: "Live Class scheduled and notifications sent", class: newClass });
    }
    catch (error) {
        console.error("Create Live Class Error:", error);
        res.status(500).json({ message: "Error scheduling live class" });
    }
});
exports.createLiveClass = createLiveClass;
const toggleLiveStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isLive } = req.body;
        const updated = yield prisma.liveClass.update({
            where: { id },
            data: { isLive }
        });
        // If going live, send another urgent notification
        if (isLive) {
            const users = yield prisma.user.findMany({ select: { id: true } });
            const notifications = users.map(u => ({
                userId: u.id,
                title: "WE ARE LIVE!",
                message: `The class on "${updated.topic}" has started. Join now!`,
                type: "LIVE_CLASS_URGENT",
                link: `/live-classes`
            }));
            yield prisma.notification.createMany({ data: notifications });
        }
        res.json({ message: `Class is now ${isLive ? 'Live' : 'Offline'}`, class: updated });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating live status" });
    }
});
exports.toggleLiveStatus = toggleLiveStatus;
const deleteLiveClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.liveClass.delete({ where: { id } });
        res.json({ message: "Live class deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting live class" });
    }
});
exports.deleteLiveClass = deleteLiveClass;
