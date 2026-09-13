import re

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"const fetchAnnouncements = async \(\) => \{[\s\S]*?setAnnouncements\(data\.slice\(0, 5\)\);\s*\};"
replacement = """const fetchAnnouncements = async () => {
    const q = query(collection(db, 'announcements'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
    data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setAnnouncements(data);
  };"""

content = re.sub(pattern, replacement, content)

with open("src/features.tsx", "w") as f:
    f.write(content)
