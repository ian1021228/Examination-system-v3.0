import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Add MaterialProgress interface
if "export interface MaterialProgress" not in content:
    content = content.replace("export interface CourseMaterial", "export interface MaterialProgress {\n  id?: string;\n  userId: string;\n  materialId: string;\n  subjectId: string;\n  completed: boolean;\n  timeSpent: number;\n  notes: string;\n  highlights: string[];\n  lastUpdated: number;\n}\n\nexport interface CourseMaterial")

with open("src/features.tsx", "w") as f:
    f.write(content)
