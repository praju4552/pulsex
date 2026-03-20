"use strict";
/**
 * resetTemplates.ts
 * Controlled deletion of all Project Template data.
 * Deletes in correct FK dependency order.
 * Does NOT delete users, skills, or unrelated data.
 */
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
const db_1 = __importDefault(require("../db"));
function resetTemplates() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting controlled Project Templates data reset...');
        try {
            // 1. Delete UserProgress (tied to Steps)
            const progressDeleted = yield db_1.default.userProgress.deleteMany({});
            console.log(`[1/9] Deleted ${progressDeleted.count} UserProgress records`);
            // 2. Delete FailureSimulations (tied to Steps)
            const failuresDeleted = yield db_1.default.failureSimulation.deleteMany({});
            console.log(`[2/9] Deleted ${failuresDeleted.count} FailureSimulation records`);
            // 3. Delete Steps (tied to Modules)
            const stepsDeleted = yield db_1.default.step.deleteMany({});
            console.log(`[3/9] Deleted ${stepsDeleted.count} Step records`);
            // 4. Delete Modules (tied to ProjectVersions)
            const modulesDeleted = yield db_1.default.module.deleteMany({});
            console.log(`[4/9] Deleted ${modulesDeleted.count} Module records`);
            // 5. Delete Components (tied to ProjectVersions)
            const componentsDeleted = yield db_1.default.component.deleteMany({});
            console.log(`[5/9] Deleted ${componentsDeleted.count} Component records`);
            // 6. Delete CommonIssues (tied to ProjectVersions)
            const issuesDeleted = yield db_1.default.commonIssue.deleteMany({});
            console.log(`[6/9] Deleted ${issuesDeleted.count} CommonIssue records`);
            // 7. Delete ProjectVersions (tied to Projects)
            const versionsDeleted = yield db_1.default.projectVersion.deleteMany({});
            console.log(`[7/9] Deleted ${versionsDeleted.count} ProjectVersion records`);
            // 8. Delete ProjectSkills (tied to Projects)
            const skillLinksDeleted = yield db_1.default.projectSkill.deleteMany({});
            console.log(`[8/9] Deleted ${skillLinksDeleted.count} ProjectSkill link records`);
            // 9. Delete UserProjectActivity and UserSearchHistory (tied to Projects)
            yield db_1.default.userProjectActivity.deleteMany({});
            yield db_1.default.userSearchHistory.deleteMany({});
            // 10. Delete Projects and Categories
            const projectsDeleted = yield db_1.default.project.deleteMany({});
            console.log(`[9/9] Deleted ${projectsDeleted.count} Project records`);
            const categoriesDeleted = yield db_1.default.category.deleteMany({});
            console.log(`     Deleted ${categoriesDeleted.count} Category records`);
            console.log('\n✅ Template data reset complete. Database is clean and ready for new schema migration.');
        }
        catch (error) {
            console.error('❌ Reset failed:', error);
            process.exit(1);
        }
        finally {
            yield db_1.default.$disconnect();
        }
    });
}
resetTemplates();
