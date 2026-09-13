with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import { LandingPage", "import { ParticleEngine } from './ParticleEngine';\nimport { LandingPage")

with open("src/App.tsx", "w") as f:
    f.write(content)
