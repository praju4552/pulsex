import os

FILES_TO_EDIT = [
    r"d:\pulsex(prototyping)\backend-node\src\routes\threeDPrintingRoutes.ts",
    r"d:\pulsex(prototyping)\backend-node\src\routes\serviceInquiryRoutes.ts",
    r"d:\pulsex(prototyping)\backend-node\src\routes\laserCuttingRoutes.ts"
]

inject_filter = """const ALLOWED_EXTS = ['.gbr', '.zip', '.stl', '.pdf', '.dxf', '.step', '.png', '.jpg'];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});"""

def fix_multer():
    for path_str in FILES_TO_EDIT:
        if not os.path.exists(path_str):
            print(f"❌ File not found: {path_str}")
            continue
            
        with open(path_str, 'r', encoding='utf-8') as f:
             content = f.read()

        old_upload = """const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});"""

        if old_upload in content:
             content = content.replace(old_upload, inject_filter)
             with open(path_str, 'w', encoding='utf-8') as f:
                  f.write(content)
             print(f"✅ Filter added to {os.path.basename(path_str)}")
        else:
             print(f"❌ Could not find old_upload signature in {os.path.basename(path_str)}")

fix_multer()
