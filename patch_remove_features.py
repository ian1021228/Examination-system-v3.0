import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove Leaderboard and Shop buttons from header
pattern1 = r"<button onClick=\{\(\) => navigate\('/leaderboard'\)\} className=\"bg-yellow-500\/20.*?<\/button>"
content = re.sub(pattern1, "", content, flags=re.DOTALL)

pattern2 = r"<button onClick=\{\(\) => navigate\('/shop'\)\} className=\"bg-emerald-500\/20.*?<\/button>"
content = re.sub(pattern2, "", content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Removed Leaderboard and Shop from header.")
