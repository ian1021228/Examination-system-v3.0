import re

with open("src/App.tsx", "r") as f:
    content = f.read()

pattern = r"export function SignIn\(\) \{[\s\S]*?className=\"flex-1 bg-\[\#F5F5F0\] border border-\[\#D5CFC4\] rounded-xl px-4 py-2 text-sm text-center text-\[\#B39969\] focus:outline-none focus:border-purple-500\"[\s\S]*?\/>[\s\S]*?<button[\s\S]*?onClick=\{handleTestSubmit\}[\s\S]*?className=\"bg-white hover:bg-\[\#EAE6DF\] text-\[\#4A3F35\] px-4 py-2 rounded-xl text-sm font-bold transition-colors\"[\s\S]*?>[\s\S]*?進入[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\}"

replacement = """export function SignIn() {
  const [testCode, setTestCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      toast('Google登入失敗，請稍後再試。');
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return toast('請輸入信箱與密碼');
    if (isRegistering && !nickname) return toast('請輸入暱稱');
    
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: nickname });
        // The onAuthStateChanged listener will handle creating the user doc
        toast('註冊成功！');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast('登入成功！');
      }
    } catch (e: any) {
      console.error(e);
      toast(isRegistering ? '註冊失敗: ' + e.message : '登入失敗: ' + e.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return toast('請輸入信箱');
    try {
      await sendPasswordResetEmail(auth, email);
      toast('已發送重設密碼信件，請至信箱收取');
      setIsResetting(false);
    } catch (e: any) {
      console.error(e);
      toast('發送失敗: ' + e.message);
    }
  };

  const handleTestSubmit = async () => {
    if (testCode === 'ianw0000') {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        console.error(e);
        if (e.code === 'auth/admin-restricted-operation') {
          toast('測試登入失敗：請先至 Firebase Console 啟用「匿名登入 (Anonymous Auth)」功能。');
        } else {
          toast('測試登入失敗。');
        }
      }
    } else {
      toast('無效的測試碼');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto text-center py-10 my-auto">
      <div className="bg-[#FDFBF7]/80 backdrop-blur-xl border border-[#EAE6DF] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-[#C2A878]/20 transform hover:scale-105 transition-transform duration-300">
          <span className="text-4xl">🚀</span>
        </div>
        <h2 className="font-serif text-2xl font-black tracking-wide text-[#4A3F35]">登入 DevSeed 課業進化站</h2>
        <p className="text-sm text-[#8C7A6B] mt-2 mb-6">加入我們，解鎖你的學習潛能。</p>

        <div className="space-y-4 mb-6 text-left">
          {isRegistering && (
            <div>
              <label className="text-xs font-bold text-[#8C7A6B] ml-1">暱稱 (必填)</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="你的大名" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-[#8C7A6B] ml-1">信箱 (必填)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
          </div>
          {!isResetting && (
            <div>
              <label className="text-xs font-bold text-[#8C7A6B] ml-1">密碼</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>
          )}
          
          {isResetting ? (
            <div className="flex gap-2">
              <button onClick={handleResetPassword} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md">
                發送重設信件
              </button>
              <button onClick={() => setIsResetting(false)} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-all">
                取消
              </button>
            </div>
          ) : (
            <button onClick={handleEmailAuth} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-2">
              {isRegistering ? '註冊帳號' : '登入帳號'}
            </button>
          )}

          {!isResetting && (
             <div className="flex justify-between items-center px-1">
               <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">
                 {isRegistering ? '已有帳號？切換登入' : '沒有帳號？立即註冊'}
               </button>
               {!isRegistering && (
                 <button onClick={() => setIsResetting(true)} className="text-xs text-gray-500 hover:text-gray-700">
                   忘記密碼？
                 </button>
               )}
             </div>
          )}
        </div>

        <div className="relative flex py-4 items-center mb-2">
            <div className="flex-grow border-t border-[#EAE6DF]"></div>
            <span className="flex-shrink-0 mx-4 text-[#A69B8F] text-xs font-bold uppercase tracking-wider">或</span>
            <div className="flex-grow border-t border-[#EAE6DF]"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 border border-[#EAE6DF] font-bold py-3 px-6 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm">使用 Google 帳號</span>
        </button>

        <div className="border-t border-[#EAE6DF] pt-4 mt-2">
          <p className="text-[10px] text-[#A69B8F] mb-2 uppercase tracking-wide">系統管理員通道</p>
          <div className="flex space-x-2">
            <input 
              type="password" 
              value={testCode}
              onChange={e => setTestCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTestSubmit()}
              placeholder="輸入授權碼" 
              className="flex-1 bg-[#F5F5F0] border border-[#D5CFC4] rounded-xl px-3 py-1.5 text-xs text-center text-[#B39969] focus:outline-none focus:border-purple-500"
            />
            <button 
              onClick={handleTestSubmit}
              className="bg-white hover:bg-[#EAE6DF] text-[#4A3F35] border border-[#EAE6DF] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              進入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/App.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced.")
else:
    print("No match found.")
