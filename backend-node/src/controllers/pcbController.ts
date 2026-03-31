import { Request, Response } from 'express';
import fs from 'fs';
import { parseGerberZip } from '../services/gerberParser';
import { renderGerberZip } from '../services/gerberRenderer';

// Helper: silently delete a temp Gerber file after processing
function cleanupTempFile(filePath: string) {
  fs.unlink(filePath, (err) => {
    if (err) console.error('[pcbController] Failed to delete temp Gerber file:', err);
  });
}

export async function parsePCBGerber(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a .zip or .rar file containing your Gerber files.' });
    }

    // Extension validation is handled by the multer fileFilter in pcbRoutes.ts.
    // This secondary check is kept as a defence-in-depth guard.
    const allowedExts = ['.zip', '.rar', '.gbz', '.gbr', '.gtl', '.gbl', '.gto', '.gbo', '.gts', '.gbs', '.drl', '.xln'];
    const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
    if (!allowedExts.includes(ext)) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ error: 'Only .zip, .rar, or .gbz files are accepted.' });
    }

    // Read from disk — file was saved by multer diskStorage
    const fileBuffer = await fs.promises.readFile(req.file.path);
    const parsed = await parseGerberZip(fileBuffer);

    // Clean up temp file after successful processing
    cleanupTempFile(req.file.path);

    return res.json({
      success: true,
      filename: req.file.originalname,
      fileSize: req.file.size,
      parsedSpec: {
        layers: parsed.layers,
        dimX: parsed.dimX,
        dimY: parsed.dimY,
        dimUnit: parsed.dimUnit,
        finish: parsed.surfaceFinish,
      },
      analysis: {
        detectedLayers: parsed.detectedLayers,
        fileCount: parsed.fileCount,
        confidence: parsed.confidence,
        warnings: parsed.warnings,
      }
    });
  } catch (err) {
    // Clean up temp file on error too
    if (req.file?.path) cleanupTempFile(req.file.path);
    console.error('[parsePCBGerber] Error:', err);
    return res.status(500).json({
      error: 'Failed to parse Gerber files.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function renderPCBGerber(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
    if (!['.zip', '.rar', '.gbz'].includes(ext)) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ error: 'Only .zip files are accepted for rendering.' });
    }

    console.log(`[renderPCBGerber] Rendering ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Read from disk — file was saved by multer diskStorage
    const fileBuffer = await fs.promises.readFile(req.file.path);
    const result = await renderGerberZip(fileBuffer);

    // Clean up temp file after successful processing
    cleanupTempFile(req.file.path);

    return res.json({
      success: true,
      topSvg: result.topSvg,
      bottomSvg: result.bottomSvg,
      layers: result.layers,
    });
  } catch (err) {
    // Clean up temp file on error too
    if (req.file?.path) cleanupTempFile(req.file.path);
    console.error('[renderPCBGerber] Error:', err);
    return res.status(500).json({
      error: 'Failed to render Gerber files.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}


