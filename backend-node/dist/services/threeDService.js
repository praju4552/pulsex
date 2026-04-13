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
exports.ThreeDService = void 0;
const fs_1 = __importDefault(require("fs"));
// Use Function() constructor to get a real ESM dynamic import()
// that TypeScript won't transform into require() during CommonJS compilation.
const dynamicImport = new Function('specifier', 'return import(specifier)');
class ThreeDService {
    /**
     * Processes a 3D file and extracts metadata.
     * Supports STL and 3MF.
     * All three.js imports are lazy-loaded to prevent server crash on startup.
     */
    static getMetadata(filePath, fileType) {
        return __awaiter(this, void 0, void 0, function* () {
            // Lazy-load three.js core only when actually processing a file
            const THREE = yield dynamicImport('three');
            const data = fs_1.default.readFileSync(filePath);
            let geometry; // THREE.BufferGeometry
            if (fileType.toLowerCase().includes('stl') || filePath.toLowerCase().endsWith('.stl')) {
                const { STLLoader } = yield dynamicImport('three/examples/jsm/loaders/STLLoader.js');
                const loader = new STLLoader();
                const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                geometry = loader.parse(arrayBuffer);
            }
            else if (fileType.toLowerCase().includes('3mf') || filePath.toLowerCase().endsWith('.3mf')) {
                const { ThreeMFLoader } = yield dynamicImport('three/examples/jsm/loaders/3MFLoader.js');
                const BufferGeometryUtils = yield dynamicImport('three/examples/jsm/utils/BufferGeometryUtils.js');
                const loader = new ThreeMFLoader();
                const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                const group = loader.parse(arrayBuffer);
                const geometries = [];
                group.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) {
                            child.updateMatrixWorld();
                            const geom = child.geometry.clone();
                            geom.applyMatrix4(child.matrixWorld);
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
                throw new Error(`Unsupported file type for metadata extraction: ${fileType}. Please use STL or 3MF.`);
            }
            if (!geometry.index && geometry.attributes.position) {
                // If not indexed, we can still calculate
            }
            const metadata = this.calculateMetadata(geometry, THREE);
            return metadata;
        });
    }
    static calculateMetadata(geometry, THREE) {
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
