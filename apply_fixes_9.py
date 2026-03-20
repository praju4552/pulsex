import os

def fix_app():
    path = r"d:\pulsex(prototyping)\backend-node\src\app.ts"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    imports_old = "import express from 'express';"
    imports_new = "import express from 'express';\nimport helmet from 'helmet';\nimport rateLimit from 'express-rate-limit';"
    if imports_old in content and "import helmet" not in content:
        content = content.replace(imports_old, imports_new)

    # Inject rate-limiting and helmet config right after app initialized
    app_init = "const app = express();"
    inject_block = """const app = express();

app.use(helmet());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests max per window
    message: { error: 'Too many attempts, try again in 15 minutes.' }
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/prototyping-auth', authLimiter);
app.use('/api/cms-auth', authLimiter);
"""
    if app_init in content and "app.use(helmet())" not in content:
         content = content.replace(app_init, inject_block)

    with open(path, 'w', encoding='utf-8') as f:
         f.write(content)
    print("✅ app.ts secured with Helmet and Rate Limits")
    return True

fix_app()
