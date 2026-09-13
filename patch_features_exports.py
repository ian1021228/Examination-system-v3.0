import re

with open("src/features.tsx", "r") as f:
    content = f.read()

# Add imports for Leaderboard and Shop
import_target = """import { ChevronLeft, BookOpen, Video, FileText, MessageCircle, Send, Award, Trash, Star, Play, CheckCircle, ChevronRight, Layout, Info, User, Volume2, Calendar, Paperclip, Download, Plus, X, Upload } from 'lucide-react';"""
new_import = """import { ChevronLeft, BookOpen, Video, FileText, MessageCircle, Send, Award, Trash, Star, Play, CheckCircle, ChevronRight, Layout, Info, User, Volume2, Calendar, Paperclip, Download, Plus, X, Upload, ShoppingCart, Trophy, Lock, Unlock } from 'lucide-react';"""
content = content.replace(import_target, new_import)

new_components = """

// ==========================================
// Leaderboard Component
// ==========================================
export function Leaderboard({ user }: { user: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'player'), orderBy('points', 'desc'), limit(50));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data() as UserProfile);
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full py-8">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-[#EAE6DF]">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-[#F5F5F0]">
          <div className="bg-yellow-100 p-4 rounded-2xl text-yellow-600">
            <Trophy size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#4A3F35] font-serif">榮譽排行榜</h2>
            <p className="text-[#8C7A6B] font-medium mt-1">累積 XP 總分排行，展現你的學習成果！</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#8C7A6B]">載入中...</div>
        ) : (
          <div className="space-y-4">
            {users.map((u, idx) => (
              <div 
                key={u.uid} 
                className={`flex items-center justify-between p-4 rounded-2xl transition-all
                  ${u.uid === user.uid ? 'bg-yellow-50 border-2 border-yellow-200 shadow-md transform scale-[1.02]' : 'bg-[#FDFBF7] border-2 border-[#EAE6DF] hover:border-[#C2A878]'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center font-black text-lg rounded-xl shrink-0
                    ${idx === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-200' : 
                      idx === 1 ? 'bg-gray-300 text-white' : 
                      idx === 2 ? 'bg-[#CD7F32] text-white' : 'bg-transparent text-[#8C7A6B]'}
                  `}>
                    #{idx + 1}
                  </div>
                  
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {u.displayName[0]}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-bold text-[#4A3F35] text-lg flex items-center gap-2">
                      {u.displayName}
                      {u.uid === user.uid && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">你</span>}
                    </h3>
                    <p className="text-sm text-[#8C7A6B] flex items-center gap-1">
                      連續登入 {u.streak || 0} 天 🔥
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-black text-[#C2A878] font-mono">
                    {u.points || 0}
                  </div>
                  <div className="text-xs text-[#8C7A6B] font-bold uppercase tracking-wider">
                    XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// XP Shop Component
// ==========================================
export function XPShop({ user, setUser }: { user: UserProfile, setUser: (u: UserProfile) => void }) {
  const shopItems = [
    { id: 'frame_gold', name: '黃金頭像框', cost: 1000, desc: '尊貴的黃金光澤，象徵你的努力', type: 'frame', color: 'border-yellow-400' },
    { id: 'frame_diamond', name: '鑽石頭像框', cost: 3000, desc: '閃耀的鑽石光芒，頂尖學習者的證明', type: 'frame', color: 'border-cyan-400' },
    { id: 'frame_fire', name: '烈焰頭像框', cost: 5000, desc: '燃燒的學習之火，無人能擋', type: 'frame', color: 'border-red-500' },
    { id: 'theme_dark', name: '深色模式主題', cost: 2000, desc: '護眼的深色主題，適合夜間學習', type: 'theme', color: 'bg-gray-800' },
  ];

  const handlePurchase = async (item: any) => {
    if ((user.points || 0) < item.cost) {
      toast("XP 不足！快去完成任務賺取 XP 吧！");
      return;
    }

    const isFrame = item.type === 'frame';
    const unlockedList = isFrame ? (user.unlockedFrames || ['default']) : (user.unlockedThemes || ['default']);
    
    if (unlockedList.includes(item.id)) {
      // Equip
      const updates = isFrame ? { activeFrame: item.id } : { activeTheme: item.id };
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUser({ ...user, ...updates });
      toast(`已裝備 ${item.name}！`);
    } else {
      // Buy
      const newPoints = (user.points || 0) - item.cost;
      const newUnlocked = [...unlockedList, item.id];
      const updates = isFrame 
        ? { points: newPoints, unlockedFrames: newUnlocked, activeFrame: item.id }
        : { points: newPoints, unlockedThemes: newUnlocked, activeTheme: item.id };
        
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUser({ ...user, ...updates });
      toast(`成功購買並裝備 ${item.name}！`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-8">
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-[#EAE6DF]">
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-[#F5F5F0]">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#4A3F35] font-serif">XP 兌換商店</h2>
              <p className="text-[#8C7A6B] font-medium mt-1">使用你的 XP 解鎖專屬外觀與特權！</p>
            </div>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-200 px-6 py-3 rounded-2xl text-center">
            <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">目前餘額</div>
            <div className="text-2xl font-black text-emerald-600 font-mono flex items-center gap-2">
              💎 {user.points || 0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shopItems.map(item => {
            const isFrame = item.type === 'frame';
            const isUnlocked = isFrame 
              ? (user.unlockedFrames?.includes(item.id)) 
              : (user.unlockedThemes?.includes(item.id));
            const isEquipped = isFrame 
              ? user.activeFrame === item.id 
              : user.activeTheme === item.id;
              
            return (
              <div key={item.id} className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between
                ${isEquipped ? 'border-emerald-400 bg-emerald-50' : 'border-[#EAE6DF] bg-[#FDFBF7] hover:border-[#C2A878]'}
              `}>
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isFrame ? (
                        <div className={`w-12 h-12 rounded-full border-4 ${item.color} bg-white`} />
                      ) : (
                        <div className={`w-12 h-12 rounded-xl ${item.color} border-2 border-gray-300`} />
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-[#4A3F35]">{item.name}</h3>
                        <p className="text-sm text-[#8C7A6B]">{item.type === 'frame' ? '頭像外框' : '介面主題'}</p>
                      </div>
                    </div>
                    {isUnlocked ? (
                      <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                        <Unlock size={20} />
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 p-2 rounded-xl">
                        <Lock size={20} />
                      </div>
                    )}
                  </div>
                  <p className="text-[#8C7A6B] mb-6">{item.desc}</p>
                </div>
                
                <button 
                  onClick={() => handlePurchase(item)}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                    ${isEquipped ? 'bg-emerald-100 text-emerald-700 cursor-default' : 
                      isUnlocked ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md' : 
                      (user.points || 0) >= item.cost ? 'bg-[#C2A878] hover:bg-[#B39969] text-white shadow-md' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                  `}
                  disabled={isEquipped}
                >
                  {isEquipped ? '已裝備' : isUnlocked ? '立即裝備' : `解鎖 (${item.cost} XP)`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
"""

content = content + new_components

with open("src/features.tsx", "w") as f:
    f.write(content)
