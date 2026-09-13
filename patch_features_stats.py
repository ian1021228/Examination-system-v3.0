import re

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"\{/\* Stats Section \*/\}[\s\S]*?\{/\* Features Section \*/\}"
replacement = "{/* Features Section */}"

content = re.sub(pattern, replacement, content)

with open("src/features.tsx", "w") as f:
    f.write(content)
print("Stats section removed.")
