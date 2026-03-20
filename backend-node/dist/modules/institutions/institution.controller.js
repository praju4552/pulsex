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
exports.institutionController = void 0;
const institution_service_1 = require("./institution.service");
exports.institutionController = {
    getAll: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const institutions = yield institution_service_1.institutionService.getAllInstitutions();
            res.json(institutions);
        }
        catch (error) {
            console.error('Error fetching institutions:', error);
            res.status(500).json({ error: 'Failed to fetch institutions' });
        }
    }),
    getById: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const institution = yield institution_service_1.institutionService.getInstitutionById(id);
            if (!institution) {
                return res.status(404).json({ error: 'Institution not found' });
            }
            res.json(institution);
        }
        catch (error) {
            console.error('Error fetching institution details:', error);
            res.status(500).json({ error: 'Failed to fetch institution details' });
        }
    }),
    create: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = req.body;
            // Native creation purely for admin override. Standard setup uses public registration flow.
            if (!data.name || !data.email || !data.contactNo || !data.address) {
                return res.status(400).json({ error: 'Missing required configuration fields.' });
            }
            const newInst = yield institution_service_1.institutionService.createInstitution(data);
            res.status(201).json(newInst);
        }
        catch (error) {
            console.error('Error creating institution manually:', error);
            res.status(500).json({ error: 'Failed to manually bind institution' });
        }
    }),
    update: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const updated = yield institution_service_1.institutionService.updateInstitution(id, req.body);
            res.json(updated);
        }
        catch (error) {
            console.error('Error updating institution:', error);
            res.status(500).json({ error: 'Failed to update institution schema' });
        }
    }),
    approve: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const result = yield institution_service_1.institutionService.approveInstitution(id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error approving institution:', error);
            res.status(400).json({ error: error.message || 'Failed to approve institution natively' });
        }
    }),
    reject: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const result = yield institution_service_1.institutionService.rejectInstitution(id);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error rejecting institution:', error);
            res.status(400).json({ error: error.message || 'Failed to reject institution natively' });
        }
    }),
    updatePassword: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ error: 'Password is required' });
            }
            const updated = yield institution_service_1.institutionService.updateAdminPassword(id, password);
            res.json(updated);
        }
        catch (error) {
            console.error('Error updating institution password:', error);
            res.status(500).json({ error: error.message || 'Failed to update password' });
        }
    }),
    delete: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            yield institution_service_1.institutionService.deleteInstitution(id);
            res.json({ message: 'Institution securely removed.' });
        }
        catch (error) {
            console.error('Error deleting institution mapping:', error);
            res.status(500).json({ error: 'Failed to delete configured institution' });
        }
    })
};
