import re

with open("src/features.tsx", "r") as f:
    content = f.read()

target = """            {materials.filter(m => m.unit === u).map(m => {
              const prog = progressData[m.id!];
              const isCompleted = prog?.completed || false;
              
              return (
                <div key={m.id} 
                  onClick={() => { 
                    setActiveMat(m); 
                    setIsFullscreen(true); 
                    const p = progressData[m.id!];
                    timeSpentRef.current = p?.timeSpent || 0;
                    setNotesText(p?.notes || "");
                    setHighlights(p?.highlights || []);
                  }}
                  className={`bg-[#FDFBF7] rounded-2xl p-5 border-2 transition-all cursor-pointer group relative overflow-hidden
                    ${isCompleted ? 'border-green-400' : 'border-[#EAE6DF] hover:border-[#C2A878] hover:shadow-md'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-xl shrink-0 transition-colors ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-white text-[#C2A878] group-hover:bg-[#C2A878] group-hover:text-white'}`}>
                      {isCompleted ? <CheckCircle size={28} /> : (
                        m.type === 'video' ? <Video size={28} /> : 
                        m.type === 'pdf' ? <FileText size={28} /> :
                        m.type === 'article' ? <BookOpen size={28} /> :
                        <BookOpen size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">"""

new_target = """            {materials.filter(m => m.unit === u).map(m => {
              const prog = progressData[m.id!];
              const isCompleted = prog?.completed || false;
              
              // Check locks
              const isLocked = m.requiredMaterialIds && m.requiredMaterialIds.length > 0 && 
                               !m.requiredMaterialIds.every(reqId => progressData[reqId]?.completed);
              
              return (
                <div key={m.id} 
                  onClick={() => { 
                    if (isLocked) {
                      toast("請先完成前置教材解鎖此項目");
                      return;
                    }
                    setActiveMat(m); 
                    setIsFullscreen(true); 
                    const p = progressData[m.id!];
                    timeSpentRef.current = p?.timeSpent || 0;
                    setNotesText(p?.notes || "");
                    setHighlights(p?.highlights || []);
                  }}
                  className={`rounded-2xl p-5 border-2 transition-all group relative overflow-hidden
                    ${isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-75' : 
                      isCompleted ? 'bg-[#FDFBF7] border-green-400 cursor-pointer' : 
                      'bg-[#FDFBF7] border-[#EAE6DF] hover:border-[#C2A878] hover:shadow-md cursor-pointer'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-xl shrink-0 transition-colors ${isLocked ? 'bg-gray-200 text-gray-400' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-white text-[#C2A878] group-hover:bg-[#C2A878] group-hover:text-white'}`}>
                      {isLocked ? <Lock size={28} /> :
                       isCompleted ? <CheckCircle size={28} /> : (
                        m.type === 'video' ? <Video size={28} /> : 
                        m.type === 'pdf' ? <FileText size={28} /> :
                        m.type === 'article' ? <BookOpen size={28} /> :
                        <BookOpen size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">"""

content = content.replace(target, new_target)

with open("src/features.tsx", "w") as f:
    f.write(content)
