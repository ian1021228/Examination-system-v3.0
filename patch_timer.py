import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Let's find the Timer state section
target = """  // Timer state
  const timeSpentRef = useRef(0);
  const timerIntervalRef = useRef<any>(null);"""

new_target = """  // Timer state
  const timeSpentRef = useRef(0);
  const timerIntervalRef = useRef<any>(null);
  
  const notesTextRef = useRef(notesText);
  notesTextRef.current = notesText;
  
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;"""

content = content.replace(target, new_target)

# Fix the interval to use refs
interval_target = """      // Auto-save every 10 seconds
      const saveInterval = setInterval(() => {
         saveProgress(activeMat.id!, { timeSpent: timeSpentRef.current, notes: notesText, highlights });
      }, 10000);

      return () => {
        clearInterval(timerIntervalRef.current);
        clearInterval(saveInterval);
        saveProgress(activeMat.id!, { timeSpent: timeSpentRef.current, notes: notesText, highlights });
      };"""

new_interval_target = """      // Auto-save every 10 seconds
      const saveInterval = setInterval(() => {
         saveProgress(activeMat.id!, { timeSpent: timeSpentRef.current, notes: notesTextRef.current, highlights: highlightsRef.current });
      }, 10000);

      return () => {
        clearInterval(timerIntervalRef.current);
        clearInterval(saveInterval);
        saveProgress(activeMat.id!, { timeSpent: timeSpentRef.current, notes: notesTextRef.current, highlights: highlightsRef.current });
      };"""

content = content.replace(interval_target, new_interval_target)

with open("src/features.tsx", "w") as f:
    f.write(content)
