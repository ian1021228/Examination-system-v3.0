with open("src/App.tsx", "r") as f:
    content = f.read()

target = """export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'player';
  points?: number;
  badges?: string[];
  lastPlayedAt?: number;
}"""

new_target = """export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'player';
  points?: number;
  badges?: string[];
  lastPlayedAt?: number;
  lastLoginDate?: string;
  streak?: number;
  unlockedFrames?: string[];
  activeFrame?: string;
  unlockedThemes?: string[];
  activeTheme?: string;
}"""

content = content.replace(target, new_target)

# Auth logic
auth_target = """        let profile: UserProfile;
        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
        } else {
          // New user, default to player
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.isAnonymous ? '測試管理員' : (firebaseUser.displayName || 'Unknown Player'),
            photoURL: firebaseUser.photoURL || '',
            role: (firebaseUser.email === 'ianw.solar@gmail.com' || firebaseUser.isAnonymous) ? 'admin' : 'player'
          };
          await setDoc(userRef, profile);
        }
        setUser(profile);"""

new_auth_target = """        let profile: UserProfile;
        let needsUpdate = false;
        
        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
        } else {
          // New user, default to player
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.isAnonymous ? '測試管理員' : (firebaseUser.displayName || 'Unknown Player'),
            photoURL: firebaseUser.photoURL || '',
            role: (firebaseUser.email === 'ianw.solar@gmail.com' || firebaseUser.isAnonymous) ? 'admin' : 'player',
            points: 0,
            badges: [],
            streak: 0,
            unlockedFrames: ['default'],
            activeFrame: 'default'
          };
          needsUpdate = true;
        }
        
        // Daily Check-in & Streak Logic
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time
        const yesterdayDate = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
        
        if (profile.lastLoginDate !== today) {
          if (profile.lastLoginDate === yesterdayDate) {
             profile.streak = (profile.streak || 0) + 1;
          } else {
             profile.streak = 1;
          }
          profile.lastLoginDate = today;
          
          // Reward XP
          profile.points = (profile.points || 0) + 50 + (profile.streak > 1 ? 10 : 0); // 50 daily + 10 streak bonus
          if (profile.streak >= 7 && !(profile.badges || []).includes('streak_7')) {
             profile.badges = [...(profile.badges || []), 'streak_7'];
          }
          
          needsUpdate = true;
        }
        
        if (needsUpdate) {
           await setDoc(userRef, profile, { merge: true });
        }
        
        setUser(profile);"""

content = content.replace(auth_target, new_auth_target)

with open("src/App.tsx", "w") as f:
    f.write(content)
