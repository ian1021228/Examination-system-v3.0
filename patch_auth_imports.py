with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';",
    "import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
