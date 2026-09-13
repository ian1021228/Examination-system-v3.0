import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Replace KET to PET
content = content.replace("'英文檢定'", "'PET 英文'")

# Remove 了解更多 button
pattern_learn_more = r"<button className=\"w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-\[\#FDFBF7\] border border-\[\#FDFBF7\]\/30 hover:bg-white\/5 transition-all flex items-center justify-center gap-2\">[\s\S]*?了解更多 <Info size=\{20\} \/>[\s\S]*?<\/button>"
content = re.sub(pattern_learn_more, "", content)

# Remove 學生滿意度 badge
pattern_satisfaction = r"\{/\* Floating Badges \*/\}[\s\S]*?<div className=\"absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce\" style=\{\{ animationDuration: '3s' \}\}>[\s\S]*?<\/div>\s*<\/div>"
content = re.sub(pattern_satisfaction, "", content)

with open("src/features.tsx", "w") as f:
    f.write(content)
print("Landing page patched.")
