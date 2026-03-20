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
exports.deleteNotification = exports.clearNotifications = exports.markAllAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUserNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const notifications = yield prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to 50 recent
        });
        const unreadCount = yield prisma.notification.count({
            where: { userId, isRead: false }
        });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching notifications" });
    }
});
exports.getUserNotifications = getUserNotifications;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        yield prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });
        res.json({ message: "Notification marked as read" });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating notification" });
    }
});
exports.markAsRead = markAsRead;
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        yield prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ message: "All notifications marked as read" });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating notifications" });
    }
});
exports.markAllAsRead = markAllAsRead;
const clearNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        yield prisma.notification.deleteMany({
            where: { userId }
        });
        res.json({ message: "Notifications cleared" });
    }
    catch (error) {
        res.status(500).json({ message: "Error clearing notifications" });
    }
});
exports.clearNotifications = clearNotifications;
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        yield prisma.notification.deleteMany({
            where: { id, userId }
        });
        res.json({ message: "Notification deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting notification" });
    }
});
exports.deleteNotification = deleteNotification;
