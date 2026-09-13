with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("""          if (firebaseUser.email === 'ianw.solar@gmail.com' && profile.role !== 'admin') {""", """          if ((firebaseUser.email === 'ianw.solar@gmail.com' || firebaseUser.isAnonymous) && profile.role !== 'admin') {""")

with open("src/App.tsx", "w") as f:
    f.write(content)
