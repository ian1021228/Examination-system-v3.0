import re

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"export function LandingPage\(\) \{[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\);"

replacement = """export function LandingPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAnnouncements(data.slice(0, 5));
    }, (err) => console.warn("Snapshot error:", err));
    return unsub;
  }, []);

  return (
    <div className="w-full bg-white font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="font-bold text-xl">D</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">DevSeed</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/signin')} className="text-gray-600 hover:text-gray-900 font-semibold px-4 py-2 transition-colors">
              登入
            </button>
            <button onClick={() => navigate('/signin')} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg">
              免費註冊
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="lg:w-1/2 space-y-10 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              企業級數位學習平台
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] text-gray-900">
              驅動未來的 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">智能學習體驗</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              DevSeed 提供全方位的數位教育解決方案。結合互動式多媒體教材、即時測驗與成效分析，助您釋放最大學習潛能。
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button onClick={() => navigate('/signin')} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)] transform hover:-translate-y-1">
                立即開始使用
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 relative w-full">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 bg-white p-2 transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80" alt="Platform Preview" className="w-full h-auto rounded-xl object-cover aspect-[4/3]" />
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-200">
            <div className="text-center px-4">
              <p className="text-4xl font-black text-indigo-600 mb-2">99%</p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">學習完成率</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-black text-indigo-600 mb-2">24/7</p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">不間斷服務</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-black text-indigo-600 mb-2">10k+</p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">活躍學習者</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-black text-indigo-600 mb-2">5.0</p>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">最高評分</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">打造完美學習閉環</h2>
            <p className="text-lg text-gray-600">從知識輸入到實戰輸出，我們為您設計了最科學的學習軌跡。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8">
                <Video size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">沉浸式教材</h3>
              <p className="text-gray-600 leading-relaxed">
                支援高畫質影音、豐富圖文與 Markdown 語法，讓知識不再生硬。
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8">
                <MessageCircle size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">即時共學社群</h3>
              <p className="text-gray-600 leading-relaxed">
                內建討論看板，學習不再孤單。師生零時差解惑，加速知識吸收。
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-8">
                <Award size={28} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">遊戲化驅動</h3>
              <p className="text-gray-600 leading-relaxed">
                結合經驗值、排行榜與徽章系統，激發內在動機，讓進步看得見。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black text-gray-900 mb-4">系統公告與動態</h2>
              <p className="text-gray-600">隨時掌握平台最新更新與重要訊息。</p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col h-full">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">動態</span>
                      <span className="text-sm text-gray-400 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{a.content}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {a.author?.[0] || '管'}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{a.author || '系統管理員'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-4">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">目前沒有最新動態</h3>
                <p className="text-gray-500">系統運作一切正常，請安心使用。</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gray-900 rounded-[2.5rem] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight">準備好提升學習效率了嗎？</h2>
            <p className="text-gray-300 text-lg mb-10 leading-relaxed">加入 DevSeed，立即體驗無縫銜接的數位學習環境。只需一分鐘即可完成註冊。</p>
            <button onClick={() => navigate('/signin')} className="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all transform hover:-translate-y-1 shadow-xl inline-flex items-center justify-center gap-3">
              免費建立帳號 <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
              <span className="font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-gray-900">DevSeed</span>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} DevSeed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/features.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced commercial landing page.")
else:
    print("No match found.")
