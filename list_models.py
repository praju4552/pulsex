import os

def list_models():
    path = r"d:\pulsex(prototyping)\backend-node\prisma\schema.prisma"
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    lines = content.split('\n')
    current_model = None
    for i, line in enumerate(lines):
         if line.strip().startswith('model'):
              current_model = line.split()[1]
              print(f"\n--- model {current_model} ---")
         elif line.strip().startswith('}'):
              current_model = None
         elif current_model and line.strip() and not line.strip().startswith('//') and not line.strip().startswith('@@'):
              print("  " + line.strip())

list_models()
