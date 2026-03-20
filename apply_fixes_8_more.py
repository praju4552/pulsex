import os

def fix_service_inquiry_multer():
    path = r"d:\pulsex(prototyping)\backend-node\src\routes\serviceInquiryRoutes.ts"
    if not os.path.exists(path): return False
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    # Add fileFilter
    old_upload = """const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});"""

    new_upload = """const ALLOWED_EXTS = ['.gbr', '.zip', '.stl', '.pdf', '.dxf', '.step', '.png', '.jpg'];

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
    if old_upload in content:
         content = content.replace(old_upload, new_upload)
         
    # Add download route endpoint at bottom
    if "router.get('/:id/download'" not in content:
         anchor = "router.get('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), InquiryController.getInquiry);"
         inject = anchor + "\nrouter.get('/:id/download', authenticateToken, requireRole(['SUPER_ADMIN']), InquiryController.downloadAttachment);"
         content = content.replace(anchor, inject)

    with open(path, 'w', encoding='utf-8') as f:
         f.write(content)
    print("✅ serviceInquiryRoutes.ts updated")
    return True

def disable_static_uploads():
    path = r"d:\pulsex(prototyping)\backend-node\src\app.ts"
    if not os.path.exists(path): return False
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()
    
    # Remove app.use('/uploads', express.static(...))
    old_static = """// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));"""
    if old_static in content:
         content = content.replace(old_static, "// Static uploads disabled for security - streaming via auth routes now")
         with open(path, 'w', encoding='utf-8') as f:
              f.write(content)
         print("✅ app.ts static uploads disabled")
         return True
    return False

fix_service_inquiry_multer()
disable_static_uploads()
