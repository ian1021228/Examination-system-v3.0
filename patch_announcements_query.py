import re

def replace_query(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Replace query with just collection
    pattern = r"const q = query\(collection\(db, 'announcements'\), orderBy\('createdAt', 'desc'\)(, limit\(\d+\))?\);"
    replacement = "const q = query(collection(db, 'announcements'));"
    content = re.sub(pattern, replacement, content)
    
    # Sort on the client side
    pattern_snap = r"setAnnouncements\(snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \} as Announcement\)\)\);"
    replacement_snap = """const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAnnouncements(data.slice(0, 5));"""
    content = re.sub(pattern_snap, replacement_snap, content)
    
    with open(filepath, "w") as f:
        f.write(content)

replace_query("src/features.tsx")
replace_query("src/App.tsx")
print("Query patched.")
