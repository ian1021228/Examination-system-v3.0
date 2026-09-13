// PET 英文週考專屬架構與題庫同步核心

export interface PetDateInfo {
  id: string; // 例如 '0909', '0916'
  label: string; // 例如 '9月9日'
  title: string; // 例如 '9/9 L4-PET Vocabulary & Verb Quiz'
  vocabRange: string; // 單字考試進度（週考範圍表右邊數來第二直排）
  verbRange: string; // 動詞考試進度（週考範圍表最右邊直排）
  verbsList: string[]; // 涵蓋之 100 不規則動詞
  defaultTimeLimitMinutes: number; // 預設 45 分鐘
}

export const PET_EXAM_DATES: PetDateInfo[] = [
  { id: '0909', label: '9月9日 (W2)', title: '9/9 L4-PET Vocabulary & Verb Quiz', vocabRange: 'a.an - actually', verbRange: 'awake - blow', verbsList: ['awake', 'be', 'beat', 'begin', 'bite', 'blow'], defaultTimeLimitMinutes: 45 },
  { id: '0916', label: '9月16日 (W3)', title: '9/16 L4-PET Vocabulary & Verb Quiz', vocabRange: 'ad - animal', verbRange: 'break - choose', verbsList: ['break', 'bring', 'build', 'buy', 'catch', 'choose'], defaultTimeLimitMinutes: 45 },
  { id: '0923', label: '9月23日 (W4)', title: '9/23 L4-PET Vocabulary & Verb Quiz', vocabRange: 'ankle - at once', verbRange: 'come - dig', verbsList: ['come', 'cost', 'cut', 'do', 'deal', 'dig'], defaultTimeLimitMinutes: 45 },
  { id: '0930', label: '9月30日 (W5)', title: '9/30 L4-PET Vocabulary & Verb Quiz', vocabRange: 'at present - be', verbRange: 'dream - fall', verbsList: ['dream', 'draw', 'drink', 'drive', 'eat', 'fall'], defaultTimeLimitMinutes: 45 },
  { id: '1007', label: '10月7日 (W6)', title: '10/7 L4-PET Vocabulary & Verb Quiz', vocabRange: 'beach - board game', verbRange: 'feed - forget', verbsList: ['feed', 'feel', 'fight', 'find', 'fly', 'forget'], defaultTimeLimitMinutes: 45 },
  { id: '1014', label: '10月14日 (W7)', title: '10/14 L4-PET Vocabulary & Verb Quiz', vocabRange: 'boarding pass - bus', verbRange: 'forgive - grow', verbsList: ['forgive', 'freeze', 'get', 'give', 'go', 'grow'], defaultTimeLimitMinutes: 45 },
  { id: '1021', label: '10月21日 (W8)', title: '10/21 L4-PET Vocabulary & Verb Quiz', vocabRange: 'business - cat', verbRange: 'hang - hold', verbsList: ['hang', 'have', 'hear', 'hide', 'hit', 'hold'], defaultTimeLimitMinutes: 45 },
  { id: '1028', label: '10月28日 (W9)', title: '10/28 L4-PET Vocabulary & Verb Quiz', vocabRange: 'catch - chin', verbRange: 'hurt - leave', verbsList: ['hurt', 'keep', 'know', 'lay', 'lead', 'leave'], defaultTimeLimitMinutes: 45 },
  { id: '1111', label: '11月11日 (W11)', title: '11/11 L4-PET Vocabulary & Verb Quiz', vocabRange: 'chip - complain', verbRange: 'lend - mean', verbsList: ['lend', 'let', 'lie', 'lose', 'make', 'mean'], defaultTimeLimitMinutes: 45 },
  { id: '1118', label: '11月18日 (W12)', title: '11/18 L4-PET Vocabulary & Verb Quiz', vocabRange: 'complaint - creature', verbRange: 'meet - ride', verbsList: ['meet', 'pay', 'put', 'quit', 'read', 'ride'], defaultTimeLimitMinutes: 45 },
  { id: '1125', label: '11月25日 (W13)', title: '11/25 L4-PET Vocabulary & Verb Quiz', vocabRange: 'credit - decorate', verbRange: 'ring - seek', verbsList: ['ring', 'rise', 'run', 'say', 'see', 'seek'], defaultTimeLimitMinutes: 45 },
  { id: '1202', label: '12月2日 (W14)', title: '12/2 L4-PET Vocabulary & Verb Quiz', vocabRange: 'decrease - disappointing', verbRange: 'sell - shine', verbsList: ['sell', 'send', 'set', 'sew', 'shake', 'shine'], defaultTimeLimitMinutes: 45 },
  { id: '1209', label: '12月9日 (W15)', title: '12/9 L4-PET Vocabulary & Verb Quiz', vocabRange: 'disappointment - dvd player', verbRange: 'shoot - sleep', verbsList: ['shoot', 'show', 'sing', 'sink', 'sit', 'sleep'], defaultTimeLimitMinutes: 45 },
  { id: '1216', label: '12月16日 (W16)', title: '12/16 L4-PET Vocabulary & Verb Quiz', vocabRange: 'each - environment', verbRange: 'slide - steal', verbsList: ['slide', 'speak', 'spend', 'spread', 'stand', 'steal'], defaultTimeLimitMinutes: 45 },
  { id: '1223', label: '12月23日 (W17)', title: '12/23 L4-PET Vocabulary & Verb Quiz', vocabRange: 'environmental - false', verbRange: 'stick - swim', verbsList: ['stick', 'strike', 'swear', 'sweep', 'swell', 'swim'], defaultTimeLimitMinutes: 45 },
  { id: '1230', label: '12月30日 (W18)', title: '12/30 L4-PET Vocabulary & Verb Quiz', vocabRange: 'familiar - flood', verbRange: 'swing - think', verbsList: ['swing', 'take', 'teach', 'tear', 'tell', 'think'], defaultTimeLimitMinutes: 45 },
  { id: '0106', label: '1月6日 (W19)', title: '1/6 L4-PET Vocabulary & Verb Quiz', vocabRange: 'floor - further', verbRange: 'wear - write', verbsList: ['wear', 'weep', 'win', 'write'], defaultTimeLimitMinutes: 45 }
];

