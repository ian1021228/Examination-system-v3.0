with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add handleAnswerRef
if "const handleAnswerRef = useRef<any>(null);" not in content:
    content = content.replace("const [questionStartTime, setQuestionStartTime] = useState(Date.now());", "const [questionStartTime, setQuestionStartTime] = useState(Date.now());\n  const handleAnswerRef = useRef<any>(null);")

# 2. Update handleAnswerRef on render
if "handleAnswerRef.current = handleAnswer;" not in content:
    content = content.replace("const handleAnswer = async (answer: string) => {", "const handleAnswer = async (answer: string) => {\n    if (showingWrongAnswer) return;")
    content = content.replace("if (showingWrongAnswer) return;\n    \n    // Check", "// Check")
    content = content.replace("const handleAnswer = async (answer: string) => {", "const handleAnswer = async (answer: string) => {")
    content = content.replace("const currentQ = questions[currentIndex];", "const currentQ = questions[currentIndex];\n  handleAnswerRef.current = handleAnswer;")
    
# 3. Use handleAnswerRef in interval
content = content.replace("handleAnswer(''); // Auto-submit empty if time runs out", "if (handleAnswerRef.current) handleAnswerRef.current(''); // Auto-submit empty if time runs out")

# 4. Render timeLeft
render_time_left = """            {task.gameMode !== 'survival' && <span className="text-[#B39969] font-bold text-sm">無限</span>}
          </div>
          {task.gameMode === 'speed' && (
            <div className="ml-4 flex items-center space-x-2">
               <div className="text-xs text-red-500 font-mono tracking-wider">TIME:</div>
               <div className="text-xl font-black text-red-500">{timeLeft}s</div>
            </div>
          )}"""
content = content.replace("""            {task.gameMode !== 'survival' && <span className="text-[#B39969] font-bold text-sm">無限</span>}
          </div>""", render_time_left)

with open("src/App.tsx", "w") as f:
    f.write(content)
