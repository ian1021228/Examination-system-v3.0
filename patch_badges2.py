import re

with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace("data.notes.length > 100", "data.notes.length > 10000")

with open("src/features.tsx", "w") as f:
    f.write(content)