export interface PetVocabTranslateItem {
  id: number;
  examDate?: string; // 題目所屬考期代碼，如 "0916"
  chinese: string;
  english: string;
  acceptableAnswers?: string[];
}

export interface PetVocabSentenceItem {
  id: number;
  examDate?: string; // 題目所屬考期代碼，如 "0916"
  sentence: string; // 包含 __________
  correctAnswer: string;
  acceptableAnswers?: string[];
  clue?: string;
}

export interface PetVerbTenseItem {
  id: number;
  examDate?: string; // 題目所屬考期代碼，如 "0916"
  verbChinese: string;
  subject?: string;
  presentSimple: string;
  pastSimple: string;
  participle: string;
  acceptableAnswers?: {
    presentSimple?: string[];
    pastSimple?: string[];
    participle?: string[];
  };
}

export interface PetVerbSentenceItem {
  id: number;
  examDate?: string; // 題目所屬考期代碼，如 "0916"
  sentence: string; // 包含 ________
  correctAnswer: string;
  acceptableAnswers?: string[];
  clue?: string;
}

export interface PetExamPaper {
  examDate: string; // 如 "0909"
  dateLabel?: string; // 如 "9月9日"
  title: string; // "9/9 L4-PET Vocabulary & Verb Quiz"
  totalScore: number; // 70
  timeLimitMinutes?: number; // 管理員自訂總作答時間（分鐘）
  part1_vocabulary: {
    sectionA_translation: PetVocabTranslateItem[]; // 30 題 (30分)
    sectionB_sentences: PetVocabSentenceItem[]; // 20 題 (20分)
  };
  part2_verbs: {
    sectionA_tenses: PetVerbTenseItem[]; // 5 組動詞 x 3 態 = 15 格 (15分) 時態填空
    sectionB_sentences: PetVerbSentenceItem[]; // 5 題 (5分) 時態填空（5題完全獨立語境單句，無短文、無括號提示）
  };
}

