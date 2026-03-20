import os

def list_models():
    path = r"d:\pulsex(prototyping)\backend-node\prisma\schema.prisma"
    out_path = r"d:\pulsex(prototyping)\prisma_models.txt"
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    lines = content.split('\n')
    lines = [line.replace('\r', '') for line in lines]
    
    output = []
    current_model = None
    for i, line in enumerate(lines):
         if line.strip().startswith('model'):
              current_model = line.split()[1]
              output.append(f"\n--- model {current_model} ---")
         elif line.strip().startswith('}'):
              current_model = None
         elif current_model and line.strip() and not line.strip().startswith('//') and not line.strip().startswith('@@'):
              output.append("  " + line.strip())

    with open(out_path, 'w', encoding='utf-8') as f:
         f.write('\n'.join(output))
    print(f"✅ Created {out_path}")

list_models()
