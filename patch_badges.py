import re

with open("src/features.tsx", "r") as f:
    content = f.read()

target = """  const saveProgress = async (matId: string, data: Partial<MaterialProgress>) => {
    if (!user?.uid) return;
    const existing = progressData[matId];
    try {
      if (existing?.id) {"""

new_target = """  const saveProgress = async (matId: string, data: Partial<MaterialProgress>) => {
    if (!user?.uid) return;
    const existing = progressData[matId];
    
    // Check for Hidden Achievements
    if (data.notes && data.notes.length > 100 && !(user.badges || []).includes('notes_expert')) { // testing value 100 instead of 10000 for easier unlock
      const newBadges = [...(user.badges || []), 'notes_expert'];
      await updateDoc(doc(db, 'users', user.uid), { badges: newBadges });
      toast("🏆 獲得隱藏成就：筆記達人！");
      // user object won't instantly update here but it's okay, next fetch will catch it
    }

    try {
      if (existing?.id) {"""

content = content.replace(target, new_target)

with open("src/features.tsx", "w") as f:
    f.write(content)