// 答案比對正規化工具（大小寫皆可、全半形相容、標點容錯）
export function normalizeAnswerText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,/#!$%^&*;:{}=\-_~()?'"、，。？！；：]/g, '')
    .replace(/\s+/g, ' ');
}

export function isAnswerCorrect(userInput: string, correctAnswer: string, acceptable: string[] = []): boolean {
  if (!userInput) return false;
  const normUser = normalizeAnswerText(userInput);
  if (!normUser) return false;

  const rawTargets = [correctAnswer, ...(acceptable || [])].filter(Boolean);
  const expandedTargets = new Set<string>();

  for (const raw of rawTargets) {
    // 原文正規化
    const norm = normalizeAnswerText(raw);
    if (norm) expandedTargets.add(norm);

    // 處理包含斜線情況，如 a/an 或 awake/awoken
    if (raw.includes('/')) {
      raw.split('/').forEach(part => {
        const normPart = normalizeAnswerText(part);
        if (normPart) expandedTargets.add(normPart);
      });
    }

    // 處理括號中可選文字，例如 "awake (醒來)" -> "awake"，或是 "(to) walk" -> "walk"
    if (raw.includes('(') && raw.includes(')')) {
      const strippedParens = normalizeAnswerText(raw.replace(/\([^)]*\)/g, ''));
      if (strippedParens) expandedTargets.add(strippedParens);
      const parensContentOnly = normalizeAnswerText(raw.replace(/[()]/g, ''));
      if (parensContentOnly) expandedTargets.add(parensContentOnly);
    }
  }

  // 1. 完全比對（忽略大小寫、全半形、標點）
  if (expandedTargets.has(normUser)) return true;

  // 2. 助動詞容錯 (如 have/has/had/to 等前綴容錯)
  const userNoAux = normUser.replace(/^(have|has|had|to)\s+/, '');
  for (const target of expandedTargets) {
    const targetNoAux = target.replace(/^(have|has|had|to)\s+/, '');
    if (userNoAux && targetNoAux && userNoAux === targetNoAux) {
      return true;
    }
  }

  return false;
}

