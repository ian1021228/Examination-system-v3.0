import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PET_EXAM_DATES, 
  SAMPLE_0909_PET_EXAM, 
  PetExamPaper, 
  isAnswerCorrect,
  convertPetPaperToQuestions,
  PET_AI_SKILL_MARKDOWN 
} from './petExam';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowLeft, 
  Award, 
  BookOpen, 
  ChevronRight, 
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Upload,
  Copy,
  Download,
  Settings
} from 'lucide-react';
import { toast } from './toast';
import { confirmModal } from './confirm';

// ==========================================
// 1. 學生端：PET 週考日期選擇主畫面
// ==========================================
export function PetExamDateSelector({ user }: { user: any }) {
  const navigate = useNavigate();
  const [dateStatus, setDateStatus] = useState<Record<string, { questionCount: number; maxScore?: number; timeLimit?: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetExamStatus();
  }, [user]);

  const loadPetExamStatus = async () => {
    setLoading(true);
    try {
      // 1. 取得管理員設定的總時間
      const settingsSnap = await getDoc(doc(db, 'configs', 'pet_exam_settings'));
      const timeSettings: Record<string, number> = settingsSnap.exists() ? settingsSnap.data()?.timeLimits || {} : {};

      // 2. 取得題庫中各考期的題目數量
      const qSnap = await getDocs(query(collection(db, 'questions'), where('subject', '==', 'pet')));
      const counts: Record<string, number> = {};
      qSnap.docs.forEach(d => {
        const data = d.data();
        if (data.examDate) {
          counts[data.examDate] = (counts[data.examDate] || 0) + 1;
        }
      });

      // 3. 取得使用者的歷史作答成績
      let attemptsMap: Record<string, number> = {};
      if (user?.uid) {
        const aSnap = await getDocs(query(
          collection(db, 'attempts'),
          where('userId', '==', user.uid),
          where('subject', '==', 'pet')
        ));
        aSnap.docs.forEach(d => {
          const a = d.data();
          if (a.examDate) {
            const currentMax = attemptsMap[a.examDate] || 0;
            if ((a.score || 0) > currentMax) {
              attemptsMap[a.examDate] = a.score;
            }
          }
        });
      }

      const statusMap: Record<string, { questionCount: number; maxScore?: number; timeLimit?: number }> = {};
      PET_EXAM_DATES.forEach(d => {
        // 0909 預設自帶樣卷 70 題
        const qCount = counts[d.id] ?? (d.id === '0909' ? 70 : 0);
        statusMap[d.id] = {
          questionCount: qCount,
          maxScore: attemptsMap[d.id],
          timeLimit: timeSettings[d.id] || d.defaultTimeLimitMinutes
        };
      });

      setDateStatus(statusMap);
    } catch (e) {
      console.error('Error loading PET status:', e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* 標題與簡介 */}
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6A5F55] text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#C2A878]/20 border border-[#C2A878]/40 text-[#EAE2D3] px-3 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles size={14} className="text-[#C2A878]" />
              劍橋 L4-PET 專屬週考系統
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-wide">
              每週測驗模擬考 (Weekly Exam Selection)
            </h2>
            <p className="text-[#D5CFC4] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              依據考試日期選擇每週測驗。每週考試皆嚴格分為四大 Part（單字英譯 30 題、語境選詞填空 20 題、動詞時態 15 格、動詞造句 5 題），總分 70 分，限時全真模擬！
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-center min-w-[150px]">
            <p className="text-xs text-[#EAE2D3]">預定週考次數</p>
            <p className="text-3xl font-black text-[#C2A878] mt-1">{PET_EXAM_DATES.length} 週</p>
            <p className="text-[11px] text-[#D5CFC4] mt-1">9月9日 ~ 1月6日</p>
          </div>
        </div>
      </div>

      {/* 17 個週考考期卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {PET_EXAM_DATES.map((dateItem, idx) => {
          const status = dateStatus[dateItem.id] || { questionCount: 0, timeLimit: 45 };
          const hasQuestions = status.questionCount > 0 || dateItem.id === '0909';
          const hasAttempted = status.maxScore !== undefined;

          return (
            <div
              key={dateItem.id}
              className={`bg-white border rounded-2xl p-5 transition-all flex flex-col justify-between group ${
                hasQuestions 
                  ? 'border-[#EAE6DF] hover:border-[#C2A878] hover:shadow-md cursor-pointer' 
                  : 'border-dashed border-[#D5CFC4] bg-[#FDFBF7]/50 opacity-80'
              }`}
              onClick={() => {
                if (hasQuestions) {
                  navigate(`/pet-exam/${dateItem.id}`);
                } else {
                  toast(`「${dateItem.label}」題庫籌備中，管理員可在管理後台直接匯入！`);
                }
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-[#EAE2D3] text-[#4A3F35] font-black text-sm px-3 py-1 rounded-full font-serif">
                    第 {idx + 1} 週 · {dateItem.label}
                  </span>
                  <span className="text-xs flex items-center text-[#8C7A6B] bg-[#F5F5F0] px-2 py-0.5 rounded">
                    <Clock size={12} className="mr-1" />
                    {status.timeLimit || 45} 分鐘
                  </span>
                </div>

                <h3 className="font-bold text-[#4A3F35] text-base mb-1 group-hover:text-[#B39969] transition-colors">
                  {dateItem.title}
                </h3>

                <p className="text-xs text-[#8C7A6B] mb-2.5">
                  四大 Part 全卷 · 滿分 70 Points
                </p>

                {/* 考試範圍進度提示 (依據週考範圍表格) */}
                <div className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-xl p-2.5 text-[11px] space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C7A6B]">單字進度:</span>
                    <span className="font-mono font-bold text-[#4A3F35] bg-[#EAE2D3]/60 px-1.5 py-0.2 rounded">
                      {dateItem.vocabRange || '依進度表'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C7A6B]">動詞進度:</span>
                    <span className="font-mono font-bold text-[#72816B] bg-[#72816B]/10 px-1.5 py-0.2 rounded">
                      {dateItem.verbRange || '依進度表'}
                    </span>
                  </div>
                </div>

                {/* 題庫同步狀態 */}
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  {hasQuestions ? (
                    <span className="text-[#72816B] font-bold flex items-center">
                      <CheckCircle2 size={13} className="mr-1" />
                      已同步 {status.questionCount || 70} 題考卷
                    </span>
                  ) : (
                    <span className="text-[#A69B8F] flex items-center">
                      <HelpCircle size={13} className="mr-1" />
                      題庫待匯入
                    </span>
                  )}
                </div>
              </div>

              {/* 底部按鈕與成績 */}
              <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-between mt-2">
                {hasAttempted ? (
                  <div className="flex items-center text-xs">
                    <Award size={14} className="text-[#C2A878] mr-1" />
                    <span className="text-[#8C7A6B]">最高分：</span>
                    <span className="font-black text-[#B39969] ml-1">{status.maxScore} / 70</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#A69B8F]">尚未測驗</span>
                )}

                <button
                  className={`text-xs font-bold px-3.5 py-2 min-h-[38px] rounded-xl flex items-center transition-all touch-manipulation active:scale-[0.98] ${
                    hasQuestions
                      ? 'bg-[#4A3F35] hover:bg-[#5A4F45] text-white shadow-sm'
                      : 'bg-[#EAE2D3] text-[#8C7A6B]'
                  }`}
                >
                  {hasQuestions ? (hasAttempted ? '再次測驗' : '開始挑戰') : '查看考期'}
                  <ChevronRight size={13} className="ml-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. 學生端：專屬 PET 模擬考全卷作答測驗室
