import { Request, Response } from 'express';
import { parseGerberZip } from '../services/gerberParser';
import { renderGerberZip } from '../services/gerberRenderer';

export async function parsePCBGerber(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a .zip or .rar file containing your Gerber files.' });
    }

    const allowedMimes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', 'application/x-rar'];
    const allowedExts = ['.zip', '.rar', '.gbz'];
    const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));

    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: 'Only .zip, .rar, or .gbz files are accepted.' });
    }

    const parsed = await parseGerberZip(req.file.buffer);

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
      return res.status(400).json({ error: 'Only .zip files are accepted for rendering.' });
    }

    console.log(`[renderPCBGerber] Rendering ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const result = await renderGerberZip(req.file.buffer);

    return res.json({
      success: true,
      topSvg: result.topSvg,
      bottomSvg: result.bottomSvg,
      layers: result.layers,
    });
  } catch (err) {
    console.error('[renderPCBGerber] Error:', err);
    return res.status(500).json({
      error: 'Failed to render Gerber files.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

