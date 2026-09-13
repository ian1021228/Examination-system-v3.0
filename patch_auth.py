with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("""        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
        } else {""", """        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
          if (firebaseUser.email === 'ianw.solar@gmail.com' && profile.role !== 'admin') {
            profile.role = 'admin';
            needsUpdate = true;
          }
        } else {""")

with open("src/App.tsx", "w") as f:
    f.write(content)
