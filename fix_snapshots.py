with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace(
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (err) => console.warn("Snapshot error:", err));""",
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });"""
)

content = content.replace(
"""    const unsubscribe = onSnapshot(q, (snap) => {
      const prog: Record<string, MaterialProgress> = {};
      snap.forEach(doc => {
        const d = doc.data() as MaterialProgress;
        prog[d.materialId] = { id: doc.id, ...d };
      }, (err) => console.warn("Snapshot error:", err));
      setProgressData(prog);
    });""",
"""    const unsubscribe = onSnapshot(q, (snap) => {
      const prog: Record<string, MaterialProgress> = {};
      snap.forEach(doc => {
        const d = doc.data() as MaterialProgress;
        prog[d.materialId] = { id: doc.id, ...d };
      });
      setProgressData(prog);
    }, (err) => console.warn("Snapshot error:", err));"""
)

content = content.replace(
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });""",
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (err) => console.warn("Snapshot error:", err));"""
)

with open("src/features.tsx", "w") as f:
    f.write(content)

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (err) => console.warn("Snapshot error:", err));""",
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });"""
)

content = content.replace(
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });""",
"""    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (err) => console.warn("Snapshot error:", err));"""
)

with open("src/App.tsx", "w") as f:
    f.write(content)