// 09/09 官方真題黃金樣卷（完全忠實還原 0909 L4 PET考試卷.pdf）
export const SAMPLE_0909_PET_EXAM: PetExamPaper = {
  examDate: '0909',
  dateLabel: '9月9日',
  title: '9/9 L4-PET Vocabulary & Verb Quiz',
  totalScore: 70,
  timeLimitMinutes: 45,
  part1_vocabulary: {
    sectionA_translation: [
      { id: 1, chinese: '能力', english: 'Ability' },
      { id: 2, chinese: '會計師', english: 'Accountant' },
      { id: 3, chinese: '口音', english: 'Accent' },
      { id: 4, chinese: '成就', english: 'Achievement' },
      { id: 5, chinese: '進入;使用權', english: 'Access' },
      { id: 6, chinese: '根據', english: 'According to' },
      { id: 7, chinese: '能夠的', english: 'Able' },
      { id: 8, chinese: '活躍的', english: 'Active' },
      { id: 9, chinese: '住宿', english: 'Accommodation' },
      { id: 10, chinese: '男演員', english: 'Actor' },
      { id: 11, chinese: '在...上方', english: 'Above' },
      { id: 12, chinese: '幕;表演', english: 'Act' },
      { id: 13, chinese: '準確的', english: 'Accurate' },
      { id: 14, chinese: '達成', english: 'Achieve' },
      { id: 15, chinese: '接受', english: 'accept', acceptableAnswers: ['Accept'] },
      { id: 16, chinese: '一個', english: 'a/an', acceptableAnswers: ['a', 'an'] },
      { id: 17, chinese: '陪同', english: 'Accompany' },
      { id: 18, chinese: '在國外', english: 'Abroad' },
      { id: 19, chinese: '行動;動作', english: 'Action' },
      { id: 20, chinese: '缺席的', english: 'Absent' },
      { id: 21, chinese: '完全地', english: 'Absolutely' },
      { id: 22, chinese: '疼痛', english: 'Ache' },
      { id: 23, chinese: '女演員', english: 'Actress' },
      { id: 24, chinese: '意外', english: 'Accident' },
      { id: 25, chinese: '穿過;橫越', english: 'Across' },
      { id: 26, chinese: '可接受的', english: 'Acceptable' },
      { id: 27, chinese: '其實;實際上', english: 'Actually' },
      { id: 28, chinese: '大約;關於', english: 'About' },
      { id: 29, chinese: '活動', english: 'Activity' },
      { id: 30, chinese: '帳號;帳戶', english: 'Account' }
    ],
    sectionB_sentences: [
      { id: 1, sentence: 'The museum is free, so visitors do not have to pay for __________ to the exhibits.', correctAnswer: 'access', clue: '免費進入' },
      { id: 2, sentence: 'Emma has the __________ to learn new languages very quickly.', correctAnswer: 'ability', clue: '學習的能力' },
      { id: 3, sentence: 'The weather was __________ terrible, so we decided to stay at home.', correctAnswer: 'absolutely', clue: '完全地、極其糟糕' },
      { id: 4, sentence: 'The doctor asked me to describe where I felt the __________.', correctAnswer: 'ache', clue: '疼痛處' },
      { id: 5, sentence: 'He finally __________ his dream of becoming a professional photographer.', correctAnswer: 'achieved', acceptableAnswers: ['achieve'], clue: '達成夢想（過去式）' },
      { id: 6, sentence: 'Please make sure that all the information in your report is __________.', correctAnswer: 'accurate', clue: '資訊準確的' },
      { id: 7, sentence: 'My parents are going __________ next month to visit some friends in Canada.', correctAnswer: 'abroad', clue: '前往國外' },
      { id: 8, sentence: '__________ the weather forecast, it will rain heavily this evening.', correctAnswer: 'According to', acceptableAnswers: ['according to'], clue: '根據氣象預報' },
      { id: 9, sentence: 'Regular physical __________ can help people stay healthy.', correctAnswer: 'activity', clue: '身體運動活動' },
      { id: 10, sentence: 'Jack was __________ from school because he had a high fever.', correctAnswer: 'absent', clue: '從學校缺席/請假' },
      { id: 11, sentence: 'We need __________ hour to finish this project before dinner.', correctAnswer: 'an', acceptableAnswers: ['a/an'], clue: '冠詞（h不發音接 an）' },
      { id: 12, sentence: 'The hotel offers cheap __________ for students during the summer.', correctAnswer: 'accommodation', clue: '平價住宿' },
      { id: 13, sentence: "I don't __________ his explanation because some of the facts are incorrect.", correctAnswer: 'accept', clue: '無法接受其解釋' },
      { id: 14, sentence: 'The firefighters took immediate __________ when they saw smoke coming from the building.', correctAnswer: 'action', clue: '採取即時行動' },
      { id: 15, sentence: 'Sarah speaks English with a noticeable American __________.', correctAnswer: 'accent', clue: '美式口音' },
      { id: 16, sentence: 'The students were asked to write a short report __________ their experience during the school trip.', correctAnswer: 'about', clue: '關於其旅程經驗' },
      { id: 17, sentence: "The film's main __________ won several awards for his performance.", correctAnswer: 'actor', clue: '電影男主角/男演員' },
      { id: 18, sentence: 'The teacher said that cheating in an exam was not __________.', correctAnswer: 'acceptable', clue: '考試作弊是不可接受的' },
      { id: 19, sentence: 'She is now __________ to work independently after receiving enough training.', correctAnswer: 'able', clue: '能夠獨立工作' },
      { id: 20, sentence: 'We walked __________ the bridge to get to the other side of the river.', correctAnswer: 'across', clue: '穿過/走過橋樑' }
    ]
  },
  part2_verbs: {
    sectionA_tenses: [
      {
        id: 1,
        verbChinese: 'awake (醒來)',
        subject: 'He',
        presentSimple: 'awake',
        pastSimple: 'awoke',
        participle: 'awaken',
        acceptableAnswers: {
          presentSimple: ['awake', 'Awake', 'awakes', 'Awakes'],
          pastSimple: ['awoke', 'Awoke'],
          participle: ['awaken', 'awoken', 'Awaken', 'Awoken', 'have awaken', 'has awaken', 'has awoken', 'have awoken']
        }
      },
      {
        id: 2,
        verbChinese: 'beat (打；跳動)',
        subject: 'He',
        presentSimple: 'beat',
        pastSimple: 'beat',
        participle: 'beaten',
        acceptableAnswers: {
          presentSimple: ['beat', 'Beat', 'beats', 'Beats'],
          pastSimple: ['beat', 'Beat'],
          participle: ['beaten', 'Beaten', 'has beaten', 'have beaten']
        }
      },
      {
        id: 3,
        verbChinese: 'begin (開始)',
        subject: 'He',
        presentSimple: 'begin',
        pastSimple: 'began',
        participle: 'begun',
        acceptableAnswers: {
          presentSimple: ['begin', 'Begin', 'begins', 'Begins'],
          pastSimple: ['began', 'Began'],
          participle: ['begun', 'Begun', 'has begun', 'have begun']
        }
      },
      {
        id: 4,
        verbChinese: 'bite (咬)',
        subject: 'He',
        presentSimple: 'bite',
        pastSimple: 'bit',
        participle: 'bitten',
        acceptableAnswers: {
          presentSimple: ['bite', 'Bite', 'bites', 'Bites'],
          pastSimple: ['bit', 'Bit'],
          participle: ['bitten', 'Bitten', 'has bitten', 'have bitten']
        }
      },
      {
        id: 5,
        verbChinese: 'blow (吹；吹動)',
        subject: 'He',
        presentSimple: 'blow',
        pastSimple: 'blew',
        participle: 'blown',
        acceptableAnswers: {
          presentSimple: ['blow', 'Blow', 'blows', 'Blows'],
          pastSimple: ['blew', 'Blew'],
          participle: ['blown', 'Blown', 'has blown', 'have blown']
        }
      }
    ],
    sectionB_sentences: [
      { id: 1, sentence: 'The cold wind ________ strongly through the tall trees yesterday afternoon.', correctAnswer: 'blew', acceptableAnswers: ['Blew', 'blew'], clue: '從 Section A 動詞 (blow) 選詞，依據時間副詞 yesterday 填入過去式 blew' },
      { id: 2, sentence: 'When I ________ from my deep sleep at dawn, I heard thunder in the distance.', correctAnswer: 'awoke', acceptableAnswers: ['Awoke', 'awoke'], clue: '從 Section A 動詞 (awake) 選詞，依據過去敘事 heard 填入過去式 awoke' },
      { id: 3, sentence: 'His heart ________ very fast because the sudden loud noise startled him.', correctAnswer: 'beat', acceptableAnswers: ['Beat', 'beat'], clue: '從 Section A 動詞 (beat) 選詞，依據過去式 startled 填入過去式 beat' },
      { id: 4, sentence: 'Soon after the sun rose, the town cleanup crew ________ their work on the street.', correctAnswer: 'began', acceptableAnswers: ['Began', 'began'], clue: '從 Section A 動詞 (begin) 選詞，依據 rose 填入過去式 began' },
      { id: 5, sentence: 'Please be careful around the frightened dog so it will not ________ anyone.', correctAnswer: 'bite', acceptableAnswers: ['Bite', 'bite'], clue: '從 Section A 動詞 (bite) 選詞，助動詞 will not 後接原形動詞 bite' }
    ]
  }
};

