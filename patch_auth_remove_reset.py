import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove isResetting state
content = re.sub(r"const \[isResetting, setIsResetting\] = useState\(false\);\n", "", content)

# Remove the handleResetPassword function
content = re.sub(r"const handleResetPassword = async \(\) => \{[\s\S]*?\};\n", "", content)

# Replace the input rendering
pattern1 = r"\{!isResetting && \(\s*<div>\s*<label className=\"text-xs font-bold text-\[\#8C7A6B\] ml-1\">密碼<\/label>\s*<input type=\"password\" value=\{password\} onChange=\{e => setPassword\(e\.target\.value\)\} placeholder=\"••••••••\" className=\"w-full mt-1 bg-white border border-\[\#EAE6DF\] rounded-xl px-4 py-2\.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all\" \/>\s*<\/div>\s*\)\}"
replacement1 = """<div>
              <label className="text-xs font-bold text-[#8C7A6B] ml-1">密碼</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>"""
content = re.sub(pattern1, replacement1, content)

# Replace the button rendering
pattern2 = r"\{isResetting \? \([\s\S]*?\) : \(\s*<button onClick=\{handleEmailAuth\} className=\"w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2\.5 rounded-xl transition-all shadow-md mt-2\">\s*\{isRegistering \? '註冊帳號' : '登入帳號'\}\s*<\/button>\s*\)\}"
replacement2 = """<button onClick={handleEmailAuth} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-2">
              {isRegistering ? '註冊帳號' : '登入帳號'}
            </button>"""
content = re.sub(pattern2, replacement2, content)

# Replace the footer links
pattern3 = r"\{!isResetting && \(\s*<div className=\"flex justify-between items-center px-1\">\s*<button onClick=\{\(\) => setIsRegistering\(!isRegistering\)\} className=\"text-xs text-indigo-600 hover:text-indigo-800 font-bold\">\s*\{isRegistering \? '已有帳號？切換登入' : '沒有帳號？立即註冊'\}\s*<\/button>\s*\{!isRegistering && \(\s*<button onClick=\{\(\) => setIsResetting\(true\)\} className=\"text-xs text-gray-500 hover:text-gray-700\">\s*忘記密碼？\s*<\/button>\s*\)\}\s*<\/div>\s*\)\}"
replacement3 = """<div className="flex justify-between items-center px-1">
               <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">
                 {isRegistering ? '已有帳號？切換登入' : '沒有帳號？立即註冊'}
               </button>
             </div>"""
content = re.sub(pattern3, replacement3, content)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Auth mechanism patched.")
