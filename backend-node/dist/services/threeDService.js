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
exports.ThreeDService = void 0;
const THREE = __importStar(require("three"));
const STLLoader_js_1 = require("three/examples/jsm/loaders/STLLoader.js");
const fs_1 = __importDefault(require("fs"));
class ThreeDService {
    /**
     * Processes a 3D file and extracts metadata.
     * Supports STL and 3MF.
     */
    static getMetadata(filePath, fileType) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = fs_1.default.readFileSync(filePath);
            let geometry;
            if (fileType.toLowerCase().includes('stl') || filePath.toLowerCase().endsWith('.stl')) {
                const loader = new STLLoader_js_1.STLLoader();
                // STLLoader.parse expects an ArrayBuffer
                const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                geometry = loader.parse(arrayBuffer);
            }
            else if (fileType.toLowerCase().includes('3mf') || filePath.toLowerCase().endsWith('.3mf')) {
                // Lazy-load 3MF dependencies to avoid crashing the server on startup
                // TypeScript compiles import() to require() with module:"commonjs",
                // so we use Function() to get a real ESM dynamic import
                const dynamicImport = new Function('specifier', 'return import(specifier)');
                const { ThreeMFLoader } = yield dynamicImport('three/examples/jsm/loaders/3MFLoader.js');
                const BufferGeometryUtils = yield dynamicImport('three/examples/jsm/utils/BufferGeometryUtils.js');
                const loader = new ThreeMFLoader();
                const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                const group = loader.parse(arrayBuffer);
                const geometries = [];
                group.traverse((child) => {
                    if (child.isMesh) {
                        const mesh = child;
                        if (mesh.geometry) {
                            mesh.updateMatrixWorld();
                            const geom = mesh.geometry.clone();
                            geom.applyMatrix4(mesh.matrixWorld);
                            geometries.push(geom);
                        }
                    }
                });
                if (geometries.length === 0) {
                    throw new Error('No valid meshes found in 3MF file.');
                }
                const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
                if (!merged) {
                    throw new Error('Failed to merge 3MF geometries.');
                }
                geometry = merged;
            }
            else {
                // Placeholder for OBJ/STEP
                throw new Error(`Unsupported file type for metadata extraction: ${fileType}. Please use STL or 3MF.`);
            }
            if (!geometry.index && geometry.attributes.position) {
                // If not indexed, we can still calculate
            }
            const metadata = this.calculateMetadata(geometry);
            return metadata;
        });
    }
    static calculateMetadata(geometry) {
        // 1. Triangle Count
        const positionAttribute = geometry.getAttribute('position');
        const triangleCount = positionAttribute.count / 3;
        // 2. Dimensions (Bounding Box)
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const depth = bbox.max.z - bbox.min.z;
        // 3. Volume and Surface Area
        let volume = 0;
        let surfaceArea = 0;
        const pos = positionAttribute.array;
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        const p3 = new THREE.Vector3();
        for (let i = 0; i < pos.length; i += 9) {
            p1.set(pos[i], pos[i + 1], pos[i + 2]);
            p2.set(pos[i + 3], pos[i + 4], pos[i + 5]);
            p3.set(pos[i + 6], pos[i + 7], pos[i + 8]);
            // Signed volume of tetrahedron formed by origin and triangle faces
            volume += p1.dot(p2.cross(p3)) / 6.0;
            // Surface Area
            const edge1 = new THREE.Vector3().subVectors(p2, p1);
            const edge2 = new THREE.Vector3().subVectors(p3, p1);
            surfaceArea += new THREE.Vector3().crossVectors(edge1, edge2).length() * 0.5;
        }
        // 4. Estimated Print Time (Very basic heuristic: Volume based)
        // Assume 10mm3 per second for standard printing + some overhead
        const estimatedPrintTime = (Math.abs(volume) / 10) / 60 + 30; // Minutes
        return {
            volume: Math.abs(volume),
            surfaceArea,
            width,
            height,
            depth,
            triangleCount,
            estimatedPrintTime
        };
    }
}
exports.ThreeDService = ThreeDService;
