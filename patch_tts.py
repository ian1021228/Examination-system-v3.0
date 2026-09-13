import re

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"<div className=\"absolute -top-4 -right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity\">[\s\S]*?<\/button>\s*<\/div>"

replacement = """<div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={toggleTTS}
                      className="bg-[#C2A878] text-white px-4 py-2 rounded-full shadow-md hover:bg-[#B39969] transition-transform hover:scale-105 flex items-center gap-2 font-bold"
                      title={isPlayingTTS ? "停止朗讀" : "語音朗讀"}
                    >
                      {isPlayingTTS ? "🛑 停止" : "🔊 朗讀"}
                    </button>
                  </div>"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/features.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced TTS button.")
else:
    print("No match found.")
