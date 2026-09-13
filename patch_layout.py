import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-purple-500 bg-white object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-purple-500 bg-white flex items-center justify-center font-bold text-[#4A3F35] uppercase">
                  {user.displayName[0]}
                </div>
              )}"""

new_target = """              {(() => {
                const frameClass = 
                  user.activeFrame === 'frame_gold' ? 'border-yellow-400 border-4 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                  user.activeFrame === 'frame_diamond' ? 'border-cyan-400 border-4 shadow-[0_0_15px_rgba(34,211,238,0.6)]' :
                  user.activeFrame === 'frame_fire' ? 'border-red-500 border-4 shadow-[0_0_20px_rgba(239,68,68,0.8)]' :
                  'border-purple-500 border-2';
                  
                return user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className={`w-10 h-10 rounded-full bg-white object-cover ${frameClass}`} referrerPolicy="no-referrer" />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#4A3F35] uppercase ${frameClass}`}>
                    {user.displayName[0]}
                  </div>
                );
              })()}"""

content = content.replace(target, new_target)

# Theme target
layout_bg_target = """    <div className="min-h-screen bg-[#FDFBF7] font-sans flex flex-col relative overflow-hidden">
      {/* Background elements */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-50" />"""

new_layout_bg = """    <div className={`min-h-screen font-sans flex flex-col relative overflow-hidden transition-colors duration-500 ${user?.activeTheme === 'theme_dark' ? 'bg-gray-900 text-gray-100' : 'bg-[#FDFBF7] text-[#4A3F35]'}`}>
      {/* Background elements */}
      <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${user?.activeTheme === 'theme_dark' ? 'opacity-20' : 'opacity-50'}`} />"""

content = content.replace(layout_bg_target, new_layout_bg)

header_bg_target = """      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#EAE6DF] sticky top-0 z-50 shadow-sm">"""

new_header_bg = """      {/* Header */}
      <header className={`backdrop-blur-md border-b sticky top-0 z-50 shadow-sm transition-colors duration-500 ${user?.activeTheme === 'theme_dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-[#EAE6DF]'}`}>"""

content = content.replace(header_bg_target, new_header_bg)

logo_target = """              <h1 className="font-serif font-black text-lg tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                全科星際航行系統
              </h1>
              <p className="text-xs text-[#8C7A6B]">Quest Analytics Platform</p>"""

new_logo = """              <h1 className="font-serif font-black text-lg tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                全科星際航行系統
              </h1>
              <p className={`text-xs ${user?.activeTheme === 'theme_dark' ? 'text-gray-400' : 'text-[#8C7A6B]'}`}>Quest Analytics Platform</p>"""

content = content.replace(logo_target, new_logo)

with open("src/App.tsx", "w") as f:
    f.write(content)
