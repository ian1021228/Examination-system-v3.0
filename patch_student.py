import re

with open("src/features.tsx", "r") as f:
    content = f.read()

grouping_code = """
  const groupedMaterials = materials.reduce((acc, curr) => {
    const unit = curr.unit || 1;
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(curr);
    return acc;
  }, {} as Record<number, CourseMaterial[]>);

  if (isFullscreen && activeMat) {"""

content = content.replace("  if (isFullscreen && activeMat) {", grouping_code)

list_pattern = r"(<div className=\"lg:w-1/3 space-y-4\">\s*<h2 className=\"text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3\"><BookOpen className=\"text-indigo-500\"\/> 課程章節<\/h2>\s*)\{materials\.map\(m => \([\s\S]*?<\/div>\s*<\/div>\s*<\/button>\s*\)\)\}(\s*<\/div>\s*<div className=\"lg:w-2\/3\">)"

list_replacement = """\\1
        {Object.entries(groupedMaterials).map(([unit, mats]) => (
          <div key={unit} className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Unit {unit}</h3>
            <div className="space-y-3">
              {mats.map(m => (
                <button key={m.id} onClick={() => { setActiveMat(m); window.speechSynthesis.cancel(); setIsPlayingTTS(false); }} className={`w-full text-left p-4 rounded-xl border transition-all ${activeMat?.id === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg transform scale-[1.02]' : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200 hover:shadow-md'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${activeMat?.id === m.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                      {m.unit}
                    </div>
                    <div>
                      <div className="font-bold line-clamp-1 text-sm">{m.title}</div>
                      <div className={`text-xs mt-1 uppercase tracking-wider ${activeMat?.id === m.id ? 'text-indigo-100' : 'text-gray-400'}`}>{m.type}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
\\2"""

content = re.sub(list_pattern, list_replacement, content, flags=re.DOTALL)

with open("src/features.tsx", "w") as f:
    f.write(content)

print("Student view patched.")
