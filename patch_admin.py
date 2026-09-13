import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Add Edit2 to imports
content = re.sub(
    r"import \{([^}]+Trash[^}]+)\} from 'lucide-react';",
    r"import {\1, Edit2} from 'lucide-react';",
    content
)

# Admin tab changes
admin_pattern = r"(export function CourseMaterialsAdminTab\(\{ subjectId \}: \{ subjectId: string \}\) \{)(.*?)(return \()"
admin_replacement = """\1
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMat, setNewMat] = useState<Partial<CourseMaterial>>({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });

  const fetchMaterials = async () => {
    const q = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseMaterial));
    data.sort((a, b) => a.unit - b.unit);
    setMaterials(data);
  };

  useEffect(() => { fetchMaterials(); }, [subjectId]);

  const handleEdit = (m: CourseMaterial) => {
    setNewMat(m);
    setEditingId(m.id || null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!newMat.title) return;
    try {
      const mat = { ...newMat, subjectId, createdAt: newMat.createdAt || Date.now() };
      if (editingId) {
        await updateDoc(doc(db, 'materials', editingId), mat);
      } else {
        await addDoc(collection(db, 'materials'), mat);
      }
      setShowForm(false);
      setEditingId(null);
      setNewMat({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });
      fetchMaterials();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'materials', id));
    fetchMaterials();
  };

  const groupedMaterials = materials.reduce((acc, curr) => {
    const unit = curr.unit || 1;
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(curr);
    return acc;
  }, {} as Record<number, CourseMaterial[]>);

  \3"""

content = re.sub(admin_pattern, admin_replacement, content, flags=re.DOTALL)

# Update form JSX
form_pattern = r"(<h2 className=\"font-bold text-2xl text-gray-900\">課程教材管理<\/h2>\s*<button onClick=\{\(\) => setShowForm\(!showForm\)\} className=\"bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2\">\s*\{showForm \? '取消' : <><Upload size=\{18\}\/> 新增教材<\/>\}\s*<\/button>\s*<\/div>\s*\{showForm && \(\s*<div className=\"mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4\">)(.*?)(<button onClick=\{handleSave\} className=\"bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold w-full hover:bg-indigo-700\">儲存教材<\/button>\s*<\/div>\s*\))"

form_replacement = """<h2 className="font-bold text-2xl text-gray-900">課程教材管理</h2>
        <button onClick={() => {
          if (showForm) {
            setShowForm(false);
            setEditingId(null);
            setNewMat({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });
          } else {
            setShowForm(true);
          }
        }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2">
          {showForm ? '取消' : <><Upload size={18}/> 新增教材</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">\\2<button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold w-full hover:bg-indigo-700">{editingId ? '更新教材' : '儲存教材'}</button>
        </div>
      )}"""

content = re.sub(form_pattern, form_replacement, content, flags=re.DOTALL)

# Update list JSX
list_pattern = r"(<div className=\"space-y-4\">\s*)\{materials\.map\(m => \(\s*<div key=\{m\.id\}.*?<\/div>\s*\)\)\}(\s*<\/div>\s*<\/div>\s*\);\s*\})"
list_replacement = """\\1
        {Object.entries(groupedMaterials).map(([unit, mats]) => (
          <div key={unit} className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Unit {unit}</h3>
            <div className="space-y-3">
              {mats.map(m => (
                <div key={m.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">{m.unit}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{m.title}</h4>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">{m.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(m)} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(m.id!)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
\\2"""

content = re.sub(list_pattern, list_replacement, content, flags=re.DOTALL)

with open("src/features.tsx", "w") as f:
    f.write(content)

print("Admin tab patched.")
