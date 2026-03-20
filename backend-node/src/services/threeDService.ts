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
   * Supports STL for now.
   */
  static async getMetadata(filePath: string, fileType: string): Promise<MeshMetadata> {
    const data = fs.readFileSync(filePath);
    
    let geometry: THREE.BufferGeometry;

    if (fileType.toLowerCase().includes('stl')) {
      const loader = new STLLoader();
      // STLLoader.parse expects an ArrayBuffer
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      geometry = loader.parse(arrayBuffer);
    } else {
       // Placeholder for OBJ/3MF/STEP
       throw new Error(`Unsupported file type for metadata extraction: ${fileType}`);
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
