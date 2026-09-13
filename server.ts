import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  app.post('/api/generate-questions', async (req, res) => {
    try {
      const { text, count, type } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: '系統未設定 GEMINI_API_KEY' });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `# Role
你是一位專業的教育測驗命題專家，專門設計高品質、符合教學邏輯的測驗題目。

# Task
請根據使用者提供的「文本或大綱」與「期望總題數」，一次性生成題庫。你需要嚴格按照指定的 JSON 格式產出資料，以利系統匯入。

# Generation Rules (命題規則)
1. 題型 (Type)：請盡量根據要求的題型出題，若是混合題型，則混合產出：
   - 選擇題 (multiple_choice)：必須提供 4 個選項，並明確指出正確答案。
   - 填空題 (fill_in_the_blank)：題目中需使用底線（___）表示需填空的區域。不須提供選項，正確答案必須簡短、唯一且精確。
2. 單元標註 (Unit)：請在該題目的欄位中標註單元（預設為 1，或根據文本內容推斷）。
3. 難易度 (Difficulty)：每題需標註難度，分為：簡單 (easy)、中等 (medium)、困難 (hard)。
4. 提示 (Clue)：為每題設計一句簡短的提示或詳解。

# Input
- 文本/大綱：${text}
- 期望題數：${count}
- 期望題型：${type === 'mixed' ? '混合題型 (選擇與填空)' : (type === 'multiple_choice' ? '選擇題' : '填空題')}

# Output Format
輸出必須是一個合法的 JSON Array，每個物件代表一題，不可有 Markdown 區塊。格式如下：
[
  {
    "prompt": "題目內容（若為填空題請留 ___）",
    "correctAnswer": "正確答案（必須完全吻合 options 中的一個，或填空題的答案）",
    "options": ["選項A", "選項B", "選項C", "選項D"], // 若為填空題，此欄位設為空陣列 []
    "unit": 1,
    "difficulty": "medium",
    "type": "${type === 'mixed' ? 'multiple_choice 或 fill_in_the_blank' : type}",
    "clue": "解題小提示或詳解"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      const rawText = (typeof (response as any).text === 'function' ? (response as any).text() : response.text) || '';
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('無法從 AI 回應中解析出符合格式的 JSON 陣列');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      res.json({ questions });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/generate-clue', async (req, res) => {
    try {
      const { prompt, options, answer } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: '系統未設定 GEMINI_API_KEY' });
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const promptText = `請為以下題目產生詳細的解題說明（繁體中文），不超過 100 字。
題目：${prompt}
${options ? `選項：${options.join(', ')}` : ''}
正確答案：${answer}

請直接輸出詳解文字，不需加任何前綴。`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
      });
      const clueText = (typeof (response as any).text === 'function' ? (response as any).text() : response.text) || '';
      res.json({ clue: clueText });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
