import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, limit, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db, auth, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, UploadTask } from 'firebase/storage';
import Markdown from 'react-markdown';
import type { UserProfile, Subject } from './App';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Video, FileText, MessageCircle, Send, Award, Trash, Star, Play, CheckCircle, ChevronRight, Layout, Info, User, Volume2, VolumeX, Calendar, Paperclip, Download, Plus, X, Upload, ShoppingCart, Trophy, Lock, Unlock , Edit2, GripVertical, Timer, Pause, RotateCcw, TrendingUp, Clock, Percent, Activity} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from './toast';
import { googleSignIn, getAccessToken } from './auth';
import { confirmModal } from './confirm';

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  author: string;
  createdAt: number;
}

export interface HighlightItem {
  text: string;
  color: string;
  createdAt: number;
  comment?: string;
}

export interface MaterialProgress {
  id?: string;
  userId: string;
  materialId: string;
  subjectId: string;
  completed: boolean;
  timeSpent: number;
  notes: string;
  highlights?: HighlightItem[];
  lastUpdated: number;
}

export interface CourseMaterial {
  id?: string;
  subjectId: string;
  unit: number;
  type: 'video' | 'pdf' | 'article' | 'lesson';
  title: string;
  contentUrl: string;
  description: string;
  markdownNotes?: string;
  attachments?: { name: string; url: string }[];
  createdAt: number;
  requiredMaterialIds?: string[];
}

export interface DiscussionMsg {
  id?: string;
  targetId: string; // can be a taskId, subjectId, or specific materialId
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '國語',
  math: '數學',
  science: '自然',
  social_studies: '社會',
  pet: 'PET 英文'
};

export function LandingPage() {
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
                結合經驗值、每日挑戰與排行榜，激發內在動機，讓進步看得見。
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
}

