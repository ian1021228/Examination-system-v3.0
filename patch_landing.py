import re

with open("src/features.tsx", "r") as f:
    content = f.read()

pattern = r"export function LandingPage\(\) \{[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\);"

replacement = """export function LandingPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, (err) => console.warn("Snapshot error:", err));
    return unsub;
  }, []);

  return (
    <div className="w-full bg-[#FDFBF7] font-sans">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#4A3F35] to-[#2D2620] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-24 lg:py-32 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[#C2A878] text-sm font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C2A878] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C2A878]"></span>
              </span>
              全新一代數位學習體驗
            </div>
            <h1 className="text-5xl lg:text-7xl font-black font-serif text-[#FDFBF7] leading-tight tracking-tight">
              突破傳統框架<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C2A878] to-[#EAE2D3]">引領未來教育</span>
            </h1>
            <p className="text-[#D5CFC4] text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
              DevSeed 課業進化站將最新多媒體互動與實戰測驗完美融合。打造個人化學習軌跡，激發你的無限潛能。
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <button onClick={() => navigate('/signin')} className="w-full sm:w-auto bg-[#C2A878] text-[#4A3F35] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#B39969] transition-all transform hover:-translate-y-1 shadow-[0_10px_20px_rgba(194,168,120,0.3)] flex items-center justify-center gap-2">
                開始探索 <ChevronRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-[#FDFBF7] border border-[#FDFBF7]/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                了解更多 <Info size={20} />
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 relative w-full max-w-lg lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 blur-3xl rounded-full"></div>
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 aspect-[4/3] transform transition-transform duration-700 hover:scale-[1.02]">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80" alt="Students learning" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D2620]/80 via-transparent to-transparent"></div>
            </div>
            {/* Floating Badges */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Star size={24} fill="currentColor" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">學生滿意度</p>
                <p className="text-2xl font-black text-gray-900">99.8%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-[#EAE6DF] hover:border-[#C2A878]/50 transition-all group">
              <div className="w-16 h-16 bg-[#FDFBF7] rounded-2xl border border-[#EAE6DF] flex items-center justify-center text-[#B39969] mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <Video size={28} />
              </div>
              <h3 className="text-2xl font-black font-serif text-[#4A3F35] mb-4 group-hover:text-[#C2A878] transition-colors">影音圖文並茂</h3>
              <p className="text-[#8C7A6B] leading-relaxed">
                結合高畫質影音與精緻 Markdown 講義，讓枯燥的理論變得生動易懂，隨時隨地沉浸學習。
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-[#EAE6DF] hover:border-[#C2A878]/50 transition-all group md:-translate-y-6">
              <div className="w-16 h-16 bg-[#FDFBF7] rounded-2xl border border-[#EAE6DF] flex items-center justify-center text-[#B39969] mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-2xl font-black font-serif text-[#4A3F35] mb-4 group-hover:text-[#C2A878] transition-colors">即時互動問答</h3>
              <p className="text-[#8C7A6B] leading-relaxed">
                突破空間限制，內建專屬課程討論區。隨時提問、即刻解答，打造零距離的師生共學環境。
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-[#EAE6DF] hover:border-[#C2A878]/50 transition-all group">
              <div className="w-16 h-16 bg-[#FDFBF7] rounded-2xl border border-[#EAE6DF] flex items-center justify-center text-[#B39969] mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <Award size={28} />
              </div>
              <h3 className="text-2xl font-black font-serif text-[#4A3F35] mb-4 group-hover:text-[#C2A878] transition-colors">成效數據追蹤</h3>
              <p className="text-[#8C7A6B] leading-relaxed">
                自動化學習歷程記錄與雷達圖分析，精準掌握各科弱點，讓每一分努力都轉化為實質進步。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-24 bg-[#EAE2D3]/20 border-y border-[#EAE6DF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black font-serif text-[#4A3F35] mb-4">平台最新動態</h2>
              <p className="text-lg text-[#8C7A6B]">掌握第一手學習資訊與課程更新，不錯過任何重要活動。</p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.length > 0 ? (
              announcements.map((a, i) => (
                <div key={a.id} className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-[#EAE6DF] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col h-full">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#F5F5F0] text-[#A69B8F] text-xs font-bold uppercase tracking-widest rounded-full">公告</span>
                      <span className="text-sm text-[#A69B8F] font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-xl text-[#4A3F35] mb-4 group-hover:text-[#C2A878] transition-colors leading-snug">{a.title}</h3>
                    <p className="text-[#8C7A6B] text-sm leading-relaxed line-clamp-3">{a.content}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-[#F5F5F0] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EAE2D3] flex items-center justify-center text-[#B39969] font-bold text-xs">
                      {a.author?.[0] || '管'}
                    </div>
                    <span className="text-sm font-semibold text-[#5A4F45]">{a.author || '系統管理員'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-[#EAE6DF] text-[#C2A878] mb-4 shadow-sm">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#4A3F35] mb-2">目前沒有最新公告</h3>
                <p className="text-[#8C7A6B]">請隨時關注我們的平台動態</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-[#4A3F35] rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-[#C2A878]/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black font-serif text-white mb-6">準備好開始你的學習之旅了嗎？</h2>
            <p className="text-[#D5CFC4] text-lg mb-10">立即註冊帳號，體驗專為你打造的高效學習環境。</p>
            <button onClick={() => navigate('/signin')} className="bg-[#C2A878] text-[#4A3F35] px-10 py-5 rounded-full font-bold text-lg hover:bg-[#B39969] transition-all transform hover:-translate-y-1 shadow-[0_10px_20px_rgba(194,168,120,0.3)] inline-flex items-center justify-center gap-3">
              立即免費加入 <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open("src/features.tsx", "w") as f:
        f.write(new_content)
    print("Match found and replaced.")
else:
    print("No match found.")
