import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# We need to add "const [viewMode, setViewMode] = useState<'materials'|'progress'>('materials');"
# And then render conditionally.
# Since it's a bit long, I will inject the viewMode and render logic safely.

start_idx = content.find("export function CourseMaterialsAdminTab({ subjectId }: { subjectId: string }) {")

if start_idx != -1:
    viewMode_injection = """  const [viewMode, setViewMode] = useState<'materials' | 'progress'>('materials');
  const [progressRecords, setProgressRecords] = useState<MaterialProgress[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    if (viewMode === 'progress') {
      const fetchProg = async () => {
        const q = query(collection(db, 'material_progress'), where('subjectId', '==', subjectId));
        const snap = await getDocs(q);
        setProgressRecords(snap.docs.map(d => d.data() as MaterialProgress));
        
        const qUsers = query(collection(db, 'users'));
        const snapUsers = await getDocs(qUsers);
        setStudents(snapUsers.docs.map(d => d.data() as UserProfile));
      };
      fetchProg();
    }
  }, [viewMode, subjectId]);
"""
    # Insert right after `const [filterUnit, setFilterUnit] = useState<number | 'all'>('all');`
    target = "const [filterUnit, setFilterUnit] = useState<number | 'all'>('all');\n"
    target_idx = content.find(target, start_idx) + len(target)
    
    content = content[:target_idx] + viewMode_injection + content[target_idx:]

    # Now add the buttons and progress view.
    return_target = """        <button onClick={() => {"""
    return_target_idx = content.find(return_target, start_idx)
    
    header_buttons = """        <div className="flex gap-2 shrink-0">
          <button onClick={() => setViewMode(viewMode === 'materials' ? 'progress' : 'materials')} className="bg-[#FDFBF7] text-[#8C7A6B] border border-[#EAE6DF] px-6 py-2 rounded-lg font-bold hover:bg-[#F5F5F0] transition-all shadow-sm">
            {viewMode === 'materials' ? '查看學生進度' : '返回教材編輯'}
          </button>
          {viewMode === 'materials' && <button onClick={() => {
          if (showForm) {
            setShowForm(false); setEditingId(null);
          } else {
            setNewMat({ type: 'lesson', unit: filterUnit === 'all' ? 1 : filterUnit as number, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });
            setShowForm(true);
          }
        }} className="bg-[#C2A878] text-[#4A3F35] px-6 py-2 rounded-lg font-bold hover:bg-[#B39969] transition-all shadow-sm flex items-center gap-2 shrink-0">
          <Plus size={18} /> {showForm && !editingId ? '取消' : editingId ? '取消編輯' : '新增教材'}
        </button>}
        </div>
"""
    
    # We replace the single button with these two buttons
    button_end_idx = content.find("</button>", return_target_idx) + len("</button>")
    content = content[:return_target_idx] + header_buttons + content[button_end_idx:]

    # Now we inject the progress view inside the return.
    # Where does the form start? 
    # `{showForm && (`
    form_start_idx = content.find("{showForm && (", return_target_idx)
    
    progress_view = """      {viewMode === 'progress' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAE6DF] shadow-sm">
          <h4 className="font-bold text-lg text-[#4A3F35] mb-4 flex items-center gap-2"><BookOpen size={20} className="text-[#C2A878]" /> 學生學習進度追蹤</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-[#EAE6DF] text-[#8C7A6B] text-sm font-bold uppercase tracking-wider">
                  <th className="p-3">學生姓名</th>
                  <th className="p-3">教材</th>
                  <th className="p-3">完成狀態</th>
                  <th className="p-3">停留時間</th>
                  <th className="p-3">重點與筆記</th>
                  <th className="p-3">最後更新</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {progressRecords.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-[#A69B8F]">尚未有學習紀錄</td></tr>
                )}
                {progressRecords.sort((a, b) => b.lastUpdated - a.lastUpdated).map((p, i) => {
                  const s = students.find(u => u.uid === p.userId);
                  const m = materials.find(m => m.id === p.materialId);
                  return (
                    <tr key={i} className="border-b border-[#F5F5F0] hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-3 font-bold text-[#4A3F35]">{s?.displayName || '未知使用者'}</td>
                      <td className="p-3 text-[#4A3F35] max-w-[200px] truncate" title={m?.title}>{m?.title || '未知教材'}</td>
                      <td className="p-3">
                        {p.completed ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={14}/> 已完成</span> : <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">學習中</span>}
                      </td>
                      <td className="p-3 text-[#8C7A6B] font-mono">{Math.floor(p.timeSpent / 60)}m {p.timeSpent % 60}s</td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {p.highlights?.length > 0 && <div className="text-xs text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded border border-yellow-200 inline-block w-max">🖍️ {p.highlights.length} 個重點</div>}
                          {p.notes && <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200 max-w-[150px] truncate" title={p.notes}>📝 {p.notes}</div>}
                          {!p.highlights?.length && !p.notes && <span className="text-[#D5CFC4] text-xs">無</span>}
                        </div>
                      </td>
                      <td className="p-3 text-[#A69B8F] text-xs font-mono">{new Date(p.lastUpdated).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {viewMode === 'materials' && (
      <>
"""
    content = content[:form_start_idx] + progress_view + content[form_start_idx:]
    
    # Close the `<>` added above
    # Find the end of `CourseMaterialsAdminTab`
    end_of_func = content.find("export function DiscussionBoard", form_start_idx)
    # Actually just look for `    </div>\n  );\n}` corresponding to `return (<div className="space-y-6">`
    # The return block starts at `return (`
    # We will close `</>` before the last `</div>\n  );`
    
    # Just a simple hack:
    last_div = content.rfind("</div>\n  );\n}", form_start_idx, end_of_func)
    content = content[:last_div] + "      </>\n      )}\n" + content[last_div:]
    
    with open("src/features.tsx", "w") as f:
        f.write(content)
else:
    print("Could not find CourseMaterialsAdminTab")
