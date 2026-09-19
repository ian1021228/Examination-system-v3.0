import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CourseMaterial } from './features';
import { formatUnitBadge } from './features';
import { 
  X, Upload, Download, Copy, Check, FileText, 
  HelpCircle, Eye, Trash, AlertCircle, FileCode, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from './toast';

export const COURSE_MATERIAL_SKILL_TEXT = `# 教材批次生成與匯入規格 (Course Materials Skill)

你是一位專業的教材研發專家與課程設計架構師。你的任務是根據使用者指定的主題、章節或課程內容，產出符合學習平台匯入規格的教材 JSON 陣列資料。

---

## 輸出規則 (Output Format)
1. 必須一律輸出標準的 JSON 陣列 \`[...]\`，每個元素為一個教材物件。
2. 不要在 JSON 結構外輸出額外的聊天開頭或結尾文字；若放在代碼區塊中，請使用 \`\`\`json ... \`\`\`。
3. 單元（unit）支援英文字母（如 "A", "B", "C"）、數字（如 1, 2）或自訂文字（如 "Unit A", "第一課"）。
4. 類型（type）必須為以下其一：
   - "lesson": 課程講義 / 重點整理
   - "video": 影音教學（contentUrl 可填入 YouTube 或教學影片連結）
   - "exam": 考卷 / 模擬試題
   - "solution": 考卷解答 / 題目詳解
   - "article": 補充閱讀 / 文章
   - "pdf": PDF 文檔 / 講義檔案

---

## 欄位定義 (Schema)

| 欄位名稱 | 型別 | 必填 | 說明 |
| :--- | :--- | :---: | :--- |
| unit | number \\| string | 是 | 單元或課次，例如 1, 2, "Unit 1", "複習篇" |
| type | string | 是 | 類型：lesson, video, exam, solution, article, pdf |
| title | string | 是 | 教材標題，簡明清楚，例如 "Unit 1: 現在完成式觀念精講與句型" |
| contentUrl | string | 否 | 主連結（如 YouTube 影片網址、雲端講義 URL，若無可填 ""） |
| description | string | 否 | 簡短說明 / 章節核心重點摘要（1~2 句話） |
| markdownNotes | string | 否 | 核心教材內容！支援完整 Markdown 語法（標題、清單、表格、粗體、範例句等） |
| attachments | array | 否 | 補充檔案連結陣列，每項包含 { "name": "...", "url": "..." } |

---

## 標準 JSON 範例 (Example)

\`\`\`json
[
  {
    "unit": 1,
    "type": "lesson",
    "title": "Unit 1: 核心單字與常見混淆詞彙精講",
    "contentUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "description": "本單元涵蓋初中級必考高頻動詞、形容詞與介系詞搭配。",
    "markdownNotes": "# Unit 1: 核心單字精講\\n\\n## 一、高頻動詞搭配 (Collocations)\\n- **make a decision**: 做決定\\n- **take into account**: 考慮到\\n- **look forward to + V-ing**: 期待\\n\\n## 二、容易混淆字辨析\\n1. **affect (v.) vs. effect (n.)**\\n   - *Smoking affects your health.*\\n   - *The new policy had an immediate effect.*\\n\\n## 三、精選例句\\n- We are looking forward to **hearing** from you soon.\\n- She managed to **solve** the difficult problem on her own.",
    "attachments": [
      {
        "name": "Unit 1 核心單字表 (PDF).pdf",
        "url": "https://example.com/files/unit1-vocabulary.pdf"
      }
    ]
  },
  {
    "unit": 1,
    "type": "video",
    "title": "Unit 1: 現在完成式 10 分鐘速解 (時態精選影音)",
    "contentUrl": "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    "description": "透過時間軸視覺化解析 Have/Has + p.p. 與過去簡單式的關鍵差異。",
    "markdownNotes": "### 影音重點整理\\n- **現在完成式公式**: have / has + 過去分詞 (p.p.)\\n- **三大核心用法**:\\n  1. 經驗 (Have you ever...?)\\n  2. 持續到現在的狀態 (for 3 years / since 2020)\\n  3. 剛完成或未完成 (already, just, yet)",
    "attachments": []
  },
  {
    "unit": 1,
    "type": "exam",
    "title": "Unit 1: 階段隨堂評量試卷 (附聽力與閱讀)",
    "contentUrl": "https://example.com/exam/unit1-test.pdf",
    "description": "單元學習完成後的 20 題綜合驗收測驗卷。",
    "markdownNotes": "請學生在 25 分鐘內獨立作答完畢，完成後可對照 Unit 1 詳解說明。",
    "attachments": [
      {
        "name": "Unit 1 測驗卷 (空白列印版).pdf",
        "url": "https://example.com/exam/unit1-print.pdf"
      }
    ]
  },
  {
    "unit": 1,
    "type": "solution",
    "title": "Unit 1: 隨堂評量試卷 逐題解析與翻譯",
    "contentUrl": "https://example.com/exam/unit1-solution.pdf",
    "description": "包含每一題的解題破題關鍵、生字表與延伸句型補充。",
    "markdownNotes": "# Unit 1 隨堂測驗詳解\\n\\n### 第 1 題 (單字題)\\n- **答案**: B\\n- **解析**: 語境表示「期待收到來信」，look forward to 後方介系詞 to 接動名詞 hearing。\\n\\n### 第 2 題 (時態題)\\n- **答案**: C\\n- **解析**: 句尾有 since yesterday，主要子句必須使用現在完成式 has been。",
    "attachments": []
  }
]
\`\`\`
`;

export const SAMPLE_MATERIALS_JSON = `[
  {
    "unit": 1,
    "type": "lesson",
    "title": "Unit 1: 核心單字與常見混淆詞彙精講",
    "contentUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "description": "本單元涵蓋初中級必考高頻動詞、形容詞與介系詞搭配。",
    "markdownNotes": "# Unit 1: 核心單字精講\\n\\n## 一、高頻動詞搭配 (Collocations)\\n- **make a decision**: 做決定\\n- **take into account**: 考慮到\\n- **look forward to + V-ing**: 期待\\n\\n## 二、容易混淆字辨析\\n1. **affect (v.) vs. effect (n.)**\\n   - *Smoking affects your health.*\\n   - *The new policy had an immediate effect.*\\n\\n## 三、精選例句\\n- We are looking forward to **hearing** from you soon.\\n- She managed to **solve** the difficult problem on her own.",
    "attachments": [
      {
        "name": "Unit 1 核心單字表 (PDF).pdf",
        "url": "https://example.com/files/unit1-vocabulary.pdf"
      }
    ]
  },
  {
    "unit": 1,
    "type": "video",
    "title": "Unit 1: 現在完成式 10 分鐘速解 (時態精選影音)",
    "contentUrl": "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    "description": "透過時間軸視覺化解析 Have/Has + p.p. 與過去簡單式的關鍵差異。",
    "markdownNotes": "### 影音重點整理\\n- **現在完成式公式**: have / has + 過去分詞 (p.p.)\\n- **三大核心用法**:\\n  1. 經驗 (Have you ever...?)\\n  2. 持續到現在的狀態 (for 3 years / since 2020)\\n  3. 剛完成或未完成 (already, just, yet)",
    "attachments": []
  },
  {
    "unit": 1,
    "type": "exam",
    "title": "Unit 1: 階段隨堂評量試卷 (附聽力與閱讀)",
    "contentUrl": "https://example.com/exam/unit1-test.pdf",
    "description": "單元學習完成後的 20 題綜合驗收測驗卷。",
    "markdownNotes": "請學生在 25 分鐘內獨立作答完畢，完成後可對照 Unit 1 詳解說明。",
    "attachments": [
      {
        "name": "Unit 1 測驗卷 (空白列印版).pdf",
        "url": "https://example.com/exam/unit1-print.pdf"
      }
    ]
  },
  {
    "unit": 1,
    "type": "solution",
    "title": "Unit 1: 隨堂評量試卷 逐題解析與翻譯",
    "contentUrl": "https://example.com/exam/unit1-solution.pdf",
    "description": "包含每一題的解題破題關鍵、生字表與延伸句型補充。",
    "markdownNotes": "# Unit 1 隨堂測驗詳解\\n\\n### 第 1 題 (單字題)\\n- **答案**: B\\n- **解析**: 語境表示「期待收到來信」，look forward to 後方介系詞 to 接動名詞 hearing。\\n\\n### 第 2 題 (時態題)\\n- **答案**: C\\n- **解析**: 句尾有 since yesterday，主要子句必須使用現在完成式 has been。",
    "attachments": []
  }
]`;

/**
 * 清除物件中所有 undefined 屬性，防範 Firestore 寫入報錯
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): Partial<T> {
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
 * 健壯解析教材字串（符合使用者規則：以正規表達式先行過濾前後綴多餘字元）
 */
export function parseMaterialsJSON(text: string): Partial<CourseMaterial>[] {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: any = null;

  // 使用正規表達式提取 JSON 陣列或物件區塊
  const regexMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (regexMatch) {
    try {
      parsed = JSON.parse(regexMatch[0]);
    } catch {
      // 容錯繼續
    }
  }

  if (!parsed) {
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // 貪婪括號擷取
      const startIdx = cleaned.indexOf('[');
      if (startIdx !== -1) {
        let endIdx = cleaned.lastIndexOf(']');
        while (endIdx > startIdx) {
          try {
            parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
            break;
          } catch {
            endIdx = cleaned.lastIndexOf(']', endIdx - 1);
          }
        }
      }

      if (!parsed) {
        const startObj = cleaned.indexOf('{');
        if (startObj !== -1) {
          let endObj = cleaned.lastIndexOf('}');
          while (endObj > startObj) {
            try {
              parsed = JSON.parse(cleaned.substring(startObj, endObj + 1));
              break;
            } catch {
              endObj = cleaned.lastIndexOf('}', endObj - 1);
            }
          }
        }
      }
    }
  }

  if (!parsed) {
    throw new Error('無法解析為有效的 JSON 格式，請確認是否為標準 JSON 陣列或物件。');
  }

  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed.materials)) rawList = parsed.materials;
    else if (Array.isArray(parsed.items)) rawList = parsed.items;
    else if (Array.isArray(parsed.data)) rawList = parsed.data;
    else if (Array.isArray(parsed.courses)) rawList = parsed.courses;
    else rawList = [parsed];
  }

  if (rawList.length === 0) {
    throw new Error('解析結果為空，找不到教材清單資料。');
  }

  return rawList.map((item, idx) => {
    // 單元 (數字或字串)
    const rawUnit = item.unit ?? item['單元'] ?? item.Unit ?? 1;
    const numUnit = Number(rawUnit);
    const unit = !isNaN(numUnit) && String(rawUnit).trim() !== '' ? numUnit : (String(rawUnit).trim() || 1);

    // 類型 (正規化為六種合法 type)
    const rawType = String(item.type || item['類型'] || item.Type || 'lesson').toLowerCase();
    let type: CourseMaterial['type'] = 'lesson';
    if (rawType.includes('video') || rawType.includes('影音') || rawType.includes('影片')) type = 'video';
    else if (rawType.includes('exam') || rawType.includes('考卷') || rawType.includes('測驗')) type = 'exam';
    else if (rawType.includes('solution') || rawType.includes('解答') || rawType.includes('詳解')) type = 'solution';
    else if (rawType.includes('article') || rawType.includes('文章') || rawType.includes('閱讀')) type = 'article';
    else if (rawType.includes('pdf') || rawType.includes('文件')) type = 'pdf';
    else type = 'lesson';

    // 標題
    const title = String(item.title || item['標題'] || item.Title || `教材 ${idx + 1}`).trim();

    // 連結
    const contentUrl = String(item.contentUrl || item['內容連結'] || item.url || item.URL || item['連結'] || '').trim();

    // 說明
    const description = String(item.description || item['說明'] || item['簡短說明'] || item['簡介'] || item.Description || '').trim();

    // Markdown 筆記
    const markdownNotes = String(item.markdownNotes || item['筆記'] || item['課程筆記'] || item['講義內容'] || item.content || item.notes || '');

    // 補充檔案
    let attachments: { name: string; url: string }[] = [];
    const rawAtts = item.attachments || item['補充檔案'] || item['附件'];
    if (Array.isArray(rawAtts)) {
      attachments = rawAtts.map((att: any) => ({
        name: String(att.name || att['名稱'] || '補充檔案').trim(),
        url: String(att.url || att['連結'] || '').trim()
      })).filter(att => att.name || att.url);
    }

    return {
      unit,
      type,
      title,
      contentUrl,
      description,
      markdownNotes,
      attachments
    };
  });
}