// ==========================================
export function PetExamRunner({ user }: { user: any }) {
  const { examDateId } = useParams<{ examDateId: string }>();
  const navigate = useNavigate();

  const [paper, setPaper] = useState<PetExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePart, setActivePart] = useState<'part1_a' | 'part1_b' | 'part2_a' | 'part2_b'>('part1_a');
  
  // 學生輸入之答案狀態
  const [answers1A, setAnswers1A] = useState<Record<number, string>>({});
  const [answers1B, setAnswers1B] = useState<Record<number, string>>({});
  const [answers2A, setAnswers2A] = useState<Record<string, string>>({}); // key: `${rowId}_present`, `${rowId}_past`, `${rowId}_participle`
  const [answers2B, setAnswers2B] = useState<Record<number, string>>({});

  // 計時器
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45 * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);

  // 載入試卷資料
  useEffect(() => {
    if (!examDateId) return;
    loadExamPaper(examDateId);
  }, [examDateId]);

  const loadExamPaper = async (dateId: string) => {
    setLoading(true);
    try {
      // 1. 取得管理員設定時間
      const settingsSnap = await getDoc(doc(db, 'configs', 'pet_exam_settings'));
      const timeLimitMin = settingsSnap.exists() && settingsSnap.data()?.timeLimits?.[dateId]
        ? settingsSnap.data().timeLimits[dateId]
        : 45;

      // 2. 查詢 Firestore 中的考題
      const qSnap = await getDocs(query(
        collection(db, 'questions'),
        where('subject', '==', 'pet'),
        where('examDate', '==', dateId)
      ));

      if (qSnap.empty) {
        // 若 Firestore 尚未匯入且為 0909，使用內建模範樣卷
        if (dateId === '0909') {
          const sample = { ...SAMPLE_0909_PET_EXAM, timeLimitMinutes: timeLimitMin };
          setPaper(sample);
          setTimeLeftSeconds(timeLimitMin * 60);
        } else {
          // 其他考期若尚未匯入題目
          setPaper(null);
        }
      } else {
        // 重構試卷
        const p1a: any[] = [];
        const p1b: any[] = [];
        const p2aMap: Record<number, any> = {};
        const p2b: any[] = [];

        qSnap.docs.forEach(d => {
          const q = d.data();
          if (q.part === 'part1_a') {
            const matchZh = q.prompt.match(/單字英譯 \d+\.\s*([^_\s]+)/);
            p1a.push({
              id: q.itemNumber || p1a.length + 1,
              chinese: matchZh ? matchZh[1] : (q.clue || '單字'),
              english: q.correctAnswer,
              acceptableAnswers: q.acceptableAnswers || []
            });
          } else if (q.part === 'part1_b') {
            p1b.push({
              id: q.itemNumber || p1b.length + 1,
              sentence: q.prompt.replace(/\[Part I - Sec B\] 句子選詞填空 \d+\.\s*/, ''),
              correctAnswer: q.correctAnswer,
              acceptableAnswers: q.acceptableAnswers || [],
              clue: q.clue
            });
          } else if (q.part === 'part2_a') {
            const rowId = q.verbRowId || 1;
            if (!p2aMap[rowId]) {
              const zhMatch = q.prompt.match(/動詞(?:填空|三態)\s*\(([^)]+)\)/);
              const subMatch = q.prompt.match(/主詞:\s*([^[]+)/);
              p2aMap[rowId] = {
                id: rowId,
                verbChinese: zhMatch ? zhMatch[1] : (q.clue ? q.clue.replace(/動詞：([^，]+).*/, '$1') : '動詞'),
                subject: subMatch ? subMatch[1].trim() : '-',
                presentSimple: '',
                pastSimple: '',
                participle: '',
                acceptableAnswers: {}
              };
            }
            if (q.verbTense === 'present') {
              p2aMap[rowId].presentSimple = q.correctAnswer;
              p2aMap[rowId].acceptableAnswers.presentSimple = q.acceptableAnswers || [q.correctAnswer];
            } else if (q.verbTense === 'past') {
              p2aMap[rowId].pastSimple = q.correctAnswer;
              p2aMap[rowId].acceptableAnswers.pastSimple = q.acceptableAnswers || [q.correctAnswer];
            } else if (q.verbTense === 'participle') {
              p2aMap[rowId].participle = q.correctAnswer;
              p2aMap[rowId].acceptableAnswers.participle = q.acceptableAnswers || [q.correctAnswer];
            }
          } else if (q.part === 'part2_b') {
            p2b.push({
              id: q.itemNumber || p2b.length + 1,
              sentence: q.prompt.replace(/\[Part II - Sec B.*?\]\s*(?:第\s*)?\d+\.\s*/, ''),
              correctAnswer: q.correctAnswer,
              acceptableAnswers: q.acceptableAnswers || [],
              clue: q.clue
            });
          }
        });

        p1a.sort((a, b) => a.id - b.id);
        p1b.sort((a, b) => a.id - b.id);
        p2b.sort((a, b) => a.id - b.id);
        const p2aList = Object.values(p2aMap).sort((a, b) => a.id - b.id);

        const dateMeta = PET_EXAM_DATES.find(d => d.id === dateId);

        setPaper({
          examDate: dateId,
          dateLabel: dateMeta?.label || dateId,
          title: dateMeta?.title || `${dateId} L4-PET Quiz`,
          totalScore: 70,
          timeLimitMinutes: timeLimitMin,
          part1_vocabulary: {
            sectionA_translation: p1a,
            sectionB_sentences: p1b
          },
          part2_verbs: {
            sectionA_tenses: p2aList,
            sectionB_sentences: p2b
          }
        });
        setTimeLeftSeconds(timeLimitMin * 60);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // 計時器運作
  useEffect(() => {
    if (!paper || examSubmitted || isTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paper, examSubmitted, isTimeUp]);

  // 已作答題數統計
  const answeredCount = useMemo(() => {
    let count = 0;
    Object.values(answers1A).forEach(v => { if (v?.trim()) count++; });
    Object.values(answers1B).forEach(v => { if (v?.trim()) count++; });
    Object.values(answers2A).forEach(v => { if (v?.trim()) count++; });
    Object.values(answers2B).forEach(v => { if (v?.trim()) count++; });
    return count;
  }, [answers1A, answers1B, answers2A, answers2B]);

  // 時間格式化
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeftSeconds]);

  // 自動交卷
  const handleAutoSubmit = () => {
    toast('作答時間結束，系統為您自動結算成績！');
    submitGrading();
  };

  // 手動交卷
  const handleManualSubmit = async () => {
    if (answeredCount < 70) {
      const confirmed = await confirmModal({
        title: '確認交卷',
        message: `您目前尚有 ${70 - answeredCount} 題未作答，確定要現在交卷結算嗎？`,
        confirmText: '確定交卷',
        cancelText: '繼續作答'
      });
      if (!confirmed) return;
    }
    submitGrading();
  };

  // 評分與結算
  const submitGrading = async () => {
    if (!paper) return;

    let score1A = 0;
    let score1B = 0;
    let score2A = 0;
    let score2B = 0;

    const reviewDetails: any = {
      sec1A: [],
      sec1B: [],
      sec2A: [],
      sec2B: []
    };

    // 1. Part I - Sec A 評分 (30 題)
    (paper.part1_vocabulary?.sectionA_translation || []).forEach(item => {
      const userAns = answers1A[item.id] || '';
      const correct = isAnswerCorrect(userAns, item.english, item.acceptableAnswers);
      if (correct) score1A += 1;
      reviewDetails.sec1A.push({
        id: item.id,
        chinese: item.chinese,
        userAns,
        correctAns: item.english,
        isCorrect: correct
      });
    });

    // 2. Part I - Sec B 評分 (20 題)
    (paper.part1_vocabulary?.sectionB_sentences || []).forEach(item => {
      const userAns = answers1B[item.id] || '';
      const correct = isAnswerCorrect(userAns, item.correctAnswer, item.acceptableAnswers);
      if (correct) score1B += 1;
      reviewDetails.sec1B.push({
        id: item.id,
        sentence: item.sentence,
        userAns,
        correctAns: item.correctAnswer,
        clue: item.clue,
        isCorrect: correct
      });
    });

    // 3. Part II - Sec A 評分 (5 組動詞 x 3 態 = 15 格)
    (paper.part2_verbs?.sectionA_tenses || []).forEach(item => {
      const presUser = answers2A[`${item.id}_present`] || '';
      const pastUser = answers2A[`${item.id}_past`] || '';
      const partUser = answers2A[`${item.id}_participle`] || '';

      const presOk = isAnswerCorrect(presUser, item.presentSimple, item.acceptableAnswers?.presentSimple);
      const pastOk = isAnswerCorrect(pastUser, item.pastSimple, item.acceptableAnswers?.pastSimple);
      const partOk = isAnswerCorrect(partUser, item.participle, item.acceptableAnswers?.participle);

      if (presOk) score2A += 1;
      if (pastOk) score2A += 1;
      if (partOk) score2A += 1;

      reviewDetails.sec2A.push({
        id: item.id,
        verbChinese: item.verbChinese,
        subject: item.subject,
        present: { user: presUser, correct: item.presentSimple, isCorrect: presOk },
        past: { user: pastUser, correct: item.pastSimple, isCorrect: pastOk },
        participle: { user: partUser, correct: item.participle, isCorrect: partOk }
      });
    });

    // 4. Part II - Sec B 評分 (5 題)
    (paper.part2_verbs?.sectionB_sentences || []).forEach(item => {
      const userAns = answers2B[item.id] || '';
      const correct = isAnswerCorrect(userAns, item.correctAnswer, item.acceptableAnswers);
      if (correct) score2B += 1;
      reviewDetails.sec2B.push({
        id: item.id,
        sentence: item.sentence,
        userAns,
        correctAns: item.correctAnswer,
        clue: item.clue,
        isCorrect: correct
      });
    });

    const total = score1A + score1B + score2A + score2B;
    const accuracy = Math.round((total / 70) * 100);

    const resultObj = {
      totalScore: total,
      maxScore: 70,
      accuracy,
      breakdown: {
        score1A,
        score1B,
        score2A,
        score2B
      },
      reviewDetails
    };

    setExamResult(resultObj);
    setExamSubmitted(true);

    // 記錄作答至 Firestore attempts
    if (user?.uid) {
      try {
        await addDoc(collection(db, 'attempts'), {
          subject: 'pet',
          examDate: paper.examDate,
          userId: user.uid,
          userDisplayName: user.displayName || 'PET 考生',
          score: total,
          maxScore: 70,
          accuracy,
          timeTaken: (paper.timeLimitMinutes || 45) * 60 - timeLeftSeconds,
          timestamp: Date.now(),
          breakdown: resultObj.breakdown
        });
      } catch (err) {
        console.error('Failed to save attempt:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#8C7A6B]">
        <div className="w-12 h-12 border-4 border-[#C2A878] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>正在載入 PET 週考卷與題庫資料...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white rounded-3xl p-8 border border-[#EAE6DF] shadow-sm">
        <AlertTriangle className="w-16 h-16 text-[#C2A878] mx-auto mb-4" />
        <h3 className="text-2xl font-bold font-serif text-[#4A3F35] mb-2">本週考卷尚未上架</h3>
        <p className="text-[#8C7A6B] text-sm mb-6">
          該日期的試卷題庫尚未匯入。管理員可在「PET 英文管理中心」使用專用格式一鍵匯入整份考卷！
        </p>
        <button
          onClick={() => navigate('/subject/pet/tasks')}
          className="bg-[#4A3F35] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#5A4F45] transition-all"
        >
          返回考期列表
        </button>
      </div>
    );
  }

  // ==========================================
  // 測驗成績結算報告畫面
  // ==========================================
  if (examSubmitted && examResult) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* 成績看板 */}
        <div className="bg-white border border-[#EAE6DF] rounded-3xl p-8 text-center shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#C2A878] via-[#8F9A8A] to-[#B39969]"></div>
          
          <div className="w-20 h-20 mx-auto bg-[#FDFBF7] border-2 border-[#C2A878] rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
            {examResult.totalScore >= 63 ? '👑' : examResult.totalScore >= 50 ? '🥈' : '✍️'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#4A3F35]">
            {paper.title} 測驗成果
          </h2>
          <p className="text-[#8C7A6B] text-sm mt-1">作答完畢 · 滿分 70 Points 全真評量</p>

          <div className="my-6 inline-flex items-baseline gap-2 bg-[#F5F5F0] px-8 py-4 rounded-2xl border border-[#EAE6DF]">
            <span className="text-5xl sm:text-6xl font-black text-[#4A3F35] font-serif">
              {examResult.totalScore}
            </span>
            <span className="text-xl text-[#8C7A6B] font-bold">/ 70 分</span>
            <span className="ml-4 text-sm font-bold bg-[#C2A878] text-[#4A3F35] px-3 py-1 rounded-full">
              準確率 {examResult.accuracy}%
            </span>
          </div>

          {/* 四大 Part 得分細目 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mt-4 text-left">
            <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EAE6DF]">
              <p className="text-xs text-[#8C7A6B]">Part I - Sec A</p>
              <p className="text-xs font-bold text-[#4A3F35]">單字英譯 (30題)</p>
              <p className="text-lg font-black text-[#B39969] mt-1">{examResult.breakdown.score1A} / 30</p>
            </div>
            <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EAE6DF]">
              <p className="text-xs text-[#8C7A6B]">Part I - Sec B</p>
              <p className="text-xs font-bold text-[#4A3F35]">語境選填 (20題)</p>
              <p className="text-lg font-black text-[#B39969] mt-1">{examResult.breakdown.score1B} / 20</p>
            </div>
            <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EAE6DF]">
              <p className="text-xs text-[#8C7A6B]">Part II - Sec A</p>
              <p className="text-xs font-bold text-[#4A3F35]">動詞三態 (15格)</p>
              <p className="text-lg font-black text-[#B39969] mt-1">{examResult.breakdown.score2A} / 15</p>
            </div>
            <div className="bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EAE6DF]">
              <p className="text-xs text-[#8C7A6B]">Part II - Sec B</p>
              <p className="text-xs font-bold text-[#4A3F35]">時態克漏字 (5題)</p>
              <p className="text-lg font-black text-[#B39969] mt-1">{examResult.breakdown.score2B} / 5</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => {
                setExamSubmitted(false);
                setAnswers1A({});
                setAnswers1B({});
                setAnswers2A({});
                setAnswers2B({});
                setTimeLeftSeconds((paper.timeLimitMinutes || 45) * 60);
              }}
              className="bg-[#EAE2D3] text-[#4A3F35] font-bold px-6 py-2.5 rounded-xl hover:bg-[#D5CFC4] flex items-center transition-colors"
            >
              <RotateCcw size={16} className="mr-2" /> 重新測驗
            </button>
            <button
              onClick={() => navigate('/subject/pet/tasks')}
              className="bg-[#4A3F35] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#5A4F45] transition-colors"
            >
              返回考試日期清單
            </button>
          </div>
        </div>

        {/* 逐題詳解審閱 */}
        <div className="bg-white border border-[#EAE6DF] rounded-3xl p-6 space-y-6">
          <h3 className="font-serif text-xl font-bold text-[#4A3F35] border-b border-[#EAE6DF] pb-3">
            📖 逐題作答檢視與正解解析
          </h3>

          {/* Part I Sec A 檢視 */}
          <div>
            <h4 className="font-bold text-[#4A3F35] mb-3 text-sm bg-[#F5F5F0] p-2 rounded-lg">
              Part I – Sec A: 單字英譯 (共 30 題)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {examResult.reviewDetails.sec1A.map((item: any) => (
                <div 
                  key={item.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    item.isCorrect ? 'bg-[#72816B]/5 border-[#72816B]/30' : 'bg-[#BC7665]/5 border-[#BC7665]/30'
                  }`}
                >
                  <span className="font-medium text-[#4A3F35]">
                    {item.id}. {item.chinese}
                  </span>
                  <div className="text-right">
                    <span className={item.isCorrect ? 'text-[#72816B] font-bold' : 'text-[#BC7665] font-bold'}>
                      {item.userAns || '(未作答)'}
                    </span>
                    {!item.isCorrect && (
                      <span className="text-[#8C7A6B] ml-2">正解: {item.correctAns}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part I Sec B 檢視 */}
          <div>
            <h4 className="font-bold text-[#4A3F35] mb-3 text-sm bg-[#F5F5F0] p-2 rounded-lg">
              Part I – Sec B: 語境選詞填空 (共 20 題)
            </h4>
            <div className="space-y-2 text-xs">
              {examResult.reviewDetails.sec1B.map((item: any) => (
                <div 
                  key={item.id}
                  className={`p-3 rounded-xl border ${
                    item.isCorrect ? 'bg-[#72816B]/5 border-[#72816B]/30' : 'bg-[#BC7665]/5 border-[#BC7665]/30'
                  }`}
                >
                  <p className="font-medium text-[#4A3F35] mb-1">{item.id}. {item.sentence}</p>
                  <div className="flex gap-4">
                    <span>你的回答: <strong className={item.isCorrect ? 'text-[#72816B]' : 'text-[#BC7665]'}>{item.userAns || '(未作答)'}</strong></span>
                    {!item.isCorrect && <span>正解: <strong className="text-[#72816B]">{item.correctAns}</strong></span>}
                    {item.clue && <span className="text-[#8C7A6B]">提示: {item.clue}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part II Sec A 檢視 */}
          <div>
            <h4 className="font-bold text-[#4A3F35] mb-3 text-sm bg-[#F5F5F0] p-2 rounded-lg">
              Part II – Sec A: 動詞三態與人稱表格 (5 組動詞)
            </h4>
            <div className="space-y-3 text-xs">
              {examResult.reviewDetails.sec2A.map((item: any) => (
                <div key={item.id} className="border border-[#EAE6DF] rounded-xl p-3 bg-[#FDFBF7]">
                  <p className="font-bold text-[#4A3F35] mb-2">{item.id}. {item.verbChinese}{item.subject && item.subject !== '-' ? ` (主詞: ${item.subject})` : ''}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2 rounded ${item.present.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-[#8C7A6B]">Present Simple</p>
                      <p className="font-bold">{item.present.user || '(空)'} {item.present.isCorrect ? '✓' : `✗ (${item.present.correct})`}</p>
                    </div>
                    <div className={`p-2 rounded ${item.past.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-[#8C7A6B]">Past Simple</p>
                      <p className="font-bold">{item.past.user || '(空)'} {item.past.isCorrect ? '✓' : `✗ (${item.past.correct})`}</p>
                    </div>
                    <div className={`p-2 rounded ${item.participle.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-[#8C7A6B]">Participle</p>
                      <p className="font-bold">{item.participle.user || '(空)'} {item.participle.isCorrect ? '✓' : `✗ (${item.participle.correct})`}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part II Sec B 檢視 */}
          <div>
            <h4 className="font-bold text-[#4A3F35] mb-3 text-sm bg-[#F5F5F0] p-2 rounded-lg">
              Part II – Sec B: 動詞造句選填 (共 5 題)
            </h4>
            <div className="space-y-2 text-xs">
              {examResult.reviewDetails.sec2B.map((item: any) => (
                <div 
                  key={item.id}
                  className={`p-3 rounded-xl border ${
                    item.isCorrect ? 'bg-[#72816B]/5 border-[#72816B]/30' : 'bg-[#BC7665]/5 border-[#BC7665]/30'
                  }`}
                >
                  <p className="font-medium text-[#4A3F35] mb-1">{item.id}. {item.sentence}</p>
                  <div className="flex gap-4">
                    <span>你的回答: <strong className={item.isCorrect ? 'text-[#72816B]' : 'text-[#BC7665]'}>{item.userAns || '(未作答)'}</strong></span>
                    {!item.isCorrect && <span>正解: <strong className="text-[#72816B]">{item.correctAns}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 作答中主介面
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* 頂部常駐測驗狀態列 */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-[#EAE6DF] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/subject/pet/tasks')}
            className="text-[#8C7A6B] hover:text-[#4A3F35] text-sm flex items-center font-bold"
          >
            <ArrowLeft size={16} className="mr-1" /> 退出
          </button>
          <div className="h-4 w-px bg-[#EAE6DF]"></div>
          <div>
            <h3 className="font-bold text-[#4A3F35] text-sm sm:text-base">{paper.title}</h3>
            <p className="text-xs text-[#8C7A6B]">總分 70 Points · 4 大 Part</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 倒數計時器 */}
          <div className={`flex items-center font-mono font-bold text-sm sm:text-base px-3 py-1.5 rounded-xl border ${
            timeLeftSeconds < 300 
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
              : 'bg-[#F5F5F0] text-[#4A3F35] border-[#EAE6DF]'
          }`}>
            <Clock size={16} className="mr-1.5" />
            <span>{formattedTime}</span>
          </div>

          {/* 作答進度 */}
          <div className="text-xs text-[#8C7A6B] hidden sm:block">
            已答: <strong className="text-[#4A3F35]">{answeredCount}</strong> / 70
          </div>

          {/* 交卷按鈕 */}
          <button
            onClick={handleManualSubmit}
            className="bg-[#4A3F35] hover:bg-[#5A4F45] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            交卷評分
          </button>
        </div>
      </div>

      {/* 四大 Part 切換選單 (平板優化：觸控大按鈕、清晰狀態標記) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActivePart('part1_a')}
          className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all active:scale-[0.99] touch-manipulation flex flex-col justify-center ${
            activePart === 'part1_a'
              ? 'bg-[#4A3F35] text-white border-[#4A3F35] shadow-sm ring-2 ring-[#4A3F35]/20'
              : 'bg-white text-[#8C7A6B] border-[#EAE6DF] hover:bg-[#FDFBF7]'
          }`}
        >
          <p className="text-[11px] opacity-80">Part I – Sec A</p>
          <p className="font-bold text-xs sm:text-sm">單字英譯 (30題)</p>
        </button>

        <button
          onClick={() => setActivePart('part1_b')}
          className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all active:scale-[0.99] touch-manipulation flex flex-col justify-center ${
            activePart === 'part1_b'
              ? 'bg-[#4A3F35] text-white border-[#4A3F35] shadow-sm ring-2 ring-[#4A3F35]/20'
              : 'bg-white text-[#8C7A6B] border-[#EAE6DF] hover:bg-[#FDFBF7]'
          }`}
        >
          <p className="text-[11px] opacity-80">Part I – Sec B</p>
          <p className="font-bold text-xs sm:text-sm">語境選填 (20題)</p>
        </button>

        <button
          onClick={() => setActivePart('part2_a')}
          className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all active:scale-[0.99] touch-manipulation flex flex-col justify-center ${
            activePart === 'part2_a'
              ? 'bg-[#4A3F35] text-white border-[#4A3F35] shadow-sm ring-2 ring-[#4A3F35]/20'
              : 'bg-white text-[#8C7A6B] border-[#EAE6DF] hover:bg-[#FDFBF7]'
          }`}
        >
          <p className="text-[11px] opacity-80">Part II – Sec A</p>
          <p className="font-bold text-xs sm:text-sm">動詞三態 (15格)</p>
        </button>

        <button
          onClick={() => setActivePart('part2_b')}
          className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all active:scale-[0.99] touch-manipulation flex flex-col justify-center ${
            activePart === 'part2_b'
              ? 'bg-[#4A3F35] text-white border-[#4A3F35] shadow-sm ring-2 ring-[#4A3F35]/20'
              : 'bg-white text-[#8C7A6B] border-[#EAE6DF] hover:bg-[#FDFBF7]'
          }`}
        >
          <p className="text-[11px] opacity-80">Part II – Sec B</p>
          <p className="font-bold text-xs sm:text-sm">時態克漏字 (5題)</p>
        </button>
      </div>

      {/* Part 內容作答區 */}
      <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 sm:p-7 shadow-sm">
        {/* ================= Part I - Section A ================= */}
        {activePart === 'part1_a' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAE6DF] pb-4">
              <span className="text-xs font-bold text-[#B39969] bg-[#EAE2D3] px-2.5 py-1 rounded-md">
                Part I – Vocabulary · Section A
              </span>
              <h4 className="text-lg font-bold text-[#4A3F35] mt-2">
                Translate the words into English. (將中文詞彙翻譯成英文，共 30 題)
              </h4>
              <p className="text-xs text-[#8C7A6B] mt-1">
                請在下方輸入欄位中填入相對應的正確英文單字（大小寫皆可接受）。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(paper.part1_vocabulary?.sectionA_translation || []).map(item => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#EAE6DF] bg-[#FDFBF7] focus-within:border-[#C2A878] focus-within:bg-white transition-all gap-2"
                >
                  <span className="font-bold text-[#4A3F35] text-sm sm:w-36 shrink-0">
                    {item.id}. {item.chinese}
                  </span>
                  <input
                    type="text"
                    value={answers1A[item.id] || ''}
                    onChange={e => setAnswers1A({ ...answers1A, [item.id]: e.target.value })}
                    placeholder="輸入英文單字..."
                    className="w-full bg-white border border-[#D5CFC4] rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-[#4A3F35] focus:outline-none focus:ring-1 focus:ring-[#C2A878] h-11 sm:h-10"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#EAE6DF]">
              <button
                onClick={() => setActivePart('part1_b')}
                className="min-h-[44px] bg-[#4A3F35] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#5A4F45] transition-all flex items-center shadow-sm touch-manipulation active:scale-[0.98]"
              >
                前往 Part I – Section B <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ================= Part I - Section B ================= */}
        {activePart === 'part1_b' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAE6DF] pb-4">
              <span className="text-xs font-bold text-[#B39969] bg-[#EAE2D3] px-2.5 py-1 rounded-md">
                Part I – Vocabulary · Section B
              </span>
              <h4 className="text-lg font-bold text-[#4A3F35] mt-2">
                Choose the correct words and write them in the appropriate sentences. (語境填空，共 20 題)
              </h4>
              <p className="text-xs text-[#8C7A6B] mt-1">
                請根據句意與前後文語境填入適當單字（單字源自 Section A 單字範圍，可依文法進行必要詞形變化）。
              </p>
            </div>

            <div className="space-y-3.5">
              {(paper.part1_vocabulary?.sectionB_sentences || []).map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-[#EAE6DF] bg-[#FDFBF7] space-y-2.5 focus-within:border-[#C2A878] focus-within:bg-white transition-all"
                >
                  <p className="text-sm sm:text-base font-medium text-[#4A3F35] leading-relaxed">
                    {item.id}. {item.sentence}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8C7A6B] shrink-0">回答:</span>
                    <input
                      type="text"
                      value={answers1B[item.id] || ''}
                      onChange={e => setAnswers1B({ ...answers1B, [item.id]: e.target.value })}
                      placeholder="填入適當單字..."
                      className="w-full max-w-md bg-white border border-[#D5CFC4] rounded-xl px-3.5 py-2 text-base sm:text-sm text-[#4A3F35] focus:outline-none focus:ring-1 focus:ring-[#C2A878] h-11 sm:h-10"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-[#EAE6DF]">
              <button
                onClick={() => setActivePart('part1_a')}
                className="min-h-[44px] text-[#8C7A6B] hover:text-[#4A3F35] font-bold text-sm px-4 py-2 rounded-xl touch-manipulation"
              >
                ← 返回 Section A
              </button>
              <button
                onClick={() => setActivePart('part2_a')}
                className="min-h-[44px] bg-[#4A3F35] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#5A4F45] transition-all flex items-center shadow-sm touch-manipulation active:scale-[0.98]"
              >
                前往 Part II – Section A <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ================= Part II - Section A ================= */}
        {activePart === 'part2_a' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAE6DF] pb-4">
              <span className="text-xs font-bold bg-[#72816B]/10 text-[#72816B] px-2.5 py-1 rounded-md">
                Part II – Verbs · Section A
              </span>
              <h4 className="text-lg font-bold text-[#4A3F35] mt-2">
                Fill in the correct verb forms. (不規則動詞三態填空，共 5 組動詞，15 格)
              </h4>
              <p className="text-xs text-[#8C7A6B] mt-1">
                依據動詞與中文意思，於表格中填入 Base Form (原形/現在式)、Past Simple (過去式)、Participle (過去分詞)。
              </p>
            </div>

            {/* 動詞時態表格 (平板優化橫向滑動與觸控輸入) */}
            <div 
              className="overflow-x-auto -mx-2 sm:mx-0 rounded-2xl border border-[#EAE6DF]"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <table className="w-full text-left border-collapse min-w-[620px] text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#EAE2D3]/60 text-[#4A3F35]">
                    <th className="p-3.5 border-b border-[#EAE6DF] font-bold">Verb (動詞)</th>
                    <th className="p-3.5 border-b border-[#EAE6DF] font-bold">Base Form (原形)</th>
                    <th className="p-3.5 border-b border-[#EAE6DF] font-bold">Past Simple (過去式)</th>
                    <th className="p-3.5 border-b border-[#EAE6DF] font-bold">Participle (過去分詞)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {(paper.part2_verbs?.sectionA_tenses || []).map(row => (
                    <tr key={row.id} className="hover:bg-[#FDFBF7]">
                      <td className="p-3.5 font-bold text-[#4A3F35]">
                        {row.verbChinese}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={answers2A[`${row.id}_present`] || ''}
                          onChange={e => setAnswers2A({ ...answers2A, [`${row.id}_present`]: e.target.value })}
                          placeholder="原形 (Base Form)..."
                          className="w-full bg-white border border-[#D5CFC4] rounded-xl px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C2A878] h-11 sm:h-10"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={answers2A[`${row.id}_past`] || ''}
                          onChange={e => setAnswers2A({ ...answers2A, [`${row.id}_past`]: e.target.value })}
                          placeholder="過去式 (Past Simple)..."
                          className="w-full bg-white border border-[#D5CFC4] rounded-xl px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C2A878] h-11 sm:h-10"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={answers2A[`${row.id}_participle`] || ''}
                          onChange={e => setAnswers2A({ ...answers2A, [`${row.id}_participle`]: e.target.value })}
                          placeholder="過去分詞 (Participle)..."
                          className="w-full bg-white border border-[#D5CFC4] rounded-xl px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#C2A878] h-11 sm:h-10"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#EAE6DF]">
              <button
                onClick={() => setActivePart('part1_b')}
                className="min-h-[44px] text-[#8C7A6B] hover:text-[#4A3F35] font-bold text-sm px-4 py-2 rounded-xl touch-manipulation"
              >
                ← 返回 Part I Sec B
              </button>
              <button
                onClick={() => setActivePart('part2_b')}
                className="min-h-[44px] bg-[#4A3F35] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#5A4F45] transition-all flex items-center shadow-sm touch-manipulation active:scale-[0.98]"
              >
                前往 Part II – Section B <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ================= Part II - Section B ================= */}
        {activePart === 'part2_b' && (
          <div className="space-y-6">
            <div className="border-b border-[#EAE6DF] pb-4">
              <span className="text-xs font-bold bg-[#72816B]/10 text-[#72816B] px-2.5 py-1 rounded-md">
                Part II – Verbs · Section B
              </span>
              <h4 className="text-lg font-bold text-[#4A3F35] mt-2">
                Verb Tense Sentence Completion (時態獨立單句填空，共 5 題)
              </h4>
              <p className="text-xs text-[#8C7A6B] mt-1">
                請閱讀下方 5 題獨立生活語境單句（無動詞括號提示），<strong>自主從上方 Section A 的 5 個動詞中選詞</strong>，並依句意結構與時間線索填入<strong>正確的時態變化形</strong>（每題 1 分，共 5 分）。
              </p>
            </div>

            <div className="space-y-3.5">
              {(paper.part2_verbs?.sectionB_sentences || []).map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-[#EAE6DF] bg-[#FDFBF7] space-y-2.5 focus-within:border-[#C2A878] focus-within:bg-white transition-all"
                >
                  <p className="text-sm sm:text-base font-medium text-[#4A3F35] leading-relaxed">
                    {item.id}. {item.sentence}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8C7A6B] shrink-0">回答:</span>
                    <input
                      type="text"
                      value={answers2B[item.id] || ''}
                      onChange={e => setAnswers2B({ ...answers2B, [item.id]: e.target.value })}
                      placeholder="請從 Sec A 動詞選詞並填入正確時態..."
                      className="w-full max-w-md bg-white border border-[#D5CFC4] rounded-xl px-3.5 py-2 text-base sm:text-sm text-[#4A3F35] focus:outline-none focus:ring-1 focus:ring-[#C2A878] h-11 sm:h-10"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-[#EAE6DF]">
              <button
                onClick={() => setActivePart('part2_a')}
                className="min-h-[44px] text-[#8C7A6B] hover:text-[#4A3F35] font-bold text-sm px-4 py-2 rounded-xl touch-manipulation w-full sm:w-auto text-center"
              >
                ← 返回 Section A
              </button>
              <button
                onClick={handleManualSubmit}
                className="min-h-[48px] bg-[#C2A878] hover:bg-[#B39969] text-[#4A3F35] px-8 py-3 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center touch-manipulation active:scale-[0.98] w-full sm:w-auto"
              >
                全卷作答完畢，確認交卷
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. 管理端：PET 週考設定、題庫同步與 AI Skill 專用管理面板
// ==========================================
export function PetAdminPanel({ onRefresh }: { onRefresh: () => void }) {
  const [timeLimits, setTimeLimits] = useState<Record<string, number>>({});
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [importDate, setImportDate] = useState<string>('0909');
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. 取得設定
      const snap = await getDoc(doc(db, 'configs', 'pet_exam_settings'));
      if (snap.exists()) {
        setTimeLimits(snap.data()?.timeLimits || {});
      }

      // 2. 統計各考期題數
      const qSnap = await getDocs(query(collection(db, 'questions'), where('subject', '==', 'pet')));
      const counts: Record<string, number> = {};
      qSnap.docs.forEach(d => {
        const data = d.data();
        if (data.examDate) {
          counts[data.examDate] = (counts[data.examDate] || 0) + 1;
        }
      });
      setExamCounts(counts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // 儲存某週作答時間
  const handleSaveTimeLimit = async (dateId: string, minutes: number) => {
    const updated = { ...timeLimits, [dateId]: minutes };
    setTimeLimits(updated);
    try {
      await setDoc(doc(db, 'configs', 'pet_exam_settings'), { timeLimits: updated }, { merge: true });
      toast(`已更新 ${dateId} 週考作答時間為 ${minutes} 分鐘！`);
    } catch (e) {
      console.error(e);
      toast('儲存失敗');
    }
  };

  // 一鍵匯入 09/09 官方樣卷 (70 題)
  const handleImportSample0909 = async () => {
    setIsImporting(true);
    try {
      const questions = convertPetPaperToQuestions(SAMPLE_0909_PET_EXAM);
      for (const q of questions) {
        await addDoc(collection(db, 'questions'), q);
      }
      toast('成功匯入 09/09 官方樣卷 70 題！');
      loadSettings();
      onRefresh();
    } catch (e: any) {
      toast('匯入失敗: ' + e.message);
    }
    setIsImporting(false);
  };

  // 匯入指定考期自訂 JSON（支援以日期為 Key 的字典物件、多回陣列或單回測驗，依 examDate 自動歸類並精準同步）
  const handleImportCustomJson = async () => {
    if (!importJsonText.trim()) return toast('請輸入 JSON 內容');
    setIsImporting(true);
    try {
      // 正規表達式精準提取 JSON 物件或陣列（過濾可能的前後綴或 markdown 區塊）
      const cleaned = importJsonText.trim();
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (!match) throw new Error('未在輸入文字中找到合法的 JSON 物件 ({...}) 或陣列 ([...]) 格式。');

      const rawParsed = JSON.parse(match[0]);
      const papersToProcess: PetExamPaper[] = [];

      if (Array.isArray(rawParsed)) {
        // Option 1: 陣列形式 [ { examDate: "0909", ... }, ... ]
        papersToProcess.push(...rawParsed);
      } else if (rawParsed && typeof rawParsed === 'object') {
        if (Array.isArray((rawParsed as any).quizzes)) {
          // Option 2: 頂層物件包裝陣列 { "quizzes": [ ... ] }
          papersToProcess.push(...(rawParsed as any).quizzes);
        } else if ((rawParsed as any).part1_vocabulary || (rawParsed as any).part2_verbs) {
          // 單張測驗卷格式 { "examDate": "0909", ... }
          papersToProcess.push(rawParsed as PetExamPaper);
        } else {
          // Option 3: 以日期代碼為 Key 的字典物件：{ "0909": { ... }, "0916": { ... } }
          for (const [key, val] of Object.entries(rawParsed)) {
            if (val && typeof val === 'object' && ('part1_vocabulary' in val || 'part2_verbs' in val)) {
              const paperItem = val as PetExamPaper;
              if (!paperItem.examDate) {
                paperItem.examDate = key;
              }
              papersToProcess.push(paperItem);
            }
          }
        }
      }

      if (papersToProcess.length === 0) {
        throw new Error('未能在 JSON 中識別出有效的 PET 測驗卷資料。請確認是否為以日期代碼為 Key 的字典物件（如 {"0909": {...}}）或包含 part1_vocabulary / part2_verbs 之結構。');
      }

      const allQuestions: any[] = [];
      const affectedDates = new Set<string>();

      for (const paper of papersToProcess) {
        // 支援自動判斷與歸類：優先使用 JSON 本身標註的 examDate，若無則採用下拉選單指定的 importDate
        const targetDate = (paper.examDate && paper.examDate.trim()) || importDate;
        if (!targetDate) {
          throw new Error('無法識別考期日期，請在考卷 JSON 頂層或字典 Key 註明 examDate。');
        }
        paper.examDate = targetDate;
        affectedDates.add(targetDate);

        // 轉換為系統通用題目結構（包含各題的 examDate 與 date）
        const questions = convertPetPaperToQuestions(paper);
        allQuestions.push(...questions);
      }

      // 自動清理受影響考期的舊題目，防止重複題
      for (const d of affectedDates) {
        const qSnap = await getDocs(
          query(collection(db, 'questions'), where('subject', '==', 'pet'), where('examDate', '==', d))
        );
        for (const docItem of qSnap.docs) {
          await deleteDoc(docItem.ref);
        }
      }

      // 逐題存入 Firestore
      for (const q of allQuestions) {
        await addDoc(collection(db, 'questions'), q);
      }

      const dateListStr = Array.from(affectedDates).join(', ');
      toast(`成功！已自動處理 ${papersToProcess.length} 回測驗，共將 ${allQuestions.length} 道考題精準歸類至考期 [${dateListStr}] 並同步完成！`);
      setImportJsonText('');
      loadSettings();
      onRefresh();
    } catch (e: any) {
      toast('匯入失敗: ' + e.message);
    }
    setIsImporting(false);
  };

  // 複製 AI Skill Prompt
  const handleCopySkill = () => {
    navigator.clipboard.writeText(PET_AI_SKILL_MARKDOWN);
    toast('已複製 PET 出題 AI 專用 Skill 指南！可直接貼給下一個 AI 產生完整考卷。');
  };

  // 下載 Skill Markdown 檔案
  const handleDownloadSkill = () => {
    const blob = new Blob([PET_AI_SKILL_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PET_EXAM_SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
    toast('已下載 PET_EXAM_SKILL.md 檔案！');
  };

  return (
    <div className="space-y-8">
      {/* 頂部管理功能橫幅 */}
      <div className="bg-white border border-[#EAE6DF] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#EAE2D3] text-[#4A3F35] px-2.5 py-0.5 rounded-full text-xs font-bold font-serif">
              PET 專屬功能
            </span>
            <h3 className="font-serif text-xl font-bold text-[#4A3F35]">
              PET 週考時間與題庫自動同步中心
            </h3>
          </div>
          <p className="text-xs text-[#8C7A6B]">
            管理員可在此設定每週考試的總作答時間（分鐘），並透過專屬 AI Skill 匯入各考期題目。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopySkill}
            className="bg-[#C2A878] hover:bg-[#B39969] text-[#4A3F35] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center shadow-sm transition-all"
          >
            <Copy size={14} className="mr-1.5" /> 複製 PET 出題 Skill
          </button>
          <button
            onClick={handleDownloadSkill}
            className="bg-[#EAE2D3] hover:bg-[#D5CFC4] text-[#4A3F35] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-all"
          >
            <Download size={14} className="mr-1.5" /> 下載 Skill.md
          </button>
          <button
            onClick={handleImportSample0909}
            disabled={isImporting}
            className="bg-[#4A3F35] hover:bg-[#5A4F45] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-all disabled:opacity-50"
          >
            <Upload size={14} className="mr-1.5" /> 匯入 09/09 官方樣卷 (70題)
          </button>
        </div>
      </div>

      {/* 17 個週考考期設定表格 */}
      <div className="bg-white border border-[#EAE6DF] rounded-3xl p-6 shadow-sm">
        <h4 className="font-serif font-bold text-base text-[#4A3F35] mb-4">
          📅 週考考期與每週總作答時間設定 (共 {PET_EXAM_DATES.length} 週)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#EAE6DF] text-[#8C7A6B] bg-[#FDFBF7]">
                <th className="p-3">考期 ID</th>
                <th className="p-3">考試日期</th>
                <th className="p-3">單字進度 (右二排)</th>
                <th className="p-3">動詞進度 (最右排)</th>
                <th className="p-3">題庫同步題數</th>
                <th className="p-3">每週總作答時間 (分鐘)</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF]">
              {PET_EXAM_DATES.map(dateItem => {
                const currentMinutes = timeLimits[dateItem.id] ?? dateItem.defaultTimeLimitMinutes;
                const count = examCounts[dateItem.id] ?? (dateItem.id === '0909' ? 70 : 0);

                return (
                  <tr key={dateItem.id} className="hover:bg-[#FDFBF7]/60">
                    <td className="p-3 font-mono font-bold text-[#4A3F35]">{dateItem.id}</td>
                    <td className="p-3 font-bold text-[#4A3F35]">{dateItem.label}</td>
                    <td className="p-3 font-mono text-xs text-[#5A4F45] bg-[#FDFBF7]">
                      {dateItem.vocabRange || '依進度表'}
                    </td>
                    <td className="p-3 font-mono text-xs font-bold text-[#72816B]">
                      {dateItem.verbRange || '依進度表'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        count > 0 ? 'bg-[#72816B]/10 text-[#72816B]' : 'bg-[#EAE2D3] text-[#8C7A6B]'
                      }`}>
                        {count > 0 ? `${count} 題已就緒` : '待匯入'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          max="180"
                          value={currentMinutes}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 45;
                            handleSaveTimeLimit(dateItem.id, val);
                          }}
                          className="w-20 bg-[#FDFBF7] border border-[#D5CFC4] rounded px-2.5 py-1 text-sm font-bold text-[#4A3F35]"
                        />
                        <span className="text-xs text-[#8C7A6B]">分鐘</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setImportDate(dateItem.id)}
                        className="text-xs bg-[#EAE2D3] hover:bg-[#D5CFC4] text-[#4A3F35] px-2.5 py-1 rounded font-bold"
                      >
                        指定匯入
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON 匯入區塊 */}
      <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h4 className="font-serif font-bold text-base text-[#4A3F35]">
              📥 匯入 PET 專用考卷 JSON（支援以日期為 Key 之字典物件或單回試卷）
            </h4>
            <p className="text-xs text-[#8C7A6B] mt-0.5">
              可直接貼上以日期為 Key 的字典物件（如 <code className="bg-[#EAE2D3] px-1 py-0.5 rounded text-[#4A3F35] font-mono">&#123; "0909": &#123;...&#125;, "0916": &#123;...&#125; &#125;</code>）或單回考卷，系統將自動解析並精準歸類同步！
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#8C7A6B]">預設考期：</span>
            <select
              value={importDate}
              onChange={e => setImportDate(e.target.value)}
              className="bg-[#FDFBF7] border border-[#D5CFC4] rounded-xl px-3 py-2 text-xs font-bold text-[#4A3F35] h-10"
            >
              {PET_EXAM_DATES.map(d => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.id}) - {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#F5F5F0] border border-[#EAE6DF] rounded-2xl p-3.5 text-xs text-[#72816B] flex items-center gap-2">
          <span>⚡</span>
          <span>
            <strong>全自動分類機制</strong>：若 JSON 物件或各題已標註 <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#EAE6DF]">"examDate": "0916"</code>，系統將自動覆寫並歸類至對應考期，無須手動指定！
          </span>
        </div>

        <textarea
          value={importJsonText}
          onChange={e => setImportJsonText(e.target.value)}
          placeholder="請在此貼上由 AI 依據 PET Skill 產出的整份考卷 JSON..."
          rows={8}
          className="w-full bg-[#FDFBF7] border border-[#EAE6DF] rounded-2xl p-4 font-mono text-xs text-[#4A3F35] focus:outline-none focus:ring-1 focus:ring-[#C2A878]"
        />

        <div className="flex justify-end">
          <button
            onClick={handleImportCustomJson}
            disabled={isImporting || !importJsonText.trim()}
            className="min-h-[44px] bg-[#4A3F35] hover:bg-[#5A4F45] text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 touch-manipulation active:scale-[0.98] shadow-sm"
          >
            {isImporting ? '自動歸類並匯入中...' : `確認自動歸類並匯入`}
          </button>
        </div>
      </div>
    </div>
  );
}
