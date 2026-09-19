import { confirmModal } from './confirm';
import { toast } from "./toast";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, updateDoc , limit, onSnapshot, orderBy } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Calendar, Heart, Settings, BookOpen, User, RotateCcw, Home, Plus, X, Lock, Play, CheckCircle, List, Upload, Gamepad, LayoutDashboard, LogOut, Printer, Sparkles, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { pinyin } from 'pinyin-pro';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import { ParticleEngine } from './ParticleEngine';
import { LandingPage, AnnouncementsAdminTab, CourseMaterialsAdminTab, DiscussionBoard, CourseMaterialsStudentView, GamificationProfile, Leaderboard, XPShop, StudyTimer, LearningAnalyticsDashboard, compareUnits, formatUnitDisplay, formatUnitBadge } from './features';
import { PetExamDateSelector, PetExamRunner, PetAdminPanel } from './PetExamView';
import { isAnswerCorrect, getWeeklyExamWordsSet, isQuestionMatchingWeeklyExamWords } from './petExam';



export type Subject = 'chinese' | 'math' | 'science' | 'social_studies' | 'pet';

export const SUBJECT_LABELS: Record<Subject, string> = {
  chinese: '國語',
  math: '數學',
  science: '自然',
  social_studies: '社會',
  pet: 'PET 英文'
};

export interface SubQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_in_the_blank';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Question {
  id: string;
  subject: Subject;
  examDate?: string;
  part?: string;
  verbTense?: string;
  itemNumber?: number;
  verbRowId?: number;
  acceptableAnswers?: string[];
  unit: string | number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple_choice' | 'fill_in_the_blank' | 'question_group';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  clue?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'youtube' | 'audio';
  explanation?: string;
  subQuestions?: SubQuestion[];
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  subject: Subject;
  targetUnits: (string | number)[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  gameMode?: 'normal' | 'survival' | 'speed';
  questionCount: number;
  mcCount?: number;
  fibCount?: number;
  mmCount?: number;
  qgCount?: number;
  selectionMode?: 'random' | 'manual';
  selectedQuestionIds?: string[];
  filterWeeklyExamWords?: boolean;
  maxHearts?: number;
  timeLimit?: number;
  antiCheat?: boolean;
  isActive: boolean;
  createdAt: number;
}

export interface AttemptAnswer {
  questionId: string;
  questionPrompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
}

export interface Attempt {
  id: string;
  taskId: string;
  userId: string;
  userDisplayName: string;
  subject: Subject;
  score: number;
  accuracy: number;
  correctCount?: number;
  totalAnswered?: number;
  timeTaken: number;
  cheatCount?: number;
  wrongQuestionIds?: string[];
  answers?: AttemptAnswer[];
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'player' | 'observer';
  points?: number;
  lastPlayedAt?: number;
  lastLoginDate?: string;
  streak?: number;
  unlockedFrames?: string[];
  activeFrame?: string;
  unlockedThemes?: string[];
  activeTheme?: string;
}

export interface SubjectConfig {
  id: Subject;
  totalUnits: number;
}

import { app, auth, db, storage, googleProvider } from './firebase';

/**
 * 徹底清理將寫入 Firestore 的物件，移除所有 undefined 屬性，防止 Firestore 拋出
 * "Unsupported field value: undefined" 例外。
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * 匯出題庫為標準 JSON 格式檔案
 */
export function exportQuestionsToJSON(
  questionsToExport: Question[],
  subjectId?: Subject,
  customSuffix?: string
) {
  if (!questionsToExport || questionsToExport.length === 0) {
    toast('目前沒有可匯出的題目');
    return;
  }

  const cleanList = questionsToExport.map(q => {
    const item: Record<string, any> = {
      prompt: q.prompt || '',
      correctAnswer: q.correctAnswer || '',
      unit: q.unit,
      difficulty: q.difficulty || 'medium',
      type: q.type || 'multiple_choice',
    };

    if (q.options && Array.isArray(q.options) && q.options.length > 0) {
      item.options = q.options;
    }
    if (q.explanation) {
      item.explanation = q.explanation;
    }
    if (q.clue) {
      item.clue = q.clue;
    }
    if (q.mediaUrl) {
      item.mediaUrl = q.mediaUrl;
      item.mediaType = q.mediaType || 'image';
    }
    if (q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      item.subQuestions = q.subQuestions.map(sq => {
        const sub: Record<string, any> = {
          id: sq.id,
          type: sq.type || 'multiple_choice',
          prompt: sq.prompt || '',
          correctAnswer: sq.correctAnswer || ''
        };
        if (sq.options && Array.isArray(sq.options) && sq.options.length > 0) {
          sub.options = sq.options;
        }
        if (sq.explanation) {
          sub.explanation = sq.explanation;
        }
        return sub;
      });
    }

    if (q.examDate) item.examDate = q.examDate;
    if (q.part) item.part = q.part;
    if (q.verbTense) item.verbTense = q.verbTense;
    if (q.itemNumber !== undefined) item.itemNumber = q.itemNumber;
    if (q.acceptableAnswers && q.acceptableAnswers.length > 0) {
      item.acceptableAnswers = q.acceptableAnswers;
    }

    return item;
  });

  const jsonString = JSON.stringify(cleanList, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const subjectName = subjectId ? (SUBJECT_LABELS[subjectId] || subjectId) : '題庫';
  const suffix = customSuffix ? `_${customSuffix}` : '';
  a.href = url;
  a.download = `${subjectName}_題庫${suffix}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`成功匯出 ${cleanList.length} 題題庫 JSON！`);
}

export function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[96%] w-full mx-auto py-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-3xl font-black text-[#4A3F35]">總指揮中心</h2>
          </div>
          <p className="text-[#8C7A6B] mt-1">管理各科任務與題庫</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([id, label]) => (
          <div 
            key={id}
            onClick={() => navigate(`/admin/${id}`)}
            className="bg-[#FDFBF7]/60 border border-[#EAE6DF] rounded-3xl p-6 cursor-pointer hover:border-[#C2A878]/50 transition-all group"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-xl font-bold text-[#4A3F35]">{label}</h3>
              <div className="bg-[#EAE2D3] text-[#B39969] p-2 rounded-xl">
                <BookOpen size={20} />
              </div>
            </div>
            <p className="text-sm text-[#A69B8F]">管理 {label} 的題庫、任務配置與檢視學生成績。</p>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="font-serif text-2xl font-black text-[#4A3F35]">平台公告管理</h2>
        </div>
        <AnnouncementsAdminTab />
      </div>
    </div>
  );
}


export function AdminSubjectView() {
  const { subjectId } = useParams<{ subjectId: Subject }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tasks' | 'questions' | 'ai' | 'import' | 'settings' | 'attempts' | 'paper' | 'materials' | 'petWeekly'>(subjectId === 'pet' ? 'petWeekly' : 'tasks');
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState<'testing' | 'teaching'>('testing');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [config, setConfig] = useState<SubjectConfig>({ id: subjectId!, totalUnits: 10 });

  useEffect(() => {
    if (!subjectId) return;
    fetchData();
  }, [subjectId, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks') {
        const snap = await getDocs(query(collection(db, 'tasks'), where('subject', '==', subjectId)));
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        const qSnap = await getDocs(query(collection(db, 'questions'), where('subject', '==', subjectId)));
        setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
      } else if (activeTab === 'questions') {
        const snap = await getDocs(query(collection(db, 'questions'), where('subject', '==', subjectId)));
        setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
      } else if (activeTab === 'attempts') {
        const snap = await getDocs(query(collection(db, 'attempts'), where('subject', '==', subjectId)));
        setAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attempt)));
        const qSnap = await getDocs(query(collection(db, 'questions'), where('subject', '==', subjectId)));
        setQuestions(qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
        const tSnap = await getDocs(query(collection(db, 'tasks'), where('subject', '==', subjectId)));
        setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      } else if (activeTab === 'settings') {
        const snap = await getDocs(query(collection(db, 'configs'), where('id', '==', subjectId)));
        if (!snap.empty) {
          setConfig(snap.docs[0].data() as SubjectConfig);
        }
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!subjectId) return null;

  return (
    <div className="max-w-[96%] w-full mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-black text-[#4A3F35]">{SUBJECT_LABELS[subjectId]} 管理中心</h2>
        </div>
        <button onClick={() => navigate('/admin')} className="text-[#8C7A6B] hover:text-[#4A3F35]">
          返回總覽
        </button>
      </div>

      <div className="flex flex-col space-y-4 border-b border-[#EAE6DF] pb-4">
        <div className="flex bg-[#F5F5F0] p-1 rounded-xl w-fit border border-[#EAE6DF]">
          <button onClick={() => { setAdminMode('teaching'); setActiveTab('materials'); }} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${adminMode === 'teaching' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#EAE6DF]'}`}>
            📚 教學區
          </button>
          <button onClick={() => { setAdminMode('testing'); setActiveTab('tasks'); }} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${adminMode === 'testing' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#EAE6DF]'}`}>
            📝 測驗區
          </button>
        </div>

        {adminMode === 'testing' ? (
          <div className="flex space-x-2 overflow-x-auto">
            {subjectId === 'pet' && (
              <Tab btnTab="petWeekly" current={activeTab} set={setActiveTab as any} label="PET 週考與 AI 命題" icon={<Sparkles size={16} />} />
            )}
            <Tab btnTab="tasks" current={activeTab} set={setActiveTab as any} label="任務管理" icon={<List size={16} />} />
            <Tab btnTab="questions" current={activeTab} set={setActiveTab as any} label="題庫一覽" icon={<BookOpen size={16} />} />
            <Tab btnTab="import" current={activeTab} set={setActiveTab as any} label="匯入題庫" icon={<Upload size={16} />} />
            <Tab btnTab="attempts" current={activeTab} set={setActiveTab as any} label="作答數據" icon={<CheckCircle size={16} />} />
            <Tab btnTab="paper" current={activeTab} set={setActiveTab as any} label="紙本測驗" icon={<Printer size={16} />} />
            <Tab btnTab="settings" current={activeTab} set={setActiveTab as any} label="科目設定" icon={<Settings size={16} />} />
          </div>
        ) : (
          <div className="flex space-x-2 overflow-x-auto">
            <Tab btnTab="materials" current={activeTab} set={setActiveTab as any} label="教材編輯系統" icon={<BookOpen size={16} />} />
          </div>
        )}
      </div>

      <div className="bg-[#FDFBF7]/40 rounded-3xl p-6 border border-[#EAE6DF]">
        {loading ? <p className="text-[#A69B8F]">載入中...</p> : (
          <>
            {activeTab === 'petWeekly' && <PetAdminPanel onRefresh={fetchData} />}
            {activeTab === 'tasks' && <TasksTab tasks={tasks} subjectId={subjectId} onRefresh={fetchData} config={config} questions={questions} />}
            {activeTab === 'questions' && <QuestionsTab questions={questions} onRefresh={fetchData} subjectId={subjectId} />}
            {activeTab === 'ai' && <AIGeneratorTab subjectId={subjectId} onRefresh={fetchData} />}
            {activeTab === 'import' && <ImportTab subjectId={subjectId} config={config} questions={questions} />}
            {activeTab === 'attempts' && <AttemptsTab attempts={attempts} questions={questions} tasks={tasks} onRefresh={fetchData} />}
            {activeTab === 'paper' && <PaperTestTab questions={questions} attempts={attempts} subjectId={subjectId} />}
            {activeTab === 'settings' && <SettingsTab config={config} subjectId={subjectId} />}
            {activeTab === 'materials' && <CourseMaterialsAdminTab subjectId={subjectId!} />}
          </>
        )}
      </div>
    </div>
  );
}

