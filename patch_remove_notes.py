import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Remove the Notes section
pattern_notes = r"\{showNotes && \([\s\S]*?<\/textarea>\s*<\/div>\s*\)\}"
content = re.sub(pattern_notes, "", content)

with open("src/features.tsx", "w") as f:
    f.write(content)
print("Removed notes section.")
