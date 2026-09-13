import re

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"export function CourseMaterialsStudentView\(\{ subjectId, user \}: \{ subjectId: string, user: UserProfile \}\) \{[\s\S]*?return \([\s\S]*?    </div>\s*\);\s*\}"

replacement = """export function CourseMaterialsStudentView({ subjectId, user }: { subjectId: string, user: UserProfile }) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [activeMat, setActiveMat] = useState<CourseMaterial | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (url.includes('youtu.be/')) {
        const v = url.split('youtu.be/')[1].split('?')[0];
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
    } catch (e) {
      // Ignore
    }
    return url;
  };

  if (isFullscreen && activeMat) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10 relative">
          <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 lg:-right-16 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-all">
            <X size={24}/>
          </button>
          
          <h2 className="text-4xl font-black text-gray-900 mb-2">{activeMat.title}</h2>
          {activeMat.description && <p className="text-gray-500 mb-8 text-lg">{activeMat.description}</p>}

          {(activeMat.type === 'video' || activeMat.contentUrl) && (
            <div className="aspect-video bg-black rounded-3xl overflow-hidden mb-12 shadow-2xl">
              {activeMat.contentUrl?.includes('youtube.com') || activeMat.contentUrl?.includes('youtu.be') ? (
                <iframe src={getYoutubeEmbedUrl(activeMat.contentUrl)} className="w-full h-full border-0" allowFullScreen></iframe>
              ) : activeMat.contentUrl ? (
                <video src={activeMat.contentUrl} controls className="w-full h-full"></video>
              ) : null}
            </div>
          )}

          {activeMat.markdownNotes && (
            <div className="relative mt-8">
              <button onClick={toggleTTS} className="absolute -top-16 right-0 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm">
                {isPlayingTTS ? <><VolumeX size={18}/> 停止朗讀</> : <><Volume2 size={18}/> 語音朗讀</>}
              </button>
              <div className="prose prose-lg prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
                <Markdown>{activeMat.markdownNotes}</Markdown>
              </div>
            </div>
          )}

          {activeMat.attachments && activeMat.attachments.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Paperclip size={20}/> 補充檔案</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeMat.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <FileText size={20}/>
                    </div>
                    <span className="font-semibold text-gray-700 truncate">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

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
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 relative">
            <button onClick={() => setIsFullscreen(true)} className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 p-3 rounded-full transition-all" title="全螢幕無擾模式">
              <Layout size={20}/>
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 pr-16">{activeMat.title}</h2>
            {activeMat.description && <p className="text-gray-500 mb-8">{activeMat.description}</p>}
            
            {(activeMat.type === 'video' || activeMat.contentUrl) && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-inner mt-6">
                {activeMat.contentUrl?.includes('youtube.com') || activeMat.contentUrl?.includes('youtu.be') ? (
                  <iframe src={getYoutubeEmbedUrl(activeMat.contentUrl)} className="w-full h-full border-0" allowFullScreen></iframe>
                ) : activeMat.contentUrl ? (
                  <video src={activeMat.contentUrl} controls className="w-full h-full"></video>
                ) : null}
              </div>
            )}
            {activeMat.markdownNotes && (
              <div className="relative mt-12">
                <button onClick={toggleTTS} className="absolute -top-12 right-0 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                  {isPlayingTTS ? <><VolumeX size={18}/> 停止朗讀</> : <><Volume2 size={18}/> 語音朗讀</>}
                </button>
                <div className="prose prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                  <Markdown>{activeMat.markdownNotes}</Markdown>
                </div>
              </div>
            )}
            
            {activeMat.attachments && activeMat.attachments.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Paperclip size={18}/> 補充檔案</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeMat.attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-indigo-200 transition-all">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <FileText size={16}/>
                      </div>
                      <span className="font-medium text-gray-700 text-sm truncate">{att.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {!activeMat.contentUrl && !activeMat.markdownNotes && (!activeMat.attachments || activeMat.attachments.length === 0) && (
              <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100 mt-6">
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
}"""

content = re.sub(pattern, replacement, content)

with open("src/features.tsx", "w") as f:
    f.write(content)
print("Student view patched.")