function Tab({ btnTab, current, set, label, icon }: any) {
  return (
    <button 
      onClick={() => set(btnTab)}
      className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-bold transition-colors ${current === btnTab ? 'border-purple-500 text-[#B39969]' : 'border-transparent text-[#A69B8F] hover:text-[#6A5F55]'}`}
    >
      {icon} <span>{label}</span>
    </button>
  );
}


export function TasksTab({ tasks, subjectId, onRefresh, config, questions = [] }: { tasks: Task[], subjectId: Subject, onRefresh: () => void, config: SubjectConfig, questions?: Question[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'|'mixed'>('mixed');
  const [gameMode, setGameMode] = useState<'normal'|'survival'|'speed'>('normal');
  const [mcCount, setMcCount] = useState(10);
  const [fibCount, setFibCount] = useState(10);
  const [mmCount, setMmCount] = useState(0);
  const [qgCount, setQgCount] = useState(0);
  const [selectionMode, setSelectionMode] = useState<'random'|'manual'>('random');
  const [manualSelectedQs, setManualSelectedQs] = useState<string[]>([]);
  const [manualFilter, setManualFilter] = useState<string>('all');
  const [maxHearts, setMaxHearts] = useState<number>(3);
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [antiCheat, setAntiCheat] = useState<boolean>(false);
  const [units, setUnits] = useState<(string | number)[]>([]);
  const [customUnitInput, setCustomUnitInput] = useState<string>('');
  const [filterWeeklyExamWords, setFilterWeeklyExamWords] = useState<boolean>(false);

  // 週考單字清單集合（包含真題、不規則動詞庫與題庫中 pet 題目）
  const weeklyWordsSet = useMemo(() => {
    return getWeeklyExamWordsSet(questions);
  }, [questions]);

  // 動態收集目前題庫已存在的所有單元，並融合目前已選單元
  const availableUnitList = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.unit !== undefined && q.unit !== null && String(q.unit).trim() !== '') {
        set.add(String(q.unit).trim());
      }
    });
    units.forEach(u => {
      if (u !== undefined && u !== null && String(u).trim() !== '') {
        set.add(String(u).trim());
      }
    });
    if (set.size === 0) {
      for (let i = 1; i <= (config.totalUnits || 10); i++) {
        set.add(String(i));
      }
    }
    return Array.from(set).sort(compareUnits);
  }, [questions, units, config.totalUnits]);

  // 基礎題庫篩選核心（單元 + 週考單字過濾）
  const baseFilteredQuestions = useMemo(() => {
    let q = questions;
    if (units.length > 0) {
      q = q.filter(x => units.some(u => String(u).trim().toLowerCase() === String(x.unit).trim().toLowerCase()));
    }
    if (filterWeeklyExamWords) {
      q = q.filter(x => !isQuestionMatchingWeeklyExamWords(x, weeklyWordsSet));
    }
    return q;
  }, [questions, units, filterWeeklyExamWords, weeklyWordsSet]);

  const availableMmCount = useMemo(() => {
    let q = baseFilteredQuestions.filter(x => !!x.mediaUrl);
    if (diff !== 'mixed') q = q.filter(x => x.difficulty === diff);
    return q.length;
  }, [baseFilteredQuestions, diff]);

  const availableQgCount = useMemo(() => {
    let q = baseFilteredQuestions.filter(x => !x.mediaUrl && x.type === 'question_group');
    if (diff !== 'mixed') q = q.filter(x => x.difficulty === diff);
    return q.length;
  }, [baseFilteredQuestions, diff]);

  const availableMcCount = useMemo(() => {
    let q = baseFilteredQuestions.filter(x => !x.mediaUrl && x.type === 'multiple_choice');
    if (diff !== 'mixed') q = q.filter(x => x.difficulty === diff);
    return q.length;
  }, [baseFilteredQuestions, diff]);

  const availableFibCount = useMemo(() => {
    let q = baseFilteredQuestions.filter(x => !x.mediaUrl && x.type === 'fill_in_the_blank');
    if (diff !== 'mixed') q = q.filter(x => x.difficulty === diff);
    return q.length;
  }, [baseFilteredQuestions, diff]);

  const filteredManualQuestions = useMemo(() => {
    let q = baseFilteredQuestions;
    if (diff !== 'mixed') q = q.filter(x => x.difficulty === diff);
    if (manualFilter === 'multimedia') q = q.filter(x => !!x.mediaUrl);
    else if (manualFilter !== 'all') q = q.filter(x => x.type === manualFilter && !x.mediaUrl);
    return q;
  }, [baseFilteredQuestions, diff, manualFilter]);

  const handleCreate = async () => {
    if (selectionMode === 'random') {
      if (mcCount > availableMcCount || fibCount > availableFibCount || mmCount > availableMmCount || qgCount > availableQgCount) {
        toast(`錯誤：題數大於圖庫中符合條件的題數。\n選擇題: ${mcCount} / ${availableMcCount}
填空題: ${fibCount} / ${availableFibCount}
題組: ${qgCount} / ${availableQgCount}
多媒體: ${mmCount} / ${availableMmCount}`);
        return;
      }
    }
    
    const totalCount = selectionMode === 'random' ? (mcCount + fibCount + mmCount + qgCount) : manualSelectedQs.length;
    if (totalCount === 0) {
      toast('請至少設定一題');
      return;
    }

    try {
      const taskData = {
        title, targetUnits: units, difficulty: diff, gameMode, questionCount: totalCount,
        selectionMode,
        mcCount: selectionMode === 'random' ? mcCount : 0,
        fibCount: selectionMode === 'random' ? fibCount : 0,
        mmCount: selectionMode === 'random' ? mmCount : 0,
        qgCount: selectionMode === 'random' ? qgCount : 0,
        selectedQuestionIds: selectionMode === 'manual' ? manualSelectedQs : [],
        filterWeeklyExamWords,
        maxHearts: gameMode === 'survival' ? (maxHearts || 1) : 0, 
        timeLimit, antiCheat
      };
      
      if (editingTaskId) {
        await updateDoc(doc(db, 'tasks', editingTaskId), taskData);
        setEditingTaskId(null);
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskData, subject: subjectId, isActive: true, createdAt: Date.now()
        });
      }
      setShowForm(false);
      onRefresh();
    } catch(e) { console.error(e); }
  };

  const handleEditTask = (t: Task) => {
    setTitle(t.title);
    setDiff(t.difficulty);
    setGameMode(t.gameMode || 'normal');
    setSelectionMode(t.selectionMode || 'random');
    setMcCount(t.mcCount || 0);
    setFibCount(t.fibCount || 0);
    setMmCount(t.mmCount || 0);
    setQgCount(t.qgCount || 0);
    setManualSelectedQs(t.selectedQuestionIds || []);
    setMaxHearts(t.maxHearts || 0);
    setTimeLimit(t.timeLimit || 10);
    setAntiCheat(t.antiCheat || false);
    setUnits(t.targetUnits || []);
    setFilterWeeklyExamWords(!!t.filterWeeklyExamWords);
    setEditingTaskId(t.id);
    setShowForm(true);
  };

  const toggleUnit = (u: string | number) => {
    const strU = String(u).trim().toLowerCase();
    if (units.some(x => String(x).trim().toLowerCase() === strU)) {
      setUnits(units.filter(x => String(x).trim().toLowerCase() !== strU));
    } else {
      setUnits([...units, u]);
    }
  };

  const addCustomUnit = () => {
    const val = customUnitInput.trim();
    if (!val) return;
    const strVal = val.toLowerCase();
    if (!units.some(x => String(x).trim().toLowerCase() === strVal)) {
      setUnits([...units, val]);
    }
    setCustomUnitInput('');
  };

  const toggleTaskActive = async (t: Task) => {
    await updateDoc(doc(db, 'tasks', t.id), { isActive: !t.isActive });
    onRefresh();
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('確定要刪除這個任務嗎？這將會連帶刪除所有該任務的測驗紀錄。')) {
      await deleteDoc(doc(db, 'tasks', id));
      const qSnapshot = await getDocs(query(collection(db, 'attempts'), where('taskId', '==', id)));
      const deletePromises = qSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-serif text-xl font-bold text-[#4A3F35]">任務列表</h3>
        <button onClick={() => {
            if (showForm) {
                setShowForm(false);
                setEditingTaskId(null);
            } else {
                setTitle(''); setDiff('mixed'); setGameMode('normal'); setMcCount(10); setFibCount(10); setUnits([]); setFilterWeeklyExamWords(false); setCustomUnitInput(''); setMaxHearts(3);
                setShowForm(true);
            }
        }} className="bg-[#C2A878] hover:bg-[#B39969] px-4 py-2 rounded-lg text-[#4A3F35] font-bold text-sm">
          {showForm ? '取消' : '新增任務'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl space-y-4 shadow-sm border border-[#EAE6DF]">
          <div className="flex flex-col space-y-1">
            <label className="text-xs text-[#8C7A6B]">任務標題</label>
            <input type="text" placeholder="任務標題 (e.g. 第一次段考模擬)" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-[#8C7A6B]">難度設定</label>
              <select value={diff} onChange={e => setDiff(e.target.value as any)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]">
                <option value="mixed">混合難度</option><option value="easy">簡單</option><option value="medium">中等</option><option value="hard">困難</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-[#8C7A6B]">挑戰模式</label>
              <select value={gameMode} onChange={e => setGameMode(e.target.value as any)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]">
                <option value="normal">一般模式</option>
                <option value="survival">生存模式 (無限題, 愛心耗盡即結束)</option>
                <option value="speed">計時速答 (每題10秒)</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-[#8C7A6B] font-medium">包含單元 (留空表示全範圍，單元可為任意數字或自訂文字)</label>
              {units.length > 0 && (
                <button type="button" onClick={() => setUnits([])} className="text-xs text-[#C2A878] hover:underline font-bold">
                  清除所有選取 ({units.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {availableUnitList.map(u => {
                const isSelected = units.some(x => String(x).trim().toLowerCase() === u.toLowerCase());
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => toggleUnit(u)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-[#4A3F35] text-white shadow-sm' : 'bg-[#EAE2D3] text-[#8C7A6B] hover:bg-[#D5CFC4]'}`}
                  >
                    {formatUnitDisplay(u)}
                  </button>
                );
              })}
              
              {/* 自訂單元輸入框 */}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={customUnitInput}
                  onChange={e => setCustomUnitInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomUnit(); } }}
                  placeholder="+ 自訂單元 (如 A, B, 1)..."
                  className="text-xs bg-[#FDFBF7] border border-[#D5CFC4] rounded-full px-3 py-1 text-[#4A3F35] focus:outline-none focus:ring-1 focus:ring-[#C2A878] w-32"
                />
                {customUnitInput.trim() && (
                  <button
                    type="button"
                    onClick={addCustomUnit}
                    className="text-xs bg-[#C2A878] hover:bg-[#B39969] text-[#4A3F35] font-bold px-2 py-1 rounded-full"
                  >
                    加入
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 過濾週考出現過的單字選項 */}
          <div className="bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl p-3.5 transition-all">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterWeeklyExamWords}
                onChange={e => setFilterWeeklyExamWords(e.target.checked)}
                className="mt-1 accent-[#C2A878] w-4 h-4 rounded cursor-pointer shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#4A3F35]">過濾週考出現過的單字</span>
                  <span className="text-[11px] font-semibold bg-[#E8DFD1] text-[#6A5A4A] px-2 py-0.5 rounded-full">
                    已自動對齊每週 PET 題庫與不規則動詞庫 ({weeklyWordsSet.size} 個詞彙)
                  </span>
                </div>
                <p className="text-xs text-[#7A6C5D] mt-1 leading-relaxed">
                  開啟後，系統將自動比對並排除 PET 週考（包含第一大題單字中翻英、句子語境選填，以及第二大題動詞三態、時態填空）曾考過的所有單字題目，確保日常測驗與考前特訓不重複練習週考詞彙。
                </p>
              </div>
            </label>
          </div>

          <div className="flex space-x-4 mb-2">
            <label className="flex items-center space-x-2 text-sm font-bold text-[#4A3F35]">
              <input type="radio" name="selectionMode" checked={selectionMode === 'random'} onChange={() => setSelectionMode('random')} className="accent-[#C2A878]" />
              <span>依題數隨機出題</span>
            </label>
            <label className="flex items-center space-x-2 text-sm font-bold text-[#4A3F35]">
              <input type="radio" name="selectionMode" checked={selectionMode === 'manual'} onChange={() => setSelectionMode('manual')} className="accent-[#C2A878]" />
              <span>手動勾選題目</span>
            </label>
          </div>

          {selectionMode === 'random' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-[#8C7A6B]">選擇題數 (庫存: {availableMcCount})</label>
                <input type="number" min="0" value={mcCount} onChange={e => setMcCount(parseInt(e.target.value)||0)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-[#8C7A6B]">填空題數 (庫存: {availableFibCount})</label>
                <input type="number" min="0" value={fibCount} onChange={e => setFibCount(parseInt(e.target.value)||0)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-[#8C7A6B]">題組題數 (庫存: {availableQgCount})</label>
                <input type="number" min="0" value={qgCount} onChange={e => setQgCount(parseInt(e.target.value)||0)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-[#8C7A6B]">多媒體題數 (庫存: {availableMmCount})</label>
                <input type="number" min="0" value={mmCount} onChange={e => setMmCount(parseInt(e.target.value)||0)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]" />
              </div>
            </div>
          ) : (
            <div className="border border-[#EAE6DF] rounded-lg p-4 bg-[#FDFBF7] max-h-60 overflow-y-auto">
              <div className="flex space-x-2 mb-3 pb-3 border-b border-[#EAE6DF] overflow-x-auto">
                <button onClick={() => setManualFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${manualFilter === 'all' ? 'bg-[#4A3F35] text-white' : 'bg-[#EAE2D3] text-[#8C7A6B]'}`}>全部</button>
                <button onClick={() => setManualFilter('multiple_choice')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${manualFilter === 'multiple_choice' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800'}`}>選擇</button>
                <button onClick={() => setManualFilter('fill_in_the_blank')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${manualFilter === 'fill_in_the_blank' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-800'}`}>填空</button>
                <button onClick={() => setManualFilter('question_group')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${manualFilter === 'question_group' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800'}`}>題組</button>
                <button onClick={() => setManualFilter('multimedia')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${manualFilter === 'multimedia' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-800'}`}>多媒體</button>
              </div>
              <div className="space-y-2">
                {filteredManualQuestions.map(q => (
                  <label key={q.id} className="flex items-start space-x-3 cursor-pointer group hover:bg-[#F5F5F0] p-1 rounded">
                    <input type="checkbox" checked={manualSelectedQs.includes(q.id)} onChange={(e) => {
                      if (e.target.checked) setManualSelectedQs([...manualSelectedQs, q.id]);
                      else setManualSelectedQs(manualSelectedQs.filter(id => id !== q.id));
                    }} className="mt-1 accent-[#C2A878]" />
                    <div className="flex-1 text-sm text-[#4A3F35]">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                        <span className="bg-[#EAE2D3] text-[#8C7A6B] px-1.5 py-0.5 rounded text-[10px] font-bold">{formatUnitBadge(q.unit)}</span>
                        {q.type === 'multiple_choice' && !q.mediaUrl && <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">選擇</span>}
                        {q.type === 'fill_in_the_blank' && !q.mediaUrl && <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-bold">填空</span>}
                        {q.type === 'question_group' && !q.mediaUrl && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-bold">題組</span>}
                        {q.mediaUrl && <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[10px] font-bold">多媒體</span>}
                        {isQuestionMatchingWeeklyExamWords(q, weeklyWordsSet) && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">週考詞彙</span>}
                      </div>
                      <p className="line-clamp-2">{(q.prompt || '').replace(/\[SOURCE_IMAGE\]/g, '')}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#EAE6DF] text-sm font-bold text-[#4A3F35]">
                已選 {manualSelectedQs.length} 題
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {gameMode === 'survival' && (
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-[#8C7A6B]">生命值限制 (愛心)</label>
                <input type="number" min="1" value={maxHearts} onChange={e => setMaxHearts(parseInt(e.target.value)||1)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]" />
              </div>
            )}
            {gameMode === 'speed' && (
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-[#8C7A6B]">每題作答秒數</label>
                <input type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value)||10)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]" />
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-[#8C7A6B]">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={antiCheat} onChange={e => setAntiCheat(e.target.checked)} className="rounded" />
              <span>啟用防作弊 (偵測離開分頁次數)</span>
            </label>
          </div>
          <button onClick={handleCreate} className="w-full bg-[#4A3F35] hover:bg-[#5A4F45] text-white font-bold py-3 rounded-lg mt-4 transition-colors">
            {editingTaskId ? '儲存修改' : '建立任務'}
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {tasks.map(t => (
          <div key={t.id} className="bg-white border border-[#EAE6DF] rounded-2xl p-5 shadow-sm relative group hover:border-[#C2A878] transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-[#4A3F35] group-hover:text-[#B39969] transition-colors">{t.title}</h4>
              <div className="flex items-center space-x-2">
                <button onClick={() => toggleTaskActive(t)} className={`text-xs px-2 py-1 rounded font-bold ${t.isActive ? 'bg-[#8F9A8A] text-white' : 'bg-[#D5CFC4] text-[#8C7A6B]'}`}>
                  {t.isActive ? '進行中' : '已關閉'}
                </button>
                <button onClick={() => handleDeleteTask(t.id)} className="text-xs px-2 py-1 rounded font-bold bg-[#BC7665] text-white hover:bg-[#A35D4C]">
                  刪除
                </button>
              </div>
            </div>
            <div className="text-sm text-[#8C7A6B] space-y-1">
              <p>模式: {t.gameMode === 'survival' ? '生存' : t.gameMode === 'speed' ? '速答' : '一般'}</p>
              <p>總題數: {t.questionCount} {t.selectionMode === 'manual' ? '(手動選題)' : `(選擇 ${t.mcCount||0}, 填空 ${t.fibCount||0}, 題組 ${t.qgCount||0}, 多媒體 ${t.mmCount||0})`}</p>
              <p>難度: {t.difficulty === 'mixed' ? '混合' : t.difficulty === 'easy' ? '簡單' : t.difficulty === 'medium' ? '中等' : '困難'}</p>
              <p>範圍: {t.targetUnits?.length ? t.targetUnits.map(u => formatUnitDisplay(u)).join(', ') : '全部單元'}</p>
              {t.filterWeeklyExamWords && <p className="text-amber-700 font-semibold text-xs">✨ 已排除週考單字</p>}
              <p>愛心: {t.maxHearts ? t.maxHearts : '無限'}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#EAE6DF] flex justify-end space-x-2">
                <button onClick={() => handleEditTask(t)} className="text-sm px-3 py-1 bg-[#EAE2D3] text-[#8C7A6B] hover:text-[#4A3F35] rounded font-bold transition-colors">編輯</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-[#A69B8F] col-span-2">尚無任務</p>}
      </div>
    </div>
  );
}

function SubQuestionEditor({ subQuestions, setSubQuestions }: { subQuestions: SubQuestion[], setSubQuestions: (sq: SubQuestion[]) => void }) {
  const handleAddSq = () => {
    setSubQuestions([...subQuestions, { id: Date.now().toString(), type: 'multiple_choice', prompt: '', correctAnswer: '', options: [] }]);
  };
  
  const handleUpdateSq = (idx: number, updates: Partial<SubQuestion>) => {
    const newSqs = [...subQuestions];
    newSqs[idx] = { ...newSqs[idx], ...updates };
    setSubQuestions(newSqs);
  };
  
  const handleRemoveSq = (idx: number) => {
    const newSqs = [...subQuestions];
    newSqs.splice(idx, 1);
    setSubQuestions(newSqs);
  };

  return (
    <div className="mt-4 p-4 border border-[#EAE6DF] rounded-xl bg-[#FDFBF7]">
      <h5 className="font-bold text-[#4A3F35] mb-3">子問題設定</h5>
      {subQuestions.map((sq, idx) => (
        <div key={sq.id} className="mb-4 pb-4 border-b border-[#D5CFC4] last:border-b-0 last:mb-0 last:pb-0 relative">
          <button onClick={() => handleRemoveSq(idx)} className="absolute top-0 right-0 text-red-500 hover:text-red-700 text-xs font-bold bg-white px-2 py-1 rounded">刪除</button>
          <div className="grid grid-cols-2 gap-3 mb-2 pr-12">
            <div>
              <label className="text-xs text-[#8C7A6B]">子問題題型</label>
              <select value={sq.type} onChange={e => handleUpdateSq(idx, { type: e.target.value as any })} className="w-full bg-white border border-[#D5CFC4] rounded px-3 py-1 text-sm text-[#4A3F35]">
                <option value="multiple_choice">選擇題</option>
                <option value="fill_in_the_blank">填空題</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8C7A6B]">正確答案</label>
              <input value={sq.correctAnswer} onChange={e => handleUpdateSq(idx, { correctAnswer: e.target.value })} className="w-full bg-white border border-[#D5CFC4] rounded px-3 py-1 text-sm text-[#4A3F35]" placeholder="正確答案" />
            </div>
          </div>
          <div className="mb-2">
            <label className="text-xs text-[#8C7A6B]">題目內容</label>
            <input value={sq.prompt} onChange={e => handleUpdateSq(idx, { prompt: e.target.value })} className="w-full bg-white border border-[#D5CFC4] rounded px-3 py-1 text-sm text-[#4A3F35]" placeholder="輸入子問題..." />
          </div>
          {sq.type === 'multiple_choice' && (
            <div>
              <label className="text-xs text-[#8C7A6B]">選項 (逗號分隔)</label>
              <input value={sq.options?.join(', ') || ''} onChange={e => {
                const opts = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                handleUpdateSq(idx, { options: opts });
              }} className="w-full bg-white border border-[#D5CFC4] rounded px-3 py-1 text-sm text-[#4A3F35]" placeholder="A, B, C, D" />
            </div>
          )}
        </div>
      ))}
      <button onClick={handleAddSq} className="mt-2 text-sm text-blue-600 font-bold px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded">+ 新增子問題</button>
    </div>
  );
}

export function QuestionsTab({ questions, onRefresh, subjectId }: { questions: Question[], onRefresh: () => void, subjectId: Subject }) {
  const downloadSkillTxt = () => {
    const text = `# Role
你是一位專業的教育測驗命題專家，專門設計高品質、符合教學邏輯的測驗題目。

# Task
請根據提供的「科目」、「單元大綱」與「期望題數」，生成題庫。請嚴格按照以下 JSON 格式產出。

# Generation Rules (命題規則)
1. 題型 (type)：必須產出以下三種基本題型之一：
   - 選擇題 (multiple_choice)：提供 4 個選項。
   - 填空題 (fill_in_the_blank)：題目中需使用底線（___）。
   - 題組 (question_group)：包含一段主文本（prompt）與數個子問題（subQuestions）。
2. 多媒體題 (Multimedia)：多媒體題「不是」一個獨立的 type，它是選擇題或填空題搭配多媒體。如果使用者要求產出多媒體題，type 仍然必須是 multiple_choice 或 fill_in_the_blank，但請在該物件中額外提供 mediaUrl (例如填入相關假網址如 https://picsum.photos/400/300 或 YouTube 網址) 與 mediaType (填寫 image, youtube, 或 audio)。系統會根據是否有 mediaUrl 自動將其歸類為多媒體題。
3. 每個物件必須包含單元 (unit)、難易度 (difficulty)、詳解 (explanation)。

# JSON Output Format
[
  {
    "prompt": "題目內容（若為填空題請留 ___）",
    "correctAnswer": "正確答案",
    "options": ["選項A", "選項B", "選項C", "選項D"], // 若無則省略
    "unit": 1,
    "difficulty": "easy", // easy, medium, hard
    "type": "multiple_choice", // 必須是 multiple_choice, fill_in_the_blank, 或 question_group
    "explanation": "解題詳解",
    "mediaUrl": "https://picsum.photos/400/300", // 選填，若需生成多媒體題才提供
    "mediaType": "image", // image, youtube, audio (若有 mediaUrl 則必填)
    "subQuestions": [ // 僅在 type 為 question_group 時提供
      {
        "id": "sq1",
        "type": "multiple_choice",
        "prompt": "子問題1",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "子問題1詳解"
      }
    ]
  }
]`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skill.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newOptions, setNewOptions] = useState('');
  const [newUnit, setNewUnit] = useState<string | number>(1);
  const [newDiff, setNewDiff] = useState<'easy'|'medium'|'hard'>('medium');
  const [newType, setNewType] = useState<'multiple_choice'|'fill_in_the_blank'|'question_group'>('multiple_choice');
  const [newSubQuestions, setNewSubQuestions] = useState<SubQuestion[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image'|'youtube'|'audio'>('image');
  const [newExplanation, setNewExplanation] = useState('');

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editOptions, setEditOptions] = useState('');
  const [editUnit, setEditUnit] = useState<string | number>(1);
  const [editDiff, setEditDiff] = useState<'easy'|'medium'|'hard'>('medium');
  const [editType, setEditType] = useState<'multiple_choice'|'fill_in_the_blank'|'question_group'>('multiple_choice');  
  const [editSubQuestions, setEditSubQuestions] = useState<SubQuestion[]>([]);
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editMediaType, setEditMediaType] = useState<'image'|'youtube'|'audio'>('image');
  const [editExplanation, setEditExplanation] = useState('');

  const handleAdd = async () => {
    if (newType === 'question_group') {
      if (!newPrompt || newSubQuestions.length === 0) return toast('請填寫文章內容與至少一題子問題');
      for (const sq of newSubQuestions) {
        if (!sq.prompt || !sq.correctAnswer) return toast('子問題必須包含題目與答案');
        if (sq.type === 'multiple_choice' && (!sq.options || sq.options.length === 0)) return toast('選擇題子問題需有選項');
        if (sq.type === 'multiple_choice' && !sq.options?.includes(sq.correctAnswer)) return toast('選擇題子問題正確答案必須在選項中');
      }
    } else {
      if (!newPrompt || !newAnswer) return toast('請填寫題目與答案');
    }

    const options = newOptions.split(',').map(s => s.trim()).filter(s => s);
    if (newType === 'multiple_choice' && options.length === 0) return toast('選擇題需有選項');
    if (newType === 'multiple_choice' && !options.includes(newAnswer)) return toast('正確答案必須在選項中');

    try {
      const numUnit = Number(newUnit);
      const finalUnit = !isNaN(numUnit) && String(newUnit).trim() !== '' ? numUnit : (String(newUnit).trim() || 1);
      const data: any = {
        subject: subjectId,
        unit: finalUnit,
        difficulty: newDiff,
        type: newType,
        prompt: newPrompt.replace(/\[SOURCE_IMAGE\]/g, ''),
        correctAnswer: newType === 'question_group' ? '' : newAnswer,
        mediaUrl: newMediaUrl,
        mediaType: newMediaType,
        explanation: newExplanation
      };
      if (newType === 'multiple_choice') data.options = options;
      if (newType === 'question_group') data.subQuestions = newSubQuestions.map((sq: any) => ({...sq, prompt: sq.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}));
      await addDoc(collection(db, 'questions'), cleanFirestoreData(data));
      setShowAddForm(false);
      setNewPrompt(''); setNewAnswer(''); setNewOptions(''); setNewMediaUrl(''); setNewExplanation(''); setNewSubQuestions([]);
      onRefresh();
    } catch(e) { console.error(e); }
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setEditPrompt(q.prompt);
    setEditAnswer(q.correctAnswer);
    setEditOptions(q.options ? q.options.join(', ') : '');
    setEditUnit(q.unit);
    setEditDiff(q.difficulty);
    setEditType(q.type || 'multiple_choice');
    setEditMediaUrl(q.mediaUrl || '');
    setEditMediaType(q.mediaType || 'image');
    setEditExplanation(q.explanation || '');
    setEditSubQuestions(q.subQuestions || []);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    if (editType === 'question_group') {
      if (!editPrompt || editSubQuestions.length === 0) return toast('請填寫文章內容與至少一題子問題');
      for (const sq of editSubQuestions) {
        if (!sq.prompt || !sq.correctAnswer) return toast('子問題必須包含題目與答案');
        if (sq.type === 'multiple_choice' && (!sq.options || sq.options.length === 0)) return toast('選擇題子問題需有選項');
        if (sq.type === 'multiple_choice' && !sq.options?.includes(sq.correctAnswer)) return toast('選擇題子問題正確答案必須在選項中');
      }
    } else {
      if (!editPrompt || !editAnswer) return toast('請填寫題目與答案');
    }

    const options = editOptions.split(',').map(s => s.trim()).filter(s => s);
    if (editType === 'multiple_choice' && options.length === 0) return toast('選擇題需有選項');
    if (editType === 'multiple_choice' && !options.includes(editAnswer)) return toast('正確答案必須在選項中');

    try {
      const numEditUnit = Number(editUnit);
      const finalEditUnit = !isNaN(numEditUnit) && String(editUnit).trim() !== '' ? numEditUnit : (String(editUnit).trim() || 1);
      const data: any = {
        unit: finalEditUnit,
        difficulty: editDiff,
        type: editType,
        prompt: editPrompt.replace(/\[SOURCE_IMAGE\]/g, ''),
        correctAnswer: editType === 'question_group' ? '' : editAnswer,
        mediaUrl: editMediaUrl,
        mediaType: editMediaType,
        explanation: editExplanation
      };
      if (editType === 'multiple_choice') data.options = options;
      else data.options = null;
      
      if (editType === 'question_group') data.subQuestions = editSubQuestions.map((sq: any) => ({...sq, prompt: sq.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}));
      else data.subQuestions = null;
      
      await updateDoc(doc(db, 'questions', editingId), cleanFirestoreData(data));
      setEditingId(null);
      onRefresh();
    } catch(e) { console.error(e); }
  };

  const filteredQuestions = useMemo(() => {
    let qs = questions;
    if (filterType !== 'all') {
      if (filterType === 'multimedia') qs = qs.filter(q => !!q.mediaUrl);
      else qs = qs.filter(q => q.type === filterType);
    }
    return [...qs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [questions, filterType]);

  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) setSelectedQuestions([]);
    else setSelectedQuestions(filteredQuestions.map(q => q.id));
  };

  const toggleSelectQuestion = (id: string) => {
    if (selectedQuestions.includes(id)) setSelectedQuestions(selectedQuestions.filter(x => x !== id));
    else setSelectedQuestions([...selectedQuestions, id]);
  };

  const handleDelete = async (id: string) => {
    // confirm removed
    try {
      await deleteDoc(doc(db, 'questions', id));
      onRefresh();
    } catch(e) { console.error(e); }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    // confirm removed
    try {
      for (const id of selectedQuestions) {
        await deleteDoc(doc(db, 'questions', id));
      }
      setSelectedQuestions([]);
      onRefresh();
    } catch(e) { console.error(e); }
  };

  const handleExportAll = () => {
    exportQuestionsToJSON(questions, subjectId);
  };

  const handleExportSelected = () => {
    const selectedList = questions.filter(q => selectedQuestions.includes(q.id));
    if (selectedList.length === 0) return toast('請先勾選欲匯出的題目');
    exportQuestionsToJSON(selectedList, subjectId, `選中${selectedList.length}題`);
  };

  const handleExportFiltered = () => {
    if (filteredQuestions.length === 0) return toast('目前篩選沒有任何題目');
    const filterLabel = filterType === 'multiple_choice' ? '選擇題' : filterType === 'fill_in_the_blank' ? '填空題' : filterType === 'question_group' ? '題組' : filterType === 'multimedia' ? '多媒體' : '篩選';
    exportQuestionsToJSON(filteredQuestions, subjectId, filterLabel);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-y-3">
        <h3 className="font-serif text-xl font-bold text-[#4A3F35]">題庫管理 (共 {questions.length} 題)</h3>
        <div className="space-x-2 flex items-center flex-wrap gap-y-2">
          <button onClick={downloadSkillTxt} className="bg-[#EAE2D3] hover:bg-[#D5CFC4] text-[#4A3F35] px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
            下載題庫生成 skill.txt
          </button>
          <button 
            onClick={handleExportAll} 
            className="bg-[#5C7D64] hover:bg-[#4D6953] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
            title={`匯出題庫 JSON (全部共 ${questions.length} 題)`}
          >
            <Download size={15} /> 匯出題庫 JSON
          </button>
          {selectedQuestions.length > 0 && (
            <button 
              onClick={handleExportSelected} 
              className="bg-[#3D6B8C] hover:bg-[#305570] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
              title="匯出勾選的題目"
            >
              <Download size={15} /> 匯出選中 ({selectedQuestions.length})
            </button>
          )}
          {filterType !== 'all' && filteredQuestions.length !== questions.length && (
            <button 
              onClick={handleExportFiltered} 
              className="bg-[#8B7355] hover:bg-[#725E45] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
              title="匯出符合目前題型篩選的題目"
            >
              <Download size={15} /> 匯出當前篩選 ({filteredQuestions.length})
            </button>
          )}
          {selectedQuestions.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-[#B65D48] hover:bg-[#8B4534] text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              刪除選中 ({selectedQuestions.length})
            </button>
          )}
          <button onClick={() => setShowAddForm(true)} className="bg-[#C2A878] hover:bg-[#B39969] text-[#4A3F35] font-bold px-4 py-1.5 rounded-lg text-sm">
            新增題目
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 mb-4 shadow-sm text-sm">
          <h4 className="font-bold text-[#4A3F35] mb-3 border-b border-[#EAE6DF] pb-2">新增題目</h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><label className="text-xs text-[#8C7A6B]">單元 (英文字母、數字或文字)</label><input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="例如: A, B, 1, 第一單元" className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" /></div>
            <div><label className="text-xs text-[#8C7A6B]">難度</label><select value={newDiff} onChange={e => setNewDiff(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]"><option value="easy">簡單</option><option value="medium">中等</option><option value="hard">困難</option></select></div>
            <div><label className="text-xs text-[#8C7A6B]">題型</label><select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]"><option value="multiple_choice">選擇題</option><option value="fill_in_the_blank">填空題</option><option value="question_group">閱讀題組</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-[#8C7A6B]">多媒體 URL (選填)</label><input value={newMediaUrl} onChange={e => setNewMediaUrl(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" placeholder="圖片或YouTube網址" /></div>
            <div><label className="text-xs text-[#8C7A6B]">多媒體類型</label><select value={newMediaType} onChange={e => setNewMediaType(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]"><option value="image">圖片</option><option value="youtube">YouTube</option><option value="audio">音訊</option></select></div>
          </div>
          <div><label className="text-xs text-[#8C7A6B]">{newType === 'question_group' ? '閱讀文章內容' : '題目內容'}</label>{newType === 'question_group' ? <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35] mb-3" placeholder="輸入文章..." rows={4} /> : <input value={newPrompt} onChange={e => setNewPrompt(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35] mb-3" placeholder="輸入題目..." />}</div>
          {newType !== 'question_group' && (
            <>
              <div><label className="text-xs text-[#8C7A6B]">正確答案</label><input value={newAnswer} onChange={e => setNewAnswer(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35] mb-3" placeholder="輸入正確答案..." /></div>
              {newType === 'multiple_choice' && (
                <div><label className="text-xs text-[#8C7A6B]">選項 (逗號分隔)</label><input value={newOptions} onChange={e => setNewOptions(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35] mb-3" placeholder="A, B, C, D" /></div>
              )}
            </>
          )}
          {newType === 'question_group' && <SubQuestionEditor subQuestions={newSubQuestions} setSubQuestions={setNewSubQuestions} />}
          <div className="mt-3"><label className="text-xs text-[#8C7A6B]">詳解 (選填)</label><textarea value={newExplanation} onChange={e => setNewExplanation(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35] mb-3" placeholder="輸入詳解..." rows={2} /></div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-[#EAE6DF]">
            <button onClick={() => setShowAddForm(false)} className="text-[#8C7A6B] hover:text-[#4A3F35] px-3 py-1 font-bold">取消</button>
            <button onClick={handleAdd} className="bg-[#4A3F35] hover:bg-[#5A4F45] text-white font-bold px-4 py-2 rounded-lg">確認新增</button>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${filterType === 'all' ? 'bg-[#4A3F35] text-white' : 'bg-[#EAE2D3] text-[#8C7A6B] hover:bg-[#D5CFC4]'}`}>全部</button>
        <button onClick={() => setFilterType('multiple_choice')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${filterType === 'multiple_choice' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}>選擇題</button>
        <button onClick={() => setFilterType('fill_in_the_blank')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${filterType === 'fill_in_the_blank' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}>填空題</button>
        <button onClick={() => setFilterType('question_group')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${filterType === 'question_group' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>題組</button>
        <button onClick={() => setFilterType('multimedia')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${filterType === 'multimedia' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-800 hover:bg-orange-100'}`}>多媒體</button>
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h4 className="font-serif font-bold text-xl text-[#4A3F35] mb-4">編輯題目</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><label className="text-xs text-[#8C7A6B]">單元 (英文字母、數字或文字)</label><input type="text" value={editUnit} onChange={e => setEditUnit(e.target.value)} placeholder="例如: A, B, 1, 第一單元" className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" /></div>
              <div><label className="text-xs text-[#8C7A6B]">難度</label><select value={editDiff} onChange={e => setEditDiff(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]"><option value="easy">簡單</option><option value="medium">中等</option><option value="hard">困難</option></select></div>
              <div><label className="text-xs text-[#8C7A6B]">題型</label><select value={editType} onChange={e => setEditType(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]"><option value="multiple_choice">選擇題</option><option value="fill_in_the_blank">填空題</option><option value="question_group">閱讀題組</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs text-[#8C7A6B]">多媒體 URL</label><input value={editMediaUrl} onChange={e => setEditMediaUrl(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" /></div>
              <div><label className="text-xs text-[#8C7A6B]">多媒體類型</label><select value={editMediaType} onChange={e => setEditMediaType(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]"><option value="image">圖片</option><option value="youtube">YouTube</option><option value="audio">音訊</option></select></div>
            </div>
            <div className="mb-3"><label className="text-xs text-[#8C7A6B]">{editType === 'question_group' ? '閱讀文章內容' : '題目內容'}</label>{editType === 'question_group' ? <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" rows={4} /> : <input value={editPrompt} onChange={e => setEditPrompt(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" />}</div>
            {editType !== 'question_group' && (
              <>
                <div className="mb-3"><label className="text-xs text-[#8C7A6B]">正確答案</label><input value={editAnswer} onChange={e => setEditAnswer(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" /></div>
                {editType === 'multiple_choice' && (
                  <div className="mb-3"><label className="text-xs text-[#8C7A6B]">選項</label><input value={editOptions} onChange={e => setEditOptions(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" /></div>
                )}
              </>
            )}
            {editType === 'question_group' && <SubQuestionEditor subQuestions={editSubQuestions} setSubQuestions={setEditSubQuestions} />}
            <div className="mb-3 mt-3"><label className="text-xs text-[#8C7A6B]">詳解</label><textarea value={editExplanation} onChange={e => setEditExplanation(e.target.value)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded px-3 py-2 text-[#4A3F35]" rows={2} /></div>
            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-[#EAE6DF]">
              <button onClick={() => setEditingId(null)} className="text-[#8C7A6B] hover:text-[#4A3F35] px-4 py-2 font-bold">取消</button>
              <button onClick={handleSaveEdit} className="bg-[#4A3F35] hover:bg-[#5A4F45] text-white font-bold px-6 py-2 rounded-lg">儲存</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
        {filteredQuestions.length > 0 && (
          <div className="flex items-center px-4 py-2 bg-[#FDFBF7] rounded-lg border border-[#D5CFC4] mb-2 sticky top-0 z-10">
            <input type="checkbox" checked={selectedQuestions.length > 0 && selectedQuestions.length === filteredQuestions.length} onChange={toggleSelectAll} className="w-4 h-4 mr-3" />
            <span className="text-sm text-[#8C7A6B] font-bold">全選目前顯示 ({filteredQuestions.length})</span>
          </div>
        )}
        {filteredQuestions.map((q, i) => (
          <div key={q.id} className="bg-white border border-[#EAE6DF] rounded-xl p-4 flex items-start group shadow-sm hover:border-[#C2A878] transition-colors">
            <input 
              type="checkbox" 
              checked={selectedQuestions.includes(q.id)} 
              onChange={() => toggleSelectQuestion(q.id)} 
              className="mt-1 w-4 h-4 mr-4" 
            />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex space-x-2 mb-1 flex-wrap gap-y-1">
                  <span className="bg-[#EAE2D3] text-[#8C7A6B] px-2 py-0.5 rounded text-xs font-bold">{formatUnitBadge(q.unit)}</span>
                  <span className="bg-[#FDFBF7] border border-[#D5CFC4] text-[#8C7A6B] px-2 py-0.5 rounded text-xs">{q.difficulty === 'easy' ? '簡單' : q.difficulty === 'medium' ? '中等' : '困難'}</span>
                  {q.type === 'multiple_choice' && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">選擇</span>}
                  {q.type === 'fill_in_the_blank' && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">填空</span>}
                  {q.type === 'question_group' && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">題組</span>}
                  {q.mediaUrl && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-bold">多媒體</span>}
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(q)} className="text-sm text-[#8C7A6B] hover:text-[#4A3F35] font-bold">編輯</button>
                  <button onClick={() => handleDelete(q.id)} className="text-sm text-[#B65D48] hover:text-[#8B4534] font-bold">刪除</button>
                </div>
              </div>
              <p className="text-[#4A3F35] font-medium text-lg leading-relaxed">{(q.prompt || '').replace(/\[SOURCE_IMAGE\]/g, '')}</p>
              {q.mediaUrl && (
                  <p className="text-xs text-[#8C7A6B] mt-1 break-all">🔗 {q.mediaUrl}</p>
              )}
              {q.type === 'question_group' && q.subQuestions && q.subQuestions.length > 0 ? (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-[#D5CFC4]">
                  {q.subQuestions.map((sq, idx) => (
                    <div key={sq.id} className="text-sm">
                      <p className="font-bold text-[#4A3F35] mb-1">{idx + 1}. {sq.prompt}</p>
                      {sq.options && sq.options.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 text-[#6A5F55]">
                          {sq.options.map((opt, oIdx) => (
                            <span key={oIdx} className={opt === sq.correctAnswer ? 'font-bold text-[#8F9A8A]' : ''}>
                              {String.fromCharCode(65 + oIdx)}. {opt} {opt === sq.correctAnswer && '✓'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div><span className="text-[#8C7A6B]">正確答案:</span> <span className="font-bold text-[#8F9A8A]">{sq.correctAnswer}</span></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {q.options && q.options.length > 0 && (
                    <div className="mt-2 text-sm text-[#6A5F55] grid grid-cols-2 gap-1 bg-[#FDFBF7] p-2 rounded border border-[#EAE6DF]">
                      {q.options.map((opt, idx) => (
                        <span key={idx} className={opt === q.correctAnswer ? 'font-bold text-[#8F9A8A]' : ''}>
                          {String.fromCharCode(65 + idx)}. {opt} {opt === q.correctAnswer && '✓'}
                        </span>
                      ))}
                    </div>
                  )}
                  {!q.options && (
                    <div className="mt-2 text-sm">
                      <span className="text-[#8C7A6B]">正確答案:</span> <span className="font-bold text-[#8F9A8A]">{q.correctAnswer}</span>
                    </div>
                  )}
                </>
              )}
              {q.explanation && (
                <div className="mt-2 text-sm bg-[#F5F5F0] p-2 rounded text-[#6A5F55] italic">
                  💡 詳解: {q.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
        {questions.length === 0 && <p className="text-[#A69B8F] text-center py-10">尚無題目，請點擊右上角新增</p>}
      </div>
    </div>
  );
}
export function AIGeneratorTab({ subjectId, onRefresh }: { subjectId: Subject, onRefresh: () => void }) {
  const [text, setText] = useState('');
  const [count, setCount] = useState(5);
  const [type, setType] = useState<'multiple_choice'|'fill_in_the_blank'|'mixed'>('multiple_choice');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Partial<Question>[]>([]);

  const handleGenerate = async () => {
    if (!text) return toast('請輸入課文');
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, count, type })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data.questions);
    } catch(e: any) {
      toast('產生失敗: ' + e.message);
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    for (const q of generated) {
      await addDoc(collection(db, 'questions'), cleanFirestoreData({
        ...q,
        prompt: q.prompt ? q.prompt.replace(/\[SOURCE_IMAGE\]/g, '') : '',
        subject: subjectId,
        unit: q.unit || 1,
        difficulty: q.difficulty || 'medium',
        type: q.type || (type === 'mixed' ? 'multiple_choice' : type),
        createdAt: Date.now()
      }));
    }
    toast('已儲存至題庫');
    setGenerated([]);
    onRefresh();
  };

  return (
    <div className="bg-white border border-[#EAE6DF] rounded-3xl p-6 space-y-4">
      <h3 className="font-serif font-bold text-[#5A4F45]">AI 輔助出題</h3>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="貼上課文或重點筆記..." className="w-full h-32 bg-[#FDFBF7] border border-[#EAE6DF] rounded-xl p-4 text-[#4A3F35] focus:ring-[#C2A878] focus:border-[#C2A878]" />
      <div className="flex space-x-4">
        <select value={type} onChange={e => setType(e.target.value as any)} className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35]">
          <option value="multiple_choice">選擇題</option>
          <option value="fill_in_the_blank">填空題</option>
          <option value="mixed">混合題型</option>
        </select>
        <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value)||5)} min="1" max="20" className="bg-[#FDFBF7] border border-[#EAE6DF] rounded-lg px-4 py-2 text-[#4A3F35] w-24" />
        <button disabled={generating} onClick={handleGenerate} className="bg-[#C2A878] hover:bg-[#B39969] text-[#4A3F35] px-6 py-2 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50">
          {generating ? '生成中...' : '開始生成'}
        </button>
      </div>
      
      {generated.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-[#5A4F45]">生成結果 ({generated.length} 題)</h4>
          {generated.map((q, i) => (
            <div key={i} className="p-4 bg-[#F5F5F0] rounded-xl border border-[#D5CFC4]">
              <p className="font-medium text-[#4A3F35] mb-2">{i+1}. {q.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</p>
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {q.options.map((opt, j) => <div key={j} className="text-sm text-[#6A5F55]">{String.fromCharCode(65+j)}. {opt}</div>)}
                </div>
              )}
              <p className="text-sm text-[#72816B] font-medium">解答: {q.correctAnswer}</p>
              {q.clue && <p className="text-xs text-[#8C7A6B] mt-1">詳解: {q.clue}</p>}
            </div>
          ))}
          <button onClick={handleSave} className="bg-[#82917B] hover:bg-[#72816B] text-white px-6 py-2 rounded-lg font-medium shadow-sm w-full">儲存至題庫</button>
        </div>
      )}
    </div>
  );
}

export function ImportTab({ subjectId, config, questions = [] }: { subjectId: Subject, config: SubjectConfig, questions?: Question[] }) {
  const [isImporting, setIsImporting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [previewData, setPreviewData] = useState<Partial<Question>[]>([]);

  const parseRobustJSON = (text: string) => {
    let data = null;
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/^```(json)?\\n?/, '').replace(/\\n?```$/, '').trim();

    // 先以正規表達式提取 JSON 陣列或物件區塊
    const regexMatch = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (regexMatch) {
      try {
        data = JSON.parse(regexMatch[0]);
      } catch (e) {
        // 容錯解析
      }
    }

    try {
      if (!data) data = JSON.parse(cleanedText);
    } catch (e) {
      const startIndexArray = cleanedText.indexOf('[');
      if (startIndexArray !== -1) {
        let endIndex = cleanedText.lastIndexOf(']');
        while (endIndex > startIndexArray) {
          const candidate = cleanedText.substring(startIndexArray, endIndex + 1);
          try {
            data = JSON.parse(candidate);
            break;
          } catch (err) {
            endIndex = cleanedText.lastIndexOf(']', endIndex - 1);
          }
        }
      }
      
      if (!data) {
        const startIndexObj = cleanedText.indexOf('{');
        if (startIndexObj !== -1) {
          let endIndex = cleanedText.lastIndexOf('}');
          while (endIndex > startIndexObj) {
            const candidate = cleanedText.substring(startIndexObj, endIndex + 1);
            try {
              data = JSON.parse(candidate);
              break;
            } catch (err) {
              endIndex = cleanedText.lastIndexOf('}', endIndex - 1);
            }
          }
        }
      }
      
      if (!data) {
        throw new Error('無法解析為有效的 JSON 格式。請確認內容是否正確。');
      }
    }

    if (!Array.isArray(data)) {
        if (typeof data === 'object' && data !== null) {
            data = [data];
        } else {
            throw new Error('JSON 格式錯誤，必須是陣列或單一物件。');
        }
    }
    return data;
  };

  const processData = async (data: any[]) => {
    let count = 0;
    for (const item of data) {
      const prompt = item.prompt || item['題目'] || item.Question || item['句子填空'] || item['單字（中文）'];
      const correctAnswer = item.correctAnswer || item['答案'] || item.Answer || item['單字（英文）'];
      if (!prompt || !correctAnswer) continue;

      let options = item.options || item['選項'] || item.Options || null;
      if (typeof options === 'string') {
        options = options.split(',').map((s: string) => s.trim());
      }

      let itemUnit = item.unit ?? item['單元'] ?? item.Unit ?? 1;
      const numUnit = Number(itemUnit);
      const finalUnit = !isNaN(numUnit) && String(itemUnit).trim() !== '' ? numUnit : (String(itemUnit).trim() || 1);
      let itemDiff = item.difficulty || item['難度'] || item.Difficulty || 'medium';
      let itemType = item.type || item['題型'] || item.Type;
      
      if (!itemType) {
        itemType = options && options.length > 0 ? 'multiple_choice' : 'fill_in_the_blank';
      }

      if (itemDiff === '簡單') itemDiff = 'easy';
      if (itemDiff === '中等') itemDiff = 'medium';
      if (itemDiff === '困難') itemDiff = 'hard';

      if (itemType === '選擇題') itemType = 'multiple_choice';
      if (itemType === '填空題') itemType = 'fill_in_the_blank';
      if (itemType === '多媒體題' || itemType === 'multimedia') {
        itemType = options && options.length > 0 ? 'multiple_choice' : 'fill_in_the_blank';
        if (!item.mediaUrl && !item['多媒體連結']) {
            item.mediaUrl = 'https://picsum.photos/400/300';
            item.mediaType = 'image';
        }
      }

      let clue = item.clue || item['提示'] || item.Hint || null;
      if (!clue) {
        const customClues = [];
        if (item['單字（中文）'] && prompt !== item['單字（中文）']) customClues.push(item['單字（中文）']);
        if (item['句子中文']) customClues.push(item['句子中文']);
        if (customClues.length > 0) clue = customClues.join(' / ');
      }

      let mediaUrl = item.mediaUrl || item['多媒體連結'] || null;
      let mediaType = item.mediaType || item['多媒體類型'] || (mediaUrl ? 'image' : null);
      let explanation = item.explanation || item['詳解'] || null;
      let subQuestions = item.subQuestions || item['子問題'] || null;

      const questionPayload = cleanFirestoreData({
        subject: subjectId,
        unit: finalUnit,
        difficulty: itemDiff,
        type: itemType,
        prompt: String(prompt).replace(/\[SOURCE_IMAGE\]/g, ''),
        options: options ?? null,
        correctAnswer: String(correctAnswer),
        clue: clue ?? null,
        mediaUrl: mediaUrl ?? null,
        mediaType: mediaType ?? null,
        explanation: explanation ?? null,
        subQuestions: subQuestions ?? null,
        createdAt: Date.now()
      });

      await addDoc(collection(db, 'questions'), questionPayload);
      count++;
    }
    return count;
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return;
    setIsImporting(true);
    try {
      for (const item of previewData) {
        const previewPayload = cleanFirestoreData({
          ...item,
          prompt: item.prompt ? item.prompt.replace(/\[SOURCE_IMAGE\]/g, '') : '',
          subject: subjectId,
          createdAt: Date.now()
        });
        await addDoc(collection(db, 'questions'), previewPayload);
      }
      toast(`成功匯入 ${previewData.length} 題！`);
      setPreviewData([]);
    } catch(e) {
      console.error(e);
      toast('匯入失敗');
    }
    setIsImporting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let count = 0;
      if (extension === 'json') {
        const text = await file.text();
        const data = parseRobustJSON(text);
        count = await processData(data);
      } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        count = await processData(data);
      } else {
        throw new Error('不支援的檔案格式，請上傳 JSON 或 Excel (xlsx/xls)。');
      }
      toast(`成功匯入 ${count} 題！`);
    } catch (err: any) {
      toast('匯入失敗: ' + err.message);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  
  const handleJsonDelete = async () => {
    if (!textInput.trim()) return;
    setIsImporting(true);
    try {
      const data = parseRobustJSON(textInput);
      if (!Array.isArray(data)) throw new Error('內容必須是 JSON 陣列');
      
      const cleanPrompt = (p: string) => (p || '').replace(/\[SOURCE_IMAGE\]/g, '').trim();
      const promptsToDelete = data.map((item: any) => cleanPrompt(item.prompt)).filter(Boolean);
      if (promptsToDelete.length === 0) throw new Error('找不到要刪除的題目內容');

      const qSnapshot = await getDocs(query(collection(db, 'questions'), where('subject', '==', subjectId)));
      const questionsToDelete: string[] = [];
      qSnapshot.forEach(doc => {
        const dbPrompt = cleanPrompt(doc.data().prompt);
        if (promptsToDelete.includes(dbPrompt)) {
          questionsToDelete.push(doc.id);
        }
      });

      if (questionsToDelete.length === 0) {
        toast('找不到吻合的題目');
        setIsImporting(false);
        return;
      }

      if (!(await confirmModal(`找到 ${questionsToDelete.length} 題吻合的題目，確定要刪除嗎？`))) {
        setIsImporting(false);
        return;
      }

      for (const id of questionsToDelete) {
        await deleteDoc(doc(db, 'questions', id));
      }
      
      toast(`成功刪除 ${questionsToDelete.length} 題！`);
      setTextInput('');
    } catch (err: any) {
      toast('刪除失敗: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleTextImport = async () => {
    if (!textInput.trim()) return;
    setIsImporting(true);
    try {
      const data = parseRobustJSON(textInput);
      const count = await processData(data);
      toast(`成功匯入 ${count} 題！`);
      setTextInput('');
    } catch (err: any) {
      toast('文字匯入失敗: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h3 className="font-serif text-xl font-bold text-[#4A3F35]">匯入題庫 (支援 JSON 與 Excel)</h3>
        {questions && questions.length > 0 && (
          <button
            onClick={() => exportQuestionsToJSON(questions, subjectId)}
            className="bg-[#5C7D64] hover:bg-[#4D6953] text-white px-3.5 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
            title={`匯出備份當前全部題庫 (${questions.length} 題)`}
          >
            <Download size={15} /> 匯出當前題庫備份 JSON ({questions.length})
          </button>
        )}
      </div>
      
      <div className="border-2 border-dashed border-[#D5CFC4] hover:border-purple-500 rounded-xl p-8 text-center transition-colors">
        <input type="file" accept=".json, .xlsx, .xls" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={isImporting} />
        <label htmlFor="file-upload" className={`cursor-pointer block ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="text-4xl mb-4">📥</div>
          <p className="text-[#4A3F35] font-bold mb-1">{isImporting ? '檔案處理中，請稍候...' : '點擊選擇檔案上傳'}</p>
          <p className="text-[#8C7A6B] text-sm">支援 .xlsx, .xls, .json 格式</p>
        </label>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-[#8C7A6B]">或直接貼上 JSON 陣列：</p>
          {questions && questions.length > 0 && (
            <button
              onClick={() => {
                const sample = questions.slice(0, 2).map(q => {
                  const item: Record<string, any> = {
                    prompt: q.prompt,
                    correctAnswer: q.correctAnswer,
                    unit: q.unit,
                    difficulty: q.difficulty,
                    type: q.type
                  };
                  if (q.options) item.options = q.options;
                  if (q.explanation) item.explanation = q.explanation;
                  return item;
                });
                setTextInput(JSON.stringify(sample, null, 2));
              }}
              className="text-xs text-[#8C7A6B] hover:text-[#4A3F35] underline font-medium"
            >
              填入題庫範例格式
            </button>
          )}
        </div>
        <textarea 
          value={textInput} 
          onChange={e => setTextInput(e.target.value)} 
          disabled={isImporting}
          className="w-full h-32 bg-[#FDFBF7] border border-[#D5CFC4] rounded-xl p-4 text-[#4A3F35] font-mono text-sm mb-2 focus:border-purple-500 focus:outline-none" 
          placeholder="[ { &quot;prompt&quot;: &quot;題目&quot;, &quot;correctAnswer&quot;: &quot;答案&quot;, &quot;options&quot;: [&quot;A&quot;, &quot;B&quot;] } ]"
        ></textarea>
<div className="flex space-x-2">
          <button 
            onClick={handleTextImport} 
            disabled={isImporting || !textInput.trim()}
            className="bg-[#9BA8B5] hover:bg-[#8B98A5] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg text-[#4A3F35] font-bold transition-colors"
          >
            貼上文字匯入
          </button>
          <button 
            onClick={handleJsonDelete} 
            disabled={isImporting || !textInput.trim()}
            className="bg-[#BC7665] hover:bg-[#AC6655] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg text-white font-bold transition-colors"
          >
            刪除吻合的題目
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl mt-4 text-sm text-[#8C7A6B]">
        <p className="font-bold text-[#6A5F55] mb-2">Excel 欄位說明 (標題行)：</p>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li><span className="text-[#B39969]">題目 (必填)</span>: 也可以寫 prompt 或 Question</li>
          <li><span className="text-[#B39969]">答案 (必填)</span>: 也可以寫 correctAnswer 或 Answer</li>
          <li>選項: 選擇題的選項，請用半形逗號 <code className="bg-[#EAE6DF] px-1 rounded">,</code> 分隔</li>
          <li>提示: 也可以寫 clue</li>
          <li>其他可選欄位: 單元、難度 (簡單/中等/困難)、題型 (選擇題/填空題)</li>
        </ul>
        <p className="font-bold text-[#6A5F55] mb-2 mt-4">也支援特定英文單字表格式：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>包含 <span className="text-blue-300">單字（英文）</span>、<span className="text-blue-300">單字（中文）</span>、<span className="text-blue-300">句子填空</span>、<span className="text-blue-300">句子中文</span> 欄位可直接匯入！</li>
          <li>系統會自動判定為「填空題」，並將中文與句子翻譯作為提示。</li>
        </ul>
      </div>
    </div>
  );
}

export function AttemptsTab({ attempts, questions, tasks, onRefresh }: { attempts: Attempt[], questions: Question[], tasks: Task[], onRefresh: () => void }) {
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedAttempts, setSelectedAttempts] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  const toggleSelectAttempt = (id: string) => {
    setSelectedAttempts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllAttempts = () => {
    if (selectedAttempts.length === searchedAttempts.length) {
      setSelectedAttempts([]);
    } else {
      setSelectedAttempts(searchedAttempts.map(a => a.id));
    }
  };

  const handleDeleteAttempts = async (ids: string[]) => {
    if (ids.length === 0) return;
    // confirm removed
    setDeleting(true);
    try {
      for (const id of ids) {
        await deleteDoc(doc(db, 'attempts', id));
      }
      setSelectedAttempts([]);
      onRefresh();
    } catch(e) {
      console.error(e);
      toast('刪除失敗');
    } finally {
      setDeleting(false);
    }
  };

  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const filteredAttempts = selectedTask === 'all' 
    ? attempts 
    : selectedTask === 'pet' 
      ? attempts.filter(a => a.subject === 'pet') 
      : attempts.filter(a => a.taskId === selectedTask);
  const userFilteredAttempts = selectedUserFilter === 'all' ? filteredAttempts : filteredAttempts.filter(a => a.userId === selectedUserFilter);
  const searchedAttempts = userFilteredAttempts.filter(a => 
    (a.userDisplayName || '').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  const uniqueUsers = Array.from(new Set(filteredAttempts.map(a => a.userId))).map(id => {
    return { id, name: filteredAttempts.find(a => a.userId === id)?.userDisplayName || '未知' };
  });

  // Group by student
  const studentStats = userFilteredAttempts.reduce((acc, att) => {
    const uid = att.userId || 'unknown';
    if (!acc[uid]) {
      acc[uid] = { 
        name: att.userDisplayName || '匿名', 
        attemptsCount: 0, 
        bestScore: 0,
        totalScore: 0,
        averageAccuracy: 0,
        totalAccuracy: 0
      };
    }
    const s = att.score || 0;
    const accRate = att.accuracy || 0;
    acc[uid].attemptsCount += 1;
    acc[uid].bestScore = Math.max(acc[uid].bestScore, s);
    acc[uid].totalScore += s;
    acc[uid].totalAccuracy += accRate;
    acc[uid].averageAccuracy = Math.round(acc[uid].totalAccuracy / acc[uid].attemptsCount);
    return acc;
  }, {} as Record<string, any>);

  const studentList = Object.values(studentStats).sort((a, b) => b.bestScore - a.bestScore);
  const activePlayers = Object.keys(studentStats).length;
  const avgScore = userFilteredAttempts.length > 0 ? Math.round(userFilteredAttempts.reduce((s, a) => s + (a.score || 0), 0) / userFilteredAttempts.length) : 0;
  const highScore = userFilteredAttempts.length > 0 ? Math.max(0, ...userFilteredAttempts.map(a => a.score || 0)) : 0;

  // Find all difficult questions
  const wrongCountMap = userFilteredAttempts.reduce((acc, att) => {
    (att.wrongQuestionIds || []).forEach(id => {
      acc[id] = (acc[id] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const wrongQuestionsList = Object.entries(wrongCountMap)
    .map(([qId, count]) => {
      const q = questions.find(x => x.id === qId);
      return { id: qId, count, prompt: q?.prompt || '未知題目', answer: q?.correctAnswer || '' };
    })
    .sort((a, b) => b.count - a.count);

  const chartData = [...userFilteredAttempts].sort((a, b) => a.timestamp - b.timestamp).map(a => {
    const d = new Date(a.timestamp);
    return {
      name: `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      score: a.score,
      accuracy: a.accuracy
    };
  });

  const exportWrongWords = (format: 'pdf' | 'docx') => {
    if (wrongQuestionsList.length === 0) return toast('沒有錯題紀錄');
    let html = `<div style="text-align:center; margin-bottom:20px;"><h2 style="color:#4b5563; font-size:24px;">錯題頻率彙整表</h2><p style="color:#6b7280; font-size:14px;">產出時間：${new Date().toLocaleString('zh-TW')} | 共計：${wrongQuestionsList.length} 題</p></div>`;
    
    html += `<table style="width:100%; border-collapse:collapse; font-size:13px; table-layout:fixed;">
      <thead>
        <tr style="background-color:#fee2e2; color:#991b1b; text-align:center;">
          <th style="padding:8px; border:1px solid #fca5a5; width:15%;">錯誤次數</th>
          <th style="padding:8px; border:1px solid #fca5a5; width:45%;">題目</th>
          <th style="padding:8px; border:1px solid #fca5a5; width:40%;">正確答案</th>
        </tr>
      </thead>
      <tbody>`;

    for (const item of wrongQuestionsList) {
      html += `<tr>
        <td style="padding:8px; border:1px solid #fca5a5; text-align:center; font-weight:bold; color:#dc2626;">${item.count} 次</td>
        <td style="padding:8px; border:1px solid #fca5a5; color:#000000;">${item.prompt}</td>
        <td style="padding:8px; border:1px solid #fca5a5; color:#4b5563;">${item.answer}</td>
      </tr>`;
    }
    html += `</tbody></table>`;

    if (format === 'docx') {
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent("<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>錯題表</title><style>body{font-family:'Microsoft JhengHei',sans-serif;}</style></head><body>" + html + "</body></html>");
      const link = document.createElement("a"); link.href = source; link.download = `錯題表_${Date.now()}.doc`; link.click();
    } else {
      const opt: any = { margin: 10, filename: `錯題表_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
      const element = document.createElement('div');
      element.innerHTML = `<div style="font-family:'Microsoft JhengHei',sans-serif; padding:10px; color:#000000;">${html}</div>`;
      html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-serif text-xl font-bold text-[#4A3F35]">測驗數據分析</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <select 
              value={selectedTask} 
              onChange={e => setSelectedTask(e.target.value)}
              className="bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35] min-w-[200px]"
            >
              <option value="all">全部任務</option>
              <option value="pet">PET 週考測驗</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <select 
              value={selectedUserFilter} 
              onChange={e => setSelectedUserFilter(e.target.value)}
              className="bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35] min-w-[150px]"
            >
              <option value="all">全部使用者</option>
              {uniqueUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/60 border border-[#D5CFC4] rounded-2xl p-5">
          <span className="text-xs text-[#8C7A6B]">總測驗場次</span>
          <p className="text-3xl font-bold mt-2 text-[#4A3F35]">{filteredAttempts.length}</p>
        </div>
        <div className="bg-white/60 border border-[#D5CFC4] rounded-2xl p-5">
          <span className="text-xs text-[#8C7A6B]">歷史最高記錄</span>
          <p className="text-3xl font-bold mt-2 text-[#4A3F35]">{highScore}</p>
        </div>
        <div className="bg-white/60 border border-[#D5CFC4] rounded-2xl p-5">
          <span className="text-xs text-[#8C7A6B]">平均分</span>
          <p className="text-3xl font-bold mt-2 text-[#4A3F35]">{avgScore}</p>
        </div>
        <div className="bg-white/60 border border-[#D5CFC4] rounded-2xl p-5">
          <span className="text-xs text-[#8C7A6B]">活躍考生人數</span>
          <p className="text-3xl font-bold mt-2 text-[#4A3F35]">{activePlayers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 border border-[#D5CFC4] rounded-3xl p-6">
          <h3 className="font-serif font-bold text-[#5A4F45] mb-4">測驗成績變化趨勢圖</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickMargin={10} />
                <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} name="分數" />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="答對率 (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/60 border border-[#D5CFC4] rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-[#5A4F45] flex items-center"><CheckCircle size={18} className="mr-2 text-[#BC7665]" /> 常錯題排行</h3>
            <div className="flex space-x-2">
              <button onClick={() => exportWrongWords('pdf')} className="bg-red-500/10 hover:bg-[#AC6655]/30 text-[#BC7665] border border-[#BC7665]/30 px-2 py-1 rounded text-xs font-bold transition-all" title="匯出成 PDF">PDF</button>
              <button onClick={() => exportWrongWords('docx')} className="bg-[#9BA8B5]/10 hover:bg-[#8B98A5]/30 text-[#7A8A99] border border-[#9BA8B5]/30 px-2 py-1 rounded text-xs font-bold transition-all" title="匯出成 DOCX">DOCX</button>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto pr-2 max-h-[250px] flex-grow">
            {wrongQuestionsList.map((wq, idx) => (
              <div key={idx} className="bg-[#FDFBF7]/40 border border-[#D5CFC4] p-3 rounded-xl flex justify-between items-center">
                <div className="flex-1 mr-3">
                  <p className="text-[#4A3F35] text-sm line-clamp-2">{wq.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</p>
                  <p className="text-[#8C7A6B] text-xs mt-1">答: {wq.answer}</p>
                </div>
                <span className="bg-[#BC7665]/20 text-[#BC7665] text-xs px-2 py-1 rounded whitespace-nowrap">錯 {wq.count} 次</span>
              </div>
            ))}
            {wrongQuestionsList.length === 0 && <p className="text-[#A69B8F] text-center py-4">目前沒有錯題紀錄</p>}
          </div>
        </div>
      </div>

      <div className="bg-white/60 border border-[#D5CFC4] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 items-center">
          <div className="flex items-center space-x-4">
             <h3 className="font-serif font-bold text-[#5A4F45]">實時答題歷史明細</h3>
             {selectedAttempts.length > 0 && (
                <button disabled={deleting} onClick={() => handleDeleteAttempts(selectedAttempts)} className="bg-[#BC7665] hover:bg-[#AC6655] text-[#4A3F35] px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                   刪除已選 ({selectedAttempts.length})
                </button>
             )}
          </div>
          <div className="flex space-x-2">
            <input type="text" placeholder="搜尋姓名..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#FDFBF7] border border-[#D5CFC4] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500" />
            <button disabled={deleting || searchedAttempts.length === 0} onClick={() => handleDeleteAttempts(searchedAttempts.map(a => a.id))} className="bg-[#BC7665]/15 border border-[#BC7665]/40 text-[#BC7665] hover:bg-red-800/60 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
               刪除全部結果
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[#D5CFC4] bg-[#FDFBF7]/30">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/60 text-xs text-[#8C7A6B]">
              <tr>
                <th className="p-4 w-10">
                   <input type="checkbox" checked={searchedAttempts.length > 0 && selectedAttempts.length === searchedAttempts.length} onChange={toggleSelectAllAttempts} className="w-4 h-4 rounded border-[#D5CFC4]" />
                </th>
                <th className="p-4">日期</th>
                <th className="p-4">姓名</th>
                <th className="p-4">得分</th>
                <th className="p-4">答對題數</th>
                <th className="p-4">準確度</th>
                <th className="p-4">切窗</th>
                <th className="p-4">花費時間</th>
              </tr>
            </thead>
            <tbody>
              {searchedAttempts.map(a => (
                <React.Fragment key={a.id}>
                  <tr className="border-b border-[#D5CFC4]/50 hover:bg-white/30 cursor-pointer" onClick={() => setExpandedAttemptId(expandedAttemptId === a.id ? null : a.id)}>
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                       <input type="checkbox" checked={selectedAttempts.includes(a.id)} onChange={() => toggleSelectAttempt(a.id)} className="w-4 h-4 rounded border-[#D5CFC4]" />
                    </td>
                    <td className="p-4 text-[#6A5F55]">{new Date(a.timestamp).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4 text-[#4A3F35] flex items-center flex-wrap gap-1">
                      <span>{a.userDisplayName}</span>
                      {a.subject === 'pet' && <span className="text-[10px] bg-[#72816B]/15 text-[#72816B] font-bold px-1.5 py-0.5 rounded">PET {a.examDate ? `${a.examDate}` : ''}</span>}
                      {a.answers && <span className="text-[10px] bg-[#EAE2D3] text-[#B39969] px-2 py-0.5 rounded">可展開</span>}
                    </td>
                    <td className="p-4 text-[#D4A373] font-bold">{a.score}</td>
                    <td className="p-4 text-[#7A8A99]">{a.correctCount !== undefined ? `${a.correctCount} / ${a.totalAnswered}` : (a.answers ? `${a.answers.filter(ans=>ans.isCorrect).length} / ${a.answers.length}` : `${Math.round(a.accuracy * (a.totalAnswered||a.score/100) / 100)} / ${a.totalAnswered || a.score/100}`)}</td>
                    <td className="p-4 text-[#72816B]">{a.accuracy}%</td>
                    <td className="p-4 text-[#BC7665] font-bold">{a.cheatCount || 0}</td>
                    <td className="p-4 text-[#8C7A6B]">{Math.floor(a.timeTaken / 1000)} 秒</td>
                  </tr>
                  {expandedAttemptId === a.id && a.answers && (
                    <tr className="bg-[#F5F5F0]/40 border-b border-[#D5CFC4]/50">
                      <td colSpan={8} className="p-4 whitespace-normal">
                        <div className="space-y-3 p-2">
                          <h4 className="text-sm font-bold text-[#6A5F55] flex items-center">
                            <List size={16} className="mr-2" /> 答題詳情明細
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {a.answers.map((ans, idx) => (
                              <div key={idx} className={`p-4 rounded-xl border ${ans.isCorrect ? 'border-[#82917B]/30 bg-[#82917B]/10' : 'border-[#BC7665]/30 bg-[#BC7665]/10'}`}>
                                <p className="text-sm text-[#4A3F35] mb-2 leading-relaxed"><span className="text-[#B39969] font-bold mr-2">Q{idx + 1}</span> {ans.questionPrompt}</p>
                                <div className="flex justify-between items-end mt-2">
                                  <div className="space-y-1">
                                    <p className="text-xs text-[#8C7A6B]">你的答案: <span className={`font-bold ${ans.isCorrect ? 'text-[#72816B]' : 'text-[#BC7665] line-through'}`}>{ans.userAnswer || '(未作答)'}</span></p>
                                    {!ans.isCorrect && <p className="text-xs text-[#8C7A6B]">正確答案: <span className="text-[#72816B] font-bold">{ans.correctAnswer}</span></p>}
                                  </div>
                                  <div className="text-xs text-[#A69B8F] font-mono bg-[#FDFBF7] px-2 py-1 rounded">
                                    ⏱️ {(ans.timeTaken / 1000).toFixed(1)}s
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {searchedAttempts.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-[#A69B8F]">沒有找到相符的紀錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PaperTestTab({ questions, attempts, subjectId }: { questions: Question[], attempts: Attempt[], subjectId: string }) {
  const [source, setSource] = useState<'all'|'wrong'>('all');
  const [diff, setDiff] = useState<'easy'|'medium'|'hard'|'mixed'>('mixed');
  const [mcCount, setMcCount] = useState(10);
  const [fibCount, setFibCount] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const wrongQuestionIds = useMemo(() => {
    const ids = new Set<string>();
    attempts.forEach(a => (a.wrongQuestionIds || []).forEach(id => ids.add(id)));
    return ids;
  }, [attempts]);

  const filteredQuestions = useMemo(() => {
    let qs = questions;
    if (source === 'wrong') {
      qs = qs.filter(q => wrongQuestionIds.has(q.id));
    }
    if (diff !== 'mixed') {
      qs = qs.filter(q => q.difficulty === diff);
    }
    return qs;
  }, [questions, source, diff, wrongQuestionIds]);

  const mcQuestions = filteredQuestions.filter((q: Question) => q.type === 'multiple_choice');
  const fibQuestions = filteredQuestions.filter((q: Question) => q.type !== 'multiple_choice');

  const handleAutoSelect = () => {
    const mcSelected = [...mcQuestions].sort(() => 0.5 - Math.random()).slice(0, mcCount);
    const fibSelected = [...fibQuestions].sort(() => 0.5 - Math.random()).slice(0, fibCount);
    const newSelected = new Set([...mcSelected.map(q => q.id), ...fibSelected.map(q => q.id)]);
    setSelectedIds(newSelected);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q: Question) => q.id)));
    }
  };

  const exportPaper = (format: 'pdf' | 'docx') => {
    const selectedQs = questions.filter(q => selectedIds.has(q.id));
    if (selectedQs.length === 0) return toast('請先勾選題目');

    const mcSelected = selectedQs.filter((q: Question) => q.type === 'multiple_choice');
    const fibSelected = selectedQs.filter((q: Question) => q.type === 'fill_in_the_blank');
    const qgSelected = selectedQs.filter((q: Question) => q.type === 'question_group');

    let html = `
      <div style="font-family: 'Microsoft JhengHei', sans-serif; padding: 20px; color: #000;">
        <h1 style="text-align: center; font-size: 28px; margin-bottom: 20px;">${SUBJECT_LABELS[subjectId as Subject] || '測驗'} 試卷</h1>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 16px;">
          <span>班級：__________ 座號：__________ 姓名：____________________</span>
          <span>得分：__________</span>
        </div>
    `;
    
    let sectionIdx = 1;
    const getSectionTitle = () => {
      const titles = ['一', '二', '三', '四'];
      return titles[(sectionIdx++) - 1] || sectionIdx;
    };

    if (mcSelected.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 20px; margin-bottom: 15px;">${getSectionTitle()}、選擇題（共 ${mcSelected.length} 題）</h2>
        <div style="margin-left: 10px;">
      `;
      mcSelected.forEach((q, i) => {
        html += `<div style="margin-bottom: 15px; page-break-inside: avoid;">`;
        html += `<p style="font-size: 16px; margin: 0 0 8px 0;">${i + 1}. ( &nbsp;&nbsp; ) ${q.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</p>`;
        if (q.options && q.options.length > 0) {
          html += `<div style="display: flex; flex-wrap: wrap; gap: 15px; margin-left: 20px;">`;
          q.options.forEach((opt) => {
            html += `<div style="width: 45%;">${opt}</div>`;
          });
          html += `</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    if (fibSelected.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px;">${getSectionTitle()}、填空與問答題（共 ${fibSelected.length} 題）</h2>
        <div style="margin-left: 10px;">
      `;
      fibSelected.forEach((q, i) => {
        html += `<div style="margin-bottom: 25px; page-break-inside: avoid;">`;
        html += `<p style="font-size: 16px; margin: 0 0 10px 0;">${i + 1}. ${q.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</p>`;
        html += `<div style="border-bottom: 1px solid #000; width: 100%; height: 25px;"></div>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    if (qgSelected.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px;">${getSectionTitle()}、閱讀題組（共 ${qgSelected.length} 篇）</h2>
        <div style="margin-left: 10px;">
      `;
      qgSelected.forEach((q, i) => {
        html += `<div style="margin-bottom: 30px;">`;
        html += `<div style="font-size: 16px; margin: 0 0 15px 0; padding: 15px; border: 1px solid #ccc; background: #fdfdfd; line-height: 1.5; white-space: pre-wrap;">${q.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</div>`;
        if (q.subQuestions && q.subQuestions.length > 0) {
          html += `<div style="margin-left: 15px;">`;
          q.subQuestions.forEach((sq, sqIdx) => {
            html += `<div style="margin-bottom: 20px; page-break-inside: avoid;">`;
            if (sq.type === 'multiple_choice') {
              html += `<p style="font-size: 15px; margin: 0 0 8px 0;">${sqIdx + 1}. ( &nbsp;&nbsp; ) ${sq.prompt}</p>`;
              if (sq.options && sq.options.length > 0) {
                html += `<div style="display: flex; flex-wrap: wrap; gap: 15px; margin-left: 20px;">`;
                sq.options.forEach((opt) => {
                  html += `<div style="width: 45%;">${opt}</div>`;
                });
                html += `</div>`;
              }
            } else {
              html += `<p style="font-size: 15px; margin: 0 0 10px 0;">${sqIdx + 1}. ${sq.prompt}</p>`;
              html += `<div style="border-bottom: 1px solid #000; width: 100%; height: 25px;"></div>`;
            }
            html += `</div>`;
          });
          html += `</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    // Add Answer Key at the end
    html += `
        <div style="page-break-before: always; margin-top: 40px;">
          <h2 style="font-size: 20px; margin-bottom: 15px; text-align: center;">解答</h2>
    `;
    sectionIdx = 1;
    if (mcSelected.length > 0) {
      html += `<h3 style="font-size: 16px;">${getSectionTitle()}、選擇題</h3><div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">`;
      mcSelected.forEach((q, i) => {
        const correctIdx = q.options ? q.options.findIndex(o => o === q.correctAnswer) : -1;
        const letter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : q.correctAnswer;
        html += `<span style="font-size: 14px; width: 60px;">${i + 1}. ${letter}</span>`;
      });
      html += `</div>`;
    }
    if (fibSelected.length > 0) {
      html += `<h3 style="font-size: 16px;">${getSectionTitle()}、填空與問答題</h3><div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">`;
      fibSelected.forEach((q, i) => {
        html += `<span style="font-size: 14px; width: 150px;">${i + 1}. ${q.correctAnswer}</span>`;
      });
      html += `</div>`;
    }
    if (qgSelected.length > 0) {
      html += `<h3 style="font-size: 16px;">${getSectionTitle()}、閱讀題組</h3><div style="margin-bottom: 20px;">`;
      qgSelected.forEach((q, i) => {
        html += `<div style="margin-bottom: 10px;"><strong>第 ${i + 1} 篇</strong><div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 5px;">`;
        if (q.subQuestions) {
          q.subQuestions.forEach((sq, sqIdx) => {
            if (sq.type === 'multiple_choice') {
              const correctIdx = sq.options ? sq.options.findIndex(o => o === sq.correctAnswer) : -1;
              const letter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : sq.correctAnswer;
              html += `<span style="font-size: 14px; width: 60px;">${sqIdx + 1}. ${letter}</span>`;
            } else {
              html += `<span style="font-size: 14px; width: 150px;">${sqIdx + 1}. ${sq.correctAnswer}</span>`;
            }
          });
        }
        html += `</div></div>`;
      });
      html += `</div>`;
    }
    html += `</div></div>`;

    if (format === 'docx') {
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent("<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>測驗試卷</title><style>body{font-family:'Microsoft JhengHei',sans-serif;}</style></head><body>" + html + "</body></html>");
      const link = document.createElement("a"); link.href = source; link.download = `測驗試卷_${Date.now()}.doc`; link.click();
    } else {
      const opt: any = { margin: 15, filename: `測驗試卷_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
      const element = document.createElement('div');
      element.innerHTML = html;
      html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl space-y-4">
        <h4 className="font-bold text-[#4A3F35] text-lg border-b border-[#D5CFC4] pb-2">試卷產生條件設定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#8C7A6B] mb-1">題目來源</label>
            <select value={source} onChange={e => setSource(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35]">
              <option value="all">題庫所有題目</option>
              <option value="wrong">學生常錯題目 (錯題集)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#8C7A6B] mb-1">難易度</label>
            <select value={diff} onChange={e => setDiff(e.target.value as any)} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35]">
              <option value="mixed">混合難度</option>
              <option value="easy">簡單</option>
              <option value="medium">中等</option>
              <option value="hard">困難</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#8C7A6B] mb-1">自動選題 - 選擇題數 (庫存: {mcQuestions.length})</label>
            <input type="number" value={mcCount} onChange={e => setMcCount(parseInt(e.target.value) || 0)} max={mcQuestions.length} min={0} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35]" />
          </div>
          <div>
            <label className="block text-sm text-[#8C7A6B] mb-1">自動選題 - 填空題數 (庫存: {fibQuestions.length})</label>
            <input type="number" value={fibCount} onChange={e => setFibCount(parseInt(e.target.value) || 0)} max={fibQuestions.length} min={0} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35]" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleAutoSelect} className="bg-[#C2A878] hover:bg-[#B39969] text-[#4A3F35] font-bold py-2 px-6 rounded-lg">自動隨機選題</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-[#4A3F35] text-lg">預覽與選取題目 (已選: {selectedIds.size})</h4>
          <div className="flex space-x-2">
            <button onClick={() => exportPaper('pdf')} className="bg-red-500/10 hover:bg-[#AC6655]/30 text-[#BC7665] border border-[#BC7665]/30 px-4 py-2 rounded-lg font-bold transition-all text-sm">匯出 PDF 試卷</button>
            <button onClick={() => exportPaper('docx')} className="bg-[#9BA8B5]/10 hover:bg-[#8B98A5]/30 text-[#7A8A99] border border-[#9BA8B5]/30 px-4 py-2 rounded-lg font-bold transition-all text-sm">匯出 DOCX 試卷</button>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-[#D5CFC4]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FDFBF7] text-[#8C7A6B]">
              <tr>
                <th className="p-3 w-10">
                  <input type="checkbox" checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-purple-500" />
                </th>
                <th className="p-3">題型</th>
                <th className="p-3">難度</th>
                <th className="p-3 w-1/2">題目</th>
                <th className="p-3">答案</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-700 max-h-[400px] overflow-y-auto">
              {filteredQuestions.map(q => (
                <tr key={q.id} className="hover:bg-[#EAE6DF]/50 cursor-pointer" onClick={() => toggleSelect(q.id)}>
                  <td className="p-3">
                    <input type="checkbox" checked={selectedIds.has(q.id)} readOnly className="w-4 h-4 accent-purple-500" />
                  </td>
                  <td className="p-3">{q.type === 'multiple_choice' ? '選擇' : '填空'}</td>
                  <td className="p-3">{q.difficulty}</td>
                  <td className="p-3 truncate max-w-xs">{q.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</td>
                  <td className="p-3 text-[#72816B]">{q.correctAnswer}</td>
                </tr>
              ))}
              {filteredQuestions.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-[#A69B8F]">沒有符合條件的題目</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SettingsTab({ config, subjectId }: { config: SubjectConfig, subjectId: Subject }) {
  const [units, setUnits] = useState(config.totalUnits || 10);
  
  const handleSave = async () => {
    try {
      // Find config doc by id or create
      await setDoc(doc(db, 'configs', subjectId), {
        id: subjectId,
        totalUnits: units
      });
      toast('設定已儲存');
    } catch (e) {
      console.error(e);
      toast('儲存失敗');
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="font-serif text-xl font-bold text-[#4A3F35] mb-4">科目基本設定</h3>
      <div>
        <label className="block text-sm text-[#8C7A6B] mb-2">總單元數/課數</label>
        <input type="number" value={units} onChange={e => setUnits(parseInt(e.target.value))} className="w-full bg-[#FDFBF7] border border-[#D5CFC4] rounded-lg px-4 py-2 text-[#4A3F35]" />
      </div>
      <button onClick={handleSave} className="bg-[#C2A878] hover:bg-[#B39969] px-6 py-2 rounded-lg text-[#4A3F35] font-bold">儲存設定</button>
    </div>
  );
}




export function Layout({ children, user }: { children: React.ReactNode, user: UserProfile | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let keySequence = '';
    const keys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key) keys.add(e.key.toLowerCase());
      if (keys.has('i') && keys.has('a') && keys.has('n')) {
        navigate('/');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key) keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [navigate]);

  useEffect(() => {
    // Particle effect
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {x:number,y:number,size:number,speedX:number,speedY:number,color:string}[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        color: `rgba(${Math.floor(Math.random()*100+100)}, ${Math.floor(Math.random()*100+100)}, 255, ${Math.random()*0.5})`
      });
    }

    let animationFrameId: number;
    function animate() {
      if(!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      }
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLogout = () => {
    if (user?.uid === 'test-admin-uid') {
      window.location.reload();
    } else {
      signOut(auth).then(() => window.location.reload());
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden selection:bg-purple-500 selection:text-[#4A3F35]">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full opacity-40"></canvas>
      </div>

      <header className="border-b border-[#EAE6DF]/80 bg-[#FDFBF7]/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-[96%] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-[#D95B24] shrink-0">
              <svg viewBox="0 0 512 512" className="w-9 h-9" fill="none">
                <path fill="currentColor" d="M289.5 434.7c-.1-10.3 2.6-19.2 7-28.5-9.2 8.1-12.8 17.3-16.2 29.8.9-14.6 8-110.4 8-115.2 24.5-70 13.6-279 44.8-305.1-36 6.5-48.2 43.3-59.7 72.5-11.4-34.3-2.4-56.1-40.2-68.1 30.2 25.6 24.2 47.6 30.4 83-18.1-23.5-12.5-52.8-33.3-76.8-5.9-6.1-25.5-21-25.5-21 0 .9 15.7 32.3 18.6 48.9 2.9 16.6 9.8 49.8 8.8 62 2.6 67.8 19.6 133.5 31.3 200 2 11.4 7.8 44.5 7.8 44.5l1.3 13.8c-2.1-9.1-4.1-17.3-5.2-20.8-3.4-10-11.8-35.4-13.7-45.8-28.5-58.6-80.6-173.5-150.2-190.4 39.5 35 82 81.2 91.5 125.8-21.2-29.8-104.6-93.4-138.5-116.6 63.9 66.3 115.2 135 170.8 208.7 16.2 21 36.3 63.3 37.7 72.9 1.1 7.1 2.4 33.6 3.2 49.9-31.1-75.1-48.1-113.2-105.5-146.8-9.8-5.2-40.2-15.7-40.2-15.7 13.8 15.2 30.7 16.1 43.3 37.3-26.1-17.1-53.2-20.1-83-21.1 95.7 49.5 147.5 63.3 179.7 158.4 2.6 15.6-1.4 27.8-1 41.8h21.2c-.1-10 .1-19.6 0-21.6 1.1-6.6 1.3-26.6 4.2-32.7 10-25.4 26.2-37.4 48.8-52.2-20.3 6.6-30.6 4-46.2 29.1zM384 210.5c-7.8 7.4-31.3 37.2-31.3 37.2 1.3-42 11.9-87 38.7-118.4-37.3 24.4-58.3 84.6-68 121.4-3.8 14.8-47.9 100.7-27.4 146.7 4-16.8 13.5-33.1 24-47.6 4.9-6.6 25.5-39.3 46-86 18.1-47 47.8-74.5 89.6-97.8-31.6 4.8-49.6 23-71.6 44.5zm7.3-81.2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif font-black text-lg tracking-wider text-[#D95B24]">
                DevSeed 課業進化站
              </h1>
              <p className={`text-xs ${user?.activeTheme === 'theme_dark' ? 'text-gray-400' : 'text-[#8C7A6B]'}`}></p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-3">
              {user.role === 'admin' && location.pathname !== '/admin' && !location.pathname.startsWith('/admin/') && (
                <button onClick={() => navigate('/admin')} className="bg-[#C2A878]/20 hover:bg-[#C2A878]/40 border border-[#C2A878]/50 text-[#B39969] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center">
                  <LayoutDashboard size={14} className="mr-1" /> 控制台
                </button>
              )}
              {location.pathname !== '/select-subject' && (
                <button onClick={() => navigate('/select-subject')} className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center">
                  <Home size={14} className="mr-1" /> 任務大廳
                </button>
              )}
              {user.role === 'player' && (
                <>
                  
                  
                </>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[#5A4F45]">{user.displayName}</p>
                <p className="text-xs text-[#B39969] font-mono uppercase">ROLE: {user.role}</p>
              </div>
              {(() => {
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
              })()}
              <button onClick={handleLogout} className="text-[#8C7A6B] hover:text-[#BC7665] text-sm p-2 transition-colors" title="登出">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col px-4 py-6 z-10 max-w-[96%] w-full mx-auto relative">
        {children}
      </main>
    </div>
  );
}

export function SignIn() {
  const [testCode, setTestCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      toast('Google登入失敗，請稍後再試。');
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return toast('請輸入信箱與密碼');
    if (isRegistering && !nickname) return toast('請輸入暱稱');
    
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: nickname });
        // The onAuthStateChanged listener will handle creating the user doc
        toast('註冊成功！');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast('登入成功！');
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/invalid-credential') {
        toast('登入失敗：帳號或密碼錯誤');
      } else if (e.code === 'auth/email-already-in-use') {
        toast('註冊失敗：此信箱已被使用');
      } else {
        toast(isRegistering ? '註冊失敗: ' + e.message : '登入失敗: ' + e.message);
      }
    }
  };

  
  const handleTestSubmit = async () => {
    if (testCode === 'ianw0000') {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        console.error(e);
        if (e.code === 'auth/admin-restricted-operation') {
          toast('測試登入失敗：請先至 Firebase Console 啟用「匿名登入 (Anonymous Auth)」功能。');
        } else {
          toast('測試登入失敗。');
        }
      }
    } else {
      toast('無效的測試碼');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto text-center py-10 my-auto">
      <div className="bg-[#FDFBF7]/80 backdrop-blur-xl border border-[#EAE6DF] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 bg-[#D04003] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-105 transition-transform duration-300 text-white">
          <svg viewBox="0 0 512 512" className="w-14 h-14" fill="none">
            <path fill="currentColor" d="M289.5 434.7c-.1-10.3 2.6-19.2 7-28.5-9.2 8.1-12.8 17.3-16.2 29.8.9-14.6 8-110.4 8-115.2 24.5-70 13.6-279 44.8-305.1-36 6.5-48.2 43.3-59.7 72.5-11.4-34.3-2.4-56.1-40.2-68.1 30.2 25.6 24.2 47.6 30.4 83-18.1-23.5-12.5-52.8-33.3-76.8-5.9-6.1-25.5-21-25.5-21 0 .9 15.7 32.3 18.6 48.9 2.9 16.6 9.8 49.8 8.8 62 2.6 67.8 19.6 133.5 31.3 200 2 11.4 7.8 44.5 7.8 44.5l1.3 13.8c-2.1-9.1-4.1-17.3-5.2-20.8-3.4-10-11.8-35.4-13.7-45.8-28.5-58.6-80.6-173.5-150.2-190.4 39.5 35 82 81.2 91.5 125.8-21.2-29.8-104.6-93.4-138.5-116.6 63.9 66.3 115.2 135 170.8 208.7 16.2 21 36.3 63.3 37.7 72.9 1.1 7.1 2.4 33.6 3.2 49.9-31.1-75.1-48.1-113.2-105.5-146.8-9.8-5.2-40.2-15.7-40.2-15.7 13.8 15.2 30.7 16.1 43.3 37.3-26.1-17.1-53.2-20.1-83-21.1 95.7 49.5 147.5 63.3 179.7 158.4 2.6 15.6-1.4 27.8-1 41.8h21.2c-.1-10 .1-19.6 0-21.6 1.1-6.6 1.3-26.6 4.2-32.7 10-25.4 26.2-37.4 48.8-52.2-20.3 6.6-30.6 4-46.2 29.1zM384 210.5c-7.8 7.4-31.3 37.2-31.3 37.2 1.3-42 11.9-87 38.7-118.4-37.3 24.4-58.3 84.6-68 121.4-3.8 14.8-47.9 100.7-27.4 146.7 4-16.8 13.5-33.1 24-47.6 4.9-6.6 25.5-39.3 46-86 18.1-47 47.8-74.5 89.6-97.8-31.6 4.8-49.6 23-71.6 44.5zm7.3-81.2z" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-black tracking-wide text-[#4A3F35]">登入 DevSeed 課業進化站</h2>
        <p className="text-sm text-[#8C7A6B] mt-2 mb-6">加入我們，解鎖你的學習潛能。</p>

        <div className="space-y-4 mb-6 text-left">
          {isRegistering && (
            <div>
              <label className="text-xs font-bold text-[#8C7A6B] ml-1">暱稱 (必填)</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="你的大名" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-[#8C7A6B] ml-1">信箱 (必填)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
          </div>
          <div>
              <label className="text-xs font-bold text-[#8C7A6B] ml-1">密碼</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-1 bg-white border border-[#EAE6DF] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
            </div>
          
          <button onClick={handleEmailAuth} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-2">
              {isRegistering ? '註冊帳號' : '登入帳號'}
            </button>

          <div className="flex justify-between items-center px-1">
               <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">
                 {isRegistering ? '已有帳號？切換登入' : '沒有帳號？立即註冊'}
               </button>
             </div>
        </div>

        <div className="relative flex py-4 items-center mb-2">
            <div className="flex-grow border-t border-[#EAE6DF]"></div>
            <span className="flex-shrink-0 mx-4 text-[#A69B8F] text-xs font-bold uppercase tracking-wider">或</span>
            <div className="flex-grow border-t border-[#EAE6DF]"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 border border-[#EAE6DF] font-bold py-3 px-6 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm">使用 Google 帳號</span>
        </button>

        <div className="border-t border-[#EAE6DF] pt-4 mt-2">
          <p className="text-[10px] text-[#A69B8F] mb-2 uppercase tracking-wide">系統管理員通道</p>
          <div className="flex space-x-2">
            <input 
              type="password" 
              value={testCode}
              onChange={e => setTestCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTestSubmit()}
              placeholder="輸入授權碼" 
              className="flex-1 bg-[#F5F5F0] border border-[#D5CFC4] rounded-xl px-3 py-1.5 text-xs text-center text-[#B39969] focus:outline-none focus:border-purple-500"
            />
            <button 
              onClick={handleTestSubmit}
              className="bg-white hover:bg-[#EAE6DF] text-[#4A3F35] border border-[#EAE6DF] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              進入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SUBJECT_CONFIGS: { id: Subject; icon: string; color: string }[] = [
  { id: 'chinese', icon: '📝', color: 'from-red-500 to-orange-500' },
  { id: 'math', icon: '📐', color: 'from-blue-500 to-cyan-500' },
  { id: 'science', icon: '🔬', color: 'from-green-500 to-emerald-500' },
  { id: 'social_studies', icon: '🌍', color: 'from-amber-500 to-yellow-500' },
  { id: 'pet', icon: '🔤', color: 'from-purple-500 to-pink-500' }
];

export function SubjectSelect() {
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
    <div className="max-w-[96%] w-full mx-auto py-10">
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl font-black text-[#4A3F35] mb-2">選擇探索星系 (科目)</h2>
        <p className="text-[#8C7A6B]">請選擇你今天要進行任務的科目</p>
      </div>
      

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUBJECT_CONFIGS.map(subj => (
          <div 
            key={subj.id}
            onClick={() => navigate(`/subject/${subj.id}/tasks`)}
            className="bg-[#FDFBF7]/60 border border-[#EAE6DF] rounded-3xl p-6 cursor-pointer hover:border-[#D5CFC4] transition-all transform hover:-translate-y-1 hover:shadow-md group"
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${subj.color} flex items-center justify-center text-3xl mb-4 shadow-sm`}>
              {subj.icon}
            </div>
            <h3 className="font-serif text-xl font-bold text-[#4A3F35] mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
              {SUBJECT_LABELS[subj.id]}
            </h3>
            <p className="text-sm text-[#A69B8F]">點擊進入 {SUBJECT_LABELS[subj.id]} 任務中心</p>
          </div>
        ))}
      </div>

      {/* Announcements */}
      <div className="mt-16">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="text-[#C2A878]" size={28} />
          <h2 className="text-3xl font-bold text-[#4A3F35] font-serif">平台公告</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-[#4A3F35] group-hover:text-[#B39969] transition-colors">{a.title}</h3>
              </div>
              <p className="text-[#8C7A6B] text-sm line-clamp-3 whitespace-pre-wrap">{a.content}</p>
              <div className="mt-4 pt-4 border-t border-[#EAE6DF] flex justify-between text-xs text-[#A69B8F]">
                <span>{a.author}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="col-span-full text-center py-10 text-[#A69B8F]">目前沒有平台公告</div>
          )}
        </div>
      </div>

    </div>
  );
}


export function LeaderboardTab({ user }: { user: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const usersData = snap.docs.map(d => d.data() as UserProfile).filter(u => u.role === 'player');
        usersData.sort((a, b) => (b.points || 0) - (a.points || 0));
        setUsers(usersData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="text-center py-20 text-[#A69B8F]">載入排行榜中...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#EAE6DF] rounded-3xl p-6 shadow-sm relative overflow-hidden">
        {/* Top 3 Podium */}
        <div className="flex justify-center items-end space-x-4 mb-8 pt-4">
          {[1, 0, 2].map((posIndex) => {
            const u = users[posIndex];
            if (!u) return <div key={posIndex} className="w-24"></div>;
            const isFirst = posIndex === 0;
            const isSecond = posIndex === 1;
            return (
              <div key={u.uid} className={`flex flex-col items-center ${isFirst ? 'transform -translate-y-4' : ''}`}>
                <div className="relative mb-2">
                  {isFirst && <div className="absolute -top-6 -left-2 text-3xl">👑</div>}
                  {isSecond && <div className="absolute -top-5 -left-2 text-2xl">🥈</div>}
                  {!isFirst && !isSecond && <div className="absolute -top-5 -left-2 text-2xl">🥉</div>}
                  <img src={u.photoURL} alt={u.displayName} className={`rounded-full border-4 ${isFirst ? 'w-20 h-20 border-[#C2A878] shadow-lg shadow-[#C2A878]/30' : 'w-16 h-16 border-[#D5CFC4]'}`} />
                </div>
                <div className="font-bold text-[#4A3F35] text-sm text-center line-clamp-1">{u.displayName}</div>
                <div className="text-[#B39969] font-black text-lg">{u.points || 0} pts</div>
              </div>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-3">
          {users.map((u, i) => (
            <div key={u.uid} className={`flex items-center justify-between p-4 rounded-xl border ${u.uid === user.uid ? 'bg-[#FDFBF7] border-[#C2A878]' : 'bg-white border-[#EAE6DF] hover:bg-[#FDFBF7]'}`}>
              <div className="flex items-center space-x-4">
                <span className="font-black text-lg w-6 text-center text-[#A69B8F]">{i + 1}</span>
                <img src={u.photoURL} alt={u.displayName} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-bold text-[#4A3F35] flex items-center">
                    {u.displayName}
                    {u.uid === user.uid && <span className="ml-2 text-xs bg-[#C2A878] text-[#4A3F35] px-2 py-0.5 rounded-full">你</span>}
                  </div>
                </div>
              </div>
              <div className="font-black text-[#4A3F35] text-xl">
                {u.points || 0} <span className="text-xs text-[#8C7A6B] font-medium">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MistakesTab({ user }: { user: UserProfile }) {
  const [mistakes, setMistakes] = useState<(Question & { errorCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'attempts'), where('userId', '==', user.uid)));
        const errorCounts: Record<string, number> = {};
        snap.docs.forEach(d => {
          const attempt = d.data() as Attempt;
          (attempt.wrongQuestionIds || []).forEach(qid => {
            errorCounts[qid] = (errorCounts[qid] || 0) + 1;
          });
        });
        
        const qids = Object.keys(errorCounts);
        if (qids.length === 0) {
          setMistakes([]);
          setLoading(false);
          return;
        }

        const qSnap = await getDocs(collection(db, 'questions')); // Assuming we can fetch all or chunk it
        const qs: (Question & { errorCount: number })[] = [];
        qSnap.docs.forEach(d => {
          if (errorCounts[d.id]) {
            qs.push({ id: d.id, ...d.data(), errorCount: errorCounts[d.id] } as any);
          }
        });
        setMistakes(qs.sort((a,b) => b.errorCount - a.errorCount));
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchMistakes();
  }, [user.uid]);

  if (loading) return <div className="text-center py-10 text-[#A69B8F]">載入中...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif font-bold text-[#4A3F35]">我的錯題本</h3>
      {mistakes.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-[#EAE6DF]">
          <CheckCircle className="w-12 h-12 text-[#72816B] mx-auto mb-4" />
          <p className="text-[#8C7A6B]">太棒了！目前沒有錯題紀錄。</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mistakes.map(m => (
            <div key={m.id} className="bg-white border border-[#EAE6DF] p-5 rounded-2xl relative shadow-sm">
              <span className="absolute top-4 right-4 text-xs font-bold bg-[#BC7665]/10 text-[#AC6655] px-2 py-1 rounded">錯過 {m.errorCount} 次</span>
              <p className="text-[#4A3F35] font-medium pr-16 mb-4">{m.prompt}</p>
              <div className="bg-[#F5F5F0] p-3 rounded-xl border border-[#EAE6DF]">
                <p className="text-xs text-[#8C7A6B] mb-1">正確答案</p>
                <p className="text-[#72816B] font-bold">{m.correctAnswer}</p>
              </div>
              {m.clue && (
                <div className="mt-3 p-3 bg-[#EAE2D3] rounded-xl">
                  <p className="text-xs text-[#B39969] font-bold mb-1">老師解析</p>
                  <p className="text-[#5A4F45] text-sm">{m.clue}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskSelect({ user }: { user: UserProfile }) {
  const { subjectId } = useParams<{ subjectId: Subject }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks'|'mistakes'|'leaderboard'|'materials'|'timer'|'analytics'>('tasks');
  const [petViewMode, setPetViewMode] = useState<'weekly'|'custom'>('weekly');

  useEffect(() => {
    if (!subjectId) return;
    const fetchTasks = async () => {
      try {
        const q = query(
          collection(db, 'tasks'),
          where('subject', '==', subjectId),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        const tasksData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
        tasksData.sort((a, b) => b.createdAt - a.createdAt);
        setTasks(tasksData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [subjectId]);

  return (
    <div className="max-w-[96%] w-full mx-auto py-10 space-y-8">
      <GamificationProfile user={user} />
      
      <div className="flex flex-wrap gap-1 bg-[#FDFBF7] p-1.5 rounded-2xl w-full max-w-3xl border border-[#EAE6DF]">
        <button onClick={() => setActiveTab('materials')} className={`flex-1 min-w-[110px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'materials' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#F5F5F0]'}`}>
          先看課 / 教材區
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`flex-1 min-w-[110px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#F5F5F0]'}`}>
          測驗任務
        </button>
        <button onClick={() => setActiveTab('mistakes')} className={`flex-1 min-w-[110px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mistakes' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#F5F5F0]'}`}>
          錯題複習
        </button>
        <button onClick={() => setActiveTab('timer')} className={`flex-1 min-w-[110px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'timer' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#F5F5F0]'}`}>
          ⏱️ 專注番茄鐘
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`flex-1 min-w-[110px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#F5F5F0]'}`}>
          📊 學習統計
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 min-w-[110px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-[#C2A878] text-[#4A3F35] shadow-sm' : 'text-[#8C7A6B] hover:bg-[#F5F5F0]'}`}>
          排行榜
        </button>
      </div>

      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <button onClick={() => navigate('/select-subject')} className="text-[#A69B8F] hover:text-[#4A3F35] mb-2 flex items-center text-sm transition-colors">
                ← 返回科目選擇
              </button>
              <h2 className="font-serif text-3xl font-black text-[#4A3F35]">課程內容與教材</h2>
              <p className="text-[#8C7A6B] mt-1">在開始測驗前，先閱讀或觀看以下教材吧！</p>
            </div>
          </div>
          <CourseMaterialsStudentView subjectId={subjectId!} user={user} />
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <button onClick={() => navigate('/select-subject')} className="text-[#A69B8F] hover:text-[#4A3F35] mb-2 flex items-center text-sm transition-colors">
                ← 返回科目選擇
              </button>
              <h2 className="font-serif text-3xl font-black text-[#4A3F35]">
                {subjectId === 'pet' && petViewMode === 'weekly' ? 'PET 英文週考專屬中心' : '選擇任務'}
              </h2>
              <p className="text-[#8C7A6B] mt-1">
                {subjectId === 'pet' && petViewMode === 'weekly' 
                  ? '選擇考試日期進行全真模擬練習，題庫自動同步四大 Part，滿分 70 Points'
                  : `${SUBJECT_LABELS[subjectId!] || subjectId} - 點擊任務開始挑戰`}
              </p>
            </div>
            {subjectId === 'pet' && (
              <button
                onClick={() => setPetViewMode(prev => prev === 'weekly' ? 'custom' : 'weekly')}
                className="text-xs bg-[#EAE2D3] hover:bg-[#D5CFC4] text-[#4A3F35] font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
              >
                {petViewMode === 'weekly' ? '切換為自選任務' : '切換為每週考期模式'}
              </button>
            )}
          </div>

          {subjectId === 'pet' && petViewMode === 'weekly' ? (
            <PetExamDateSelector user={user} />
          ) : (
            loading ? (
              <div className="text-center py-20 text-[#A69B8F]">尋找任務中...</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => navigate(`/play/${t.id}`)}
                    className="bg-white border border-[#EAE6DF] rounded-3xl p-6 cursor-pointer hover:border-[#C2A878] hover:-translate-y-1 transition-all group shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-serif text-xl font-bold text-[#4A3F35] group-hover:text-[#B39969] transition-colors">{t.title}</h3>
                      <div className="bg-[#EAE2D3] text-[#B39969] p-2 rounded-xl">
                        <Play size={20} className="fill-current" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs font-bold bg-[#F5F5F0] text-[#8C7A6B] px-2 py-1 rounded">
                        {t.difficulty === 'easy' ? '簡單' : t.difficulty === 'medium' ? '中等' : t.difficulty === 'hard' ? '困難' : '混合難度'}
                      </span>
                      <span className="text-xs font-bold bg-[#F5F5F0] text-[#8C7A6B] px-2 py-1 rounded">
                        {t.gameMode === 'survival' ? '生存模式' : t.gameMode === 'speed' ? '速答模式' : '一般模式'}
                      </span>
                      {t.targetUnits && t.targetUnits.length > 0 && (
                        <span className="text-xs font-bold bg-[#EAE2D3] text-[#4A3F35] px-2 py-1 rounded">
                          {t.targetUnits.map(u => formatUnitBadge(u)).join(', ')}
                        </span>
                      )}
                      {t.filterWeeklyExamWords && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          排除週考詞彙
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#A69B8F]">題數: {t.questionCount} {t.mcCount !== undefined ? `(選擇 ${t.mcCount}, 填空 ${t.fibCount})` : ""}</span>
                      <div className="flex items-center text-[#BC7665]">
                        {t.maxHearts ? (
                          <>
                            <Heart className="w-4 h-4 fill-current mr-1" />
                            {t.maxHearts}
                          </>
                        ) : (
                          <span className="text-[#8C7A6B]">無限愛心</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="col-span-full text-center py-20 text-[#A69B8F] bg-white border border-[#EAE6DF] rounded-3xl">
                    目前沒有可用的任務
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'mistakes' && <MistakesTab user={user} />}
      {activeTab === 'timer' && <StudyTimer />}
      {activeTab === 'analytics' && <LearningAnalyticsDashboard subjectId={subjectId!} user={user} />}
      {activeTab === 'leaderboard' && <LeaderboardTab user={user} />}
    </div>
  );
}

export function Gameplay({ user }: { user: UserProfile }) {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cheatCount, setCheatCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && task?.antiCheat && !showResult) {
        setCheatCount(c => c + 1);
        console.warn('Tab switch detected!');
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  const [loading, setLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  
  // Game state
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [combo, setCombo] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [lastEffect, setLastEffect] = useState<'correct'|'wrong'|null>(null);
  const [showingWrongAnswer, setShowingWrongAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  useEffect(() => { if (task?.gameMode === 'speed') setTimeLeft(task.timeLimit || 10); }, [task]);
  
  useEffect(() => {
    if (task?.gameMode === 'speed' && !showingWrongAnswer && lives > 0) {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            if (handleAnswerRef.current) handleAnswerRef.current(''); // Auto-submit empty if time runs out
            return 10;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [task, currentIndex, showingWrongAnswer, lives]);
  
  const [inputVal, setInputVal] = useState('');
  const [groupAnswers, setGroupAnswers] = useState<Record<string, string>>({});
  
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const handleAnswerRef = useRef<any>(null);
  
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);
  
  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new ParticleEngine(canvasRef.current);
    }
    return () => {
      engineRef.current?.destroy();
    };
  }, [canvasRef.current]);

  useEffect(() => {
    const initGame = async () => {
      if (!taskId) return;
      try {
        const taskSnap = await getDoc(doc(db, 'tasks', taskId));
        if (!taskSnap.exists()) {
          toast('找不到任務');
          navigate('/');
          return;
        }
        const taskData = { id: taskSnap.id, ...taskSnap.data() } as Task;
        setTask(taskData);
        setLives(taskData.maxHearts || 9999);
        
        // Fetch questions for this subject
        let qQuery = query(collection(db, 'questions'), where('subject', '==', taskData.subject));
        const qSnap = await getDocs(qQuery);
        let allQs = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        
        // Filter by target units
        if (taskData.targetUnits && taskData.targetUnits.length > 0) {
          allQs = allQs.filter(q => 
            taskData.targetUnits.some(u => String(u).trim().toLowerCase() === String(q.unit).trim().toLowerCase())
          );
        }

        // Filter by weekly exam words if enabled in task
        if (taskData.filterWeeklyExamWords) {
          const weeklyWordsSet = getWeeklyExamWordsSet(allQs);
          allQs = allQs.filter(q => !isQuestionMatchingWeeklyExamWords(q, weeklyWordsSet));
        }

        // Filter by difficulty if not mixed
        if (taskData.difficulty !== 'mixed') {
          allQs = allQs.filter(q => q.difficulty === taskData.difficulty);
        }
        
        // Shuffle and slice
        if (taskData.selectionMode === 'manual' && taskData.selectedQuestionIds) {
          // Manual selection mode
          const selectedSet = new Set(taskData.selectedQuestionIds);
          allQs = allQs.filter(q => selectedSet.has(q.id)).sort(() => Math.random() - 0.5);
        } else if (taskData.mcCount !== undefined || taskData.fibCount !== undefined) {
          // Random selection mode
          let mmQs = allQs.filter(q => !!q.mediaUrl).sort(() => Math.random() - 0.5);
          let remainingQs = allQs.filter(q => !q.mediaUrl);
          
          let qgQs = remainingQs.filter(q => q.type === 'question_group').sort(() => Math.random() - 0.5);
          remainingQs = remainingQs.filter(q => q.type !== 'question_group');

          let mcQs = remainingQs.filter(q => q.type === 'multiple_choice').sort(() => Math.random() - 0.5);
          let fibQs = remainingQs.filter(q => q.type === 'fill_in_the_blank').sort(() => Math.random() - 0.5);
          
          let targetMc = taskData.mcCount || 0;
          let targetFib = taskData.fibCount || 0;
          let targetMm = taskData.mmCount || 0;
          let targetQg = taskData.qgCount || 0;
          
          allQs = [
            ...mmQs.slice(0, targetMm),
            ...qgQs.slice(0, targetQg),
            ...mcQs.slice(0, targetMc),
            ...fibQs.slice(0, targetFib)
          ].sort(() => Math.random() - 0.5);
        } else {
          // Fallback
          allQs.sort(() => Math.random() - 0.5);
          if (allQs.length > taskData.questionCount) {
            allQs = allQs.slice(0, taskData.questionCount);
          }
        }
        
        if (allQs.length === 0) {
          toast('找不到符合條件的題目');
          navigate(-1);
          return;
        }
        
        setQuestions(allQs);
        setStartTime(Date.now());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    initGame();
  }, [taskId, navigate]);

  const proceedToNext = async (currentScore: number, isCorrect: boolean, currentLives: number, currentWrongIds: string[], currentAnswers: AttemptAnswer[]) => {
    if (currentLives <= 0 || currentIndex + 1 >= questions.length) {
      // Game over
      const timeTaken = Date.now() - startTime;
      const totalQuestions = currentIndex + 1;
      const correctAnswers = totalQuestions - currentWrongIds.length;
      const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
      
      try {
        const attemptRef = await addDoc(collection(db, 'attempts'), {
          taskId: task!.id,
          userId: user.uid,
          userDisplayName: user.displayName,
          subject: task!.subject,
          score: currentScore,
          accuracy,
          correctCount: correctAnswers,
          totalAnswered: totalQuestions,
          timeTaken,
          cheatCount,
          wrongQuestionIds: currentWrongIds,
          answers: currentAnswers,
          timestamp: Date.now()
        } as Omit<Attempt, 'id'>);

        // Update User points
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const newPoints = (userData.points || 0) + currentScore;
          
          await updateDoc(userRef, {
            points: newPoints,
            lastPlayedAt: Date.now()
          });
        }
        
        navigate(`/gameover/${attemptRef.id}`);
      } catch(e) {
        console.error(e);
        toast('儲存成績失敗');
      }
    } else {
      setCurrentIndex(i => i + 1);
      if (task?.gameMode === 'speed') {
        setTimeLeft(task.timeLimit || 10);
      }
    }
  };

  const renderMedia = (q: Question) => {
    if (!q.mediaUrl) return null;
    if (q.mediaType === 'youtube') {
      const videoId = q.mediaUrl.split('v=')[1]?.split('&')[0] || q.mediaUrl.split('/').pop();
      return <div className="mb-4 aspect-video"><iframe className="w-full h-full rounded-lg" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen></iframe></div>;
    }
    if (q.mediaType === 'audio') {
      return <audio controls src={q.mediaUrl} className="w-full mb-4" />;
    }
    return <img src={q.mediaUrl} alt="media" className="w-full max-h-64 object-contain rounded-lg mb-4 bg-white/50" />;
  };

  const handleAnswer = async (answer: string) => {
    if (showingWrongAnswer) return;
    // Check if the correct answer is Chinese
    let isCorrect = false;
    let finalAnswer = answer;
    
    if (currentQ.type === 'question_group') {
      isCorrect = true;
      let parsedAns: Record<string, string> = {};
      try {
        parsedAns = typeof answer === 'string' && answer.startsWith('{') ? JSON.parse(answer) : {};
      } catch {
        parsedAns = {};
      }
      for (const sq of currentQ.subQuestions || []) {
        const sqAns = parsedAns[sq.id] || '';
        const isChinese = /[\u4E00-\u9FFF]/.test(sq.correctAnswer);
        let sqCorrect = false;
        if (isChinese && sq.type === 'fill_in_the_blank') {
          const ansPinyin = pinyin(sqAns.trim(), { toneType: 'none', v: true }).replace(/\s+/g, '').toLowerCase();
          const correctPinyin = pinyin((sq.correctAnswer || '').trim(), { toneType: 'none', v: true }).replace(/\s+/g, '').toLowerCase();
          sqCorrect = ((ansPinyin === correctPinyin) && sqAns.trim().length > 0) || isAnswerCorrect(sqAns, sq.correctAnswer);
        } else {
          sqCorrect = isAnswerCorrect(sqAns, sq.correctAnswer);
        }
        if (!sqCorrect) { isCorrect = false; break; }
      }
    } else {
      const isChinese = /[\u4E00-\u9FFF]/.test(currentQ.correctAnswer);
      if (isChinese && currentQ.type === 'fill_in_the_blank') {
          const ansPinyin = pinyin(answer.trim(), { toneType: 'none', v: true }).replace(/\s+/g, '').toLowerCase();
          const correctPinyin = pinyin((currentQ.correctAnswer || '').trim(), { toneType: 'none', v: true }).replace(/\s+/g, '').toLowerCase();
          isCorrect = ((ansPinyin === correctPinyin) && answer.trim().length > 0) || isAnswerCorrect(answer, currentQ.correctAnswer, currentQ.acceptableAnswers);
      } else {
          isCorrect = isAnswerCorrect(answer, currentQ.correctAnswer, currentQ.acceptableAnswers);
      }
    }
    
    const timeTakenForQuestion = Date.now() - questionStartTime;
    const newAnswer: AttemptAnswer = {
      questionId: currentQ.id,
      questionPrompt: currentQ.prompt,
      userAnswer: answer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      timeTaken: timeTakenForQuestion
    };
    const newAnswers = [...attemptAnswers, newAnswer];
    setAttemptAnswers(newAnswers);

    let currentScore = score;
    let currentCombo = combo;
    let currentEnergy = energy;

    if (isCorrect) {
      setLastEffect('correct');
      if (engineRef.current) {
        engineRef.current.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#4ade80', 50); // green
      }
      currentCombo += 1;
      currentEnergy = Math.min(currentEnergy + 10, 100);
      const multiplier = 1 + Math.floor(currentEnergy / 20) * 0.5;
      currentScore += Math.round(100 * multiplier);
      
      setCombo(currentCombo);
      setEnergy(currentEnergy);
      setScore(currentScore);
      
      setTimeout(() => setLastEffect(null), 600);
      setInputVal('');
      setGroupAnswers({});
      
      proceedToNext(currentScore, true, lives, wrongQuestionIds, newAnswers);
    } else {
      setLastEffect('wrong');
      if (engineRef.current) {
        engineRef.current.createExplosion(window.innerWidth / 2, window.innerHeight / 2, '#ef4444', 30); // red
      }
      currentCombo = 0;
      currentEnergy = 0;
      
      setCombo(currentCombo);
      setEnergy(currentEnergy);
      const newLives = lives - 1;
      setLives(newLives);
      const newWrongIds = [...wrongQuestionIds, currentQ.id];
      setWrongQuestionIds(newWrongIds);
      
      setTimeout(() => setLastEffect(null), 600);
      setInputVal('');
      setGroupAnswers({});
      
      setShowingWrongAnswer(true);
      setTimeout(() => {
        setShowingWrongAnswer(false);
        proceedToNext(currentScore, false, newLives, newWrongIds, newAnswers);
      }, 2000);
    }
  };

  if (loading || !task) return <div className="text-center text-[#A69B8F] py-10">載入任務中...</div>;

  const currentQ = questions[currentIndex];
  handleAnswerRef.current = handleAnswer;
  if (!currentQ) return <div className="text-center text-[#A69B8F] py-10">結束中...</div>;

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-50"
      />
      <div className={`max-w-2xl w-full mx-auto flex flex-col space-y-6 transition-all duration-300 relative z-10 ${lastEffect === 'correct' ? 'border-green-500/40' : lastEffect === 'wrong' ? 'border-[#BC7665]/40 animate-shake' : ''}`}>
        <div className="bg-[#FDFBF7]/60 backdrop-blur-md border border-[#EAE6DF] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-xs text-[#8C7A6B] font-mono tracking-wider mr-1">LIVES:</div>
          <div className="flex space-x-1.5 text-red-500 text-lg">
            {task.gameMode === 'survival' && Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <span key={i} className={i < lives ? 'opacity-100' : 'opacity-20 grayscale'}>❤️</span>
            ))}
            {task.gameMode !== 'survival' && <span className="text-[#B39969] font-bold text-sm">無限</span>}
          </div>
          {task.gameMode === 'speed' && (
            <div className="ml-4 flex items-center space-x-2">
               <div className="text-xs text-red-500 font-mono tracking-wider">TIME:</div>
               <div className="text-xl font-black text-red-500">{timeLeft}s</div>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8C7A6B] font-mono tracking-wider uppercase">Score</p>
          <p className="text-2xl font-black text-[#D4A373] font-mono">{String(score).padStart(5, '0')}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 flex items-center space-x-2 relative overflow-hidden flex-1 select-none">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 font-mono">COMBO X{combo}</p>
            <p className="text-[10px] text-[#B39969] uppercase tracking-widest font-mono">Combo Power-up</p>
          </div>
        </div>
        <div className="bg-[#FDFBF7]/60 border border-[#EAE6DF] rounded-2xl px-5 py-3 text-center min-w-[80px] transition-all">
          <p className="text-[10px] text-[#8C7A6B] uppercase tracking-widest font-mono">Multiplier</p>
          <p className="text-xl font-black text-[#B39969] font-mono">{(1 + Math.floor(energy / 20) * 0.5).toFixed(1)}X</p>
        </div>
      </div>

      <div className="bg-[#FDFBF7]/40 rounded-full p-1 border border-[#EAE6DF]/60 relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${energy}%` }}></div>
        {energy >= 100 && <div className="absolute inset-0 bg-blue-500/20 mix-blend-screen opacity-0 animate-pulse rounded-full"></div>}
      </div>

      <div className={`bg-[#FDFBF7]/80 border ${lastEffect === 'wrong' ? 'border-red-500' : lastEffect === 'correct' ? 'border-green-500' : 'border-[#EAE6DF]'} rounded-3xl p-8 text-center shadow-md relative neon-border transition-colors duration-300`}>
        {energy >= 100 && (
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 py-1.5 px-4 text-center text-xs font-black tracking-widest uppercase text-[#4A3F35] animate-pulse">
            ⚡ EXTREME ENERGY MODE! SCORE MULTIPLIED! ⚡
          </div>
        )}
        <div className={`flex items-center justify-between border-b border-[#EAE6DF] pb-4 mb-8 ${energy >= 100 ? 'pt-6' : ''}`}>
          <span className="text-xs bg-purple-500/20 text-[#B39969] font-bold px-3 py-1 rounded-full uppercase tracking-widest font-mono">
            {currentQ.type === 'multiple_choice' ? '選擇題' : currentQ.type === 'question_group' ? '題組' : '填空/問答'}
          </span>
          <span className="text-xs text-[#8C7A6B] font-mono">
            QUEST <span className="text-[#B39969] font-bold">{currentIndex + 1}</span> / {questions.length}
          </span>
        </div>
        
        {renderMedia(currentQ)}
        
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A3F35] mb-8 leading-relaxed">
          {currentQ.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}
        </h3>
        
        {currentQ.clue && (
          <p className="text-sm text-[#8C7A6B] bg-[#F5F5F0]/40 py-2 px-4 rounded-xl border border-[#EAE6DF]/40 inline-block mb-6">
            提示: {task.subject === 'pet' ? currentQ.clue.split(' / ')[0] : currentQ.clue}
          </p>
        )}

        {showingWrongAnswer && (
          <div className="bg-red-50 border border-red-500/50 p-4 rounded-xl mb-6 relative overflow-hidden text-center text-[#4A3F35]">
             <p className="font-bold mb-2 text-red-700">正確答案：<span className="text-red-900 text-xl ml-2">{currentQ.type === 'question_group' ? '請參閱解析或重新挑戰' : currentQ.correctAnswer}</span></p>
             <div className="w-full bg-[#BC7665]/20 h-1 absolute bottom-0 left-0">
               <div className="bg-red-500 h-1" style={{ animation: 'shrinkWidth 2s linear forwards' }}></div>
             </div>
          </div>
        )}
        
        {currentQ.type === 'question_group' ? (
          <div className="space-y-6 text-left">
            {currentQ.subQuestions?.map((sq, idx) => (
              <div key={sq.id} className="bg-white/50 p-4 rounded-xl border border-[#D5CFC4]">
                <p className="font-bold text-[#4A3F35] mb-3">{idx + 1}. {sq.prompt.replace(/\[SOURCE_IMAGE\]/g, '')}</p>
                {sq.type === 'multiple_choice' && sq.options ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sq.options.map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setGroupAnswers({...groupAnswers, [sq.id]: opt})}
                        className={`font-bold py-2 px-4 rounded-xl transition-all shadow-sm border ${groupAnswers[sq.id] === opt ? 'bg-[#C2A878] text-[#4A3F35] border-[#C2A878]' : 'bg-white hover:bg-[#F5F5F0] text-[#4A3F35] border-[#EAE6DF]'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={groupAnswers[sq.id] || ''}
                    onChange={e => setGroupAnswers({...groupAnswers, [sq.id]: e.target.value})}
                    placeholder="輸入答案"
                    className="w-full bg-[#F5F5F0] border border-[#D5CFC4] rounded-xl px-4 py-2 text-[#4A3F35] focus:outline-none focus:border-[#C2A878]"
                  />
                )}
              </div>
            ))}
            <button 
              onClick={() => handleAnswer(JSON.stringify(groupAnswers))}
              className="w-full py-4 px-6 bg-[#4A3F35] hover:bg-[#5A4F45] text-white font-extrabold rounded-2xl shadow-md transition-all mt-4"
            >
              送出題組答案
            </button>
          </div>
        ) : currentQ.type === 'multiple_choice' && currentQ.options ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt, idx) => (
              <button 
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="bg-white hover:bg-[#C2A878] text-[#4A3F35] font-bold py-4 px-6 rounded-2xl transition-all shadow-md"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-md mx-auto">
            <input 
              type="text" 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && inputVal && handleAnswer(inputVal)}
              placeholder="輸入你的答案"
              className="w-full bg-[#F5F5F0] border-2 border-[#D5CFC4] rounded-2xl px-5 py-4 text-center text-lg font-bold tracking-widest text-[#B39969] focus:outline-none focus:border-purple-500"
            />
            <button 
              onClick={() => inputVal && handleAnswer(inputVal)}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-extrabold rounded-2xl shadow-md transition-all"
            >
              送出答案
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export function GameOver() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const fetchAttempt = async () => {
      try {
        const snap = await getDoc(doc(db, 'attempts', attemptId));
        if (snap.exists()) {
          setAttempt({ id: snap.id, ...snap.data() } as Attempt);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  if (!attempt) return <div className="text-center py-10 text-[#A69B8F]">讀取成績中...</div>;

  return (
    <div className="max-w-xl w-full mx-auto flex flex-col space-y-6 animate-bounce-in py-10">
      <div className="bg-[#FDFBF7]/60 backdrop-blur-md border border-[#EAE6DF] rounded-3xl p-8 shadow-lg relative overflow-hidden text-center">
        <h2 className="font-serif text-3xl font-black tracking-wider text-[#4A3F35]">任務完成！</h2>
        <p className="text-[#8C7A6B] mt-2 text-sm">成績已紀錄至指揮中心。</p>
        
        {attempt.cheatCount ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-red-600 font-bold text-sm">
            ⚠️ 系統偵測到離開畫面次數：{attempt.cheatCount} 次
          </div>
        ) : null}
        <div className="grid grid-cols-3 gap-4 my-8">
          <div className="bg-[#F5F5F0]/60 border border-[#EAE6DF] rounded-2xl p-4">
            <p className="text-xs text-[#8C7A6B] font-mono">最終分數</p>
            <p className="text-3xl font-black text-[#D4A373] mt-1">{attempt.score}</p>
          </div>
          <div className="bg-[#F5F5F0]/60 border border-[#EAE6DF] rounded-2xl p-4">
            <p className="text-xs text-[#8C7A6B] font-mono">答對題數</p>
            <p className="text-3xl font-black text-[#7A8A99] mt-1">{attempt.correctCount !== undefined ? `${attempt.correctCount} / ${attempt.totalAnswered}` : (attempt.answers ? `${attempt.answers.filter(ans=>ans.isCorrect).length} / ${attempt.answers.length}` : `${Math.round(attempt.accuracy * (attempt.totalAnswered||attempt.score/100) / 100)} / ${attempt.totalAnswered || attempt.score/100}`)}</p>
          </div>
          <div className="bg-[#F5F5F0]/60 border border-[#EAE6DF] rounded-2xl p-4">
            <p className="text-xs text-[#8C7A6B] font-mono">答對率</p>
            <p className="text-3xl font-black text-[#72816B] mt-1">{attempt.accuracy}%</p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate(`/play/${attempt.taskId}`)}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-[#4A3F35] font-bold rounded-2xl shadow-sm transition-transform hover:scale-[1.02] flex justify-center items-center"
          >
            再戰一次 <RotateCcw size={18} className="ml-2" />
          </button>
          <button 
            onClick={() => navigate('/select-subject')}
            className="flex-1 py-4 bg-white hover:bg-[#EAE6DF] text-[#4A3F35] font-bold rounded-2xl transition-transform hover:scale-[1.02] flex justify-center items-center"
          >
            回首頁 <Home size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}



// Pages

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in db
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let profile: UserProfile;
        let needsUpdate = false;
        
        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
          if ((firebaseUser.email === 'ianw.solar@gmail.com' || firebaseUser.isAnonymous) && profile.role !== 'admin') {
            profile.role = 'admin';
            needsUpdate = true;
          }
        } else {
          // New user, default to player
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.isAnonymous ? '測試管理員' : (firebaseUser.displayName || 'Unknown Player'),
            photoURL: firebaseUser.photoURL || '',
            role: (firebaseUser.email === 'ianw.solar@gmail.com' || firebaseUser.isAnonymous) ? 'admin' : 'player',
            points: 0,
            streak: 0,
            unlockedFrames: ['default'],
            activeFrame: 'default'
          };
          needsUpdate = true;
        }
        
        // Daily Check-in & Streak Logic
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time
        const yesterdayDate = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
        
        if (profile.lastLoginDate !== today) {
          if (profile.lastLoginDate === yesterdayDate) {
             profile.streak = (profile.streak || 0) + 1;
          } else {
             profile.streak = 1;
          }
          profile.lastLoginDate = today;
          
          // Reward XP
          profile.points = (profile.points || 0) + 50 + (profile.streak > 1 ? 10 : 0); // 50 daily + 10 streak bonus
          needsUpdate = true;
        }
        
        if (needsUpdate) {
           await setDoc(userRef, profile, { merge: true });
        }
        
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#F5F5F0] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#B39969]">Loading Quest System...</p>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to={user.role === 'admin' ? "/admin" : "/select-subject"} />} />
          <Route path="/signin" element={!user ? <div className="min-h-screen flex flex-col pt-10 px-4"><SignIn /></div> : <Navigate to="/" />} />
          
          {/* Player Routes */}
          <Route path="/select-subject" element={user ? <SubjectSelect /> : <Navigate to="/" />} />
          <Route path="/subject/:subjectId/tasks" element={user ? <TaskSelect user={user} /> : <Navigate to="/" />} />
          <Route path="/pet-exam/:examDateId" element={user ? <PetExamRunner user={user} /> : <Navigate to="/" />} />
          <Route path="/play/:taskId" element={user ? <Gameplay user={user} /> : <Navigate to="/" />} />
          <Route path="/gameover/:attemptId" element={user ? <GameOver /> : <Navigate to="/" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard user={user} /> : <Navigate to="/" />} />
          <Route path="/shop" element={user ? <XPShop user={user} setUser={setUser} /> : <Navigate to="/" />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/admin/:subjectId" element={user && user.role === 'admin' ? <AdminSubjectView /> : <Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
