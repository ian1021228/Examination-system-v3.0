import re

with open("src/features.tsx", "r") as f:
    content = f.read()

replacement = """          <div>
            <label className="text-sm font-bold text-gray-700">內容連結 (影片URL或檔案連結)</label>
            <input value={newMat.contentUrl} onChange={e => setNewMat({...newMat, contentUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3" placeholder="https://youtube.com/..."/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">簡短說明</label>
            <input value={newMat.description || ''} onChange={e => setNewMat({...newMat, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3" placeholder="選填：章節摘要..."/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">補充檔案連結</label>
            {newMat.attachments?.map((att, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={att.name} onChange={e => {
                  const newAtts = [...(newMat.attachments || [])];
                  newAtts[i].name = e.target.value;
                  setNewMat({...newMat, attachments: newAtts});
                }} className="border border-gray-200 rounded-xl p-2 w-1/3" placeholder="檔案名稱" />
                <input value={att.url} onChange={e => {
                  const newAtts = [...(newMat.attachments || [])];
                  newAtts[i].url = e.target.value;
                  setNewMat({...newMat, attachments: newAtts});
                }} className="border border-gray-200 rounded-xl p-2 flex-grow" placeholder="https://..." />
                <button onClick={() => {
                  const newAtts = [...(newMat.attachments || [])];
                  newAtts.splice(i, 1);
                  setNewMat({...newMat, attachments: newAtts});
                }} className="text-red-500 p-2"><Trash size={18}/></button>
              </div>
            ))}
            <button onClick={() => {
              setNewMat({...newMat, attachments: [...(newMat.attachments || []), {name: '', url: ''}]});
            }} className="text-sm text-indigo-600 font-bold mt-1">+ 新增補充檔案</button>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">Markdown 課程筆記</label>
            <textarea value={newMat.markdownNotes} onChange={e => setNewMat({...newMat, markdownNotes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 h-32" placeholder="支援 Markdown 語法..."/>
          </div>"""

pattern = r"<div>\s*<label className=\"text-sm font-bold text-gray-700\">內容連結 \(影片URL或檔案連結\)<\/label>\s*<input value=\{newMat\.contentUrl\} onChange=\{e => setNewMat\(\{\.\.\.newMat, contentUrl: e\.target\.value\}\)\} className=\"w-full border border-gray-200 rounded-xl p-3\" placeholder=\"https://youtube\.com/\.\.\.\"\/>\s*<\/div>\s*<div>\s*<label className=\"text-sm font-bold text-gray-700\">Markdown 課程筆記<\/label>\s*<textarea value=\{newMat\.markdownNotes\} onChange=\{e => setNewMat\(\{\.\.\.newMat, markdownNotes: e\.target\.value\}\)\} className=\"w-full border border-gray-200 rounded-xl p-3 h-32\" placeholder=\"支援 Markdown 語法\.\.\.\"\/>\s*<\/div>"

content = re.sub(pattern, replacement, content)

with open("src/features.tsx", "w") as f:
    f.write(content)
print("Admin form patched.")
