import re

def patch_file(filename):
    with open(filename, "r") as f:
        content = f.read()
    
    # Replace single argument onSnapshot
    content = re.sub(r'(onSnapshot\([^,]+,\s*\([^)]*\)\s*=>\s*\{.*?\})\);', r'\1, (err) => console.warn("Snapshot error:", err));', content, flags=re.DOTALL)
    
    with open(filename, "w") as f:
        f.write(content)

patch_file("src/features.tsx")
patch_file("src/App.tsx")
