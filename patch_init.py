import re

with open("src/features.tsx", "r") as f:
    content = f.read()

target = """  // Timer logic
  useEffect(() => {
    if (isFullscreen && activeMat) {
      const currentProg = progressData[activeMat.id!] || null;
      timeSpentRef.current = currentProg?.timeSpent || 0;
      setNotesText(currentProg?.notes || "");
      setHighlights(currentProg?.highlights || []);"""

new_target = """  // Initialization logic
  useEffect(() => {
    if (isFullscreen && activeMat && progressData[activeMat.id!]) {
      const currentProg = progressData[activeMat.id!];
      // Only initialize if we haven't typed anything, or if it's the first load
      // But actually it's easier to just initialize unconditionally on open?
      // But this effect runs when isFullscreen/activeMat changes.
      // So it will run once when they open it.
      // What if progressData is late? We can use a ref to track if we initialized this material's notes.
    }
  }, [isFullscreen, activeMat, progressData]);"""

