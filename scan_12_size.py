import os

def get_dir_size(path, exclude_dirs=[]):
    total_size = 0
    for root, dirs, files in os.walk(path):
        # Apply exclusions
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            filepath = os.path.join(root, file)
            try:
                if os.path.islink(filepath): continue
                total_size += os.path.getsize(filepath)
            except:
                 pass
    return total_size

def scan_size():
    root_dir = r"d:\pulsex(prototyping)"
    out_file = r"d:\pulsex(prototyping)\scan_12_results.txt"
    
    # 1. Total size excluding node_modules, .git
    core_size = get_dir_size(root_dir, exclude_dirs=['node_modules', '.git'])
    # 2. node_modules size
    node_modules_dir = os.path.join(root_dir, 'node_modules')
    node_size = get_dir_size(node_modules_dir) if os.path.exists(node_modules_dir) else 0

    with open(out_file, 'w', encoding='utf-8') as f:
         f.write(f"CoreSize: {core_size}\nNodeModulesSize: {node_size}")
         
    print(f"✅ Sizes measured. Core: {core_size} bytes, NodeModules: {node_size} bytes")

scan_size()
# Cleanup scripts
scripts = [
    r"d:\pulsex(prototyping)\scan_1_debug.py", r"d:\pulsex(prototyping)\delete_scan_1.py",
    r"d:\pulsex(prototyping)\scan_2_throwaway.py", r"d:\pulsex(prototyping)\delete_scan_2.py",
    r"d:\pulsex(prototyping)\scan_3_duplicates.py", r"d:\pulsex(prototyping)\delete_scan_3.py",
    r"d:\pulsex(prototyping)\scan_4_unused_components.py", r"d:\pulsex(prototyping)\delete_scan_4.py",
    r"d:\pulsex(prototyping)\scan_5_backend_unused.py",
    r"d:\pulsex(prototyping)\scan_6_ml_pipeline.py", r"d:\pulsex(prototyping)\delete_scan_6.py",
    r"d:\pulsex(prototyping)\scan_7_empty_folders.py", r"d:\pulsex(prototyping)\delete_scan_7.py",
    r"d:\pulsex(prototyping)\scan_8_uploads.py", r"d:\pulsex(prototyping)\delete_scan_8.py",
    r"d:\pulsex(prototyping)\scan_9_configs.py", r"d:\pulsex(prototyping)\scan_10_dead_code.py",
    r"d:\pulsex(prototyping)\scan_11_scripts.py"
]
for s in scripts:
    if os.path.exists(s): os.remove(s)
print("✅ Deleted cleanup helper scripts file trees.")
