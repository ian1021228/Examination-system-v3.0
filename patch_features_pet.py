with open("src/features.tsx", "r") as f:
    content = f.read()

content = content.replace("ket: 'PET 英文'", "pet: 'PET 英文'")
content = content.replace("ket: '英文檢定'", "pet: 'PET 英文'")

with open("src/features.tsx", "w") as f:
    f.write(content)
print("features.tsx patched for PET.")
