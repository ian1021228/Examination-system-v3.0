import re

components_code = """
export function AnnouncementsAdminTab() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    const q = query(collection(db, 'announcements'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
    data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setAnnouncements(data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async () => {
    if (!title || !content) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        title, content, author: '系統管理員', createdAt: Date.now()
      });
      setTitle(''); setContent(''); fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
    fetchAnnouncements();
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
      <h2 className="font-bold text-2xl mb-6 text-gray-900">發布系統公告</h2>
      <div className="space-y-4 mb-8">
        <input placeholder="公告標題" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3" />
        <textarea placeholder="公告內容..." value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 h-32" />
        <button onClick={handlePost} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">發布公告</button>
      </div>
      <h3 className="font-bold text-lg mb-4 text-gray-900">歷史公告</h3>
      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="p-4 border border-gray-100 rounded-xl flex justify-between">
            <div>
              <h4 className="font-bold text-gray-900">{a.title}</h4>
              <p className="text-gray-600 text-sm mt-1">{a.content}</p>
              <p className="text-gray-400 text-xs mt-2">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => handleDelete(a.id!)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseMaterialsAdminTab({ subjectId }: { subjectId: string }) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newMat, setNewMat] = useState<Partial<CourseMaterial>>({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });

  const fetchMaterials = async () => {
    const q = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseMaterial));
    data.sort((a, b) => a.unit - b.unit);
    setMaterials(data);
  };

  useEffect(() => { fetchMaterials(); }, [subjectId]);

  const handleSave = async () => {
    if (!newMat.title) return;
    try {
      const mat = { ...newMat, subjectId, createdAt: Date.now() };
      await addDoc(collection(db, 'materials'), mat);
      setShowForm(false);
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

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl text-gray-900">課程教材管理</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2">
          {showForm ? '取消' : <><Upload size={18}/> 新增教材</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700">類型</label>
              <select value={newMat.type} onChange={e => setNewMat({...newMat, type: e.target.value as any})} className="w-full border border-gray-200 rounded-xl p-3">
                <option value="lesson">課程講義</option>
                <option value="exam">考卷</option>
                <option value="solution">考卷解答</option>
                <option value="video">影音</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">單元</label>
              <input type="number" value={newMat.unit} onChange={e => setNewMat({...newMat, unit: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl p-3"/>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">標題</label>
            <input value={newMat.title} onChange={e => setNewMat({...newMat, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3" placeholder="例如：第一單元 基礎觀念"/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">內容連結 (影片URL或檔案連結)</label>
            <input value={newMat.contentUrl} onChange={e => setNewMat({...newMat, contentUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3" placeholder="https://youtube.com/..."/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700">Markdown 課程筆記</label>
            <textarea value={newMat.markdownNotes} onChange={e => setNewMat({...newMat, markdownNotes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 h-32" placeholder="支援 Markdown 語法..."/>
          </div>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold w-full hover:bg-indigo-700">儲存教材</button>
        </div>
      )}

      <div className="space-y-4">
        {materials.map(m => (
          <div key={m.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">{m.unit}</div>
              <div>
                <h3 className="font-bold text-gray-900">{m.title}</h3>
                <span className="text-xs text-gray-500 uppercase tracking-wide">{m.type}</span>
              </div>
            </div>
            <button onClick={() => handleDelete(m.id!)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiscussionBoard({ subjectId, user }: { subjectId: string, user: UserProfile }) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'discussions'), where('subjectId', '==', subjectId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscussionPost)));
    });
    return unsub;
  }, [subjectId]);

  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    try {
      await addDoc(collection(db, 'discussions'), {
        subjectId, authorId: user.uid, authorName: user.displayName, content: newPost, createdAt: Date.now(), replies: []
      });
      setNewPost('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3"><MessageCircle className="text-indigo-500"/> 科目討論版</h2>
      <div className="mb-8 flex gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">{user.displayName[0]}</div>
        <div className="flex-grow">
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="有什麼問題想討論嗎？" className="w-full border border-gray-200 rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"/>
          <div className="flex justify-end mt-3">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"><Send size={16}/> 發布</button>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">{post.authorName[0]}</div>
              <div>
                <span className="font-bold text-gray-900 text-sm block">{post.authorName}</span>
                <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap pl-11">{post.content}</p>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center text-gray-500 py-10">目前還沒有討論，來做第一個發問的人吧！</p>}
      </div>
    </div>
  );
}

export function CourseMaterialsStudentView({ subjectId, user }: { subjectId: string, user: UserProfile }) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [activeMat, setActiveMat] = useState<CourseMaterial | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseMaterial));
      data.sort((a, b) => a.unit - b.unit);
      setMaterials(data);
      if (data.length > 0 && !activeMat) setActiveMat(data[0]);
    });
    return unsub;
  }, [subjectId]);

  const toggleTTS = () => {
    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    } else if (activeMat?.markdownNotes) {
      const textToRead = activeMat.markdownNotes.replace(/<[^>]*>?/gm, '').replace(/[#*_]/g, '');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'zh-TW';
      utterance.onend = () => setIsPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingTTS(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
      <div className="lg:w-1/3 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3"><BookOpen className="text-indigo-500"/> 課程章節</h2>
        {materials.map(m => (
          <button key={m.id} onClick={() => { setActiveMat(m); window.speechSynthesis.cancel(); setIsPlayingTTS(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all ${activeMat?.id === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg transform scale-[1.02]' : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200 hover:shadow-md'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${activeMat?.id === m.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                {m.unit}
              </div>
              <div>
                <div className="font-bold line-clamp-1">{m.title}</div>
                <div className={`text-xs mt-1 uppercase tracking-wider ${activeMat?.id === m.id ? 'text-indigo-100' : 'text-gray-400'}`}>{m.type}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="lg:w-2/3">
        {activeMat ? (
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{activeMat.title}</h2>
            {activeMat.type === 'video' && activeMat.contentUrl && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-inner">
                {activeMat.contentUrl.includes('youtube.com') ? (
                  <iframe src={activeMat.contentUrl.replace('watch?v=', 'embed/')} className="w-full h-full border-0" allowFullScreen></iframe>
                ) : (
                  <video src={activeMat.contentUrl} controls className="w-full h-full"></video>
                )}
              </div>
            )}
            {activeMat.markdownNotes && (
              <div className="relative">
                <button onClick={toggleTTS} className="absolute -top-12 right-0 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                  {isPlayingTTS ? <><VolumeX size={18}/> 停止朗讀</> : <><Volume2 size={18}/> 語音朗讀</>}
                </button>
                <div className="prose prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                  <Markdown>{activeMat.markdownNotes}</Markdown>
                </div>
              </div>
            )}
            {!activeMat.contentUrl && !activeMat.markdownNotes && (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
                本章節暫無詳細內容
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 bg-white rounded-[2rem] border border-gray-100 p-10 text-center">
            <div>
              <BookOpen size={48} className="mx-auto mb-4 opacity-50"/>
              <p className="text-xl font-bold text-gray-500">請從左側選擇課程章節</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"""

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"export function GamificationProfile"

new_content = content.replace("export function GamificationProfile", components_code + "export function GamificationProfile")

with open("src/features.tsx", "w") as f:
    f.write(new_content)

print("Restored 4 components.")
