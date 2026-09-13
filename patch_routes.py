with open("src/App.tsx", "r") as f:
    content = f.read()

import_target = """import { CourseMaterialsAdminView, CourseMaterialsStudentView } from './features';"""
new_import = """import { CourseMaterialsAdminView, CourseMaterialsStudentView, Leaderboard, XPShop } from './features';"""

content = content.replace(import_target, new_import)

route_target = """          <Route path="/gameover/:attemptId" element={user ? <GameOver /> : <Navigate to="/" />} />
          
          {/* Admin Routes */}"""

new_route = """          <Route path="/gameover/:attemptId" element={user ? <GameOver /> : <Navigate to="/" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard user={user} /> : <Navigate to="/" />} />
          <Route path="/shop" element={user ? <XPShop user={user} setUser={setUser} /> : <Navigate to="/" />} />
          
          {/* Admin Routes */}"""

content = content.replace(route_target, new_route)

header_target = """              {location.pathname !== '/select-subject' && (
                <button onClick={() => navigate('/select-subject')} className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center">
                  <Home size={14} className="mr-1" /> 任務大廳
                </button>
              )}"""

new_header = """              {location.pathname !== '/select-subject' && (
                <button onClick={() => navigate('/select-subject')} className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center">
                  <Home size={14} className="mr-1" /> 任務大廳
                </button>
              )}
              {user.role === 'player' && (
                <>
                  <button onClick={() => navigate('/leaderboard')} className="bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 text-yellow-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center hidden sm:flex">
                    🏆 排行榜
                  </button>
                  <button onClick={() => navigate('/shop')} className="bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center hidden sm:flex">
                    💎 兌換商店 ({user.points || 0} XP)
                  </button>
                </>
              )}"""

content = content.replace(header_target, new_header)

with open("src/App.tsx", "w") as f:
    f.write(content)
