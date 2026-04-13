import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import fs from 'fs';

export interface MeshMetadata {
  volume: number;
  surfaceArea: number;
  width: number;
  height: number;
  depth: number;
  triangleCount: number;
  estimatedPrintTime: number;
}

export class ThreeDService {
  /**
   * Processes a 3D file and extracts metadata.
   * Supports STL and 3MF.
   */
  static async getMetadata(filePath: string, fileType: string): Promise<MeshMetadata> {
    const data = fs.readFileSync(filePath);
    
    let geometry: THREE.BufferGeometry;

    if (fileType.toLowerCase().includes('stl') || filePath.toLowerCase().endsWith('.stl')) {
      const loader = new STLLoader();
      // STLLoader.parse expects an ArrayBuffer
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      geometry = loader.parse(arrayBuffer);
    } else if (fileType.toLowerCase().includes('3mf') || filePath.toLowerCase().endsWith('.3mf')) {
      // Use dynamic require to avoid startup ERR_REQUIRE_ESM crashes in restrictive host environments
      const { ThreeMFLoader } = require('three/examples/jsm/loaders/3MFLoader.js');
      const BufferGeometryUtils = require('three/examples/jsm/utils/BufferGeometryUtils.js');
      
      const loader = new ThreeMFLoader();
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      const group = loader.parse(arrayBuffer);
      
      const geometries: THREE.BufferGeometry[] = [];
      group.traverse((child: any) => {
        if (child.isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.updateMatrixWorld();
            const geom = (mesh.geometry as THREE.BufferGeometry).clone();
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
      geometry = merged as THREE.BufferGeometry;
    } else {
       // Placeholder for OBJ/STEP
       throw new Error(`Unsupported file type for metadata extraction: ${fileType}. Please use STL or 3MF.`);
    }

    if (!geometry.index && geometry.attributes.position) {
       // If not indexed, we can still calculate
    }

    const metadata = this.calculateMetadata(geometry);
    return metadata;
  }

  private static calculateMetadata(geometry: THREE.BufferGeometry): MeshMetadata {
    // 1. Triangle Count
    const positionAttribute = geometry.getAttribute('position');
    const triangleCount = positionAttribute.count / 3;

    // 2. Dimensions (Bounding Box)
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox!;
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
