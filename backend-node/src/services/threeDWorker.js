/**
 * 3D Mesh Parsing Worker Script
 * This is executed in a separate process via child_process.fork()
 */
const fs = require('fs');
const path = require('path');

// 🪵 Direct file logging for diagnostics
const logPath = '/home/u655334071/domains/pulsewritexsolutions.com/nodejs/tmp/deep_debug.log';
const workerLog = (msg) => {
    try {
        const timestamp = new Date().toISOString();
        const line = `[WORKER-PROC] [${timestamp}] ${msg}`;
        fs.appendFileSync(logPath, line + '\n');
        console.log(line); 
    } catch(e) {
        console.error('Logging failed:', e);
    }
};

workerLog('Script starting execution...');

try {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    workerLog('Environment check passed');

    const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
});

rl.on('line', async (line) => {
  try {
    const data = JSON.parse(line);
    const { filePath, fileType } = data;
    workerLog(`Started processing ${filePath}`);

    const THREE = await dynamicImport('three');
    workerLog('Three.js loaded');

    const fileBuffer = fs.readFileSync(filePath);
    workerLog(`File read successful: ${fileBuffer.length} bytes`);

    let geometry;

    if (fileType.toLowerCase().includes('stl') || filePath.toLowerCase().endsWith('.stl')) {
      workerLog('Parsing STL...');
      const { STLLoader } = await dynamicImport('three/examples/jsm/loaders/STLLoader.js');
      const loader = new STLLoader();
      const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      geometry = loader.parse(arrayBuffer);
      workerLog('STL Parsing complete');
    } else if (fileType.toLowerCase().includes('3mf') || filePath.toLowerCase().endsWith('.3mf')) {
      workerLog('Parsing 3MF...');
      const { ThreeMFLoader } = await dynamicImport('three/examples/jsm/loaders/3MFLoader.js');
      const BufferGeometryUtils = await dynamicImport('three/examples/jsm/utils/BufferGeometryUtils.js');
      
      const loader = new ThreeMFLoader();
      const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      const group = loader.parse(arrayBuffer);
      
      const geometries = [];
      group.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.updateMatrixWorld();
          const geom = child.geometry.clone();
          geom.applyMatrix4(child.matrixWorld);
          geometries.push(geom);
        }
      });
      
      if (geometries.length === 0) throw new Error('No valid meshes found in 3MF file.');
      const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
      if (!merged) throw new Error('Failed to merge 3MF geometries.');
      geometry = merged;
      workerLog('3MF Parsing complete');
    } else {
       throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Calculations
    const positionAttribute = geometry.getAttribute('position');
    const triangleCount = positionAttribute.count / 3;
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    
    let volume = 0;
    let surfaceArea = 0;
    const pos = positionAttribute.array;
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();

    workerLog(`Calculating for ${triangleCount} triangles...`);
    for (let i = 0; i < pos.length; i += 9) {
      p1.set(pos[i], pos[i + 1], pos[i + 2]);
      p2.set(pos[i + 3], pos[i + 4], pos[i + 5]);
      p3.set(pos[i + 6], pos[i + 7], pos[i + 8]);
      volume += p1.dot(p2.cross(p3)) / 6.0;
      const edge1 = new THREE.Vector3().subVectors(p2, p1);
      const edge2 = new THREE.Vector3().subVectors(p3, p1);
      surfaceArea += new THREE.Vector3().crossVectors(edge1, edge2).length() * 0.5;
    }

    const results = {
      volume: Math.abs(volume),
      surfaceArea,
      width: bbox.max.x - bbox.min.x,
      height: bbox.max.y - bbox.min.y,
      depth: bbox.max.z - bbox.min.z,
      triangleCount,
      estimatedPrintTime: (Math.abs(volume) / 10) / 60 + 30
    };

    workerLog('Calculations successful');
    console.log(JSON.stringify({ success: true, results }));
  } catch (err) {
    workerLog(`ERROR: ${err.message}`);
    console.log(JSON.stringify({ success: false, error: err.message }));
  } finally {
    process.exit(0);
  }
});

} catch (e) {
    workerLog('FATAL: Worker bootstrap failed: ' + (e.message || e));
    console.log(JSON.stringify({ success: false, error: 'Worker bootstrap failed: ' + (e.message || e) }));
    process.exit(1);
}
