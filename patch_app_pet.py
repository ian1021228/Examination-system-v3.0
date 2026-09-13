with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("'KET 英文'", "'PET 英文'")
content = content.replace("ket: 'PET 英文'", "pet: 'PET 英文'")
content = content.replace("ket: '英文檢定'", "pet: 'PET 英文'")
content = content.replace("'ket'", "'pet'")
content = content.replace("id: 'ket'", "id: 'pet'")

with open("src/App.tsx", "w") as f:
    f.write(content)
print("App.tsx patched for PET.")
