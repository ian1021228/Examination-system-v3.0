with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace("onClick={() => setActiveMat(m)}", "onClick={() => { setActiveMat(m); setIsFullscreen(true); }}")

with open("src/features.tsx", "w") as f:
    f.write(content)
