import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("role: 'admin' | 'player';", "role: 'admin' | 'player' | 'observer';")

with open("src/App.tsx", "w") as f:
    f.write(content)
