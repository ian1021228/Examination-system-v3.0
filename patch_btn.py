with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace("navigate('/select-subject')", "navigate('/signin')")

with open("src/features.tsx", "w") as f:
    f.write(content)
