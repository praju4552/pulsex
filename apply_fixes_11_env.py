import os

def fix_env():
    path = r"d:\pulsex(prototyping)\backend-node\.env"
    if not os.path.exists(path): return False
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    old_db = 'DATABASE_URL="mysql://root:password@localhost:3306/pulsex_db"'
    new_db = 'DATABASE_URL="mysql://antigravity_app:EdmalaB@2025_db@localhost:3306/pulsex_db"'

    if old_db in content:
         content = content.replace(old_db, new_db)
         with open(path, 'w', encoding='utf-8') as f:
              f.write(content)
         print("✅ .env Database credentials updated")
         return True
    print("❌ Could not find old_db configuration in .env")
    return False

fix_env()