/**
 * 彈窗：教材格式說明 (Skill.txt)
 */
export function CourseMaterialSkillModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'doc' | 'json' | 'prompt'>('doc');

  if (!isOpen) return null;

  const handleCopySkill = () => {
    navigator.clipboard.writeText(COURSE_MATERIAL_SKILL_TEXT);
    setCopied(true);
    toast('📋 已複製教材格式 skill.txt 內容至剪貼簿！');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSkill = () => {
    const blob = new Blob([COURSE_MATERIAL_SKILL_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skill.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('⬇️ skill.txt 已開始下載！');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-200">
              <FileCode size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                教材匯入格式規範 (skill.txt)
                <span className="text-xs bg-indigo-500/40 text-indigo-100 px-2 py-0.5 rounded-full font-normal">
                  v1.0
                </span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">提供 AI 提示詞或教材開發人員標準 JSON Schema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSkill}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-all"
              title="下載 skill.txt 檔案"
            >
              <Download size={15} /> 下載 skill.txt
            </button>
            <button
              onClick={handleCopySkill}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm"
              title="複製全文"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? '已複製！' : '一鍵複製'}
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 bg-gray-50/70 shrink-0 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('doc')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'doc'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} /> 欄位說明與規範
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileCode size={16} /> 標準 JSON 範例
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HelpCircle size={16} /> AI 生成 Prompt 範本
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700">
          {activeTab === 'doc' && (
            <div className="space-y-6">
              {/* Type Badges */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-sm text-indigo-900 mb-2">支援的 6 種教材類型 (type)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center gap-2">
                    <span className="font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">lesson</span>
                    <span>📖 課程講義 / 觀念精講</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center gap-2">
                    <span className="font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">video</span>
                    <span>📹 影音教學 / YouTube</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center gap-2">
                    <span className="font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">exam</span>
                    <span>📝 考卷 / 模擬試卷</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center gap-2">
                    <span className="font-mono bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">solution</span>
                    <span>🔑 考卷解答 / 逐題詳解</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center gap-2">
                    <span className="font-mono bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-bold">article</span>
                    <span>📰 延伸閱讀 / 補充文章</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-center gap-2">
                    <span className="font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">pdf</span>
                    <span>📄 PDF 文件 / 講義檔案</span>
                  </div>
                </div>
              </div>

              {/* Schema Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">欄位名稱 (Key)</th>
                      <th className="px-4 py-3">型別 (Type)</th>
                      <th className="px-4 py-3">必填</th>
                      <th className="px-4 py-3">說明與建議範例</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">unit</td>
                      <td className="px-4 py-3 font-mono text-gray-500">number | string</td>
                      <td className="px-4 py-3 font-bold text-rose-600">是</td>
                      <td className="px-4 py-3">單元編號或自訂名稱，例如 <code>1</code>, <code>"Unit 1"</code>, <code>"文法總複習"</code></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">type</td>
                      <td className="px-4 py-3 font-mono text-gray-500">string</td>
                      <td className="px-4 py-3 font-bold text-rose-600">是</td>
                      <td className="px-4 py-3">固定為 <code>lesson</code>, <code>video</code>, <code>exam</code>, <code>solution</code>, <code>article</code>, <code>pdf</code> 之一</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">title</td>
                      <td className="px-4 py-3 font-mono text-gray-500">string</td>
                      <td className="px-4 py-3 font-bold text-rose-600">是</td>
                      <td className="px-4 py-3">教材主題標題，例如 <code>"第1單元: 不規則動詞與時態精析"</code></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">contentUrl</td>
                      <td className="px-4 py-3 font-mono text-gray-500">string</td>
                      <td className="px-4 py-3 text-gray-400">否</td>
                      <td className="px-4 py-3">主要影音或檔案 URL，例如 YouTube 網址，系統會自動嵌入播放器</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">description</td>
                      <td className="px-4 py-3 font-mono text-gray-500">string</td>
                      <td className="px-4 py-3 text-gray-400">否</td>
                      <td className="px-4 py-3">教材簡短說明，1~2 句話摘要核心概念</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">markdownNotes</td>
                      <td className="px-4 py-3 font-mono text-gray-500">string</td>
                      <td className="px-4 py-3 text-gray-400">否</td>
                      <td className="px-4 py-3"><strong>核心內容！</strong>支援完整 Markdown 標題、粗體、清單、表格、例句與語音朗讀 (TTS)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">attachments</td>
                      <td className="px-4 py-3 font-mono text-gray-500">array</td>
                      <td className="px-4 py-3 text-gray-400">否</td>
                      <td className="px-4 py-3">補充檔案連結陣列，每項為 <code>{`{ "name": "...", "url": "..." }`}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle size={15} /> 貼心提醒與容錯機制
                </div>
                <p>• 匯入時亦支援中文欄位（如「單元」、「類型」、「標題」、「內容連結」、「說明」、「課程筆記」）。</p>
                <p>• 系統具有強健的正規表達式防護，即便 AI 回覆包含 Markdown 標記（如 ```json）或前後問候語，系統皆會自動剔除並精準提取 JSON 陣列。</p>
                <p>• 匯入完成後，學生端可直接在頁面上閱讀筆記、劃重點螢光筆、聽取文字語音朗讀 (TTS) 與觀看 YouTube 影片。</p>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>標準 4 題不同類型教材範例（含講義、影音、考卷與詳解）</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SAMPLE_MATERIALS_JSON);
                    toast('📋 已複製標準 JSON 範例！');
                  }}
                  className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
                >
                  <Copy size={13} /> 複製範例代碼
                </button>
              </div>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-gray-800 max-h-[500px]">
                {SAMPLE_MATERIALS_JSON}
              </pre>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                將下方 Prompt 複製並傳送給 Gemini、ChatGPT 或其他大型語言模型，即可快速產出符合規格的整套課程教材：
              </p>
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-900">AI 提示詞範本 (可直接複製使用)</span>
                  <button
                    onClick={() => {
                      const prompt = `請根據以下規格，為我設計【科目/單元名稱】的教材內容，並輸出為符合 skill.txt 規格的標準 JSON 陣列：\n1. 包含 2~4 份教材（例如講義 lesson、影音推薦 video、測驗卷 exam、解答 solution）。\n2. 單元填入【第 X 單元】。\n3. 講義的 markdownNotes 請條理清晰，使用 Markdown 標題、粗體、清單和實用例句。\n4. 請直接輸出 JSON 陣列，不需其他額外寒暄文字。\n\n規格欄位：\nunit (單元), type (lesson/video/exam/solution), title (標題), contentUrl (影音或講義連結), description (簡介), markdownNotes (Markdown詳細筆記), attachments (補充檔案陣列)`;
                      navigator.clipboard.writeText(prompt);
                      toast('📋 已複製 AI 提示詞範本！');
                    }}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Copy size={13} /> 複製提示詞
                  </button>
                </div>
                <pre className="p-3 bg-white rounded-xl border border-indigo-100 text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
{`請根據以下規格，為我設計【英語 PET / 單元名稱】的教材內容，並輸出為符合 skill.txt 規格的標準 JSON 陣列：
1. 包含 3 份教材：講義 (lesson)、推薦影音 (video)、隨堂測驗卷 (exam)。
2. 單元 unit 填入 1。
3. 講義的 markdownNotes 請完整詳盡，運用 Markdown 標題 (#, ##)、粗體、列點清單與精選例句。
4. 請直接輸出 JSON 陣列，代碼區塊使用 \`\`\`json ... \`\`\`。

規格說明：
- unit: 單元 (數字或文字)
- type: "lesson" | "video" | "exam" | "solution" | "article" | "pdf"
- title: 標題
- contentUrl: 連結 (可填 YouTube 網址或空白)
- description: 簡短摘要 (1~2 句話)
- markdownNotes: 詳細 Markdown 筆記內容
- attachments: 補充檔案陣列 [ { "name": "...", "url": "..." } ]`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <span className="text-xs text-gray-400">已部署至 /public/skill.txt，可自由取用</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-sm transition-all"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 彈窗：教材批次匯入 (Import Modal)
 */
export function CourseMaterialImportModal({
  subjectId,
  isOpen,
  onClose,
  onSuccess,
  onOpenSkill,
  materialsCount = 0
}: {
  subjectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenSkill: () => void;
  materialsCount?: number;
}) {
  const [inputText, setInputText] = useState('');
  const [previewList, setPreviewList] = useState<Partial<CourseMaterial>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    setParseError(null);
    if (!inputText.trim()) {
      setParseError('請輸入或貼上教材 JSON 內容！');
      return;
    }
    try {
      const parsed = parseMaterialsJSON(inputText);
      setPreviewList(parsed);
      setSelectedIndices(new Set(parsed.map((_, i) => i)));
      toast(`✅ 成功解析 ${parsed.length} 筆教材，請確認後進行匯入！`);
    } catch (err: any) {
      console.error(err);
      setParseError(err?.message || '解析失敗，請確認 JSON 格式是否正確。');
    }
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_MATERIALS_JSON);
    setParseError(null);
    try {
      const parsed = parseMaterialsJSON(SAMPLE_MATERIALS_JSON);
      setPreviewList(parsed);
      setSelectedIndices(new Set(parsed.map((_, i) => i)));
      toast('💡 已載入標準範例教材資料');
    } catch (e: any) {
      setParseError(e?.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        try {
          const parsed = parseMaterialsJSON(content);
          setPreviewList(parsed);
          setSelectedIndices(new Set(parsed.map((_, i) => i)));
          setParseError(null);
          toast(`📂 已讀取檔案並解析 ${parsed.length} 筆教材！`);
        } catch (err: any) {
          setParseError(`讀取成功但解析失敗: ${err.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === previewList.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(previewList.map((_, i) => i)));
    }
  };

  const handleDeleteItem = (index: number) => {
    const nextList = previewList.filter((_, i) => i !== index);
    setPreviewList(nextList);
    const nextSelected = new Set<number>();
    nextList.forEach((_, i) => nextSelected.add(i));
    setSelectedIndices(nextSelected);
  };

  const handleConfirmImport = async () => {
    if (selectedIndices.size === 0) {
      toast('請至少選擇一項教材進行匯入！');
      return;
    }
    setIsSaving(true);
    try {
      const toImport = previewList.filter((_, i) => selectedIndices.has(i));
      let currentOrder = materialsCount;

      for (const item of toImport) {
        const payload = cleanFirestoreData({
          unit: item.unit ?? 1,
          type: item.type || 'lesson',
          title: item.title || '未命名教材',
          contentUrl: item.contentUrl || '',
          description: item.description || '',
          markdownNotes: item.markdownNotes || '',
          attachments: item.attachments || [],
          subjectId,
          createdAt: Date.now(),
          sortOrder: currentOrder++
        });
        await addDoc(collection(db, 'materials'), payload);
      }

      toast(`🎉 成功匯入 ${toImport.length} 筆教材至資料庫！`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast(`❌ 匯入失敗: ${err?.message || '未知錯誤'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const typeConfig: Record<string, { label: string; badge: string }> = {
    lesson: { label: '📖 講義', badge: 'bg-blue-100 text-blue-700' },
    video: { label: '📹 影音', badge: 'bg-purple-100 text-purple-700' },
    exam: { label: '📝 考卷', badge: 'bg-amber-100 text-amber-700' },
    solution: { label: '🔑 解答', badge: 'bg-emerald-100 text-emerald-700' },
    article: { label: '📰 文章', badge: 'bg-teal-100 text-teal-700' },
    pdf: { label: '📄 文件', badge: 'bg-rose-100 text-rose-700' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-200">
              <Upload size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">批次匯入教材</h3>
              <p className="text-xs text-indigo-200 mt-0.5">支援貼上 JSON、拖曳上傳檔案，自動容錯解析</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSkill}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-all"
            >
              <HelpCircle size={15} /> 教材格式 (skill.txt)
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                <Upload size={14} /> 上傳 .json / .txt 檔案
                <input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleLoadSample}
                className="bg-white hover:bg-gray-100 border border-gray-200 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                💡 載入範例
              </button>
            </div>
            <button
              onClick={handleParse}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ml-auto"
            >
              <FileCode size={14} /> 解析內容
            </button>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-700">
                貼上教材 JSON 陣列內容（支援包含 Markdown 代碼區塊與說明文字）：
              </label>
              <span className="text-[11px] text-gray-400">
                {inputText.length > 0 ? `${inputText.length} 字元` : '可直接貼上 AI 回覆的全文'}
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='貼上例如：[ { "unit": 1, "type": "lesson", "title": "Unit 1: 核心單字", "markdownNotes": "# 筆記內容..." } ]'
              className="w-full h-36 font-mono text-xs p-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50/50"
            />
          </div>

          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">解析發生問題：</span>
                <span className="ml-1">{parseError}</span>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {previewList.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    解析預覽 ({selectedIndices.size} / {previewList.length} 項已選取)
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold ml-2"
                  >
                    {selectedIndices.size === previewList.length ? '取消全選' : '全選'}
                  </button>
                </div>
                <span className="text-xs text-gray-400">點擊卡片可展開檢視筆記預覽</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {previewList.map((item, idx) => {
                  const isSelected = selectedIndices.has(idx);
                  const isExpanded = expandedIndex === idx;
                  const cfg = typeConfig[item.type || 'lesson'] || typeConfig.lesson;

                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-3.5 transition-all ${
                        isSelected
                          ? 'border-indigo-200 bg-indigo-50/20 shadow-sm'
                          : 'border-gray-200 bg-gray-50/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(idx)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {formatUnitBadge(item.unit)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                            <span className="font-bold text-sm text-gray-900 truncate">
                              {item.title}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                            {item.contentUrl && <span className="truncate max-w-[200px]">🔗 {item.contentUrl}</span>}
                            {item.markdownNotes && (
                              <span className="text-indigo-600">📝 有筆記 ({item.markdownNotes.length} 字)</span>
                            )}
                            {item.attachments && item.attachments.length > 0 && (
                              <span className="text-teal-600">📎 附件 x{item.attachments.length}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                            title="展開/收合詳細"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(idx)}
                            className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                            title="自預覽清單移除"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs space-y-2 bg-white p-3 rounded-xl">
                          {item.contentUrl && (
                            <div>
                              <span className="font-bold text-gray-500">內容連結：</span>
                              <a href={item.contentUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline ml-1">
                                {item.contentUrl}
                              </a>
                            </div>
                          )}
                          {item.attachments && item.attachments.length > 0 && (
                            <div>
                              <span className="font-bold text-gray-500">補充檔案：</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {item.attachments.map((att, aIdx) => (
                                  <span key={aIdx} className="bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-700">
                                    📎 {att.name} ({att.url})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.markdownNotes && (
                            <div>
                              <span className="font-bold text-gray-500">Markdown 課程筆記摘要：</span>
                              <pre className="p-2.5 bg-gray-50 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-36 overflow-y-auto mt-1 border border-gray-100 text-gray-700">
                                {item.markdownNotes}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={isSaving || selectedIndices.size === 0}
            className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all ${
              isSaving || selectedIndices.size === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isSaving ? (
              <>匯入儲存中...</>
            ) : (
              <>
                <CheckCircle2 size={16} /> 確認匯入 ({selectedIndices.size} 筆教材)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
