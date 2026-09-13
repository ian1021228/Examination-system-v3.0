import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r"toast\(isRegistering \? '註冊失敗: ' \+ e\.message : '登入失敗: ' \+ e\.message\);"
replacement = """if (e.code === 'auth/invalid-credential') {
        toast('登入失敗：帳號或密碼錯誤');
      } else if (e.code === 'auth/email-already-in-use') {
        toast('註冊失敗：此信箱已被使用');
      } else {
        toast(isRegistering ? '註冊失敗: ' + e.message : '登入失敗: ' + e.message);
      }"""

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched auth errors")
else:
    print("Pattern not found")