// 將 PET 試卷轉為題庫 Question 物件（便於同步入 Firestore questions，自動歸類至指定考期）
export function convertPetPaperToQuestions(paper: PetExamPaper): any[] {
  const result: any[] = [];
  const defaultDate = paper.examDate;

  // 1. Part I - Section A: 30 題單字英譯
  (paper.part1_vocabulary?.sectionA_translation || []).forEach(item => {
    const itemDate = item.examDate || defaultDate;
    result.push({
      subject: 'pet',
      examDate: itemDate,
      date: itemDate,
      part: 'part1_a',
      itemNumber: item.id,
      unit: 1,
      difficulty: 'medium',
      type: 'fill_in_the_blank',
      prompt: `[Part I - Sec A] 單字英譯 ${item.id}. ${item.chinese} __________________`,
      correctAnswer: item.english,
      clue: `中文：${item.chinese}，英文答案：${item.english}`,
      explanation: `【Part I Section A 單字翻譯】中文「${item.chinese}」對應之英文單字為「${item.english}」`,
      acceptableAnswers: item.acceptableAnswers || [],
      createdAt: Date.now()
    });
  });

  // 2. Part I - Section B: 20 題語境填空
  (paper.part1_vocabulary?.sectionB_sentences || []).forEach(item => {
    const itemDate = item.examDate || defaultDate;
    result.push({
      subject: 'pet',
      examDate: itemDate,
      date: itemDate,
      part: 'part1_b',
      itemNumber: item.id,
      unit: 1,
      difficulty: 'medium',
      type: 'fill_in_the_blank',
      prompt: `[Part I - Sec B] 句子選詞填空 ${item.id}. ${item.sentence}`,
      correctAnswer: item.correctAnswer,
      clue: item.clue || `答案是：${item.correctAnswer}`,
      explanation: `【Part I Section B 語境選詞填空】根據句意填入「${item.correctAnswer}」`,
      acceptableAnswers: item.acceptableAnswers || [],
      createdAt: Date.now()
    });
  });

  // 3. Part II - Section A: 5 組動詞三態 (共 15 格)
  (paper.part2_verbs?.sectionA_tenses || []).forEach(item => {
    const itemDate = item.examDate || defaultDate;
    // Present Simple
    result.push({
      subject: 'pet',
      examDate: itemDate,
      date: itemDate,
      part: 'part2_a',
      verbRowId: item.id,
      verbTense: 'present',
      itemNumber: (item.id - 1) * 3 + 1,
      unit: 2,
      difficulty: 'medium',
      type: 'fill_in_the_blank',
      prompt: `[Part II - Sec A 時態填空] 動詞填空 (${item.verbChinese}) [Present Simple 原形/現在式]`,
      correctAnswer: item.presentSimple,
      clue: `動詞：${item.verbChinese}，原形 (Base Form)`,
      explanation: `【動詞三態時態填空】${item.verbChinese} 之原形 (Base Form) 為「${item.presentSimple}」`,
      acceptableAnswers: item.acceptableAnswers?.presentSimple || [],
      createdAt: Date.now()
    });

    // Past Simple
    result.push({
      subject: 'pet',
      examDate: itemDate,
      date: itemDate,
      part: 'part2_a',
      verbRowId: item.id,
      verbTense: 'past',
      itemNumber: (item.id - 1) * 3 + 2,
      unit: 2,
      difficulty: 'medium',
      type: 'fill_in_the_blank',
      prompt: `[Part II - Sec A 時態填空] 動詞填空 (${item.verbChinese}) [Past Simple 過去式]`,
      correctAnswer: item.pastSimple,
      clue: `動詞：${item.verbChinese}，過去式 (Past Simple)`,
      explanation: `【動詞三態時態填空】${item.verbChinese} 之過去式 (Past Simple) 為「${item.pastSimple}」`,
      acceptableAnswers: item.acceptableAnswers?.pastSimple || [],
      createdAt: Date.now()
    });

    // Participle
    result.push({
      subject: 'pet',
      examDate: itemDate,
      date: itemDate,
      part: 'part2_a',
      verbRowId: item.id,
      verbTense: 'participle',
      itemNumber: (item.id - 1) * 3 + 3,
      unit: 2,
      difficulty: 'medium',
      type: 'fill_in_the_blank',
      prompt: `[Part II - Sec A 時態填空] 動詞填空 (${item.verbChinese}) [Participle 過去分詞]`,
      correctAnswer: item.participle,
      clue: `動詞：${item.verbChinese}，過去分詞 (Participle)`,
      explanation: `【動詞三態時態填空】${item.verbChinese} 之過去分詞 (Participle) 為「${item.participle}」`,
      acceptableAnswers: item.acceptableAnswers?.participle || [],
      createdAt: Date.now()
    });
  });

  // 4. Part II - Section B: 5 題獨立單句動詞時態填空（無短文、無括號提示）
  (paper.part2_verbs?.sectionB_sentences || []).forEach(item => {
    const itemDate = item.examDate || defaultDate;
    result.push({
      subject: 'pet',
      examDate: itemDate,
      date: itemDate,
      part: 'part2_b',
      itemNumber: item.id,
      unit: 2,
      difficulty: 'medium',
      type: 'fill_in_the_blank',
      prompt: `[Part II - Sec B 時態填空] 第 ${item.id} 題. ${item.sentence}`,
      correctAnswer: item.correctAnswer,
      clue: item.clue || `答案是：${item.correctAnswer}`,
      explanation: `【Part II Section B 動詞時態填空】${item.sentence} 正確填入動詞時態為「${item.correctAnswer}」`,
      acceptableAnswers: item.acceptableAnswers || [],
      createdAt: Date.now()
    });
  });

  return result;
}

