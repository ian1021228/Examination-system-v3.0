import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("keys.add(e.key.toLowerCase());", "if (e.key) keys.add(e.key.toLowerCase());")
content = content.replace("keys.delete(e.key.toLowerCase());", "if (e.key) keys.delete(e.key.toLowerCase());")

with open('src/App.tsx', 'w') as f:
    f.write(content)
