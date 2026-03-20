import os

def fix_controller():
    path_str = r"d:\pulsex(prototyping)\backend-node\src\controllers\serviceInquiryController.ts"
    if not os.path.exists(path_str): return False
    with open(path_str, 'r', encoding='utf-8') as f:
         content = f.read()

    # 1. Add import path
    if "import path from 'path';" not in content:
         content = content.replace("import { Request, Response } from 'express';", "import { Request, Response } from 'express';\nimport path from 'path';")

    # 2. Append downloadAttachment at the bottom
    download_block = """
export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const inquiry = await prisma.serviceInquiry.findUnique({
      where: { id: req.params.id }
    });
    if (!inquiry || !inquiry.filePath) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }
    const absPath = path.resolve(inquiry.filePath);
    return res.sendFile(absPath);
  } catch (error: any) {
    console.error('[ServiceInquiry downloadAttachment]', error);
    return res.status(500).json({ success: false, error: 'Failed to download file.' });
  }
};
"""
    if "export const downloadAttachment" not in content:
         content += download_block

    with open(path_str, 'w', encoding='utf-8') as f:
         f.write(content)
    print("✅ serviceInquiryController.ts updated with downloadAttachment")
    return True

fix_controller()