export function AnnouncementsAdminTab() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
    const q = query(collection(db, 'announcements'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
    data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setAnnouncements(data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async () => {
    if (!title || !content) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        title, content, author: '系統管理員', createdAt: Date.now()
      });
      setTitle(''); setContent(''); fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
    fetchAnnouncements();
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
      <h2 className="font-bold text-2xl mb-6 text-gray-900">發布系統公告</h2>
      <div className="space-y-4 mb-8">
        <input placeholder="公告標題" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3" />
        <textarea placeholder="公告內容..." value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 h-32" />
        <button onClick={handlePost} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">發布公告</button>
      </div>
      <h3 className="font-bold text-lg mb-4 text-gray-900">歷史公告</h3>
      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="p-4 border border-gray-100 rounded-xl flex justify-between">
            <div>
              <h4 className="font-bold text-gray-900">{a.title}</h4>
              <p className="text-gray-600 text-sm mt-1">{a.content}</p>
              <p className="text-gray-400 text-xs mt-2">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => handleDelete(a.id!)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseMaterialsAdminTab({ subjectId }: { subjectId: string }) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMat, setNewMat] = useState<Partial<CourseMaterial>>({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'materials' | 'progress'>('materials');
  const [progressRecords, setProgressRecords] = useState<MaterialProgress[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [progressGroupMode, setProgressGroupMode] = useState<'student' | 'material'>('student');

  const fetchMaterials = async () => {
    const q = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseMaterial));
    data.sort((a, b) => {
      if (a.unit !== b.unit) return a.unit - b.unit;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0);
    });
    setMaterials(data);
  };

  useEffect(() => { fetchMaterials(); }, [subjectId]);

  useEffect(() => {
    if (viewMode === 'progress') {
      const fetchProg = async () => {
        try {
          const q = query(collection(db, 'material_progress'), where('subjectId', '==', subjectId));
          const snap = await getDocs(q);
          setProgressRecords(snap.docs.map(d => d.data() as MaterialProgress));
          
          const qUsers = query(collection(db, 'users'), where('role', '==', 'player'));
          const snapUsers = await getDocs(qUsers);
          const usersList = snapUsers.docs
            .map(d => d.data() as UserProfile)
            .filter(u => u.role === 'player' && u.displayName !== '測試管理員');
          setStudents(usersList);
          
          if (usersList.length > 0) {
            if (!activeStudentId || !usersList.some(u => u.uid === activeStudentId)) {
              setActiveStudentId(usersList[0].uid);
            }
          } else {
            setActiveStudentId(null);
          }
        } catch (error) {
          console.error("Fetch progress error: ", error);
        }
      };
      fetchProg();
    }
  }, [viewMode, subjectId]);

  const handleEdit = (m: CourseMaterial) => {
    setNewMat(m);
    setEditingId(m.id || null);
    setShowForm(true);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;

    const draggedMat = materials.find(m => m.id === draggedId);
    const targetMat = materials.find(m => m.id === targetId);
    if (!draggedMat || !targetMat) return;

    const updatedMats = [...materials];
    const draggedIndex = updatedMats.findIndex(m => m.id === draggedId);
    
    // 移除被拖曳的
    updatedMats.splice(draggedIndex, 1);
    
    // 如果拖曳到不同的單元，將單元改為目標單元
    draggedMat.unit = targetMat.unit;

    // 重新塞入到目標位置
    const targetIndex = updatedMats.findIndex(m => m.id === targetId);
    updatedMats.splice(targetIndex, 0, draggedMat);

    try {
      const batchPromises = updatedMats.map((m, index) => {
        const ref = doc(db, 'materials', m.id!);
        return updateDoc(ref, {
          unit: m.unit,
          sortOrder: index
        });
      });
      await Promise.all(batchPromises);
      toast("↕️ 教材排序更新成功！");
      fetchMaterials();
    } catch (error) {
      console.error(error);
      toast("❌ 儲存順序失敗");
    }

    setDraggedId(null);
  };

  const handleSave = async () => {
    if (!newMat.title) return;
    try {
      const mat = { 
        ...newMat, 
        subjectId, 
        createdAt: newMat.createdAt || Date.now(),
        sortOrder: newMat.sortOrder !== undefined ? newMat.sortOrder : materials.length
      };
      if (editingId) {
        await updateDoc(doc(db, 'materials', editingId), mat);
      } else {
        await addDoc(collection(db, 'materials'), mat);
      }
      setShowForm(false);
      setEditingId(null);
      setNewMat({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });
      fetchMaterials();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'materials', id));
    fetchMaterials();
  };

  const groupedMaterials = materials.reduce((acc, curr) => {
    const unit = curr.unit || 1;
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(curr);
    return acc;
  }, {} as Record<number, CourseMaterial[]>);

  const formatTimeSpent = (seconds: number) => {
    if (!seconds || seconds <= 0) return '未閱讀 (0s)';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) {
      return `${s} 秒`;
    }
    return `${m} 分 ${s} 秒`;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-2xl text-gray-900">課程教材管理</h2>
          <p className="text-sm text-gray-500 mt-1">在這裡您可以管理教材順序，並查看學生學習歷程。</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setViewMode(viewMode === 'materials' ? 'progress' : 'materials')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              viewMode === 'progress' 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {viewMode === 'materials' ? '📊 查看學生學習進度' : '✏️ 返回教材編輯'}
          </button>
          {viewMode === 'materials' && (
            <button onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setNewMat({ type: 'lesson', unit: 1, title: '', contentUrl: '', description: '', markdownNotes: '', attachments: [] });
              } else {
                setShowForm(true);
              }
            }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold shadow-sm transition-all">
              {showForm ? '取消' : <><Upload size={18}/> 新增教材</>}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'materials' && (
        <>
          {showForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="text-sm font-bold text-gray-700">類型</label>
                  <select value={newMat.type} onChange={e => setNewMat({...newMat, type: e.target.value as any})} className="w-full border border-gray-200 rounded-xl p-3 bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="lesson">課程講義</option>
                    <option value="exam">考卷</option>
                    <option value="solution">考卷解答</option>
                    <option value="video">影音</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">單元</label>
                  <input type="number" value={newMat.unit} onChange={e => setNewMat({...newMat, unit: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl p-3 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="md:col-span-7">
                  <label className="text-sm font-bold text-gray-700">標題</label>
                  <input value={newMat.title} onChange={e => setNewMat({...newMat, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="例如：第一單元 基礎觀念"/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="text-sm font-bold text-gray-700">內容連結 (影片URL或檔案連結)</label>
                  <input value={newMat.contentUrl} onChange={e => setNewMat({...newMat, contentUrl: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://youtube.com/..."/>
                </div>
                <div className="md:col-span-4">
                  <label className="text-sm font-bold text-gray-700">簡短說明</label>
                  <input value={newMat.description || ''} onChange={e => setNewMat({...newMat, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="選填：章節摘要..."/>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">補充檔案連結</label>
                <div className="mt-2 space-y-2">
                  {newMat.attachments?.map((att, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={att.name} onChange={e => {
                        const newAtts = [...(newMat.attachments || [])];
                        newAtts[i].name = e.target.value;
                        setNewMat({...newMat, attachments: newAtts});
                      }} className="border border-gray-200 rounded-xl p-3 w-1/3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="檔案名稱" />
                      <input value={att.url} onChange={e => {
                        const newAtts = [...(newMat.attachments || [])];
                        newAtts[i].url = e.target.value;
                        setNewMat({...newMat, attachments: newAtts});
                      }} className="border border-gray-200 rounded-xl p-3 flex-grow bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
                      <button onClick={() => {
                        const newAtts = [...(newMat.attachments || [])];
                        newAtts.splice(i, 1);
                        setNewMat({...newMat, attachments: newAtts});
                      }} className="text-red-500 hover:bg-red-50 p-3 rounded-xl transition-colors"><Trash size={18}/></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  setNewMat({...newMat, attachments: [...(newMat.attachments || []), {name: '', url: ''}]});
                }} className="text-sm text-indigo-600 font-bold mt-2 hover:text-indigo-800 flex items-center gap-1">
                  <Plus size={16}/> 新增補充檔案
                </button>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Markdown 課程筆記</label>
                <textarea value={newMat.markdownNotes} onChange={e => setNewMat({...newMat, markdownNotes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 h-32 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="支援 Markdown 語法..."/>
              </div>
              <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold w-full hover:bg-indigo-700 transition-colors shadow-md mt-2">{editingId ? '更新教材' : '儲存教材'}</button>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(groupedMaterials).map(([unit, mats]) => (
              <div key={unit} className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Unit {unit}</h3>
                <div className="space-y-3">
                  {mats.map(m => {
                    const isBeingDragged = draggedId === m.id;
                    const isDragOver = dragOverId === m.id;
                    return (
                      <div 
                        key={m.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, m.id!)}
                        onDragOver={(e) => handleDragOver(e, m.id!)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, m.id!)}
                        className={`flex justify-between items-center p-4 border rounded-xl transition-all duration-200 select-none ${
                          isBeingDragged 
                            ? 'opacity-40 border-dashed border-indigo-300 bg-indigo-50/30 cursor-grabbing' 
                            : isDragOver
                              ? 'border-indigo-500 bg-indigo-50/40 scale-[1.01] shadow-md cursor-grabbing'
                              : 'border-gray-100 hover:border-indigo-200 hover:shadow-sm bg-white cursor-grab'
                        }`}
                        title="按住並拖曳可以調整此教材的上下順序"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0 p-1 hover:text-indigo-500 rounded hover:bg-gray-50 transition-colors">
                            <GripVertical size={18} />
                          </div>
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold shrink-0">{m.unit}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-gray-900 truncate">{m.title}</h4>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">
                              {m.type === 'video' ? '📹 影音' : m.type === 'lesson' ? '📖 課程講義' : m.type === 'exam' ? '📝 考卷' : m.type === 'solution' ? '🔑 解答' : m.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleEdit(m)} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="編輯"><Edit2 size={18}/></button>
                          <button onClick={() => handleDelete(m.id!)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="刪除"><Trash size={18}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === 'progress' && (
        <div className="space-y-6">
          {/* 切換統計維度 */}
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 max-w-sm">
            <button
              onClick={() => setProgressGroupMode('student')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                progressGroupMode === 'student'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 依學生檢視
            </button>
            <button
              onClick={() => setProgressGroupMode('material')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                progressGroupMode === 'material'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📖 依教材檢視
            </button>
          </div>

          {progressGroupMode === 'student' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 左側學生名單 */}
              <div className="lg:col-span-4 border border-gray-100 rounded-3xl p-4 bg-gray-50/50 space-y-2 max-h-[500px] overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-500 px-2 mb-3">學生名單 ({students.length})</h3>
                {students.map(s => {
                  const sRecords = progressRecords.filter(p => p.userId === s.uid);
                  const completedCount = sRecords.filter(r => r.completed).length;
                  const totalCount = materials.length;
                  
                  return (
                    <button
                      key={s.uid}
                      onClick={() => setActiveStudentId(s.uid)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left border ${
                        activeStudentId === s.uid
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          activeStudentId === s.uid ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {s.displayName ? s.displayName[0] : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-sm line-clamp-1">{s.displayName || '未命名學生'}</div>
                          <div className={`text-xs mt-0.5 ${activeStudentId === s.uid ? 'text-indigo-100' : 'text-gray-400'}`}>
                            🏆 {s.points || 0} XP
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                        activeStudentId === s.uid ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        進度: {completedCount}/{totalCount}
                      </div>
                    </button>
                  );
                })}
                {students.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">無學生資料</p>
                )}
              </div>

              {/* 右側該學生詳細教材學習資料 */}
              <div className="lg:col-span-8 border border-gray-100 rounded-3xl p-6 bg-white shadow-sm space-y-6">
                {(() => {
                  const currentStudent = students.find(s => s.uid === activeStudentId);
                  if (!currentStudent) {
                    return <div className="text-center text-gray-400 py-12">請從左側選擇一位學生以檢視詳情</div>;
                  }

                  const studentProgress = progressRecords.filter(p => p.userId === currentStudent.uid);

                  return (
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <span>{currentStudent.displayName}</span> 的學習歷程
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            最後更新時間：
                            {studentProgress.length > 0 
                              ? new Date(Math.max(...studentProgress.map(p => p.lastUpdated))).toLocaleString() 
                              : '無紀錄'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                            完成率： {Math.round((studentProgress.filter(p => p.completed).length / (materials.length || 1)) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {materials.map(m => {
                          const record = studentProgress.find(p => p.materialId === m.id);
                          return (
                            <div key={m.id} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded shrink-0">Unit {m.unit}</span>
                                  <span className="font-bold text-gray-800 text-sm truncate" title={m.title}>{m.title}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {record?.completed ? (
                                    <span className="bg-green-50 text-green-700 border border-green-100 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                      <CheckCircle size={12}/> 已完成
                                    </span>
                                  ) : (
                                    <span className="bg-gray-50 text-gray-400 border border-gray-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                                      未完成
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500 mt-3 bg-gray-50/50 p-3 rounded-xl">
                                <div>
                                  <span className="font-semibold text-gray-400 mr-1">停留時間:</span>
                                  <span className="font-mono font-bold text-gray-700">{formatTimeSpent(record?.timeSpent || 0)}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-400 mr-1">類型:</span>
                                  <span className="font-bold text-gray-600 uppercase tracking-wide">
                                    {m.type === 'video' ? '📹 影音' : m.type === 'lesson' ? '📖 課程講義' : m.type === 'exam' ? '📝 考卷' : m.type === 'solution' ? '🔑 解答' : m.type}
                                  </span>
                                </div>
                              </div>

                              {record?.notes ? (
                                <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100/80 rounded-xl relative">
                                  <div className="text-[10px] text-amber-600 font-bold mb-1">📝 學生筆記：</div>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{record.notes}</p>
                                </div>
                              ) : (
                                <div className="mt-3 p-3 bg-gray-50/30 border border-dashed border-gray-100 rounded-xl text-center">
                                  <p className="text-[11px] text-gray-400">目前無個人筆記</p>
                                </div>
                              )}

                              {record?.highlights && record.highlights.length > 0 && (
                                <div className="mt-2.5 p-3.5 bg-yellow-50/50 border border-yellow-100/80 rounded-xl relative">
                                  <div className="text-[10px] text-yellow-600 font-bold mb-1.5 flex items-center gap-1">
                                    <span>💡 學生劃線重點 ({record.highlights.length})：</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {record.highlights.map((h, hIdx) => (
                                      <div key={hIdx} className="text-[11px] text-gray-700 bg-white border border-gray-200/60 p-2.5 rounded-xl">
                                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400 font-bold">
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            h.color === 'yellow' ? 'bg-yellow-400' :
                                            h.color === 'green' ? 'bg-green-400' :
                                            h.color === 'blue' ? 'bg-blue-400' : 'bg-pink-400'
                                          }`} />
                                          <span className="uppercase">{h.color === 'yellow' ? '黃色標記' : h.color === 'green' ? '綠色標記' : h.color === 'blue' ? '藍色標記' : '粉色標記'}</span>
                                        </div>
                                        <p className="italic font-medium leading-relaxed">"{h.text}"</p>
                                        {h.comment && (
                                          <p className="mt-1.5 pl-2 border-l-2 border-indigo-500/30 text-gray-500 text-[10px] leading-normal font-normal">
                                            ✍️ 學生備註：{h.comment}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {materials.length === 0 && (
                          <p className="text-center text-sm text-gray-400 py-12">此科目尚未上傳任何教材</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* 依教材檢視 */
            <div className="space-y-4">
              {materials.map(m => {
                const matRecords = progressRecords.filter(p => p.materialId === m.id);
                return (
                  <div key={m.id} className="border border-gray-100 rounded-3xl p-5 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-50 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded">Unit {m.unit}</span>
                          <h3 className="font-bold text-gray-900">{m.title}</h3>
                        </div>
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider block mt-1">
                          {m.type === 'video' ? '📹 影音' : m.type === 'lesson' ? '📖 課程講義' : m.type === 'exam' ? '📝 考卷' : m.type === 'solution' ? '🔑 解答' : m.type}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 shrink-0">
                        <div>
                          已完成學生數: <span className="font-bold text-green-600">{matRecords.filter(r => r.completed).length} 人</span>
                        </div>
                        <div>
                          總研讀次數: <span className="font-bold text-gray-700">{matRecords.length} 人次</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-bold">
                            <th className="pb-2">學生姓名</th>
                            <th className="pb-2">狀態</th>
                            <th className="pb-2">停留時間</th>
                            <th className="pb-2">筆記內容</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(s => {
                            const r = matRecords.find(record => record.userId === s.uid);
                            return (
                              <tr key={s.uid} className="border-b border-gray-50/50 last:border-0">
                                <td className="py-2.5 font-bold text-gray-800">{s.displayName || '未命名學生'}</td>
                                <td className="py-2.5">
                                  {r?.completed ? (
                                    <span className="text-green-600 font-bold flex items-center gap-0.5"><CheckCircle size={12}/> 已完成</span>
                                  ) : r ? (
                                    <span className="text-amber-600 font-semibold">研讀中</span>
                                  ) : (
                                    <span className="text-gray-300">未開始</span>
                                  )}
                                </td>
                                <td className="py-2.5 font-mono text-gray-600">{formatTimeSpent(r?.timeSpent || 0)}</td>
                                <td className="py-2.5 max-w-md">
                                  {r?.notes ? (
                                    <div className="bg-amber-50/40 p-2 rounded border border-amber-100/60 text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap mb-1.5" title={r.notes}>
                                      {r.notes}
                                    </div>
                                  ) : null}
                                  {r?.highlights && r.highlights.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {r.highlights.map((h, hIdx) => (
                                        <span 
                                          key={hIdx} 
                                          className={`text-[9px] px-1.5 py-0.5 rounded-full border truncate max-w-[120px] font-medium inline-block ${
                                            h.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                            h.color === 'green' ? 'bg-green-50 border-green-200 text-green-700' :
                                            h.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            'bg-pink-50 border-pink-200 text-pink-700'
                                          }`} 
                                          title={`"${h.text}"${h.comment ? ` (備註: ${h.comment})` : ''}`}
                                        >
                                          💡 {h.text}
                                        </span>
                                      ))}
                                    </div>
                                  ) : !r?.notes ? (
                                    <span className="text-gray-300 italic">無</span>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              {materials.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-12">此科目尚未上傳任何教材</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface DiscussionPost {
  id?: string;
  subjectId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  replies?: any[];
}

export function DiscussionBoard({ subjectId, user }: { subjectId: string, user: UserProfile }) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'discussions'), where('subjectId', '==', subjectId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscussionPost)));
    });
    return unsub;
  }, [subjectId]);

  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    try {
      await addDoc(collection(db, 'discussions'), {
        subjectId, authorId: user.uid, authorName: user.displayName, content: newPost, createdAt: Date.now(), replies: []
      });
      setNewPost('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3"><MessageCircle className="text-indigo-500"/> 科目討論版</h2>
      <div className="mb-8 flex gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold shrink-0">{user.displayName ? user.displayName[0] : 'U'}</div>
        <div className="flex-grow">
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="有什麼問題想討論嗎？" className="w-full border border-gray-200 rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"/>
          <div className="flex justify-end mt-3">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"><Send size={16}/> 發布</button>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">{post.authorName ? post.authorName[0] : 'U'}</div>
              <div>
                <span className="font-bold text-gray-900 text-sm block">{post.authorName}</span>
                <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap pl-11">{post.content}</p>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center text-gray-500 py-10">目前還沒有討論，來做第一個發問的人吧！</p>}
      </div>
    </div>
  );
}

export function CourseMaterialsStudentView({ subjectId, user }: { subjectId: string, user: UserProfile }) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [activeMat, setActiveMat] = useState<CourseMaterial | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progressData, setProgressData] = useState<Record<string, MaterialProgress>>({});
  const [notesText, setNotesText] = useState('');
  const [fontSize, setFontSize] = useState<number>(16);

  const markdownRef = useRef<HTMLDivElement>(null);
  const fullscreenMarkdownRef = useRef<HTMLDivElement>(null);

  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [clickedHighlight, setClickedHighlight] = useState<{ index: number; text: string; color: string; x: number; y: number } | null>(null);

  const handleSelectionDetect = (e: MouseEvent | TouchEvent) => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();

    const target = e.target as HTMLElement;
    if (target.closest('.highlighter-toolbar') || target.closest('.highlight-menu') || target.closest('mark.custom-highlight')) return;

    const isInsideNormal = markdownRef.current?.contains(selection.anchorNode);
    const isInsideFullscreen = fullscreenMarkdownRef.current?.contains(selection.anchorNode);

    if (text.length > 0 && (isInsideNormal || isInsideFullscreen)) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionPosition({
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top - 55 + window.scrollY
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setSelectedText('');
      setSelectionPosition(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionDetect);
    document.addEventListener('touchend', handleSelectionDetect);
    return () => {
      document.removeEventListener('mouseup', handleSelectionDetect);
      document.removeEventListener('touchend', handleSelectionDetect);
    };
  }, [activeMat?.id, progressData]);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark.custom-highlight');
      if (mark) {
        const hIdxStr = mark.getAttribute('data-h-idx');
        if (hIdxStr !== null) {
          const index = parseInt(hIdxStr, 10);
          const highlights = progressData[activeMat?.id!]?.highlights || [];
          const h = highlights[index];
          if (h) {
            const rect = mark.getBoundingClientRect();
            setClickedHighlight({
              index,
              text: h.text,
              color: h.color,
              x: rect.left + rect.width / 2 + window.scrollX,
              y: rect.top - 55 + window.scrollY
            });
            setSelectedText('');
            setSelectionPosition(null);
            return;
          }
        }
      }
      
      if (!target.closest('.highlight-menu')) {
        setClickedHighlight(null);
      }
    };
    
    document.addEventListener('click', handleDocClick);
    return () => {
      document.removeEventListener('click', handleDocClick);
    };
  }, [activeMat?.id, progressData]);

  const addHighlight = async (color: string) => {
    if (!activeMat?.id) return;
    const currentHighlights = progressData[activeMat.id]?.highlights || [];
    const newHighlight = {
      text: selectedText,
      color,
      createdAt: Date.now()
    };
    const updated = [...currentHighlights, newHighlight];
    await saveProgress(activeMat.id, { highlights: updated });
    toast(`💡 已劃線標記！`);
    
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionPosition(null);
  };

  const updateHighlightColor = async (idx: number, newColor: string) => {
    if (!activeMat?.id) return;
    const currentHighlights = progressData[activeMat.id]?.highlights || [];
    const updated = [...currentHighlights];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], color: newColor };
      await saveProgress(activeMat.id, { highlights: updated }, true);
      toast("🎨 已更換重點標記顏色！");
    }
    setClickedHighlight(null);
  };

  const appendSelectedToNotes = async () => {
    if (!activeMat?.id) return;
    const separator = notesText.trim() ? '\n\n' : '';
    const addedText = `> ${selectedText}`;
    const newNotes = notesText + separator + addedText;
    setNotesText(newNotes);
    await saveProgress(activeMat.id, { notes: newNotes });
    toast(`📝 已成功將此段文字匯入個人筆記！`);
    
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionPosition(null);
  };

  const applyHighlightsToDOM = () => {
    const container = isFullscreen ? fullscreenMarkdownRef.current : markdownRef.current;
    if (!container) return;
    
    const existingMarks = container.querySelectorAll('mark.custom-highlight');
    existingMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });

    const currentHighlights = progressData[activeMat?.id!]?.highlights || [];
    if (currentHighlights.length === 0) return;

    const highlightTextNode = (node: Node, highlightText: string, color: string, hIdx: number) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        const index = text.toLowerCase().indexOf(highlightText.toLowerCase());
        if (index >= 0) {
          const matchedText = text.substring(index, index + highlightText.length);
          const before = text.substring(0, index);
          const after = text.substring(index + highlightText.length);

          const mark = document.createElement('mark');
          mark.className = `custom-highlight highlight-${color} px-1 rounded cursor-pointer transition-all hover:opacity-80`;
          mark.setAttribute('data-h-idx', String(hIdx));
          
          if (color === 'yellow') mark.style.backgroundColor = '#fef08a';
          else if (color === 'green') mark.style.backgroundColor = '#bbf7d0';
          else if (color === 'blue') mark.style.backgroundColor = '#bfdbfe';
          else if (color === 'pink') mark.style.backgroundColor = '#fbcfe8';
          
          mark.style.color = '#1f2937';
          mark.textContent = matchedText;

          const parent = node.parentNode;
          if (parent) {
            const beforeNode = document.createTextNode(before);
            const afterNode = document.createTextNode(after);

            parent.insertBefore(beforeNode, node);
            parent.insertBefore(mark, node);
            parent.insertBefore(afterNode, node);
            parent.removeChild(node);

            highlightTextNode(afterNode, highlightText, color, hIdx);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE' && !element.classList.contains('custom-highlight')) {
          const children = Array.from(node.childNodes);
          children.forEach(child => highlightTextNode(child, highlightText, color, hIdx));
        }
      }
    };

    currentHighlights.forEach((h, hIdx) => {
      if (h.text && h.text.trim()) {
        highlightTextNode(container, h.text, h.color, hIdx);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      applyHighlightsToDOM();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeMat?.id, progressData, fontSize, isFullscreen]);

  const handleDeleteHighlight = async (idx: number) => {
    if (!activeMat?.id) return;
    const currentHighlights = progressData[activeMat.id]?.highlights || [];
    const updated = [...currentHighlights];
    updated.splice(idx, 1);
    await saveProgress(activeMat.id, { highlights: updated }, true);
    toast("🗑️ 已成功刪除該重點標記！");
    setClickedHighlight(null);
  };



  // 1. 監聽教材進度 (監聽符合 userId 與 subjectId 的 material_progress)
  useEffect(() => {
    if (!user?.uid || !subjectId) return;
    const q = query(
      collection(db, 'material_progress'),
      where('userId', '==', user.uid),
      where('subjectId', '==', subjectId)
    );
    const unsub = onSnapshot(q, snap => {
      const data: Record<string, MaterialProgress> = {};
      snap.docs.forEach(doc => {
        const d = doc.data() as MaterialProgress;
        data[d.materialId] = { ...d, id: doc.id };
      });
      setProgressData(data);
    });
    return unsub;
  }, [subjectId, user?.uid]);

  // 2. 當切換教材時，載入對應教材的個人筆記
  useEffect(() => {
    if (activeMat) {
      setNotesText(progressData[activeMat.id!]?.notes || '');
    }
  }, [activeMat?.id, progressData]);

  // 3. 監聽教材列表
  useEffect(() => {
    const q = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseMaterial));
      data.sort((a, b) => {
        if (a.unit !== b.unit) return a.unit - b.unit;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0);
      });
      setMaterials(data);
      if (data.length > 0 && !activeMat) setActiveMat(data[0]);
    });
    return unsub;
  }, [subjectId]);

  // 儲存進度、筆記與完成狀態的核心方法
  const saveProgress = async (matId: string, data: Partial<MaterialProgress> & { timeSpentIncrement?: number }, silent = false) => {
    if (!user?.uid || !subjectId) return;
    const existing = latestProgressDataRef.current[matId];

    try {
      const isFirstTimeComplete = !existing?.completed && data.completed;
      const docId = `${user.uid}_${matId}`;
      const docRef = doc(db, 'material_progress', docId);

      const updateData: any = {
        userId: user.uid,
        materialId: matId,
        subjectId: subjectId,
        lastUpdated: Date.now()
      };

      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.highlights !== undefined) updateData.highlights = data.highlights;
      
      if (data.timeSpentIncrement !== undefined) {
        updateData.timeSpent = increment(data.timeSpentIncrement);
      } else if (data.timeSpent !== undefined) {
        updateData.timeSpent = data.timeSpent;
      }

      await setDoc(docRef, updateData, { merge: true });

      if (isFirstTimeComplete) {
        // 完成教材贈送 50 XP！
        const userRef = doc(db, 'users', user.uid);
        const newPoints = (user.points || 0) + 50;
        await updateDoc(userRef, { points: newPoints });
        if (!silent) toast("🎉 恭喜完成教材！獲得 50 XP 獎勵！");
      } else if (data.notes !== undefined) {
        if (!silent) toast("📝 筆記儲存成功！");
      } else if (data.timeSpentIncrement === undefined && data.timeSpent === undefined) {
        if (!silent) toast("✅ 狀態更新成功！");
      }
    } catch (e) {
      console.error("Save progress error:", e);
      if (!silent) toast("❌ 儲存失敗，請稍後再試");
    }
  };

  // 4. 教材停留時間統計
  const timeRef = useRef<number>(0);
  const activeMatRef = useRef<string | null>(null);
  const latestProgressDataRef = useRef<Record<string, MaterialProgress>>({});

  useEffect(() => {
    latestProgressDataRef.current = progressData;
  }, [progressData]);

  useEffect(() => {
    if (!activeMat?.id || !user?.uid) return;
    
    activeMatRef.current = activeMat.id;
    timeRef.current = 0;

    // 定期同步秒數到資料庫的函數
    const syncTimeSpent = async () => {
      const currentMatId = activeMatRef.current;
      const secondsToSave = timeRef.current;
      if (!currentMatId || secondsToSave <= 0) return;

      // 重置當前計時
      timeRef.current = 0;

      // 靜默儲存，使用 increment
      await saveProgress(currentMatId, { timeSpentIncrement: secondsToSave }, true);
    };

    const interval = setInterval(() => {
      timeRef.current += 1;
      // 每 15 秒自動跟資料庫同步一次，避免斷電或關閉網頁失去太多記錄
      if (timeRef.current >= 15) {
        syncTimeSpent();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      // 當切換教材或 unmount 時，做最後一次同步
      syncTimeSpent();
    };
  }, [activeMat?.id, user?.uid]);

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

  const getAbsoluteUrl = (url: string) => {
    if (!url) return '';
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    return cleanUrl;
  };

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const absoluteUrl = getAbsoluteUrl(url);
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
      const match = absoluteUrl.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      return absoluteUrl;
    } catch (e) {
      // Ignore
    }
    return url;
  };

  const groupedMaterials = materials.reduce((acc, curr) => {
    const unit = curr.unit || 1;
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(curr);
    return acc;
  }, {} as Record<number, CourseMaterial[]>);

  if (isFullscreen && activeMat) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10 relative">
          <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 lg:-right-16 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-all">
            <X size={24}/>
          </button>
          
          <h2 className="text-4xl font-black text-gray-900 mb-2">{activeMat.title}</h2>
          {activeMat.description && <p className="text-gray-500 mb-8 text-lg">{activeMat.description}</p>}

          {/* 全螢幕控制條 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {/* 字體大小調整 */}
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100 text-xs">
                <span className="text-gray-500 px-2 font-bold">字體大小</span>
                <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors font-bold text-gray-700">
                  A-
                </button>
                <span className="font-mono font-bold text-gray-700 px-1">{fontSize}px</span>
                <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors font-bold text-gray-700">
                  A+
                </button>
              </div>
            </div>

            {/* 完成教材按鈕 */}
            <button 
              onClick={() => saveProgress(activeMat.id!, { completed: !progressData[activeMat.id!]?.completed })} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                progressData[activeMat.id!]?.completed 
                  ? 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:-translate-y-0.5'
              }`}
            >
              {progressData[activeMat.id!]?.completed ? (
                <><CheckCircle size={18} className="text-green-600" /> 已完成此教材</>
              ) : (
                '我已完成這份教材'
              )}
            </button>
          </div>

          {(activeMat.type === 'video' || activeMat.contentUrl) && (
            <div className="aspect-video bg-black rounded-3xl overflow-hidden mb-12 shadow-2xl">
              {(() => {
                const absUrl = getAbsoluteUrl(activeMat.contentUrl || '');
                if (absUrl.includes('youtube.com') || absUrl.includes('youtu.be') || absUrl.includes('youtube-nocookie.com')) {
                  return <iframe src={getYoutubeEmbedUrl(activeMat.contentUrl || '')} className="w-full h-full border-0" allowFullScreen></iframe>;
                } else if (absUrl) {
                  return <video src={absUrl} controls className="w-full h-full"></video>;
                }
                return null;
              })()}
            </div>
          )}

          {activeMat.markdownNotes && (
            <div className="relative mt-8 text-left">
              <button onClick={toggleTTS} className="absolute -top-16 right-0 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm">
                {isPlayingTTS ? <><VolumeX size={18}/> 停止朗讀</> : <><Volume2 size={18}/> 語音朗讀</>}
              </button>
              <div 
                ref={fullscreenMarkdownRef}
                className="prose prose-lg prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700"
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.75' }}
              >
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

          {/* 全螢幕下的個人筆記區塊 */}
          <div className="mt-16 pt-10 border-t border-gray-100 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit2 size={20} className="text-indigo-500"/> 個人筆記 📝
              </h3>
              <button 
                onClick={() => saveProgress(activeMat.id!, { notes: notesText })} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Send size={14}/> 儲存個人筆記
              </button>
            </div>
            <textarea 
              value={notesText} 
              onChange={e => setNotesText(e.target.value)} 
              className="w-full h-48 p-5 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 text-gray-800 placeholder-gray-400 transition-all text-base leading-relaxed shadow-inner"
              placeholder="在此記錄您的個人學習重點、筆記、或是遇到的問題... 點擊儲存筆記即可永久儲存至您的個人帳戶中！"
            />

            {/* 全螢幕下的個人劃線重點庫 */}
            {progressData[activeMat.id!]?.highlights && progressData[activeMat.id!]?.highlights!.length > 0 && (
              <div className="mt-8 space-y-4">
                <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>💡 全螢幕劃線重點庫 ({progressData[activeMat.id!]?.highlights!.length})</span>
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {progressData[activeMat.id!]?.highlights!.map((h, hIdx) => (
                    <div 
                      key={hIdx} 
                      className={`p-4 rounded-3xl border relative text-sm leading-relaxed transition-all ${
                        h.color === 'yellow' ? 'bg-yellow-50/70 border-yellow-200 text-yellow-900' :
                        h.color === 'green' ? 'bg-green-50/70 border-green-200 text-green-900' :
                        h.color === 'blue' ? 'bg-blue-50/70 border-blue-200 text-blue-900' :
                        'bg-pink-50/70 border-pink-200 text-pink-900'
                      }`}
                    >
                      <button 
                        onClick={() => handleDeleteHighlight(hIdx)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1.5 rounded-full transition-colors"
                        title="刪除此重點"
                      >
                        <Trash size={14} />
                      </button>
                      <p className="font-semibold select-all pr-8 whitespace-pre-wrap">"{h.text}"</p>
                      <div className="mt-2 text-xs text-gray-400 font-medium">
                        劃記於 {new Date(h.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
      <div className="lg:w-1/3 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3"><BookOpen className="text-indigo-500"/> 課程章節</h2>
        
        {Object.entries(groupedMaterials).map(([unit, mats]) => (
          <div key={unit} className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Unit {unit}</h3>
            <div className="space-y-3">
              {mats.map(m => {
                const isCompleted = progressData[m.id!]?.completed || false;
                return (
                  <button 
                    key={m.id} 
                    onClick={() => { setActiveMat(m); window.speechSynthesis.cancel(); setIsPlayingTTS(false); }} 
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                      activeMat?.id === m.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg transform scale-[1.02]' 
                        : isCompleted
                          ? 'bg-green-50/50 border-green-200 text-gray-700 hover:border-green-300 hover:shadow-md'
                          : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        activeMat?.id === m.id 
                          ? 'bg-white/20 text-white' 
                          : isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {isCompleted ? <CheckCircle size={20} /> : m.unit}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-sm">{m.title}</div>
                        <div className={`text-xs mt-1 uppercase tracking-wider ${
                          activeMat?.id === m.id ? 'text-indigo-100' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {m.type === 'video' ? '📹 影音' : m.type === 'lesson' ? '📖 課程講義' : m.type === 'exam' ? '📝 考卷' : m.type === 'solution' ? '🔑 解答' : m.type}
                        </div>
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle 
                        size={18} 
                        className={`shrink-0 ml-2 ${activeMat?.id === m.id ? 'text-white' : 'text-green-500'}`} 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      </div>
      <div className="lg:w-2/3">
        {activeMat ? (
          <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 relative">
            <button onClick={() => setIsFullscreen(true)} className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 p-3 rounded-full transition-all" title="全螢幕無擾模式">
              <Layout size={20}/>
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 pr-16">{activeMat.title}</h2>
            {activeMat.description && <p className="text-gray-500 mb-4">{activeMat.description}</p>}
            
            {/* 普通模式控制條 */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {/* 字體大小調整 */}
                <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-500 px-2 font-bold">字體大小</span>
                  <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors font-bold text-gray-700" title="縮小字體">
                    A-
                  </button>
                  <span className="font-mono font-bold text-gray-700 px-1">{fontSize}px</span>
                  <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors font-bold text-gray-700" title="放大字體">
                    A+
                  </button>
                </div>
              </div>

              {/* 完成教材按鈕 */}
              <button 
                onClick={() => saveProgress(activeMat.id!, { completed: !progressData[activeMat.id!]?.completed })} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                  progressData[activeMat.id!]?.completed 
                    ? 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:-translate-y-0.5'
                }`}
              >
                {progressData[activeMat.id!]?.completed ? (
                  <><CheckCircle size={18} className="text-green-600" /> 已完成此教材</>
                ) : (
                  '我已完成這份教材'
                )}
              </button>
            </div>

            {(activeMat.type === 'video' || activeMat.contentUrl) && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-inner mt-6">
                {(() => {
                  const absUrl = getAbsoluteUrl(activeMat.contentUrl || '');
                  if (absUrl.includes('youtube.com') || absUrl.includes('youtu.be') || absUrl.includes('youtube-nocookie.com')) {
                    return <iframe src={getYoutubeEmbedUrl(activeMat.contentUrl || '')} className="w-full h-full border-0" allowFullScreen></iframe>;
                  } else if (absUrl) {
                    return <video src={absUrl} controls className="w-full h-full"></video>;
                  }
                  return null;
                })()}
              </div>
            )}
            
            {activeMat.markdownNotes && (
              <div className="relative mt-12 text-left">
                <button onClick={toggleTTS} className="absolute -top-12 right-0 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                  {isPlayingTTS ? <><VolumeX size={18}/> 停止朗讀</> : <><Volume2 size={18}/> 語音朗讀</>}
                </button>
                <div 
                  ref={markdownRef}
                  className="prose prose-indigo max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 bg-gray-50/50 p-8 rounded-2xl border border-gray-100"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.75' }}
                >
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

            {/* 個人筆記區塊 */}
            <div className="mt-12 pt-10 border-t border-gray-100 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 size={18} className="text-indigo-500"/> 個人筆記 📝
                </h3>
                <button 
                  onClick={() => saveProgress(activeMat.id!, { notes: notesText })} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <Send size={14}/> 儲存筆記
                </button>
              </div>
              <textarea 
                value={notesText} 
                onChange={e => setNotesText(e.target.value)} 
                className="w-full h-44 p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/30 text-gray-800 placeholder-gray-400 transition-all text-sm leading-relaxed"
                placeholder="在此記錄您的個人學習重點、筆記、或是遇到的問題... 點擊儲存筆記即可永久儲存至您的個人帳戶中！"
              />

              {/* 個人劃線重點庫 */}
              {progressData[activeMat.id!]?.highlights && progressData[activeMat.id!]?.highlights!.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <span>💡 劃線重點庫 ({progressData[activeMat.id!]?.highlights!.length})</span>
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {progressData[activeMat.id!]?.highlights!.map((h, hIdx) => (
                      <div 
                        key={hIdx} 
                        className={`p-3.5 rounded-2xl border relative text-xs leading-relaxed transition-all ${
                          h.color === 'yellow' ? 'bg-yellow-50/70 border-yellow-200 text-yellow-900' :
                          h.color === 'green' ? 'bg-green-50/70 border-green-200 text-green-900' :
                          h.color === 'blue' ? 'bg-blue-50/70 border-blue-200 text-blue-900' :
                          'bg-pink-50/70 border-pink-200 text-pink-900'
                        }`}
                      >
                        <button 
                          onClick={() => handleDeleteHighlight(hIdx)}
                          className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                          title="刪除此重點"
                        >
                          <Trash size={12} />
                        </button>
                        <p className="font-semibold select-all pr-6 whitespace-pre-wrap">"{h.text}"</p>
                        <div className="mt-2 text-[10px] text-gray-400 font-medium">
                          劃記於 {new Date(h.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
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

      {/* 劃線浮動工具列 */}
      {selectedText && selectionPosition && createPortal(
        <div 
          className="highlighter-toolbar absolute z-[9999] flex items-center gap-1.5 bg-gray-900 border border-gray-800 text-white px-3 py-2 rounded-full shadow-2xl -translate-x-1/2 scale-100 animate-in fade-in duration-200"
          style={{ 
            left: `${selectionPosition.x}px`, 
            top: `${selectionPosition.y}px` 
          }}
        >
          {/* Colors */}
          <button 
            onClick={() => addHighlight('yellow')} 
            className="w-5 h-5 rounded-full bg-yellow-300 hover:scale-110 active:scale-95 transition-transform" 
            title="黃色劃線"
          />
          <button 
            onClick={() => addHighlight('green')} 
            className="w-5 h-5 rounded-full bg-green-300 hover:scale-110 active:scale-95 transition-transform" 
            title="綠色劃線"
          />
          <button 
            onClick={() => addHighlight('blue')} 
            className="w-5 h-5 rounded-full bg-blue-300 hover:scale-110 active:scale-95 transition-transform" 
            title="藍色劃線"
          />
          <button 
            onClick={() => addHighlight('pink')} 
            className="w-5 h-5 rounded-full bg-pink-300 hover:scale-110 active:scale-95 transition-transform" 
            title="粉色劃線"
          />
          <div className="w-[1px] h-4 bg-gray-700 mx-1" />
          <button 
            onClick={appendSelectedToNotes} 
            className="flex items-center gap-1 hover:text-indigo-300 text-xs font-bold px-1.5 py-0.5 rounded transition-colors"
            title="匯入至個人筆記"
          >
            <Plus size={12}/> 筆記
          </button>
        </div>,
        document.body
      )}

      {/* 筆記標記編輯工具列 */}
      {clickedHighlight && createPortal(
        <div 
          className="highlight-menu absolute z-[9999] flex items-center gap-1.5 bg-gray-900 border border-gray-800 text-white px-3 py-2 rounded-full shadow-2xl -translate-x-1/2 scale-100 animate-in fade-in duration-200"
          style={{ 
            left: `${clickedHighlight.x}px`, 
            top: `${clickedHighlight.y}px` 
          }}
        >
          {/* Colors */}
          <button 
            onClick={() => updateHighlightColor(clickedHighlight.index, 'yellow')} 
            className={`w-5 h-5 rounded-full bg-yellow-300 hover:scale-110 active:scale-95 transition-transform ${clickedHighlight.color === 'yellow' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`} 
            title="黃色劃線"
          />
          <button 
            onClick={() => updateHighlightColor(clickedHighlight.index, 'green')} 
            className={`w-5 h-5 rounded-full bg-green-300 hover:scale-110 active:scale-95 transition-transform ${clickedHighlight.color === 'green' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`} 
            title="綠色劃線"
          />
          <button 
            onClick={() => updateHighlightColor(clickedHighlight.index, 'blue')} 
            className={`w-5 h-5 rounded-full bg-blue-300 hover:scale-110 active:scale-95 transition-transform ${clickedHighlight.color === 'blue' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`} 
            title="藍色劃線"
          />
          <button 
            onClick={() => updateHighlightColor(clickedHighlight.index, 'pink')} 
            className={`w-5 h-5 rounded-full bg-pink-300 hover:scale-110 active:scale-95 transition-transform ${clickedHighlight.color === 'pink' ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}`} 
            title="粉色劃線"
          />
          <div className="w-[1px] h-4 bg-gray-700 mx-1" />
          <button 
            onClick={() => handleDeleteHighlight(clickedHighlight.index)} 
            className="flex items-center gap-1 hover:text-red-400 text-xs font-bold px-1.5 py-0.5 rounded transition-colors text-red-300"
            title="刪除劃線"
          >
            <Trash size={12}/> 刪除
          </button>
        </div>,
        document.body
      )}

    </div>
  );
}

export function GamificationProfile({ user }: { user: UserProfile }) {
  const xp = user.points || 0;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className="bg-white rounded-3xl border border-[#EAE6DF] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-24 h-24 rounded-full bg-[#EAE2D3] flex items-center justify-center border-4 border-[#C2A878]">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
        ) : (
          <User size={40} className="text-[#B39969]" />
        )}
        <div className="absolute -bottom-2 bg-[#4A3F35] text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white">
          Lv. {level}
        </div>
      </div>
      <div className="flex-1 w-full space-y-2">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-bold text-[#4A3F35] font-serif">{user.displayName}</h2>
          <span className="text-sm font-bold text-[#8C7A6B]">{xp} XP</span>
        </div>
        <div className="w-full bg-[#FDFBF7] h-3 rounded-full overflow-hidden border border-[#EAE6DF]">
          <div className="bg-gradient-to-r from-[#C2A878] to-[#B39969] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, progress)}%` }}></div>
        </div>
        <p className="text-xs text-right text-[#A69B8F]">距離升級還需 {nextLevelXp - xp} XP</p>
      </div>
      <div className="w-full md:w-auto flex items-center gap-3 justify-start md:justify-end border-t md:border-t-0 md:border-l border-[#EAE6DF] pt-4 md:pt-0 md:pl-6">
        <div className="bg-[#FDFBF7] border border-[#EAE6DF] px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-sm">
            🔥
          </div>
          <div>
            <p className="text-[10px] text-[#8C7A6B] font-bold">連續登入</p>
            <p className="text-sm font-black text-[#4A3F35]">{user.streak || 1} 天</p>
          </div>
        </div>
      </div>
    </div>
  );
}



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

export function StudyTimer() {
  const [mode, setMode] = useState<'study' | 'short_break' | 'long_break'>('study');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Focus Island & Spirit companion states
  const [panelStyle, setPanelStyle] = useState<'zen' | 'cyber' | 'nordic'>('zen');
  const [tickSound, setTickSound] = useState<'none' | 'wooden' | 'chime' | 'gear'>('none');
  const [spiritState, setSpiritState] = useState<'idle' | 'focusing' | 'distracted' | 'abandon'>('idle');
  const [islandProgress, setIslandProgress] = useState(15); // 0 - 100
  const [activeRightTab, setActiveRightTab] = useState<'island' | 'noise'>('island');

  // White noise synthesizer states
  const [rainActive, setRainActive] = useState(false);
  const [rainVol, setRainVol] = useState(50);

  const [wavesActive, setWavesActive] = useState(false);
  const [wavesVol, setWavesVol] = useState(50);

  const [windActive, setWindActive] = useState(false);
  const [windVol, setWindVol] = useState(50);

  const [brownActive, setBrownActive] = useState(false);
  const [brownVol, setBrownVol] = useState(50);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Rain Nodes refs
  const rainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);

  // Waves Nodes refs
  const wavesSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const wavesGainRef = useRef<GainNode | null>(null);
  const wavesLfoRef = useRef<OscillatorNode | null>(null);

  // Forest Wind Nodes refs
  const windSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const windFilterRef = useRef<BiquadFilterNode | null>(null);
  const windLfoRef = useRef<OscillatorNode | null>(null);

  // Deep Brown Nodes refs
  const brownSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const brownGainRef = useRef<GainNode | null>(null);

  // Play custom synth tick sounds
  const playTickSound = (soundType: 'none' | 'wooden' | 'chime' | 'gear') => {
    if (soundType === 'none') return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (soundType === 'wooden') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.1);
      } else if (soundType === 'chime') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
      } else if (soundType === 'gear') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.03);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Timer useEffect with tick sound and island growth
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      if (mode === 'study' && spiritState !== 'distracted') {
        setSpiritState('focusing');
      }

      interval = setInterval(() => {
        // Ticking Sound Effect
        if (soundEnabled && tickSound !== 'none') {
          playTickSound(tickSound);
        }

        // Island Grow effect (0.4 progress point per second in study mode)
        if (mode === 'study') {
          setIslandProgress(prev => {
            const next = prev + 0.4;
            if (next >= 100) {
              toast("✨ 恭喜！你的專念小島完全成熟了！精靈送給你 10 XP 當作勤奮獎勵！🏝️");
              return 0; // reset
            }
            return next;
          });
        }

        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished!
            playAlertSound();
            setIsActive(false);
            setSpiritState('idle');
            if (mode === 'study') {
              toast("🎉 專注時間結束！休息一下吧！");
              handleModeChange('short_break');
            } else {
              toast("💪 休息結束！準備好繼續專注了嗎？");
              handleModeChange('study');
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, mode, tickSound, soundEnabled, spiritState]);

  // Handle Tab distraction and Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isActive && mode === 'study') {
          setSpiritState('distracted');
          setIslandProgress(prev => Math.max(0, prev - 3));
          toast("⚠️ 偵測到您離開了專注頁面！讀書精靈正在失落哭泣，快回來和牠一起讀書吧！");
        }
      } else {
        if (isActive && mode === 'study') {
          setSpiritState('focusing');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, mode]);

  const handleModeChange = (newMode: 'study' | 'short_break' | 'long_break') => {
    setMode(newMode);
    setIsActive(false);
    setSpiritState('idle');
    if (newMode === 'study') {
      setMinutes(25);
    } else if (newMode === 'short_break') {
      setMinutes(5);
    } else {
      setMinutes(15);
    }
    setSeconds(0);
  };

  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.error(e);
    }
  };

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Synthesize custom sound loops inside buffers
  const createNoiseBuffer = (ctx: AudioContext, type: 'pink' | 'brown'): AudioBuffer => {
    const bufferSize = ctx.sampleRate * 5; // 5 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.05; // Normalizer
      }
    } else {
      // Brown noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 1.5; // Gain compensator
      }
    }
    return buffer;
  };

  // Audio Control Effects
  useEffect(() => {
    return () => {
      // Cleanup all synthesis loops on unmount
      stopRain();
      stopWaves();
      stopWind();
      stopBrown();
    };
  }, []);

  // Sync volumes when sliders change
  useEffect(() => {
    if (rainGainRef.current) {
      rainGainRef.current.gain.value = rainActive ? rainVol / 100 : 0;
    }
  }, [rainVol, rainActive]);

  useEffect(() => {
    if (wavesGainRef.current) {
      wavesGainRef.current.gain.value = wavesActive ? wavesVol / 100 : 0;
    }
  }, [wavesVol, wavesActive]);

  useEffect(() => {
    if (windGainRef.current) {
      windGainRef.current.gain.value = windActive ? windVol / 100 : 0;
    }
  }, [windVol, windActive]);

  useEffect(() => {
    if (brownGainRef.current) {
      brownGainRef.current.gain.value = brownActive ? brownVol / 100 : 0;
    }
  }, [brownVol, brownActive]);

  // Rain sound setup
  const toggleRain = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (rainActive) {
      stopRain();
      setRainActive(false);
    } else {
      try {
        const source = ctx.createBufferSource();
        source.buffer = createNoiseBuffer(ctx, 'pink');
        source.loop = true;

        // Lowpass filter to make it sound like real rain falling
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(rainVol / 100, ctx.currentTime);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
        rainSourceRef.current = source;
        rainGainRef.current = gainNode;
        setRainActive(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopRain = () => {
    if (rainSourceRef.current) {
      try {
        rainSourceRef.current.stop();
      } catch (e) {}
      rainSourceRef.current = null;
    }
    rainGainRef.current = null;
  };

  // Ocean Waves setup
  const toggleWaves = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (wavesActive) {
      stopWaves();
      setWavesActive(false);
    } else {
      try {
        const source = ctx.createBufferSource();
        source.buffer = createNoiseBuffer(ctx, 'brown');
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime); // start with 0, modulated by LFO

        // LFO for ocean wave modulation (slow swell)
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 12 seconds loop
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.35, ctx.currentTime); // swell amplitude

        // Align center of modulation
        const baseGain = ctx.createGain();
        baseGain.gain.setValueAtTime(wavesVol / 100 * 0.4, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        lfo.start();
        source.start();

        wavesSourceRef.current = source;
        wavesGainRef.current = gainNode;
        wavesLfoRef.current = lfo;
        setWavesActive(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopWaves = () => {
    if (wavesSourceRef.current) {
      try {
        wavesSourceRef.current.stop();
      } catch (e) {}
      wavesSourceRef.current = null;
    }
    if (wavesLfoRef.current) {
      try {
        wavesLfoRef.current.stop();
      } catch (e) {}
      wavesLfoRef.current = null;
    }
    wavesGainRef.current = null;
  };

  // Forest Wind setup
  const toggleWind = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (windActive) {
      stopWind();
      setWindActive(false);
    } else {
      try {
        const source = ctx.createBufferSource();
        source.buffer = createNoiseBuffer(ctx, 'pink');
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime); // dynamic

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(windVol / 100, ctx.currentTime);

        // LFO to dynamically sweep filter frequency for breeze feel
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.05, ctx.currentTime); // 20 seconds wind cycle
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(150, ctx.currentTime); // sweeps between 150Hz and 450Hz

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        lfo.start();
        source.start();

        windSourceRef.current = source;
        windGainRef.current = gainNode;
        windFilterRef.current = filter;
        windLfoRef.current = lfo;
        setWindActive(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopWind = () => {
    if (windSourceRef.current) {
      try {
        windSourceRef.current.stop();
      } catch (e) {}
      windSourceRef.current = null;
    }
    if (windLfoRef.current) {
      try {
        windLfoRef.current.stop();
      } catch (e) {}
      windLfoRef.current = null;
    }
    windFilterRef.current = null;
    windGainRef.current = null;
  };

  // Deep Brown Noise setup
  const toggleBrown = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (brownActive) {
      stopBrown();
      setBrownActive(false);
    } else {
      try {
        const source = ctx.createBufferSource();
        source.buffer = createNoiseBuffer(ctx, 'brown');
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(brownVol / 100, ctx.currentTime);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
        brownSourceRef.current = source;
        brownGainRef.current = gainNode;
        setBrownActive(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopBrown = () => {
    if (brownSourceRef.current) {
      try {
        brownSourceRef.current.stop();
      } catch (e) {}
      brownSourceRef.current = null;
    }
    brownGainRef.current = null;
  };

  const toggleTimer = () => {
    if (isActive) {
      setSpiritState('abandon');
      toast("(｡•́︿•̀｡) 精靈一臉失落... 不要氣餒，準備好隨時可重新出發！");
    } else {
      setSpiritState('focusing');
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSpiritState('idle');
    if (mode === 'study') setMinutes(25);
    else if (mode === 'short_break') setMinutes(5);
    else setMinutes(15);
    setSeconds(0);
  };

  const adjustTime = (amount: number) => {
    const newM = Math.max(0, minutes + amount);
    setMinutes(newM);
  };

  // UI styling classes matching selected theme
  const getPanelStyles = () => {
    switch (panelStyle) {
      case 'cyber':
        return {
          wrapper: "bg-[#090A0F] text-cyan-400 p-8 rounded-[2.5rem] border-2 border-purple-600/40 shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-500",
          cardLeft: "bg-[#11131E]/95 border border-purple-500/30 text-white shadow-xl p-8 md:p-10 rounded-[2rem]",
          cardRight: "bg-[#11131E]/95 border border-purple-500/30 text-white shadow-xl p-8 md:p-10 rounded-[2rem]",
          accentBtn: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-none shadow-[0_0_15px_rgba(219,39,119,0.4)]",
          titleText: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 font-mono tracking-widest",
          timerText: "text-cyan-400 font-mono tracking-widest drop-shadow-[0_0_12px_#22d3ee] font-black",
          descText: "text-purple-300 font-mono text-xs",
          controlBtn: "bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:bg-purple-900/60"
        };
      case 'nordic':
        return {
          wrapper: "bg-[#EAEFF0] text-[#2F3E46] p-8 rounded-[2.5rem] border-2 border-[#CAD5D5] shadow-sm transition-all duration-500",
          cardLeft: "bg-[#F4F7F6] border border-[#CAD5D5] text-[#2F3E46] shadow-inner p-8 md:p-10 rounded-[2rem]",
          cardRight: "bg-[#F4F7F6] border border-[#CAD5D5] text-[#2F3E46] shadow-inner p-8 md:p-10 rounded-[2rem]",
          accentBtn: "bg-[#354F52] hover:bg-[#2F3E46] text-white shadow-sm border-none",
          titleText: "text-[#2F3E46] font-sans tracking-tight",
          timerText: "text-[#354F52] font-sans font-black",
          descText: "text-[#52796F] font-medium text-xs",
          controlBtn: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
        };
      case 'zen':
      default:
        return {
          wrapper: "bg-[#F5EFE4] text-[#4A3F35] p-8 rounded-[2.5rem] border-2 border-[#D7CDBC] shadow-md transition-all duration-500",
          cardLeft: "bg-white border border-[#EAE6DF] text-[#4A3F35] shadow-sm p-8 md:p-10 rounded-[2rem]",
          cardRight: "bg-white border border-[#EAE6DF] text-[#4A3F35] shadow-sm p-8 md:p-10 rounded-[2rem]",
          accentBtn: "bg-[#C2A878] hover:bg-[#B19667] text-white border-none shadow-md",
          titleText: "text-[#4A3F35] font-serif font-black",
          timerText: "text-[#4A3F35] font-serif font-black",
          descText: "text-[#8C7A6B] font-medium text-xs",
          controlBtn: "bg-[#FDFBF7] border border-[#EAE6DF] text-[#8C7A6B] hover:bg-[#F5EFE4]"
        };
    }
  };

  const styles = getPanelStyles();

  // Helper for island properties
  const getIslandDetails = (prog: number) => {
    if (prog < 20) {
      return {
        level: 1,
        name: "嫩芽荒島 🏝️",
        desc: "島上只有一片光禿的沙地，一株極小的綠色嫩芽正在探頭探腦...",
        icon: "🌱",
        bg: "from-amber-100/50 to-amber-200/30"
      };
    } else if (prog < 40) {
      return {
        level: 2,
        name: "綠意小島 🍃",
        desc: "小島開始泛著微微綠意，長出了幾叢可愛的小灌木，精靈正在為它澆水！",
        icon: "🌿",
        bg: "from-lime-100/60 to-emerald-200/40"
      };
    } else if (prog < 60) {
      return {
        level: 3,
        name: "花漾之丘 🌸",
        desc: "漫山遍野盛開了金黃與粉紅的小花，連空氣中都散發著專注的芬芳！",
        icon: "🌺",
        bg: "from-pink-100/60 to-rose-200/40"
      };
    } else if (prog < 80) {
      return {
        level: 4,
        name: "茂密森林 🌳",
        desc: "蔚藍的海風拂過，幾棵高聳的椰子樹與橡樹沙沙作響，吸引了小鳥前來停歇！",
        icon: "🌴",
        bg: "from-emerald-100/60 to-teal-200/40"
      };
    } else {
      return {
        level: 5,
        name: "奇幻樂園 🏰",
        desc: "小島的中央建起了一座專注魔法書屋，精靈在此刻升級為閃耀的專注大導師！",
        icon: "🏰",
        bg: "from-indigo-100/60 to-purple-200/40"
      };
    }
  };

  const getSpiritBubble = () => {
    switch (spiritState) {
      case 'focusing':
        return {
          emoji: "٩(๑•̀ㅂ•́)و",
          text: "專注大作戰！我們一分一秒都在踏實前行，精靈在默默為你加持！",
          color: "bg-emerald-500/90 text-white"
        };
      case 'distracted':
        return {
          emoji: "(つД`) 嗚嗚...",
          text: "偵測到分心！你跑去哪裡玩了啦... 精靈一個人好寂寞，快回來專心！",
          color: "bg-rose-500/90 text-white animate-bounce"
        };
      case 'abandon':
        return {
          emoji: "(｡•́︿•̀｡)",
          text: "專注暫時中斷了... 是不是累了呢？精靈在島上陪你喝杯茶，等你想再開始！",
          color: "bg-amber-500/90 text-white"
        };
      case 'idle':
      default:
        return {
          emoji: "(⁎⁍̴̛ᴗ⁍̴̛⁎)",
          text: "嗨！今天也要一起讀書嗎？我會在島上乖乖守護你、為你澆灌專注喔～",
          color: "bg-indigo-500/90 text-white"
        };
    }
  };

  const island = getIslandDetails(islandProgress);
  const spirit = getSpiritBubble();

  return (
    <div className={styles.wrapper}>
      {/* Dynamic Ambient Header Settings bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b border-gray-200/30">
        <div>
          <h2 className={`text-2xl font-black ${styles.titleText}`}>
            自修室專注沙盒
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 font-bold">自訂專屬氛圍，讓每一次點滴累積都有溫度與回報</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-gray-200/50 p-1 rounded-xl text-xs font-bold border border-gray-300/30">
            <button
              onClick={() => setPanelStyle('zen')}
              className={`px-3 py-1.5 rounded-lg transition-all ${panelStyle === 'zen' ? 'bg-[#C2A878] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              🏮 禪風
            </button>
            <button
              onClick={() => setPanelStyle('cyber')}
              className={`px-3 py-1.5 rounded-lg transition-all ${panelStyle === 'cyber' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              ⚡ 霓虹
            </button>
            <button
              onClick={() => setPanelStyle('nordic')}
              className={`px-3 py-1.5 rounded-lg transition-all ${panelStyle === 'nordic' ? 'bg-[#52796F] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              🌲 北歐
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400">指針：</span>
            <select
              value={tickSound}
              onChange={e => setTickSound(e.target.value as any)}
              className="text-xs font-bold bg-white/80 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-indigo-400 shadow-sm"
            >
              <option value="none">🔇 靜音倒數</option>
              <option value="wooden">🏮 木魚敲擊</option>
              <option value="chime">🎐 清脆風鈴</option>
              <option value="gear">⚙️ 機械齒輪</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        {/* Left Card: Pomodoro Timer */}
        <div className={`${styles.cardLeft} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>⏱️</span> 專注番茄鐘
              </h3>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-all ${soundEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                title={soundEnabled ? '提示音：開啟' : '提示音：靜音'}
              >
                {soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
              </button>
            </div>

            <div className="flex bg-gray-200/50 p-1 rounded-xl mb-6 text-[11px] font-bold">
              <button 
                onClick={() => handleModeChange('study')}
                className={`flex-1 py-2.5 rounded-lg transition-all ${mode === 'study' ? 'bg-white text-[#2F3E46] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                🎯 專注 (25m)
              </button>
              <button 
                onClick={() => handleModeChange('short_break')}
                className={`flex-1 py-2.5 rounded-lg transition-all ${mode === 'short_break' ? 'bg-white text-[#2F3E46] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                ☕ 休息 (5m)
              </button>
              <button 
                onClick={() => handleModeChange('long_break')}
                className={`flex-1 py-2.5 rounded-lg transition-all ${mode === 'long_break' ? 'bg-white text-[#2F3E46] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                🛋️ 深度 (15m)
              </button>
            </div>

            <div className="text-center py-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                <button onClick={() => adjustTime(1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${styles.controlBtn}`}>
                  +1
                </button>
                <button onClick={() => adjustTime(-1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${styles.controlBtn}`}>
                  -1
                </button>
              </div>

              <div className={`text-6xl md:text-7xl font-black tracking-wider ${styles.timerText}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>

              <div className={`mt-3 ${styles.descText}`}>
                {mode === 'study' ? '🧠 深 度 專 注 中' : mode === 'short_break' ? '☕ 讓 腦 袋 稍 作 歇 息' : '🛋️ 完 全 放 鬆 精 神'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={toggleTimer}
              className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${
                isActive 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-none' 
                  : styles.accentBtn
              }`}
            >
              {isActive ? <><Pause size={18}/> 暫停專注</> : <><Play size={18}/> 開始專注</>}
            </button>
            <button 
              onClick={resetTimer}
              className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold border border-gray-200 transition-all flex items-center justify-center"
              title="重置計時"
            >
              <RotateCcw size={18}/>
            </button>
          </div>
        </div>

        {/* Right Card: Tabs with Focus Island & Noise */}
        <div className={`${styles.cardRight} flex flex-col justify-between`}>
          <div>
            <div className="flex bg-gray-200/50 p-1 rounded-xl mb-6 text-xs font-bold border border-gray-300/20">
              <button 
                onClick={() => setActiveRightTab('island')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeRightTab === 'island' ? 'bg-white text-[#2F3E46] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                🏝️ 專注伴讀精靈
              </button>
              <button 
                onClick={() => setActiveRightTab('noise')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeRightTab === 'noise' ? 'bg-white text-[#2F3E46] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                🎧 白噪音降噪
              </button>
            </div>

            {activeRightTab === 'island' ? (
              <div className="space-y-4">
                {/* Growable Focus Island Sandbox UI */}
                <div className={`relative rounded-2xl p-5 bg-gradient-to-b ${island.bg} border border-white/40 overflow-hidden flex flex-col items-center justify-center text-center py-6 shadow-sm`}>
                  
                  {/* Distraction Overlay if spirit is distracted */}
                  {spiritState === 'distracted' && (
                    <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[1px] pointer-events-none animate-pulse flex items-center justify-center z-30">
                      <span className="text-4xl animate-bounce">🌧️🌧️</span>
                    </div>
                  )}

                  {/* Level Badge */}
                  <div className="absolute top-3 right-3 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-indigo-700 border border-indigo-200/40">
                    島嶼等級 LV.{island.level}
                  </div>

                  {/* Animated Island Visual Container */}
                  <div className="relative w-36 h-36 flex items-center justify-center mt-2">
                    
                    {/* Floating Island Base */}
                    <div className="absolute bottom-4 w-28 h-6 bg-[#D4A373]/80 rounded-full blur-xs animate-pulse" />
                    <div className="absolute bottom-5 w-24 h-10 bg-[#8B5E3C] rounded-b-3xl border-t border-amber-800" />
                    <div className="absolute bottom-11 w-26 h-5 bg-[#A3B18A] rounded-full" />

                    {/* Dynamic Growth Asset (Icon) */}
                    <div className="absolute bottom-11 text-4xl animate-bounce duration-1000 z-10 select-none">
                      {island.icon}
                    </div>

                    {/* The Companion Spirit avatar */}
                    <div className={`absolute bottom-10 left-6 text-2xl z-20 transition-all duration-300
                      ${spiritState === 'focusing' ? 'animate-pulse scale-110' : spiritState === 'distracted' ? 'animate-bounce' : 'animate-bounce scale-100'}
                    `}>
                      🐹
                    </div>

                    {/* Extra elements based on level */}
                    {island.level >= 3 && (
                      <div className="absolute bottom-12 right-6 text-lg animate-pulse">🌸</div>
                    )}
                    {island.level >= 4 && (
                      <div className="absolute bottom-16 left-3 text-lg">🐦</div>
                    )}
                    {island.level >= 5 && (
                      <div className="absolute top-4 text-xs bg-yellow-400 px-1 py-0.5 rounded text-white font-extrabold animate-bounce">書屋 🏠</div>
                    )}
                  </div>

                  {/* Bubble speech */}
                  <div className={`mt-4 px-4 py-2 rounded-2xl text-xs max-w-xs transition-all border ${spirit.color} shadow-md relative z-40`}>
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-inherit border-t border-l border-white/20" />
                    <div className="font-extrabold mb-0.5 flex items-center justify-center gap-1">
                      <span>{spirit.emoji}</span> 讀書精靈
                    </div>
                    <div className="text-[11px] leading-relaxed opacity-95">{spirit.text}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-gray-100/80 p-4 rounded-xl border border-gray-200/60 text-xs">
                  <div className="flex justify-between font-bold text-gray-500 mb-1">
                    <span>{island.name}</span>
                    <span>{Math.round(islandProgress)}% 成長度</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-500 bg-gradient-to-r from-teal-400 to-indigo-500"
                      style={{ width: `${islandProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed">
                    {island.desc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {/* Rain noise */}
                <div className="bg-white/50 border border-gray-200 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl">🌧️</span>
                    <div>
                      <h4 className="font-extrabold text-xs">窗外春雨聲</h4>
                      <p className="text-[9px] text-gray-400">粉紅噪音 + 濾波</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={rainVol} 
                      onChange={e => setRainVol(Number(e.target.value))}
                      disabled={!rainActive}
                      className="w-16 accent-[#C2A878] opacity-80"
                    />
                    <button 
                      onClick={toggleRain}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${rainActive ? 'bg-[#C2A878] text-white shadow-sm border-none' : 'bg-gray-100 text-gray-500 border'}`}
                    >
                      {rainActive ? '播放中' : '靜音'}
                    </button>
                  </div>
                </div>

                {/* Ocean Waves */}
                <div className="bg-white/50 border border-gray-200 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl">🌊</span>
                    <div>
                      <h4 className="font-extrabold text-xs">海浪拍打聲</h4>
                      <p className="text-[9px] text-gray-400">大地雜訊 + 12s潮汐</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={wavesVol} 
                      onChange={e => setWavesVol(Number(e.target.value))}
                      disabled={!wavesActive}
                      className="w-16 accent-[#C2A878] opacity-80"
                    />
                    <button 
                      onClick={toggleWaves}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${wavesActive ? 'bg-[#C2A878] text-white shadow-sm border-none' : 'bg-gray-100 text-gray-500 border'}`}
                    >
                      {wavesActive ? '播放中' : '靜音'}
                    </button>
                  </div>
                </div>

                {/* Forest wind */}
                <div className="bg-white/50 border border-gray-200 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl">🌲</span>
                    <div>
                      <h4 className="font-extrabold text-xs">林間微風聲</h4>
                      <p className="text-[9px] text-gray-400">粉紅噪音 + 20s掃頻</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={windVol} 
                      onChange={e => setWindVol(Number(e.target.value))}
                      disabled={!windActive}
                      className="w-16 accent-[#C2A878] opacity-80"
                    />
                    <button 
                      onClick={toggleWind}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${windActive ? 'bg-[#C2A878] text-white shadow-sm border-none' : 'bg-gray-100 text-gray-500 border'}`}
                    >
                      {windActive ? '播放中' : '靜音'}
                    </button>
                  </div>
                </div>

                {/* Deep Brown Noise */}
                <div className="bg-white/50 border border-gray-200 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl">🟫</span>
                    <div>
                      <h4 className="font-extrabold text-xs">深沉褐噪聲</h4>
                      <p className="text-[9px] text-gray-400">純褐噪音，阻絕干擾</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={brownVol} 
                      onChange={e => setBrownVol(Number(e.target.value))}
                      disabled={!brownActive}
                      className="w-16 accent-[#C2A878] opacity-80"
                    />
                    <button 
                      onClick={toggleBrown}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${brownActive ? 'bg-[#C2A878] text-white shadow-sm border-none' : 'bg-gray-100 text-gray-500 border'}`}
                    >
                      {brownActive ? '播放中' : '靜音'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-3 text-[10px] text-gray-400 leading-relaxed mt-4">
            💡 **互動守護秘訣：** 在您專注研讀時，切勿切換到其他瀏覽器分頁，否則讀書精靈會難過並在島上下起冰雨喔！
          </div>
        </div>
      </div>
    </div>
  );
}

export function LearningAnalyticsDashboard({ subjectId, user }: { subjectId: string, user: UserProfile }) {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [progress, setProgress] = useState<MaterialProgress[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid || !subjectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all course materials for this subject
        const qMats = query(collection(db, 'materials'), where('subjectId', '==', subjectId));
        const snapMats = await getDocs(qMats);
        const matsData = snapMats.docs.map(d => ({ id: d.id, ...d.data() } as CourseMaterial));
        setMaterials(matsData);

        // 2. Fetch all progress records for this user & subject
        const qProg = query(collection(db, 'material_progress'), where('userId', '==', user.uid), where('subjectId', '==', subjectId));
        const snapProg = await getDocs(qProg);
        const progData = snapProg.docs.map(d => d.data() as MaterialProgress);
        setProgress(progData);

        // 3. Fetch all test attempts for this user & subject
        const qAttempts = query(collection(db, 'attempts'), where('userId', '==', user.uid), where('subject', '==', subjectId));
        const snapAttempts = await getDocs(qAttempts);
        const attemptsData = snapAttempts.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort chronologically by timestamp
        attemptsData.sort((a, b) => a.timestamp - b.timestamp);
        setAttempts(attemptsData);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [subjectId, user?.uid]);

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-[2rem] border border-gray-100 text-center text-gray-500 py-20">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        載入學習數據統計中，請稍候...
      </div>
    );
  }

  // Calculate stats
  const totalStudySeconds = progress.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);
  const completedMaterialsCount = progress.filter(p => p.completed).length;
  const totalMaterialsCount = materials.length;
  const completionRate = totalMaterialsCount > 0 ? Math.round((completedMaterialsCount / totalMaterialsCount) * 100) : 0;
  
  const validScores = attempts.map(a => a.score).filter(s => typeof s === 'number');
  const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const totalQuizzes = attempts.length;

  // Chart 1: Time spent per material
  const timeChartData = materials.map(m => {
    const p = progress.find(prog => prog.materialId === m.id);
    const minutes = p ? Math.round((p.timeSpent || 0) / 60) : 0;
    return {
      name: m.title.length > 10 ? m.title.substring(0, 10) + '...' : m.title,
      '學習時間(分鐘)': minutes
    };
  });

  // Chart 2: Test Scores Progression
  const scoreChartData = attempts.map((a, idx) => {
    const dateStr = new Date(a.timestamp).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
    return {
      name: `試煉 #${idx + 1}`,
      '得分': a.score,
      '答對率(%)': a.accuracy || 0,
      date: dateStr
    };
  });

  // Chart 3: Completion Pie Data
  const pieData = [
    { name: '已研讀完成', value: completedMaterialsCount },
    { name: '未研讀章節', value: Math.max(0, totalMaterialsCount - completedMaterialsCount) }
  ];
  const PIE_COLORS = ['#10B981', '#E5E7EB'];

  return (
    <div className="space-y-8 text-left">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">⏳ 研讀總時數</div>
          <div className="text-3xl font-black text-indigo-600 font-mono">
            {totalStudyMinutes} <span className="text-sm font-bold text-gray-500">分鐘</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">來自您的教材停留計時統計</p>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">🎯 教材研讀率</div>
          <div className="text-3xl font-black text-[#C2A878] font-mono">
            {completionRate}%
          </div>
          <p className="text-[10px] text-gray-400 mt-2">共完成 {completedMaterialsCount} / {totalMaterialsCount} 個章節</p>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">📈 測驗平均分</div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {avgScore} <span className="text-sm font-bold text-gray-500">分</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">基於最近 {totalQuizzes} 次隨堂任務</p>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">🏆 歷史最高分</div>
          <div className="text-3xl font-black text-amber-500 font-mono">
            {maxScore} <span className="text-sm font-bold text-gray-500">分</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">繼續保持並刷新您的巔峰紀錄！</p>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Time Spent (Bar) */}
        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            📊 各章節停留與研讀時數分佈 (分鐘)
          </h3>
          {timeChartData.some(d => d['學習時間(分鐘)'] > 0) ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="學習時間(分鐘)" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              目前暫無章節研讀時間統計，趕緊點擊教材區開始閱讀吧！
            </div>
          )}
        </div>

        {/* Chart 3: Completion Pie */}
        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            🍩 知識覆蓋與完成度
          </h3>
          {totalMaterialsCount > 0 ? (
            <div className="w-full h-72 flex flex-col items-center justify-center">
              <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gray-800 font-mono">{completionRate}%</span>
                  <span className="text-[10px] text-gray-400 font-bold">教材完成率</span>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-3 h-3 bg-[#10B981] rounded-full"></span>
                  已完成 ({completedMaterialsCount})
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-3 h-3 bg-gray-200 rounded-full"></span>
                  未研讀 ({Math.max(0, totalMaterialsCount - completedMaterialsCount)})
                </div>
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
              此科目下目前無任何教材
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Test Scores Progression (Line) */}
      <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          📈 任務試煉得分與答對率變化趨勢
        </h3>
        {scoreChartData.length > 0 ? (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="得分" stroke="#F59E0B" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="答對率(%)" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            目前暫無任務測驗記錄，快去「測驗任務」頁面發起首場挑戰吧！ 🚀
          </div>
        )}
      </div>

      {/* Recent Attempts History */}
      {attempts.length > 0 && (
        <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            📜 近期測驗試煉歷程
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold">
                  <th className="py-3 px-4">試煉場次</th>
                  <th className="py-3 px-4">試煉時間</th>
                  <th className="py-3 px-4 text-center">測驗得分</th>
                  <th className="py-3 px-4 text-center">答對率</th>
                  <th className="py-3 px-4 text-center">作弊次數</th>
                  <th className="py-3 px-4 text-right">花費時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...attempts].reverse().slice(0, 5).map((a, idx) => {
                  const minutes = Math.floor((a.timeTaken || 0) / 60000);
                  const seconds = Math.floor(((a.timeTaken || 0) % 60000) / 1000);
                  return (
                    <tr key={a.id || idx} className="text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">隨堂試煉 #{attempts.length - idx}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-400">{new Date(a.timestamp).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center font-black text-amber-600 font-mono text-base">{a.score}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.accuracy >= 80 ? 'bg-green-50 text-green-600' : a.accuracy >= 60 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                          {a.accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono text-gray-500">{a.cheatCount || 0}次</td>
                      <td className="py-3.5 px-4 text-right text-xs font-mono font-medium text-gray-400">
                        {minutes > 0 ? `${minutes}分` : ''}{seconds}秒
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