// 專用 AI 命題 Skill 文本 (供複製或下載)
export const PET_AI_SKILL_MARKDOWN = `# Role & Identity (角色設定)
你是一位劍橋國際英語認證 (Cambridge English Qualifications) PET / B1 Preliminary 級別的專業英檢命題主任兼測驗評量專家。
你的任務是根據指定「考試日期」與「週考單元」，精確產出符合標準劍橋 L4-PET 考試卷格式的「每週單字與動詞測驗卷 (Vocabulary & Verb Quiz)」JSON 數據。

# 考試範圍來源依據
依據官方教學進度表《週考範圍.pdf》與《OD單字表 L4 (含動詞表)》：
1. **第一部分 (Part I – Vocabulary) 範圍**：查閱表格中【右邊數來第二直排（單字考試進度）】（如 a.an - actually, ad - animal 等）。
2. **第二部分 (Part II – Verbs) 範圍**：查閱表格中【最右邊直排（動詞考試進度）】（如 awake - blow, break - choose 等）。動詞出自單字表最後一頁《100 MOST COMMON ESL IRREGULAR VERBS LIST》。
3. **第二部分務必考「時態填空」與「時態獨立單句填空（無短文、無動詞括號提示）」**！

---

# 核心出題與設計規範

1. **【絕不可顯示 Section A 單字候選庫 (No Word Bank)】**：
   - 考卷題目與介面中**嚴禁顯示 Section A 單字候選字庫**（不提供候選單字框或單字提示），以訓練學生根據語境線索主動回想與正確拼寫。
2. **【每一題必須明確標註所屬日期 (\`examDate\`)，支援系統全自動分日期歸類】**：
   - 為了讓管理員在匯入 PET 專用考卷 JSON 後，系統能**自動將每一道題目精準歸類至正確的週考考期日期**（例如 "0916"、"0923"）：
   - JSON 頂層必須包含 \`"examDate": "0916"\`。
   - **每一道題目（包含 Part I Sec A 1~30、Sec B 1~20、Part II Sec A 1~5、Sec B 1~5）的 JSON 物件內，皆必須明確標註 \`"examDate": "0916"\`**！

---

# Exam Structure & Rules (四大 Part 結構與命題規則)

### Part I – Vocabulary (詞彙篇，共 50 分)
1. **Section A – Translate the words into English (單字英譯，1~30 題，共 30 分)**
   - 題數：整整 30 題 (id: 1 至 30)，單字範圍取自當週【右邊數來第二直排（單字考試進度）】。
   - 每題物件皆須包含 \`"examDate"\`。

2. **Section B – Choose the correct words and write them in the appropriate sentences (語境填空，1~20 題，共 20 分)**
   - 題數：整整 20 題 (id: 1 至 20)。
   - 核心規則：所填入的正確單字，**必須 100% 源自 Section A 的 30 個單字之一**！不得超脫 Section A 單字範圍。
   - 嚴格禁止提供候選單字提示庫。每題物件皆須包含 \`"examDate"\`。

---

### Part II – Verbs (動詞與時態篇，共 20 分)
3. **Section A – Fill in the correct verb tense (時態填空：動詞三態表格，5 組動詞，共 15 分)**
   - 題數：整整 5 組動詞 (id: 1 至 5)，動詞取自當週【最右邊直排（動詞考試進度）】（動詞表最後一頁）。
   - 指定主詞代名詞（如 He, They, We, I, She），填入現在式 (presentSimple)、過去式 (pastSimple)、完成式/過去分詞 (participle)，共 15 格。
   - 每組動詞物件皆須包含 \`"examDate"\`。

4. **Section B – Verb Tense Sentence Completion (時態獨立單句填空，1~5 題，共 5 分)**
   - **完全無短文篇章**：沒有任何 clozePassage，不考整篇閱讀克漏字。
   - **5 題完全獨立的語境單句**：每回僅有 5 道互相獨立的日常生活造句（1~5 題，每題 1 分）。
   - **無動詞原形提示**：句末不附括號提示（如無 (blow)），要求學生自主從 Part II Sec A 的 5 個動詞中選詞，並依句型與時間副詞變換為正確時態。
   - **每題皆標註 examDate**：每題物件皆須包含 \`"examDate"\`，完整支援系統全自動分日期歸類匯入。

---

# JSON Output Format (最外層根結構與規範)
最外層採用**【以日期代碼為 Key 的字典物件】**（例如 \`"0909"\`, \`"0916"\` 作為 Key，便於以日期直接取值，亦可包含單回或整學期 17 回測驗卷）：
你必須僅輸出純 JSON，勿加任何額外說明文字或前後綴符號：

\`\`\`json
{
  "0909": {
    "examDate": "0909",
    "dateLabel": "9月9日",
    "title": "9/9 L4-PET Vocabulary & Verb Quiz",
    "totalScore": 70,
    "timeLimitMinutes": 45,
    "part1_vocabulary": {
      "sectionA_translation": [
        { "id": 1, "examDate": "0909", "chinese": "能力", "english": "Ability", "acceptableAnswers": ["ability"] }
      ],
      "sectionB_sentences": [
        {
          "id": 1,
          "examDate": "0909",
          "sentence": "The museum is free, so visitors do not have to pay for __________ to the exhibits.",
          "correctAnswer": "access",
          "acceptableAnswers": ["access"],
          "clue": "免費進入展覽"
        }
      ]
    },
    "part2_verbs": {
      "sectionA_tenses": [
        {
          "id": 1,
          "examDate": "0909",
          "verbChinese": "打；跳動",
          "subject": "He",
          "presentSimple": "beats",
          "pastSimple": "beat",
          "participle": "has beaten",
          "acceptableAnswers": {
            "presentSimple": ["beats"],
            "pastSimple": ["beat"],
            "participle": ["has beaten", "beaten"]
          }
        }
      ],
      "sectionB_sentences": [
        {
          "id": 1,
          "examDate": "0909",
          "sentence": "The cold wind ________ strongly through the trees yesterday afternoon.",
          "correctAnswer": "blew",
          "acceptableAnswers": ["Blew", "blew"],
          "clue": "自主從 Sec A 動詞 (blow) 選詞並依 yesterday 變換過去式 blew"
        }
      ]
    }
  }
}
\`\`\`
*(備註：系統亦完全相容單回考卷純物件 \`{ "examDate": "0909", ... }\` 或測驗陣列格式)*
`;
